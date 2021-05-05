/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {LayoutEvent} from '../../Types/CoreEventTypes';
import setAndForwardRef from 'react-native/Libraries/Utilities/setAndForwardRef';
import Platform from '../../Utilities/Platform';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Animated from '../../Animated/Animated';
import * as React from 'react';
import {useEffect, useMemo, useRef, useCallback} from 'react';

const AnimatedView = Animated.View;

export type Props = $ReadOnly<{
  children?: React.Element<$FlowFixMe>,
  nextHeaderLayoutY: ?number,
  onLayout: (event: LayoutEvent) => void,
  scrollAnimatedValue: Animated.Value,
  // Will cause sticky headers to stick at the bottom of the ScrollView instead
  // of the top.
  inverted: ?boolean,
  // The height of the parent ScrollView. Currently only set when inverted.
  scrollViewHeight: ?number,
  nativeID?: ?string,
  hiddenOnScroll?: ?boolean,
}>;

const ScrollViewStickyHeaderWithForwardedRef: React.AbstractComponent<
  Props,
  $ReadOnly<{
    setNextHeaderY: number => void,
    ...$Exact<React.ElementRef<typeof AnimatedView>>,
  }>,
> = React.forwardRef(function ScrollViewStickyHeader(props, forwardedRef) {
  const {
    inverted,
    scrollViewHeight,
    hiddenOnScroll,
    scrollAnimatedValue,
    nextHeaderLayoutY: _nextHeaderLayoutY,
  } = props;

  const [measured, setMeasured] = React.useState<boolean>(false);
  const [layoutY, setLayoutY] = React.useState<number>(0);
  const [layoutHeight, setLayoutHeight] = React.useState<number>(0);
  const [translateY, setTranslateY] = React.useState<?number>(null);
  const [nextHeaderLayoutY, setNextHeaderLayoutY] = React.useState<?number>(
    _nextHeaderLayoutY,
  );
  const [isFabric, setIsFabric] = React.useState<boolean>(false);

  const componentRef = React.useRef<?React.ElementRef<typeof AnimatedView>>();
  const _setNativeRef = setAndForwardRef({
    getForwardedRef: () => forwardedRef,
    setLocalRef: ref => {
      componentRef.current = ref;
      if (ref) {
        ref.setNextHeaderY = value => {
          setNextHeaderLayoutY(value);
        };
        setIsFabric(
          !!(
            // An internal transform mangles variables with leading "_" as private.
            // eslint-disable-next-line dot-notation
            ref['_internalInstanceHandle']?.stateNode?.canonical
          ),
        );
      }
    },
  });

  const offset = useMemo(
    () =>
      hiddenOnScroll === true
        ? Animated.diffClamp(
            scrollAnimatedValue
              .interpolate({
                extrapolateLeft: 'clamp',
                inputRange: [layoutY, layoutY + 1],
                outputRange: ([0, 1]: Array<number>),
              })
              .interpolate({
                inputRange: [0, 1],
                outputRange: ([0, -1]: Array<number>),
              }),
            -layoutHeight,
            0,
          )
        : null,
    [scrollAnimatedValue, layoutHeight, layoutY, hiddenOnScroll],
  );

  const [
    animatedTranslateY,
    setAnimatedTranslateY,
  ] = React.useState<Animated.Node>(() => {
    const inputRange: Array<number> = [-1, 0];
    const outputRange: Array<number> = [0, 0];
    const initialTranslateY: Animated.Interpolation = scrollAnimatedValue.interpolate(
      {
        inputRange,
        outputRange,
      },
    );

    if (offset != null) {
      return Animated.add(initialTranslateY, offset);
    }
    return initialTranslateY;
  });

  const _haveReceivedInitialZeroTranslateY = useRef<boolean>(true);
  const _timer = useRef<?TimeoutID>(null);

  useEffect(() => {
    if (translateY !== 0 && translateY != null) {
      _haveReceivedInitialZeroTranslateY.current = false;
    }
  }, [translateY]);

  // This is called whenever the (Interpolated) Animated Value
  // updates, which is several times per frame during scrolling.
  // To ensure that the Fabric ShadowTree has the most recent
  // translate style of this node, we debounce the value and then
  // pass it through to the underlying node during render.
  // This is:
  // 1. Only an issue in Fabric.
  // 2. Worse in Android than iOS. In Android, but not iOS, you
  //    can touch and move your finger slightly and still trigger
  //    a "tap" event. In iOS, moving will cancel the tap in
  //    both Fabric and non-Fabric. On Android when you move
  //    your finger, the hit-detection moves from the Android
  //    platform to JS, so we need the ShadowTree to have knowledge
  //    of the current position.
  const animatedValueListener = useCallback(
    ({value}) => {
      const _debounceTimeout: number = Platform.OS === 'android' ? 15 : 64;
      // When the AnimatedInterpolation is recreated, it always initializes
      // to a value of zero and emits a value change of 0 to its listeners.
      if (value === 0 && !_haveReceivedInitialZeroTranslateY.current) {
        _haveReceivedInitialZeroTranslateY.current = true;
        return;
      }
      if (_timer.current != null) {
        clearTimeout(_timer.current);
      }
      _timer.current = setTimeout(() => {
        if (value !== translateY) {
          setTranslateY(value);
        }
      }, _debounceTimeout);
    },
    [translateY],
  );

  useEffect(() => {
    const inputRange: Array<number> = [-1, 0];
    const outputRange: Array<number> = [0, 0];

    if (measured) {
      if (inverted === true) {
        // The interpolation looks like:
        // - Negative scroll: no translation
        // - `stickStartPoint` is the point at which the header will start sticking.
        //   It is calculated using the ScrollView viewport height so it is a the bottom.
        // - Headers that are in the initial viewport will never stick, `stickStartPoint`
        //   will be negative.
        // - From 0 to `stickStartPoint` no translation. This will cause the header
        //   to scroll normally until it reaches the top of the scroll view.
        // - From `stickStartPoint` to when the next header y hits the bottom edge of the header: translate
        //   equally to scroll. This will cause the header to stay at the top of the scroll view.
        // - Past the collision with the next header y: no more translation. This will cause the
        //   header to continue scrolling up and make room for the next sticky header.
        //   In the case that there is no next header just translate equally to
        //   scroll indefinitely.
        if (scrollViewHeight != null) {
          const stickStartPoint = layoutY + layoutHeight - scrollViewHeight;
          if (stickStartPoint > 0) {
            inputRange.push(stickStartPoint);
            outputRange.push(0);
            inputRange.push(stickStartPoint + 1);
            outputRange.push(1);
            // If the next sticky header has not loaded yet (probably windowing) or is the last
            // we can just keep it sticked forever.
            const collisionPoint =
              (nextHeaderLayoutY || 0) - layoutHeight - scrollViewHeight;
            if (collisionPoint > stickStartPoint) {
              inputRange.push(collisionPoint, collisionPoint + 1);
              outputRange.push(
                collisionPoint - stickStartPoint,
                collisionPoint - stickStartPoint,
              );
            }
          }
        }
      } else {
        // The interpolation looks like:
        // - Negative scroll: no translation
        // - From 0 to the y of the header: no translation. This will cause the header
        //   to scroll normally until it reaches the top of the scroll view.
        // - From header y to when the next header y hits the bottom edge of the header: translate
        //   equally to scroll. This will cause the header to stay at the top of the scroll view.
        // - Past the collision with the next header y: no more translation. This will cause the
        //   header to continue scrolling up and make room for the next sticky header.
        //   In the case that there is no next header just translate equally to
        //   scroll indefinitely.
        inputRange.push(layoutY);
        outputRange.push(0);
        // If the next sticky header has not loaded yet (probably windowing) or is the last
        // we can just keep it sticked forever.
        const collisionPoint = (nextHeaderLayoutY || 0) - layoutHeight;
        if (collisionPoint >= layoutY) {
          inputRange.push(collisionPoint, collisionPoint + 1);
          outputRange.push(collisionPoint - layoutY, collisionPoint - layoutY);
        } else {
          inputRange.push(layoutY + 1);
          outputRange.push(1);
        }
      }
    }

    let newAnimatedTranslateY: Animated.Node = scrollAnimatedValue.interpolate({
      inputRange,
      outputRange,
    });

    if (offset != null) {
      newAnimatedTranslateY = Animated.add(newAnimatedTranslateY, offset);
    }

    // add the event listener
    let animatedListenerId;
    if (isFabric) {
      animatedListenerId = newAnimatedTranslateY.addListener(
        animatedValueListener,
      );
    }

    setAnimatedTranslateY(newAnimatedTranslateY);

    // clean up the event listener and timer
    return () => {
      if (animatedListenerId) {
        newAnimatedTranslateY.removeListener(animatedListenerId);
      }
      if (_timer.current != null) {
        clearTimeout(_timer.current);
      }
    };
  }, [nextHeaderLayoutY, measured, layoutHeight, layoutY, scrollViewHeight, scrollAnimatedValue, inverted, offset, animatedValueListener, isFabric]);

  const _onLayout = (event: LayoutEvent) => {
    setLayoutY(event.nativeEvent.layout.y);
    setLayoutHeight(event.nativeEvent.layout.height);
    setMeasured(true);

    props.onLayout(event);
    const child = React.Children.only(props.children);
    if (child.props.onLayout) {
      child.props.onLayout(event);
    }
  };

  const child = React.Children.only(props.children);

  // TODO T68319535: remove this if NativeAnimated is rewritten for Fabric
  const passthroughAnimatedPropExplicitValues =
    isFabric && translateY != null
      ? {
          style: {transform: [{translateY: translateY}]},
        }
      : null;

  return (
    /* $FlowFixMe[prop-missing] passthroughAnimatedPropExplicitValues isn't properly
       included in the Animated.View flow type. */
    <AnimatedView
      collapsable={false}
      nativeID={props.nativeID}
      onLayout={_onLayout}
      ref={_setNativeRef}
      style={[
        child.props.style,
        styles.header,
        {transform: [{translateY: animatedTranslateY}]},
      ]}
      passthroughAnimatedPropExplicitValues={
        passthroughAnimatedPropExplicitValues
      }>
      {React.cloneElement(child, {
        style: styles.fill, // We transfer the child style to the wrapper.
        onLayout: undefined, // we call this manually through our this._onLayout
      })}
    </AnimatedView>
  );
});

const styles = StyleSheet.create({
  header: {
    zIndex: 10,
    position: 'relative',
  },
  fill: {
    flex: 1,
  },
});

export default ScrollViewStickyHeaderWithForwardedRef;
