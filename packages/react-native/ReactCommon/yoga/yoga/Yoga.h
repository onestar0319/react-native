/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <stdarg.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include <yoga/YGEnums.h>
#include <yoga/YGMacros.h>
#include <yoga/YGValue.h>

YG_EXTERN_C_BEGIN

typedef struct YGSize {
  float width;
  float height;
} YGSize;

typedef struct YGConfig* YGConfigRef;
typedef const struct YGConfig* YGConfigConstRef;

typedef struct YGNode* YGNodeRef;
typedef const struct YGNode* YGNodeConstRef;

typedef YGSize (*YGMeasureFunc)(
    YGNodeConstRef node,
    float width,
    YGMeasureMode widthMode,
    float height,
    YGMeasureMode heightMode);
typedef float (*YGBaselineFunc)(YGNodeConstRef node, float width, float height);
typedef void (*YGDirtiedFunc)(YGNodeConstRef node);
typedef void (*YGPrintFunc)(YGNodeConstRef node);
typedef void (*YGNodeCleanupFunc)(YGNodeConstRef node);
typedef int (*YGLogger)(
    YGConfigConstRef config,
    YGNodeConstRef node,
    YGLogLevel level,
    const char* format,
    va_list args);
typedef YGNodeRef (*YGCloneNodeFunc)(
    YGNodeConstRef oldNode,
    YGNodeConstRef owner,
    size_t childIndex);

// YGNode
WIN_EXPORT YGNodeRef YGNodeNew(void);
WIN_EXPORT YGNodeRef YGNodeNewWithConfig(YGConfigRef config);
WIN_EXPORT YGNodeRef YGNodeClone(YGNodeConstRef node);
WIN_EXPORT void YGNodeFree(YGNodeRef node);
WIN_EXPORT void YGNodeFreeRecursiveWithCleanupFunc(
    YGNodeRef node,
    YGNodeCleanupFunc cleanup);
WIN_EXPORT void YGNodeFreeRecursive(YGNodeRef node);
WIN_EXPORT void YGNodeReset(YGNodeRef node);

WIN_EXPORT void YGNodeInsertChild(
    YGNodeRef node,
    YGNodeRef child,
    size_t index);

WIN_EXPORT void YGNodeSwapChild(YGNodeRef node, YGNodeRef child, size_t index);

WIN_EXPORT void YGNodeRemoveChild(YGNodeRef node, YGNodeRef child);
WIN_EXPORT void YGNodeRemoveAllChildren(YGNodeRef node);
WIN_EXPORT YGNodeRef YGNodeGetChild(YGNodeRef node, size_t index);
WIN_EXPORT YGNodeRef YGNodeGetOwner(YGNodeRef node);
WIN_EXPORT YGNodeRef YGNodeGetParent(YGNodeRef node);
WIN_EXPORT size_t YGNodeGetChildCount(YGNodeConstRef node);
WIN_EXPORT void YGNodeSetChildren(
    YGNodeRef owner,
    const YGNodeRef* children,
    size_t count);

WIN_EXPORT void YGNodeSetIsReferenceBaseline(
    YGNodeRef node,
    bool isReferenceBaseline);

WIN_EXPORT bool YGNodeIsReferenceBaseline(YGNodeConstRef node);

