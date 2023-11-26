/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YogaStylableProps.h"

#include <react/renderer/components/view/conversions.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>
#include <react/utils/CoreFeatures.h>
#include <yoga/Yoga.h>
#include <unordered_set>

#include "conversions.h"

namespace facebook::react {

YogaStylableProps::YogaStylableProps(
    const PropsParserContext& context,
    const YogaStylableProps& sourceProps,
    const RawProps& rawProps)
    : Props() {
  initialize(context, sourceProps, rawProps);

  yogaStyle = CoreFeatures::enablePropIteratorSetter
      ? sourceProps.yogaStyle
      : convertRawProp(context, rawProps, sourceProps.yogaStyle);

  if (!CoreFeatures::enablePropIteratorSetter) {
    convertRawPropAliases(context, sourceProps, rawProps);
  }
};

template <typename T>
static inline T const getFieldValue(
    const PropsParserContext& context,
    const RawValue& value,
    T const defaultValue) {
  if (value.hasValue()) {
    T res;
    fromRawValue(context, value, res);
    return res;
  }

  return defaultValue;
}

#define REBUILD_FIELD_SWITCH_CASE2(field, fieldName)                       \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(fieldName): {                          \
    yogaStyle.field() = getFieldValue(context, value, ygDefaults.field()); \
    return;                                                                \
  }

// @lint-ignore CLANGTIDY cppcoreguidelines-macro-usage
#define REBUILD_FIELD_SWITCH_CASE_YSP(field) \
  REBUILD_FIELD_SWITCH_CASE2(field, #field)

#define REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(field, setter, index, fieldName) \
  case CONSTEXPR_RAW_PROPS_KEY_HASH(fieldName): {                             \
    yogaStyle.setter(                                                         \
        index, getFieldValue(context, value, ygDefaults.field(index)));       \
    return;                                                                   \
  }

#define REBUILD_FIELD_YG_DIMENSION(field, setter, widthStr, heightStr) \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                \
      field, setter, yoga::Dimension::Width, widthStr);                \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                \
      field, setter, yoga::Dimension::Height, heightStr);

#define REBUILD_FIELD_YG_GUTTER(                          \
    field, setter, rowGapStr, columnGapStr, gapStr)       \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                   \
      field, setter, yoga::Gutter::Row, rowGapStr);       \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                   \
      field, setter, yoga::Gutter::Column, columnGapStr); \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                   \
      field, setter, yoga::Gutter::All, gapStr);

#define REBUILD_FIELD_YG_EDGES(field, setter, prefix, suffix)             \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                   \
      field, setter, yoga::Edge::Left, prefix "Left" suffix);             \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                   \
      field, setter, yoga::Edge::Top, prefix "Top" suffix);               \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                   \
      field, setter, yoga::Edge::Right, prefix "Right" suffix);           \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                   \
      field, setter, yoga::Edge::Bottom, prefix "Bottom" suffix);         \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                   \
      field, setter, yoga::Edge::Start, prefix "Start" suffix);           \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                   \
      field, setter, yoga::Edge::End, prefix "End" suffix);               \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                   \
      field, setter, yoga::Edge::Horizontal, prefix "Horizontal" suffix); \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                   \
      field, setter, yoga::Edge::Vertical, prefix "Vertical" suffix);     \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                                   \
      field, setter, yoga::Edge::All, prefix "" suffix);

#define REBUILD_FIELD_YG_EDGES_POSITION()                            \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                              \
      position, setPosition, yoga::Edge::Left, "left");              \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                              \
      position, setPosition, yoga::Edge::Top, "top");                \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                              \
      position, setPosition, yoga::Edge::Right, "right");            \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                              \
      position, setPosition, yoga::Edge::Bottom, "bottom");          \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                              \
      position, setPosition, yoga::Edge::Start, "start");            \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                              \
      position, setPosition, yoga::Edge::End, "end");                \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                              \
      position, setPosition, yoga::Edge::Horizontal, "insetInline"); \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                              \
      position, setPosition, yoga::Edge::Vertical, "insetBlock");    \
  REBUILD_YG_FIELD_SWITCH_CASE_INDEXED(                              \
      position, setPosition, yoga::Edge::All, "inset");

void YogaStylableProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  static const auto ygDefaults = yoga::Style{};
  static const auto defaults = YogaStylableProps{};

  Props::setProp(context, hash, propName, value);

  switch (hash) {
    REBUILD_FIELD_SWITCH_CASE_YSP(direction);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexDirection);
    REBUILD_FIELD_SWITCH_CASE_YSP(justifyContent);
    REBUILD_FIELD_SWITCH_CASE_YSP(alignContent);
    REBUILD_FIELD_SWITCH_CASE_YSP(alignItems);
    REBUILD_FIELD_SWITCH_CASE_YSP(alignSelf);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexWrap);
    REBUILD_FIELD_SWITCH_CASE_YSP(overflow);
    REBUILD_FIELD_SWITCH_CASE_YSP(display);
    REBUILD_FIELD_SWITCH_CASE_YSP(flex);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexGrow);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexShrink);
    REBUILD_FIELD_SWITCH_CASE_YSP(flexBasis);
    REBUILD_FIELD_SWITCH_CASE2(positionType, "position");
    REBUILD_FIELD_YG_GUTTER(gap, setGap, "rowGap", "columnGap", "gap");
    REBUILD_FIELD_SWITCH_CASE_YSP(aspectRatio);
    REBUILD_FIELD_YG_DIMENSION(dimension, setDimension, "width", "height");
    REBUILD_FIELD_YG_DIMENSION(
        minDimension, setMinDimension, "minWidth", "minHeight");
    REBUILD_FIELD_YG_DIMENSION(
        maxDimension, setMaxDimension, "maxWidth", "maxHeight");
    REBUILD_FIELD_YG_EDGES_POSITION();
    REBUILD_FIELD_YG_EDGES(margin, setMargin, "margin", "");
    REBUILD_FIELD_YG_EDGES(padding, setPadding, "padding", "");
    REBUILD_FIELD_YG_EDGES(border, setBorder, "border", "Width");

    // Aliases
    RAW_SET_PROP_SWITCH_CASE(insetBlockEnd, "insetBlockEnd");
    RAW_SET_PROP_SWITCH_CASE(insetBlockStart, "insetBlockStart");
    RAW_SET_PROP_SWITCH_CASE(insetInlineEnd, "insetInlineEnd");
    RAW_SET_PROP_SWITCH_CASE(insetInlineStart, "insetInlineStart");
    RAW_SET_PROP_SWITCH_CASE(marginInline, "marginInline");
    RAW_SET_PROP_SWITCH_CASE(marginInlineStart, "marginInlineStart");
    RAW_SET_PROP_SWITCH_CASE(marginInlineEnd, "marginInlineEnd");
    RAW_SET_PROP_SWITCH_CASE(marginBlock, "marginBlock");
    RAW_SET_PROP_SWITCH_CASE(marginBlockStart, "marginBlockStart");
    RAW_SET_PROP_SWITCH_CASE(marginBlockEnd, "marginBlockEnd");
    RAW_SET_PROP_SWITCH_CASE(paddingInline, "paddingInline");
    RAW_SET_PROP_SWITCH_CASE(paddingInlineStart, "paddingInlineStart");
    RAW_SET_PROP_SWITCH_CASE(paddingInlineEnd, "paddingInlineEnd");
    RAW_SET_PROP_SWITCH_CASE(paddingBlock, "paddingBlock");
    RAW_SET_PROP_SWITCH_CASE(paddingBlockStart, "paddingBlockStart");
    RAW_SET_PROP_SWITCH_CASE(paddingBlockEnd, "paddingBlockEnd");
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList YogaStylableProps::getDebugProps() const {
  const auto defaultYogaStyle = yoga::Style{};
  return {
      debugStringConvertibleItem(
          "direction", yogaStyle.direction(), defaultYogaStyle.direction()),
      debugStringConvertibleItem(
          "flexDirection",
          yogaStyle.flexDirection(),
          defaultYogaStyle.flexDirection()),
      debugStringConvertibleItem(
          "justifyContent",
          yogaStyle.justifyContent(),
          defaultYogaStyle.justifyContent()),
      debugStringConvertibleItem(
          "alignContent",
          yogaStyle.alignContent(),
          defaultYogaStyle.alignContent()),
      debugStringConvertibleItem(
          "alignItems", yogaStyle.alignItems(), defaultYogaStyle.alignItems()),
      debugStringConvertibleItem(
          "alignSelf", yogaStyle.alignSelf(), defaultYogaStyle.alignSelf()),
      debugStringConvertibleItem(
          "positionType",
          yogaStyle.positionType(),
          defaultYogaStyle.positionType()),
      debugStringConvertibleItem(
          "flexWrap", yogaStyle.flexWrap(), defaultYogaStyle.flexWrap()),
      debugStringConvertibleItem(
          "overflow", yogaStyle.overflow(), defaultYogaStyle.overflow()),
      debugStringConvertibleItem(
          "display", yogaStyle.display(), defaultYogaStyle.display()),
      debugStringConvertibleItem(
          "flex", yogaStyle.flex(), defaultYogaStyle.flex()),
      debugStringConvertibleItem(
          "flexGrow", yogaStyle.flexGrow(), defaultYogaStyle.flexGrow()),
      debugStringConvertibleItem(
          "rowGap",
          yogaStyle.gap(yoga::Gutter::Row),
          defaultYogaStyle.gap(yoga::Gutter::Row)),
      debugStringConvertibleItem(
          "columnGap",
          yogaStyle.gap(yoga::Gutter::Column),
          defaultYogaStyle.gap(yoga::Gutter::Column)),
      debugStringConvertibleItem(
          "gap",
          yogaStyle.gap(yoga::Gutter::All),
          defaultYogaStyle.gap(yoga::Gutter::All)),
      debugStringConvertibleItem(
          "flexShrink", yogaStyle.flexShrink(), defaultYogaStyle.flexShrink()),
      debugStringConvertibleItem(
          "flexBasis", yogaStyle.flexBasis(), defaultYogaStyle.flexBasis()),
      debugStringConvertibleItem(
          "marginLeft",
          yogaStyle.margin(yoga::Edge::Left),
          defaultYogaStyle.margin(yoga::Edge::Left)),
      debugStringConvertibleItem(
          "marginTop",
          yogaStyle.margin(yoga::Edge::Top),
          defaultYogaStyle.margin(yoga::Edge::Top)),
      debugStringConvertibleItem(
          "marginRight",
          yogaStyle.margin(yoga::Edge::Right),
          defaultYogaStyle.margin(yoga::Edge::Right)),
      debugStringConvertibleItem(
          "marginBottom",
          yogaStyle.margin(yoga::Edge::Bottom),
          defaultYogaStyle.margin(yoga::Edge::Bottom)),
      debugStringConvertibleItem(
          "marginStart",
          yogaStyle.margin(yoga::Edge::Start),
          defaultYogaStyle.margin(yoga::Edge::Start)),
      debugStringConvertibleItem(
          "marginEnd",
          yogaStyle.margin(yoga::Edge::End),
          defaultYogaStyle.margin(yoga::Edge::End)),
      debugStringConvertibleItem(
          "marginHorizontal",
          yogaStyle.margin(yoga::Edge::Horizontal),
          defaultYogaStyle.margin(yoga::Edge::Horizontal)),
      debugStringConvertibleItem(
          "marginVertical",
          yogaStyle.margin(yoga::Edge::Vertical),
          defaultYogaStyle.margin(yoga::Edge::Vertical)),
      debugStringConvertibleItem(
          "margin",
          yogaStyle.margin(yoga::Edge::All),
          defaultYogaStyle.margin(yoga::Edge::All)),
      debugStringConvertibleItem(
          "left",
          yogaStyle.position(yoga::Edge::Left),
          defaultYogaStyle.position(yoga::Edge::Left)),
      debugStringConvertibleItem(
          "top",
          yogaStyle.position(yoga::Edge::Top),
          defaultYogaStyle.position(yoga::Edge::Top)),
      debugStringConvertibleItem(
          "right",
          yogaStyle.position(yoga::Edge::Right),
          defaultYogaStyle.position(yoga::Edge::Right)),
      debugStringConvertibleItem(
          "bottom",
          yogaStyle.position(yoga::Edge::Bottom),
          defaultYogaStyle.position(yoga::Edge::Bottom)),
      debugStringConvertibleItem(
          "start",
          yogaStyle.position(yoga::Edge::Start),
          defaultYogaStyle.position(yoga::Edge::Start)),
      debugStringConvertibleItem(
          "end",
          yogaStyle.position(yoga::Edge::End),
          defaultYogaStyle.position(yoga::Edge::End)),
      debugStringConvertibleItem(
          "inseInline",
          yogaStyle.position(yoga::Edge::Horizontal),
          defaultYogaStyle.position(yoga::Edge::Horizontal)),
      debugStringConvertibleItem(
          "insetBlock",
          yogaStyle.position(yoga::Edge::Vertical),
          defaultYogaStyle.position(yoga::Edge::Vertical)),
      debugStringConvertibleItem(
          "inset",
          yogaStyle.position(yoga::Edge::All),
          defaultYogaStyle.position(yoga::Edge::All)),
      debugStringConvertibleItem(
          "paddingLeft",
          yogaStyle.padding(yoga::Edge::Left),
          defaultYogaStyle.padding(yoga::Edge::Left)),
      debugStringConvertibleItem(
          "paddingTop",
          yogaStyle.padding(yoga::Edge::Top),
          defaultYogaStyle.padding(yoga::Edge::Top)),
      debugStringConvertibleItem(
          "paddingRight",
          yogaStyle.padding(yoga::Edge::Right),
          defaultYogaStyle.padding(yoga::Edge::Right)),
      debugStringConvertibleItem(
          "paddingBottom",
          yogaStyle.padding(yoga::Edge::Bottom),
          defaultYogaStyle.padding(yoga::Edge::Bottom)),
      debugStringConvertibleItem(
          "paddingStart",
          yogaStyle.padding(yoga::Edge::Start),
          defaultYogaStyle.padding(yoga::Edge::Start)),
      debugStringConvertibleItem(
          "paddingEnd",
          yogaStyle.padding(yoga::Edge::End),
          defaultYogaStyle.padding(yoga::Edge::End)),
      debugStringConvertibleItem(
          "paddingHorizontal",
          yogaStyle.padding(yoga::Edge::Horizontal),
          defaultYogaStyle.padding(yoga::Edge::Horizontal)),
      debugStringConvertibleItem(
          "paddingVertical",
          yogaStyle.padding(yoga::Edge::Vertical),
          defaultYogaStyle.padding(yoga::Edge::Vertical)),
      debugStringConvertibleItem(
          "padding",
          yogaStyle.padding(yoga::Edge::All),
          defaultYogaStyle.padding(yoga::Edge::All)),
      debugStringConvertibleItem(
          "borderLeftWidth",
          yogaStyle.border(yoga::Edge::Left),
          defaultYogaStyle.border(yoga::Edge::Left)),
      debugStringConvertibleItem(
          "borderTopWidth",
          yogaStyle.border(yoga::Edge::Top),
          defaultYogaStyle.border(yoga::Edge::Top)),
      debugStringConvertibleItem(
          "borderRightWidth",
          yogaStyle.border(yoga::Edge::Right),
          defaultYogaStyle.border(yoga::Edge::Right)),
      debugStringConvertibleItem(
          "borderBottomWidth",
          yogaStyle.border(yoga::Edge::Bottom),
          defaultYogaStyle.border(yoga::Edge::Bottom)),
      debugStringConvertibleItem(
          "borderStartWidth",
          yogaStyle.border(yoga::Edge::Start),
          defaultYogaStyle.border(yoga::Edge::Start)),
      debugStringConvertibleItem(
          "borderEndWidth",
          yogaStyle.border(yoga::Edge::End),
          defaultYogaStyle.border(yoga::Edge::End)),
      debugStringConvertibleItem(
          "borderHorizontalWidth",
          yogaStyle.border(yoga::Edge::Horizontal),
          defaultYogaStyle.border(yoga::Edge::Horizontal)),
      debugStringConvertibleItem(
          "borderVerticalWidth",
          yogaStyle.border(yoga::Edge::Vertical),
          defaultYogaStyle.border(yoga::Edge::Vertical)),
      debugStringConvertibleItem(
          "bordeWidth",
          yogaStyle.border(yoga::Edge::All),
          defaultYogaStyle.border(yoga::Edge::All)),
      debugStringConvertibleItem(
          "width",
          yogaStyle.dimension(yoga::Dimension::Width),
          defaultYogaStyle.dimension(yoga::Dimension::Width)),
      debugStringConvertibleItem(
          "height",
          yogaStyle.dimension(yoga::Dimension::Height),
          defaultYogaStyle.dimension(yoga::Dimension::Height)),
      debugStringConvertibleItem(
          "minWidth",
          yogaStyle.minDimension(yoga::Dimension::Width),
          defaultYogaStyle.minDimension(yoga::Dimension::Width)),
      debugStringConvertibleItem(
          "minHeight",
          yogaStyle.minDimension(yoga::Dimension::Height),
          defaultYogaStyle.minDimension(yoga::Dimension::Height)),
      debugStringConvertibleItem(
          "maxWidth",
          yogaStyle.maxDimension(yoga::Dimension::Width),
          defaultYogaStyle.maxDimension(yoga::Dimension::Width)),
      debugStringConvertibleItem(
          "maxHeight",
          yogaStyle.maxDimension(yoga::Dimension::Height),
          defaultYogaStyle.maxDimension(yoga::Dimension::Height)),
      debugStringConvertibleItem(
          "aspectRatio",
          yogaStyle.aspectRatio(),
          defaultYogaStyle.aspectRatio()),
  };
}
#endif

