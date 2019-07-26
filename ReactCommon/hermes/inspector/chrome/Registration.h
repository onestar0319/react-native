// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <string>

#include <hermes/hermes.h>
#include <hermes/inspector/RuntimeAdapter.h>

namespace facebook {
namespace hermes {
namespace inspector {
namespace chrome {

/*
 * enableDebugging adds this runtime to the list of debuggable JS targets
 * (called "pages" in the higher-leavel React Native API) in this process. It
 * should be called before any JS runs in the runtime.
 */
extern void enableDebugging(
    std::unique_ptr<RuntimeAdapter> adapter,
    const std::string &title);

/*
 * disableDebugging removes this runtime from the list of debuggable JS targets
 * in this process.
 */
extern void disableDebugging(HermesRuntime &runtime);

} // namespace chrome
} // namespace inspector
} // namespace hermes
} // namespace facebook
