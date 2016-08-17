/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <assert.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

// Not defined in MSVC++
#ifndef NAN
static const unsigned long __nan[2] = {0xffffffff, 0x7fffffff};
#define NAN (*(const float *) __nan)
#endif

#define CSSUndefined NAN

#include <CSSLayout/CSSMacros.h>

CSS_EXTERN_C_BEGIN

typedef enum CSSDirection {
  CSSDirectionInherit,
  CSSDirectionLTR,
  CSSDirectionRTL,
} CSSDirection;

typedef enum CSSFlexDirection {
  CSSFlexDirectionColumn,
  CSSFlexDirectionColumnReverse,
  CSSFlexDirectionRow,
  CSSFlexDirectionRowReverse,
} CSSFlexDirection;

typedef enum CSSJustify {
  CSSJustifyFlexStart,
  CSSJustifyCenter,
  CSSJustifyFlexEnd,
  CSSJustifySpaceBetween,
  CSSJustifySpaceAround,
} CSSJustify;

typedef enum CSSOverflow {
  CSSOverflowVisible,
  CSSOverflowHidden,
} CSSOverflow;

// Note: auto is only a valid value for alignSelf. It is NOT a valid value for
// alignItems.
typedef enum CSSAlign {
  CSSAlignAuto,
  CSSAlignFlexStart,
  CSSAlignCenter,
  CSSAlignFlexEnd,
  CSSAlignStretch,
} CSSAlign;

typedef enum CSSPositionType {
  CSSPositionTypeRelative,
  CSSPositionTypeAbsolute,
} CSSPositionType;

typedef enum CSSWrapType {
  CSSWrapTypeNoWrap,
  CSSWrapTypeWrap,
} CSSWrapType;

typedef enum CSSMeasureMode {
  CSSMeasureModeUndefined,
  CSSMeasureModeExactly,
  CSSMeasureModeAtMost,
  CSSMeasureModeCount,
} CSSMeasureMode;

typedef enum CSSDimension {
  CSSDimensionWidth,
  CSSDimensionHeight,
} CSSDimension;

typedef enum CSSEdge {
  CSSEdgeLeft,
  CSSEdgeTop,
  CSSEdgeRight,
  CSSEdgeBottom,
  CSSEdgeStart,
  CSSEdgeEnd,
  CSSEdgeHorizontal,
  CSSEdgeVertical,
  CSSEdgeAll,
  CSSEdgeCount,
} CSSEdge;

typedef enum CSSPrintOptions {
  CSSPrintOptionsLayout = 1,
  CSSPrintOptionsStyle = 2,
  CSSPrintOptionsChildren = 4,
} CSSPrintOptions;

typedef struct CSSSize {
  float width;
  float height;
} CSSSize;

typedef struct CSSNode *CSSNodeRef;
typedef CSSSize (*CSSMeasureFunc)(void *context,
                                  float width,
                                  CSSMeasureMode widthMode,
                                  float height,
                                  CSSMeasureMode heightMode);
typedef void (*CSSPrintFunc)(void *context);

// CSSNode
CSSNodeRef CSSNodeNew();
void CSSNodeInit(CSSNodeRef node);
void CSSNodeFree(CSSNodeRef node);

void CSSNodeInsertChild(CSSNodeRef node, CSSNodeRef child, uint32_t index);
void CSSNodeRemoveChild(CSSNodeRef node, CSSNodeRef child);
CSSNodeRef CSSNodeGetChild(CSSNodeRef node, uint32_t index);
uint32_t CSSNodeChildCount(CSSNodeRef node);

void CSSNodeCalculateLayout(CSSNodeRef node,
                            float availableWidth,
                            float availableHeight,
                            CSSDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// CSSLayout knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to CSSLayout they must perform this dirty
// marking manually.
void CSSNodeMarkDirty(CSSNodeRef node);
bool CSSNodeIsDirty(CSSNodeRef node);

void CSSNodePrint(CSSNodeRef node, CSSPrintOptions options);

bool CSSValueIsUndefined(float value);

#define CSS_NODE_PROPERTY(type, name, paramName)          \
  void CSSNodeSet##name(CSSNodeRef node, type paramName); \
  type CSSNodeGet##name(CSSNodeRef node);

#define CSS_NODE_STYLE_PROPERTY(type, name, paramName)         \
  void CSSNodeStyleSet##name(CSSNodeRef node, type paramName); \
  type CSSNodeStyleGet##name(CSSNodeRef node);

#define CSS_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)                  \
  void CSSNodeStyleSet##name(CSSNodeRef node, CSSEdge edge, type paramName); \
  type CSSNodeStyleGet##name(CSSNodeRef node, CSSEdge edge);

#define CSS_NODE_LAYOUT_PROPERTY(type, name) type CSSNodeLayoutGet##name(CSSNodeRef node);

CSS_NODE_PROPERTY(void *, Context, context);
CSS_NODE_PROPERTY(CSSMeasureFunc, MeasureFunc, measureFunc);
CSS_NODE_PROPERTY(CSSPrintFunc, PrintFunc, printFunc);
CSS_NODE_PROPERTY(bool, IsTextnode, isTextNode);
CSS_NODE_PROPERTY(bool, HasNewLayout, hasNewLayout);

CSS_NODE_STYLE_PROPERTY(CSSDirection, Direction, direction);
CSS_NODE_STYLE_PROPERTY(CSSFlexDirection, FlexDirection, flexDirection);
CSS_NODE_STYLE_PROPERTY(CSSJustify, JustifyContent, justifyContent);
CSS_NODE_STYLE_PROPERTY(CSSAlign, AlignContent, alignContent);
CSS_NODE_STYLE_PROPERTY(CSSAlign, AlignItems, alignItems);
CSS_NODE_STYLE_PROPERTY(CSSAlign, AlignSelf, alignSelf);
CSS_NODE_STYLE_PROPERTY(CSSPositionType, PositionType, positionType);
CSS_NODE_STYLE_PROPERTY(CSSWrapType, FlexWrap, flexWrap);
CSS_NODE_STYLE_PROPERTY(CSSOverflow, Overflow, overflow);
CSS_NODE_STYLE_PROPERTY(float, Flex, flex);
CSS_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
CSS_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
CSS_NODE_STYLE_PROPERTY(float, FlexBasis, flexBasis);

CSS_NODE_STYLE_EDGE_PROPERTY(float, Position, position);
CSS_NODE_STYLE_EDGE_PROPERTY(float, Margin, margin);
CSS_NODE_STYLE_EDGE_PROPERTY(float, Padding, padding);
CSS_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

CSS_NODE_STYLE_PROPERTY(float, Width, width);
CSS_NODE_STYLE_PROPERTY(float, Height, height);
CSS_NODE_STYLE_PROPERTY(float, MinWidth, minWidth);
CSS_NODE_STYLE_PROPERTY(float, MinHeight, minHeight);
CSS_NODE_STYLE_PROPERTY(float, MaxWidth, maxWidth);
CSS_NODE_STYLE_PROPERTY(float, MaxHeight, maxHeight);

CSS_NODE_LAYOUT_PROPERTY(float, Left);
CSS_NODE_LAYOUT_PROPERTY(float, Top);
CSS_NODE_LAYOUT_PROPERTY(float, Right);
CSS_NODE_LAYOUT_PROPERTY(float, Bottom);
CSS_NODE_LAYOUT_PROPERTY(float, Width);
CSS_NODE_LAYOUT_PROPERTY(float, Height);
CSS_NODE_LAYOUT_PROPERTY(CSSDirection, Direction);

CSS_EXTERN_C_END
