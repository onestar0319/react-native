/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <CSSLayout/CSSLayout.h>
#include <fb/fbjni.h>
#include <iostream>

using namespace facebook::jni;
using namespace std;

static inline weak_ref<jobject> *jobjectContext(CSSNodeRef node) {
  return reinterpret_cast<weak_ref<jobject> *>(CSSNodeGetContext(node));
}

static void _jniTransferLayoutDirection(CSSNodeRef node, alias_ref<jobject> javaNode) {
  static auto layoutDirectionField = javaNode->getClass()->getField<jint>("mLayoutDirection");
  javaNode->setFieldValue(layoutDirectionField, static_cast<jint>(CSSNodeLayoutGetDirection(node)));
}

static void _jniTransferLayoutOutputsRecursive(CSSNodeRef root) {
  if (auto obj = jobjectContext(root)->lockLocal()) {
    static auto widthField = obj->getClass()->getField<jfloat>("mWidth");
    static auto heightField = obj->getClass()->getField<jfloat>("mHeight");
    static auto leftField = obj->getClass()->getField<jfloat>("mLeft");
    static auto topField = obj->getClass()->getField<jfloat>("mTop");

    obj->setFieldValue(widthField, CSSNodeLayoutGetWidth(root));
    obj->setFieldValue(heightField, CSSNodeLayoutGetHeight(root));
    obj->setFieldValue(leftField, CSSNodeLayoutGetLeft(root));
    obj->setFieldValue(topField, CSSNodeLayoutGetTop(root));
    _jniTransferLayoutDirection(root, obj);

    for (uint32_t i = 0; i < CSSNodeChildCount(root); i++) {
      _jniTransferLayoutOutputsRecursive(CSSNodeGetChild(root, i));
    }
  } else {
    CSSLog(YGLogLevelError, "Java CSSNode was GCed during layout calculation\n");
  }
}

static void _jniPrint(CSSNodeRef node) {
  if (auto obj = jobjectContext(node)->lockLocal()) {
    cout << obj->toString() << endl;
  } else {
    CSSLog(YGLogLevelError, "Java CSSNode was GCed during layout calculation\n");
  }
}

static CSSSize _jniMeasureFunc(CSSNodeRef node,
                               float width,
                               YGMeasureMode widthMode,
                               float height,
                               YGMeasureMode heightMode) {
  if (auto obj = jobjectContext(node)->lockLocal()) {
    static auto measureFunc = findClassLocal("com/facebook/csslayout/CSSNode")
                                  ->getMethod<jlong(jfloat, jint, jfloat, jint)>("measure");

    _jniTransferLayoutDirection(node, obj);
    const auto measureResult = measureFunc(obj, width, widthMode, height, heightMode);

    static_assert(sizeof(measureResult) == 8,
                  "Expected measureResult to be 8 bytes, or two 32 bit ints");

    const float measuredWidth = static_cast<float>(0xFFFFFFFF & (measureResult >> 32));
    const float measuredHeight = static_cast<float>(0xFFFFFFFF & measureResult);

    return CSSSize{measuredWidth, measuredHeight};
  } else {
    CSSLog(YGLogLevelError, "Java CSSNode was GCed during layout calculation\n");
    return CSSSize{
        widthMode == YGMeasureModeUndefined ? 0 : width,
        heightMode == YGMeasureModeUndefined ? 0 : height,
    };
  }
}

struct JYogaLogLevel : public JavaClass<JYogaLogLevel> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/csslayout/YogaLogLevel;";
};

static global_ref<jobject> *jLogger;
static int _jniLog(YGLogLevel level, const char *format, va_list args) {
  char buffer[256];
  int result = vsnprintf(buffer, sizeof(buffer), format, args);

  static auto logFunc = findClassLocal("com/facebook/csslayout/CSSLogger")
                            ->getMethod<void(local_ref<JYogaLogLevel>, jstring)>("log");

  static auto logLevelFromInt =
      JYogaLogLevel::javaClassStatic()->getStaticMethod<JYogaLogLevel::javaobject(jint)>("fromInt");

  logFunc(jLogger->get(),
          logLevelFromInt(JYogaLogLevel::javaClassStatic(), static_cast<jint>(level)),
          Environment::current()->NewStringUTF(buffer));

  return result;
}