WIN_EXPORT void YGNodeCalculateLayout(
    YGNodeRef node,
    float availableWidth,
    float availableHeight,
    YGDirection ownerDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
//
// Yoga knows when to mark all other nodes as dirty but because nodes with
// measure functions depend on information not known to Yoga they must perform
// this dirty marking manually.
WIN_EXPORT void YGNodeMarkDirty(YGNodeRef node);

// Marks the current node and all its descendants as dirty.
//
// Intended to be used for Yoga benchmarks. Don't use in production, as calling
// `YGCalculateLayout` will cause the recalculation of each and every node.
WIN_EXPORT void YGNodeMarkDirtyAndPropagateToDescendants(YGNodeRef node);

WIN_EXPORT void YGNodePrint(YGNodeConstRef node, YGPrintOptions options);

WIN_EXPORT bool YGFloatIsUndefined(float value);

// TODO: This should not be part of the public API. Remove after removing
// ComponentKit usage of it.
WIN_EXPORT bool YGNodeCanUseCachedMeasurement(
    YGMeasureMode widthMode,
    float availableWidth,
    YGMeasureMode heightMode,
    float availableHeight,
    YGMeasureMode lastWidthMode,
    float lastAvailableWidth,
    YGMeasureMode lastHeightMode,
    float lastAvailableHeight,
    float lastComputedWidth,
    float lastComputedHeight,
    float marginRow,
    float marginColumn,
    YGConfigRef config);

WIN_EXPORT void YGNodeCopyStyle(YGNodeRef dstNode, YGNodeConstRef srcNode);

WIN_EXPORT void* YGNodeGetContext(YGNodeConstRef node);
WIN_EXPORT void YGNodeSetContext(YGNodeRef node, void* context);

WIN_EXPORT YGConfigRef YGNodeGetConfig(YGNodeRef node);
WIN_EXPORT void YGNodeSetConfig(YGNodeRef node, YGConfigRef config);

void YGConfigSetPrintTreeFlag(YGConfigRef config, bool enabled);
bool YGNodeHasMeasureFunc(YGNodeConstRef node);
WIN_EXPORT void YGNodeSetMeasureFunc(YGNodeRef node, YGMeasureFunc measureFunc);
bool YGNodeHasBaselineFunc(YGNodeConstRef node);
void YGNodeSetBaselineFunc(YGNodeRef node, YGBaselineFunc baselineFunc);
YGDirtiedFunc YGNodeGetDirtiedFunc(YGNodeConstRef node);
void YGNodeSetDirtiedFunc(YGNodeRef node, YGDirtiedFunc dirtiedFunc);
void YGNodeSetPrintFunc(YGNodeRef node, YGPrintFunc printFunc);
WIN_EXPORT bool YGNodeGetHasNewLayout(YGNodeConstRef node);
WIN_EXPORT void YGNodeSetHasNewLayout(YGNodeRef node, bool hasNewLayout);
YGNodeType YGNodeGetNodeType(YGNodeConstRef node);
void YGNodeSetNodeType(YGNodeRef node, YGNodeType nodeType);
WIN_EXPORT bool YGNodeIsDirty(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetDirection(YGNodeRef node, YGDirection direction);
WIN_EXPORT YGDirection YGNodeStyleGetDirection(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetFlexDirection(
    YGNodeRef node,
    YGFlexDirection flexDirection);
WIN_EXPORT YGFlexDirection YGNodeStyleGetFlexDirection(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetJustifyContent(
    YGNodeRef node,
    YGJustify justifyContent);
WIN_EXPORT YGJustify YGNodeStyleGetJustifyContent(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetAlignContent(
    YGNodeRef node,
    YGAlign alignContent);
WIN_EXPORT YGAlign YGNodeStyleGetAlignContent(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetAlignItems(YGNodeRef node, YGAlign alignItems);
WIN_EXPORT YGAlign YGNodeStyleGetAlignItems(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetAlignSelf(YGNodeRef node, YGAlign alignSelf);
WIN_EXPORT YGAlign YGNodeStyleGetAlignSelf(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetPositionType(
    YGNodeRef node,
    YGPositionType positionType);
WIN_EXPORT YGPositionType YGNodeStyleGetPositionType(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetFlexWrap(YGNodeRef node, YGWrap flexWrap);
WIN_EXPORT YGWrap YGNodeStyleGetFlexWrap(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetOverflow(YGNodeRef node, YGOverflow overflow);
WIN_EXPORT YGOverflow YGNodeStyleGetOverflow(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetDisplay(YGNodeRef node, YGDisplay display);
WIN_EXPORT YGDisplay YGNodeStyleGetDisplay(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetFlex(YGNodeRef node, float flex);
WIN_EXPORT float YGNodeStyleGetFlex(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetFlexGrow(YGNodeRef node, float flexGrow);
WIN_EXPORT float YGNodeStyleGetFlexGrow(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetFlexShrink(YGNodeRef node, float flexShrink);
WIN_EXPORT float YGNodeStyleGetFlexShrink(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetFlexBasis(YGNodeRef node, float flexBasis);
WIN_EXPORT void YGNodeStyleSetFlexBasisPercent(YGNodeRef node, float flexBasis);
WIN_EXPORT void YGNodeStyleSetFlexBasisAuto(YGNodeRef node);
WIN_EXPORT YGValue YGNodeStyleGetFlexBasis(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetPosition(
    YGNodeRef node,
    YGEdge edge,
    float position);
WIN_EXPORT void YGNodeStyleSetPositionPercent(
    YGNodeRef node,
    YGEdge edge,
    float position);
WIN_EXPORT YGValue YGNodeStyleGetPosition(YGNodeConstRef node, YGEdge edge);

WIN_EXPORT void YGNodeStyleSetMargin(YGNodeRef node, YGEdge edge, float margin);
WIN_EXPORT void YGNodeStyleSetMarginPercent(
    YGNodeRef node,
    YGEdge edge,
    float margin);
WIN_EXPORT void YGNodeStyleSetMarginAuto(YGNodeRef node, YGEdge edge);
WIN_EXPORT YGValue YGNodeStyleGetMargin(YGNodeConstRef node, YGEdge edge);

WIN_EXPORT void YGNodeStyleSetPadding(
    YGNodeRef node,
    YGEdge edge,
    float padding);
WIN_EXPORT void YGNodeStyleSetPaddingPercent(
    YGNodeRef node,
    YGEdge edge,
    float padding);
WIN_EXPORT YGValue YGNodeStyleGetPadding(YGNodeConstRef node, YGEdge edge);

WIN_EXPORT void YGNodeStyleSetBorder(YGNodeRef node, YGEdge edge, float border);
WIN_EXPORT float YGNodeStyleGetBorder(YGNodeConstRef node, YGEdge edge);

WIN_EXPORT void YGNodeStyleSetGap(
    YGNodeRef node,
    YGGutter gutter,
    float gapLength);
WIN_EXPORT float YGNodeStyleGetGap(YGNodeConstRef node, YGGutter gutter);

WIN_EXPORT void YGNodeStyleSetWidth(YGNodeRef node, float width);
WIN_EXPORT void YGNodeStyleSetWidthPercent(YGNodeRef node, float width);
WIN_EXPORT void YGNodeStyleSetWidthAuto(YGNodeRef node);
WIN_EXPORT YGValue YGNodeStyleGetWidth(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetHeight(YGNodeRef node, float height);
WIN_EXPORT void YGNodeStyleSetHeightPercent(YGNodeRef node, float height);
WIN_EXPORT void YGNodeStyleSetHeightAuto(YGNodeRef node);
WIN_EXPORT YGValue YGNodeStyleGetHeight(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetMinWidth(YGNodeRef node, float minWidth);
WIN_EXPORT void YGNodeStyleSetMinWidthPercent(YGNodeRef node, float minWidth);
WIN_EXPORT YGValue YGNodeStyleGetMinWidth(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetMinHeight(YGNodeRef node, float minHeight);
WIN_EXPORT void YGNodeStyleSetMinHeightPercent(YGNodeRef node, float minHeight);
WIN_EXPORT YGValue YGNodeStyleGetMinHeight(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetMaxWidth(YGNodeRef node, float maxWidth);
WIN_EXPORT void YGNodeStyleSetMaxWidthPercent(YGNodeRef node, float maxWidth);
WIN_EXPORT YGValue YGNodeStyleGetMaxWidth(YGNodeConstRef node);

WIN_EXPORT void YGNodeStyleSetMaxHeight(YGNodeRef node, float maxHeight);
WIN_EXPORT void YGNodeStyleSetMaxHeightPercent(YGNodeRef node, float maxHeight);
WIN_EXPORT YGValue YGNodeStyleGetMaxHeight(YGNodeConstRef node);

// Yoga specific properties, not compatible with flexbox specification Aspect
// ratio control the size of the undefined dimension of a node. Aspect ratio is
// encoded as a floating point value width/height. e.g. A value of 2 leads to a
// node with a width twice the size of its height while a value of 0.5 gives the
// opposite effect.
//
// - On a node with a set width/height aspect ratio control the size of the
//   unset dimension
// - On a node with a set flex basis aspect ratio controls the size of the node
//   in the cross axis if unset
// - On a node with a measure function aspect ratio works as though the measure
//   function measures the flex basis
// - On a node with flex grow/shrink aspect ratio controls the size of the node
//   in the cross axis if unset
// - Aspect ratio takes min/max dimensions into account
WIN_EXPORT void YGNodeStyleSetAspectRatio(YGNodeRef node, float aspectRatio);
WIN_EXPORT float YGNodeStyleGetAspectRatio(YGNodeConstRef node);

WIN_EXPORT float YGNodeLayoutGetLeft(YGNodeConstRef node);
WIN_EXPORT float YGNodeLayoutGetTop(YGNodeConstRef node);
WIN_EXPORT float YGNodeLayoutGetRight(YGNodeConstRef node);
WIN_EXPORT float YGNodeLayoutGetBottom(YGNodeConstRef node);
WIN_EXPORT float YGNodeLayoutGetWidth(YGNodeConstRef node);
WIN_EXPORT float YGNodeLayoutGetHeight(YGNodeConstRef node);
WIN_EXPORT YGDirection YGNodeLayoutGetDirection(YGNodeConstRef node);
WIN_EXPORT bool YGNodeLayoutGetHadOverflow(YGNodeConstRef node);

// Get the computed values for these nodes after performing layout. If they were
// set using point values then the returned value will be the same as
// YGNodeStyleGetXXX. However if they were set using a percentage value then the
// returned value is the computed value used during layout.
WIN_EXPORT float YGNodeLayoutGetMargin(YGNodeConstRef node, YGEdge edge);
WIN_EXPORT float YGNodeLayoutGetBorder(YGNodeConstRef node, YGEdge edge);
WIN_EXPORT float YGNodeLayoutGetPadding(YGNodeConstRef node, YGEdge edge);

WIN_EXPORT void YGConfigSetLogger(YGConfigRef config, YGLogger logger);
// Set this to number of pixels in 1 point to round calculation results If you
// want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void YGConfigSetPointScaleFactor(
    YGConfigRef config,
    float pixelsInPoint);
WIN_EXPORT float YGConfigGetPointScaleFactor(YGConfigConstRef config);

// Yoga previously had an error where containers would take the maximum space
// possible instead of the minimum like they are supposed to. In practice this
// resulted in implicit behaviour similar to align-self: stretch; Because this
// was such a long-standing bug we must allow legacy users to switch back to
// this behaviour.
WIN_EXPORT YG_DEPRECATED(
    "Please use "
    "\"YGConfigGetErrata()\"") bool YGConfigGetUseLegacyStretchBehaviour(YGConfigConstRef
                                                                             config);
WIN_EXPORT
YG_DEPRECATED(
    "\"YGConfigSetUseLegacyStretchBehaviour\" will be removed in the next "
    "release. Usage should be replaced with \"YGConfigSetErrata(YGErrataAll)\" "
    "to opt out of all future breaking conformance fixes, or "
    "\"YGConfigSetErrata(YGErrataStretchFlexBasis)\" to opt out of the "
    "specific conformance fix previously disabled by "
    "\"UseLegacyStretchBehaviour\".")
void YGConfigSetUseLegacyStretchBehaviour(
    YGConfigRef config,
    bool useLegacyStretchBehaviour);

// YGConfig
WIN_EXPORT YGConfigRef YGConfigNew(void);
WIN_EXPORT void YGConfigFree(YGConfigRef config);

WIN_EXPORT void YGConfigSetExperimentalFeatureEnabled(
    YGConfigRef config,
    YGExperimentalFeature feature,
    bool enabled);
WIN_EXPORT bool YGConfigIsExperimentalFeatureEnabled(
    YGConfigConstRef config,
    YGExperimentalFeature feature);

// Using the web defaults is the preferred configuration for new projects. Usage
// of non web defaults should be considered as legacy.
WIN_EXPORT void YGConfigSetUseWebDefaults(YGConfigRef config, bool enabled);
WIN_EXPORT bool YGConfigGetUseWebDefaults(YGConfigConstRef config);

WIN_EXPORT void YGConfigSetCloneNodeFunc(
    YGConfigRef config,
    YGCloneNodeFunc callback);

WIN_EXPORT YGConfigRef YGConfigGetDefault(void);

WIN_EXPORT void YGConfigSetContext(YGConfigRef config, void* context);
WIN_EXPORT void* YGConfigGetContext(YGConfigConstRef config);

WIN_EXPORT void YGConfigSetErrata(YGConfigRef config, YGErrata errata);
WIN_EXPORT YGErrata YGConfigGetErrata(YGConfigConstRef config);

WIN_EXPORT float YGRoundValueToPixelGrid(
    double value,
    double pointScaleFactor,
    bool forceCeil,
    bool forceFloor);

YG_EXTERN_C_END
