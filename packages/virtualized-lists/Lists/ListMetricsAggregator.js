/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Layout} from 'react-native/Libraries/Types/CoreEventTypes';
import type {Props as VirtualizedListProps} from './VirtualizedListProps';
import {keyExtractor as defaultKeyExtractor} from './VirtualizeUtils';

import invariant from 'invariant';

type LayoutEventDirection = 'top-down' | 'bottom-up';

export type CellMetrics = {
  /**
   * Index of the item in the list
   */
  index: number,
  /**
   * Length of the cell along the scrolling axis
   */
  length: number,
  /**
   * Distance between this cell and the start of the list along the scrolling
   * axis
   */
  offset: number,
  /**
   * Whether the cell is last known to be mounted
   */
  isMounted: boolean,
};

// TODO: `inverted` can be incorporated here if it is moved to an order
// based implementation instead of transform.
export type ListOrientation = {
  horizontal: boolean,
  rtl: boolean,
};

/**
 * Subset of VirtualizedList props needed to calculate cell metrics
 */
export type CellMetricProps = {
  data: VirtualizedListProps['data'],
  getItemCount: VirtualizedListProps['getItemCount'],
  getItem: VirtualizedListProps['getItem'],
  getItemLayout?: VirtualizedListProps['getItemLayout'],
  keyExtractor?: VirtualizedListProps['keyExtractor'],
  ...
};

type UnresolvedCellMetrics = {
  index: number,
  layout: Layout,
  isMounted: boolean,

  // The length of list content at the time of layout is needed to correctly
  // resolve flow relative offset in RTL. We are lazily notified of this after
  // the layout of the cell, unless the cell relayout does not cause a length
  // change. To keep stability, we use content length at time of query, or
  // unmount if never queried.
  listContentLength?: ?number,
};

/**
 * Provides an interface to query information about the metrics of a list and its cells.
 */
export default class ListMetricsAggregator {
  _averageCellLength = 0;
  _cellMetrics: Map<string, UnresolvedCellMetrics> = new Map();
  _contentLength: ?number;
  _highestMeasuredCellIndex = 0;
  _measuredCellsLength = 0;
  _measuredCellsCount = 0;
  _orientation: ListOrientation = {
    horizontal: false,
    rtl: false,
  };

  // Fabric and Paper may call onLayout in different orders. We can tell which
  // direction layout events happen on the first layout.
  _onLayoutDirection: LayoutEventDirection = 'top-down';

  /**
   * Notify the ListMetricsAggregator that a cell has been laid out.
   *
   * @returns whether the cell layout has changed since last notification
   */
  notifyCellLayout({
    cellIndex,
    cellKey,
    orientation,
    layout,
  }: {
    cellIndex: number,
    cellKey: string,
    orientation: ListOrientation,
    layout: Layout,
  }): boolean {
    if (this._contentLength == null) {
      this._onLayoutDirection = 'bottom-up';
    }

    this._invalidateIfOrientationChanged(orientation);

    // If layout is top-down, our most recently cached content length
    // corresponds to this cell. Otherwise, we need to resolve when events fire
    // up the tree to the new length.
    const listContentLength =
      this._onLayoutDirection === 'top-down' ? this._contentLength : null;

    const next: UnresolvedCellMetrics = {
      index: cellIndex,
      layout: layout,
      isMounted: true,
      listContentLength,
    };
    const curr = this._cellMetrics.get(cellKey);

    if (
      !curr ||
      this._selectOffset(next.layout) !== this._selectOffset(curr.layout) ||
      this._selectLength(next.layout) !== this._selectLength(curr.layout) ||
      (curr.listContentLength != null &&
        curr.listContentLength !== this._contentLength)
    ) {
      if (curr) {
        const dLength =
          this._selectLength(next.layout) - this._selectLength(curr.layout);
        this._measuredCellsLength += dLength;
      } else {
        this._measuredCellsLength += this._selectLength(next.layout);
        this._measuredCellsCount += 1;
      }

      this._averageCellLength =
        this._measuredCellsLength / this._measuredCellsCount;
      this._cellMetrics.set(cellKey, next);
      this._highestMeasuredCellIndex = Math.max(
        this._highestMeasuredCellIndex,
        cellIndex,
      );
      return true;
    } else {
      curr.isMounted = true;
      return false;
    }
  }

  /**
   * Notify ListMetricsAggregator that a cell has been unmounted.
   */
  notifyCellUnmounted(cellKey: string): void {
    const curr = this._cellMetrics.get(cellKey);
    if (curr) {
      curr.isMounted = false;
    }
  }

  /**
   * Notify ListMetricsAggregator that the lists content container has been laid out.
   */
  notifyListContentLayout({
    orientation,
    layout,
  }: {
    orientation: ListOrientation,
    layout: $ReadOnly<{width: number, height: number}>,
  }): void {
    this._invalidateIfOrientationChanged(orientation);
    const newLength = this._selectLength(layout);

    // Fill in any just-measured cells which did not have this length available.
    // This logic assumes that cell relayout will always change list content
    // size, which isn't strictly correct, but issues should be rare and only
    // on Paper.
    if (this._onLayoutDirection === 'bottom-up') {
      for (const cellMetric of this._cellMetrics.values()) {
        if (cellMetric.listContentLength == null) {
          cellMetric.listContentLength = newLength;
        }
      }
    }

    this._contentLength = newLength;
  }

