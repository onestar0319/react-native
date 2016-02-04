// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSValueRef.h>

#define throwJSExecutionException(...) jni::throwNewJavaException("com/facebook/react/bridge/JSExecutionException", __VA_ARGS__)

namespace facebook {
namespace react {

void installGlobalFunction(
    JSGlobalContextRef ctx,
    const char* name,
    JSObjectCallAsFunctionCallback callback);

JSValueRef makeJSCException(
    JSContextRef ctx,
    const char* exception_text);

#ifdef __i386__
// The Android x86 ABI states that the NDK toolchain assumes 16 byte stack
// alignment: http://developer.android.com/ndk/guides/x86.html JSC checks for
// stack alignment, and fails with SIGTRAP if it is not.  Empirically, the
// google android x86 emulator does not provide this alignment, and so JSC
// calls may crash.  All checked calls go through here, so the attribute here
// is added to force alignment and prevent crashes.

JSValueRef evaluateScript(
    JSContextRef ctx,
    JSStringRef script,
    JSStringRef sourceURL,
    const char* cachePath = nullptr) __attribute__((force_align_arg_pointer));
#else
JSValueRef evaluateScript(
    JSContextRef ctx,
    JSStringRef script,
    JSStringRef sourceURL,
    const char* cachePath = nullptr);
#endif

} }