static inline CSSNodeRef _jlong2CSSNodeRef(jlong addr) {
  return reinterpret_cast<CSSNodeRef>(static_cast<intptr_t>(addr));
}

void jni_CSSLayoutSetLogger(alias_ref<jclass> clazz, alias_ref<jobject> logger) {
  if (jLogger) {
    jLogger->releaseAlias();
    delete jLogger;
  }

  if (logger) {
    jLogger = new global_ref<jobject>(make_global(logger));
    CSSLayoutSetLogger(_jniLog);
  } else {
    jLogger = NULL;
    CSSLayoutSetLogger(NULL);
  }
}

void jni_CSSLog(alias_ref<jclass> clazz, jint level, jstring message) {
  const char *nMessage = Environment::current()->GetStringUTFChars(message, 0);
  CSSLog(static_cast<YGLogLevel>(level), "%s", nMessage);
  Environment::current()->ReleaseStringUTFChars(message, nMessage);
}

void jni_CSSLayoutSetExperimentalFeatureEnabled(alias_ref<jclass> clazz,
                                                jint feature,
                                                jboolean enabled) {
  CSSLayoutSetExperimentalFeatureEnabled(static_cast<YGExperimentalFeature>(feature), enabled);
}

jboolean jni_CSSLayoutIsExperimentalFeatureEnabled(alias_ref<jclass> clazz, jint feature) {
  return CSSLayoutIsExperimentalFeatureEnabled(static_cast<YGExperimentalFeature>(feature));
}

jint jni_CSSNodeGetInstanceCount(alias_ref<jclass> clazz) {
  return CSSNodeGetInstanceCount();
}

jlong jni_CSSNodeNew(alias_ref<jobject> thiz) {
  const CSSNodeRef node = CSSNodeNew();
  CSSNodeSetContext(node, new weak_ref<jobject>(make_weak(thiz)));
  CSSNodeSetPrintFunc(node, _jniPrint);
  return reinterpret_cast<jlong>(node);
}

void jni_CSSNodeFree(alias_ref<jobject> thiz, jlong nativePointer) {
  const CSSNodeRef node = _jlong2CSSNodeRef(nativePointer);
  delete jobjectContext(node);
  CSSNodeFree(node);
}

void jni_CSSNodeReset(alias_ref<jobject> thiz, jlong nativePointer) {
  const CSSNodeRef node = _jlong2CSSNodeRef(nativePointer);
  void *context = CSSNodeGetContext(node);
  CSSNodeReset(node);
  CSSNodeSetContext(node, context);
  CSSNodeSetPrintFunc(node, _jniPrint);
}

void jni_CSSNodeInsertChild(alias_ref<jobject>,
                            jlong nativePointer,
                            jlong childPointer,
                            jint index) {
  CSSNodeInsertChild(_jlong2CSSNodeRef(nativePointer), _jlong2CSSNodeRef(childPointer), index);
}

void jni_CSSNodeRemoveChild(alias_ref<jobject>, jlong nativePointer, jlong childPointer) {
  CSSNodeRemoveChild(_jlong2CSSNodeRef(nativePointer), _jlong2CSSNodeRef(childPointer));
}

void jni_CSSNodeCalculateLayout(alias_ref<jobject>, jlong nativePointer) {
  const CSSNodeRef root = _jlong2CSSNodeRef(nativePointer);
  CSSNodeCalculateLayout(root,
                         YGUndefined,
                         YGUndefined,
                         CSSNodeStyleGetDirection(_jlong2CSSNodeRef(nativePointer)));
  _jniTransferLayoutOutputsRecursive(root);
}

void jni_CSSNodeMarkDirty(alias_ref<jobject>, jlong nativePointer) {
  CSSNodeMarkDirty(_jlong2CSSNodeRef(nativePointer));
}