  /**
   * Return the average length of the cells which have been measured
   */
  getAverageCellLength(): number {
    return this._averageCellLength;
  }

  /**
   * Return the highest measured cell index (or 0 if nothing has been measured
   * yet)
   */
  getHighestMeasuredCellIndex(): number {
    return this._highestMeasuredCellIndex;
  }

  /**
   * Returns the exact metrics of a cell if it has already been laid out,
   * otherwise an estimate based on the average length of previously measured
   * cells
   */
  getCellMetricsApprox(index: number, props: CellMetricProps): CellMetrics {
    const frame = this.getCellMetrics(index, props);
    if (frame && frame.index === index) {
      // check for invalid frames due to row re-ordering
      return frame;
    } else {
      const {data, getItemCount} = props;
      invariant(
        index >= 0 && index < getItemCount(data),
        'Tried to get frame for out of range index ' + index,
      );
      return {
        length: this._averageCellLength,
        offset: this._averageCellLength * index,
        index,
        isMounted: false,
      };
    }
  }

  /**
   * Returns the exact metrics of a cell if it has already been laid out
   */
  getCellMetrics(index: number, props: CellMetricProps): ?CellMetrics {
    const {data, getItem, getItemCount, getItemLayout} = props;
    invariant(
      index >= 0 && index < getItemCount(data),
      'Tried to get metrics for out of range cell index ' + index,
    );
    const keyExtractor = props.keyExtractor ?? defaultKeyExtractor;
    const frame = this._cellMetrics.get(
      keyExtractor(getItem(data, index), index),
    );
    if (frame && frame.index === index) {
      return this._resolveCellMetrics(frame);
    }

    if (getItemLayout) {
      const {length, offset} = getItemLayout(data, index);
      // TODO: `isMounted` is used for both "is exact layout" and "has been
      // unmounted". Should be refactored.
      return {index, length, offset, isMounted: true};
    }

    return null;
  }

  /**
   * Gets an approximate offset to an item at a given index. Supports
   * fractional indices.
   */
  getCellOffsetApprox(index: number, props: CellMetricProps): number {
    if (Number.isInteger(index)) {
      return this.getCellMetricsApprox(index, props).offset;
    } else {
      const frameMetrics = this.getCellMetricsApprox(Math.floor(index), props);
      const remainder = index - Math.floor(index);
      return frameMetrics.offset + remainder * frameMetrics.length;
    }
  }

  /**
   * Returns the length of all ScrollView content along the scrolling axis.
   */
  getContentLength(): number {
    return this._contentLength ?? 0;
  }

  /**
   * Whether a content length has been observed
   */
  hasContentLength(): boolean {
    return this._contentLength != null;
  }

  /**
   * Whether the ListMetricsAggregator is notified of cell metrics before
   * ScrollView metrics (bottom-up) or ScrollView metrics before cell metrics
   * (top-down).
   *
   * Must be queried after cell layout
   */
  getLayoutEventDirection(): LayoutEventDirection {
    return this._onLayoutDirection;
  }

  /**
   * Whether the ListMetricsAggregator must be aware of the current length of
   * ScrollView content to be able to correctly resolve the (flow-relative)
   * metrics of a cell.
   */
  needsContentLengthForCellMetrics(): boolean {
    return this._orientation.horizontal && this._orientation.rtl;
  }

  /**
   * Finds the flow-relative offset (e.g. starting from the left in LTR, but
   * right in RTL) from a layout box.
   */
  flowRelativeOffset(layout: Layout, referenceContentLength?: ?number): number {
    const {horizontal, rtl} = this._orientation;

    if (horizontal && rtl) {
      const contentLength = referenceContentLength ?? this._contentLength;
      invariant(
        contentLength != null,
        'ListMetricsAggregator must be notified of list content layout before resolving offsets',
      );
      return (
        contentLength -
        (this._selectOffset(layout) + this._selectLength(layout))
      );
    } else {
      return this._selectOffset(layout);
    }
  }

  /**
   * Converts a flow-relative offset to a cartesian offset
   */
  cartesianOffset(flowRelativeOffset: number): number {
    const {horizontal, rtl} = this._orientation;

    if (horizontal && rtl) {
      invariant(
        this._contentLength != null,
        'ListMetricsAggregator must be notified of list content layout before resolving offsets',
      );
      return this._contentLength - flowRelativeOffset;
    } else {
      return flowRelativeOffset;
    }
  }

  _invalidateIfOrientationChanged(orientation: ListOrientation): void {
    if (orientation.rtl !== this._orientation.rtl) {
      this._cellMetrics.clear();
    }

    if (orientation.horizontal !== this._orientation.horizontal) {
      this._averageCellLength = 0;
      this._contentLength = null;
      this._highestMeasuredCellIndex = 0;
      this._measuredCellsLength = 0;
      this._measuredCellsCount = 0;
    }

    this._orientation = orientation;
  }

  _selectLength({
    width,
    height,
  }: $ReadOnly<{width: number, height: number, ...}>): number {
    return this._orientation.horizontal ? width : height;
  }

  _selectOffset({x, y}: $ReadOnly<{x: number, y: number, ...}>): number {
    return this._orientation.horizontal ? x : y;
  }

  _resolveCellMetrics(metrics: UnresolvedCellMetrics): CellMetrics {
    const {index, layout, isMounted, listContentLength} = metrics;

    return {
      index,
      length: this._selectLength(layout),
      isMounted,
      offset: this.flowRelativeOffset(layout, listContentLength),
    };
  }
}
