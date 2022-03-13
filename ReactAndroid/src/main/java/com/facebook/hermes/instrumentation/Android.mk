# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


LOCAL_PATH := $(call my-dir)
REACT_NATIVE := $(LOCAL_PATH)/../../../../../../../..

include $(CLEAR_VARS)

LOCAL_MODULE := jsijniprofiler

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_C_INCLUDES := $(LOCAL_PATH) $(REACT_NATIVE)/ReactCommon/jsi

LOCAL_CPP_FEATURES := exceptions

LOCAL_STATIC_LIBRARIES := libjsireact
LOCAL_SHARED_LIBRARIES := \
  libfb \
  libfbjni \
  libfolly_runtime \
  libhermes \
  libjsi \
  libreactnativejni

include $(BUILD_SHARED_LIBRARY)

