# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := fabricjni

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)

LOCAL_SHARED_LIBRARIES := libreactconfig libyoga libglog libfb libfbjni libglog_init libfolly_json libfolly_futures libreact_render_mounting libreactnativeutilsjni libreact_utils libreact_render_debug libreact_render_graphics libreact_render_core libreact_render_mapbuffer react_render_componentregistry libreact_render_components_view libreact_render_components_view libreact_render_components_unimplementedview libreact_render_components_root libreact_render_components_scrollview libbetter libreact_render_attributedstring libreact_render_uimanager libreact_render_templateprocessor libreact_render_scheduler libreact_render_animations libreact_render_imagemanager libreact_render_textlayoutmanager

LOCAL_STATIC_LIBRARIES :=

LOCAL_C_INCLUDES := $(LOCAL_PATH)/

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/

LOCAL_CFLAGS := \
  -DLOG_TAG=\"Fabric\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++14 -Wall

include $(BUILD_SHARED_LIBRARY)

$(call import-module,fbgloginit)
$(call import-module,folly)
$(call import-module,fb)
$(call import-module,fbjni)
$(call import-module,yogajni)
$(call import-module,glog)

$(call import-module,react/utils)
$(call import-module,react/config)
$(call import-module,react/renderer/animations)
$(call import-module,react/renderer/attributedstring)
$(call import-module,react/renderer/componentregistry)
$(call import-module,react/renderer/core)
$(call import-module,react/renderer/components/root)
$(call import-module,react/renderer/components/scrollview)
$(call import-module,react/renderer/components/unimplementedview)
$(call import-module,react/renderer/components/view)
$(call import-module,react/renderer/debug)
$(call import-module,react/renderer/graphics)
$(call import-module,react/renderer/imagemanager)
$(call import-module,react/renderer/mapbuffer)
$(call import-module,react/renderer/mounting)
$(call import-module,react/renderer/scheduler)
$(call import-module,react/renderer/templateprocessor)
$(call import-module,react/renderer/textlayoutmanager)
$(call import-module,react/renderer/uimanager)