void YogaStylableProps::convertRawPropAliases(
    const PropsParserContext& context,
    const YogaStylableProps& sourceProps,
    const RawProps& rawProps) {
  insetBlockEnd = convertRawProp(
      context,
      rawProps,
      "insetBlockEnd",
      sourceProps.insetBlockEnd,
      yoga::value::undefined());
  insetBlockStart = convertRawProp(
      context,
      rawProps,
      "insetBlockStart",
      sourceProps.insetBlockStart,
      yoga::value::undefined());
  insetInlineEnd = convertRawProp(
      context,
      rawProps,
      "insetInlineEnd",
      sourceProps.insetInlineEnd,
      yoga::value::undefined());
  insetInlineStart = convertRawProp(
      context,
      rawProps,
      "insetInlineStart",
      sourceProps.insetInlineStart,
      yoga::value::undefined());
  marginInline = convertRawProp(
      context,
      rawProps,
      "marginInline",
      sourceProps.marginInline,
      yoga::value::undefined());
  marginInlineStart = convertRawProp(
      context,
      rawProps,
      "marginInlineStart",
      sourceProps.marginInlineStart,
      yoga::value::undefined());
  marginInlineEnd = convertRawProp(
      context,
      rawProps,
      "marginInlineEnd",
      sourceProps.marginInlineEnd,
      yoga::value::undefined());
  marginBlock = convertRawProp(
      context,
      rawProps,
      "marginBlock",
      sourceProps.marginBlock,
      yoga::value::undefined());
  marginBlockStart = convertRawProp(
      context,
      rawProps,
      "marginBlockStart",
      sourceProps.marginBlockStart,
      yoga::value::undefined());
  marginBlockEnd = convertRawProp(
      context,
      rawProps,
      "marginBlockEnd",
      sourceProps.marginBlockEnd,
      yoga::value::undefined());

  paddingInline = convertRawProp(
      context,
      rawProps,
      "paddingInline",
      sourceProps.paddingInline,
      yoga::value::undefined());
  paddingInlineStart = convertRawProp(
      context,
      rawProps,
      "paddingInlineStart",
      sourceProps.paddingInlineStart,
      yoga::value::undefined());
  paddingInlineEnd = convertRawProp(
      context,
      rawProps,
      "paddingInlineEnd",
      sourceProps.paddingInlineEnd,
      yoga::value::undefined());
  paddingBlock = convertRawProp(
      context,
      rawProps,
      "paddingBlock",
      sourceProps.paddingBlock,
      yoga::value::undefined());
  paddingBlockStart = convertRawProp(
      context,
      rawProps,
      "paddingBlockStart",
      sourceProps.paddingBlockStart,
      yoga::value::undefined());
  paddingBlockEnd = convertRawProp(
      context,
      rawProps,
      "paddingBlockEnd",
      sourceProps.paddingBlockEnd,
      yoga::value::undefined());
}

} // namespace facebook::react
