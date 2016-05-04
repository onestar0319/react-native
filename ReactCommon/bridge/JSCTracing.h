// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#ifdef WITH_JSC_EXTRA_TRACING

#include <JavaScriptCore/JSContextRef.h>
namespace facebook {
namespace react {

void addNativeTracingHooks(JSGlobalContextRef ctx);

} }

#endif