jboolean jni_CSSNodeIsDirty(alias_ref<jobject>, jlong nativePointer) {
  return (jboolean) CSSNodeIsDirty(_jlong2CSSNodeRef(nativePointer));
}

void jni_CSSNodeSetHasMeasureFunc(alias_ref<jobject>,
                                  jlong nativePointer,
                                  jboolean hasMeasureFunc) {
  CSSNodeSetMeasureFunc(_jlong2CSSNodeRef(nativePointer), hasMeasureFunc ? _jniMeasureFunc : NULL);
}

jboolean jni_CSSNodeHasNewLayout(alias_ref<jobject>, jlong nativePointer) {
  return (jboolean) CSSNodeGetHasNewLayout(_jlong2CSSNodeRef(nativePointer));
}

void jni_CSSNodeMarkLayoutSeen(alias_ref<jobject>, jlong nativePointer) {
  CSSNodeSetHasNewLayout(_jlong2CSSNodeRef(nativePointer), false);
}

void jni_CSSNodeCopyStyle(alias_ref<jobject>, jlong dstNativePointer, jlong srcNativePointer) {
  CSSNodeCopyStyle(_jlong2CSSNodeRef(dstNativePointer), _jlong2CSSNodeRef(srcNativePointer));
}

#define CSS_NODE_JNI_STYLE_PROP(javatype, type, name)                                       \
  javatype jni_CSSNodeStyleGet##name(alias_ref<jobject>, jlong nativePointer) {             \
    return (javatype) CSSNodeStyleGet##name(_jlong2CSSNodeRef(nativePointer));              \
  }                                                                                         \
                                                                                            \
  void jni_CSSNodeStyleSet##name(alias_ref<jobject>, jlong nativePointer, javatype value) { \
    CSSNodeStyleSet##name(_jlong2CSSNodeRef(nativePointer), static_cast<type>(value));      \
  }

#define CSS_NODE_JNI_STYLE_EDGE_PROP(javatype, type, name)                                 \
  javatype jni_CSSNodeStyleGet##name(alias_ref<jobject>, jlong nativePointer, jint edge) { \
    return (javatype) CSSNodeStyleGet##name(_jlong2CSSNodeRef(nativePointer),              \
                                            static_cast<YGEdge>(edge));                    \
  }                                                                                        \
                                                                                           \
  void jni_CSSNodeStyleSet##name(alias_ref<jobject>,                                       \
                                 jlong nativePointer,                                      \
                                 jint edge,                                                \
                                 javatype value) {                                         \
    CSSNodeStyleSet##name(_jlong2CSSNodeRef(nativePointer),                                \
                          static_cast<YGEdge>(edge),                                       \
                          static_cast<type>(value));                                       \
  }

CSS_NODE_JNI_STYLE_PROP(jint, YGDirection, Direction);
CSS_NODE_JNI_STYLE_PROP(jint, YGFlexDirection, FlexDirection);
CSS_NODE_JNI_STYLE_PROP(jint, YGJustify, JustifyContent);
CSS_NODE_JNI_STYLE_PROP(jint, YGAlign, AlignItems);
CSS_NODE_JNI_STYLE_PROP(jint, YGAlign, AlignSelf);
CSS_NODE_JNI_STYLE_PROP(jint, YGAlign, AlignContent);
CSS_NODE_JNI_STYLE_PROP(jint, YGPositionType, PositionType);
CSS_NODE_JNI_STYLE_PROP(jint, YGWrap, FlexWrap);
CSS_NODE_JNI_STYLE_PROP(jint, YGOverflow, Overflow);

void jni_CSSNodeStyleSetFlex(alias_ref<jobject>, jlong nativePointer, jfloat value) {
  CSSNodeStyleSetFlex(_jlong2CSSNodeRef(nativePointer), static_cast<float>(value));
}
CSS_NODE_JNI_STYLE_PROP(jfloat, float, FlexGrow);
CSS_NODE_JNI_STYLE_PROP(jfloat, float, FlexShrink);
CSS_NODE_JNI_STYLE_PROP(jfloat, float, FlexBasis);

