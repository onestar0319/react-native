LOCAL_PATH:= $(call my-dir)
include $(CLEAR_VARS)

LOCAL_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0
LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH)/boost_1_63_0
CXX11_FLAGS := -std=c++11
LOCAL_EXPORT_CPPFLAGS := $(CXX11_FLAGS)

LOCAL_MODULE    := boost

include $(BUILD_STATIC_LIBRARY)