CSS_NODE_JNI_STYLE_EDGE_PROP(jfloat, float, Position);
CSS_NODE_JNI_STYLE_EDGE_PROP(jfloat, float, Margin);
CSS_NODE_JNI_STYLE_EDGE_PROP(jfloat, float, Padding);
CSS_NODE_JNI_STYLE_EDGE_PROP(jfloat, float, Border);

CSS_NODE_JNI_STYLE_PROP(jfloat, float, Width);
CSS_NODE_JNI_STYLE_PROP(jfloat, float, MinWidth);
CSS_NODE_JNI_STYLE_PROP(jfloat, float, MaxWidth);
CSS_NODE_JNI_STYLE_PROP(jfloat, float, Height);
CSS_NODE_JNI_STYLE_PROP(jfloat, float, MinHeight);
CSS_NODE_JNI_STYLE_PROP(jfloat, float, MaxHeight);

// Yoga specific properties, not compatible with flexbox specification
CSS_NODE_JNI_STYLE_PROP(jfloat, float, AspectRatio);

#define CSSMakeNativeMethod(name) makeNativeMethod(#name, name)

jint JNI_OnLoad(JavaVM *vm, void *) {
  return initialize(vm, [] {
    registerNatives("com/facebook/csslayout/CSSNode",
                    {
                        CSSMakeNativeMethod(jni_CSSNodeNew),
                        CSSMakeNativeMethod(jni_CSSNodeFree),
                        CSSMakeNativeMethod(jni_CSSNodeReset),
                        CSSMakeNativeMethod(jni_CSSNodeInsertChild),
                        CSSMakeNativeMethod(jni_CSSNodeRemoveChild),
                        CSSMakeNativeMethod(jni_CSSNodeCalculateLayout),
                        CSSMakeNativeMethod(jni_CSSNodeHasNewLayout),
                        CSSMakeNativeMethod(jni_CSSNodeMarkDirty),
                        CSSMakeNativeMethod(jni_CSSNodeIsDirty),
                        CSSMakeNativeMethod(jni_CSSNodeMarkLayoutSeen),
                        CSSMakeNativeMethod(jni_CSSNodeSetHasMeasureFunc),
                        CSSMakeNativeMethod(jni_CSSNodeCopyStyle),

                        CSSMakeNativeMethod(jni_CSSNodeStyleGetDirection),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetDirection),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetFlexDirection),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetFlexDirection),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetJustifyContent),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetJustifyContent),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetAlignItems),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetAlignItems),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetAlignSelf),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetAlignSelf),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetAlignContent),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetAlignContent),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetPositionType),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetPositionType),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetFlexWrap),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetOverflow),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetOverflow),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetFlex),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetFlexGrow),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetFlexGrow),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetFlexShrink),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetFlexShrink),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetFlexBasis),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetFlexBasis),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetMargin),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetMargin),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetPadding),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetPadding),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetBorder),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetBorder),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetPosition),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetPosition),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetWidth),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetWidth),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetHeight),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetHeight),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetMinWidth),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetMinWidth),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetMinHeight),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetMinHeight),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetMaxWidth),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetMaxWidth),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetMaxHeight),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetMaxHeight),
                        CSSMakeNativeMethod(jni_CSSNodeStyleGetAspectRatio),
                        CSSMakeNativeMethod(jni_CSSNodeStyleSetAspectRatio),

                        CSSMakeNativeMethod(jni_CSSNodeGetInstanceCount),
                        CSSMakeNativeMethod(jni_CSSLayoutSetLogger),
                        CSSMakeNativeMethod(jni_CSSLog),
                        CSSMakeNativeMethod(jni_CSSLayoutSetExperimentalFeatureEnabled),
                        CSSMakeNativeMethod(jni_CSSLayoutIsExperimentalFeatureEnabled),
                    });
  });
}
