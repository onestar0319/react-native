// Copyright 2004-present Facebook. All Rights Reserved.

#include "Instance.h"

#include "Executor.h"
#include "MethodCall.h"

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
#endif

#include <folly/json.h>
#include <folly/Memory.h>

#include <glog/logging.h>

#include <condition_variable>
#include <fstream>
#include <mutex>
#include <string>

namespace facebook {
namespace react {

namespace {
struct ExecutorTokenFactoryImpl : ExecutorTokenFactory {
  ExecutorTokenFactoryImpl(InstanceCallback* callback): callback_(callback) {}
  virtual ExecutorToken createExecutorToken() const {
    return callback_->createExecutorToken();
  }
 private:
  InstanceCallback* callback_;
};
}

class Instance::BridgeCallbackImpl : public BridgeCallback {
 public:
  explicit BridgeCallbackImpl(Instance* instance) : instance_(instance) {}
  virtual void onCallNativeModules(
      ExecutorToken executorToken,
      const std::string& calls,
      bool isEndOfBatch) override {
    instance_->callNativeModules(executorToken, calls, isEndOfBatch);
  }

  virtual void onExecutorUnregistered(ExecutorToken executorToken) override {
    // TODO(cjhopman): implement this.
  }

  virtual MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int moduleId, unsigned int hookId, folly::dynamic&& params) override {
    return instance_->callSerializableNativeHook(token, moduleId, hookId, std::move(params));
  }
 private:
  Instance* instance_;
};

Instance::~Instance() {
  if (nativeQueue_) {
    nativeQueue_->quitSynchronous();
    bridge_->destroy();
  }
}

void Instance::initializeBridge(
    std::unique_ptr<InstanceCallback> callback,
    std::shared_ptr<JSExecutorFactory> jsef,
    std::shared_ptr<MessageQueueThread> jsQueue,
    std::unique_ptr<MessageQueueThread> nativeQueue,
    std::shared_ptr<ModuleRegistry> moduleRegistry,
    folly::dynamic jsModuleDescriptions) {
  callback_ = std::move(callback);
  nativeQueue_ = std::move(nativeQueue);
  jsQueue_ = jsQueue;
  moduleRegistry_ = moduleRegistry;

  jsQueue_->runOnQueueSync([this, &jsef] {
    bridge_ = folly::make_unique<Bridge>(
      jsef.get(), jsQueue_, folly::make_unique<ExecutorTokenFactoryImpl>(callback_.get()), folly::make_unique<BridgeCallbackImpl>(this));
  });
#ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "setBatchedBridgeConfig");
#endif

  CHECK(bridge_);

  folly::dynamic nativeModuleDescriptions = folly::dynamic::array();
  {
#ifdef WITH_FBSYSTRACE
    FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "collectNativeModuleDescriptions");
#endif
    nativeModuleDescriptions = moduleRegistry_->moduleDescriptions();
  }

  folly::dynamic config =
    folly::dynamic::object
    ("remoteModuleConfig", std::move(nativeModuleDescriptions))
    ("localModulesConfig", std::move(jsModuleDescriptions));

#ifdef WITH_FBSYSTRACE
  FbSystraceSection t(TRACE_TAG_REACT_CXX_BRIDGE, "setGlobalVariable");
#endif
  setGlobalVariable(
    "__fbBatchedBridgeConfig",
    folly::toJson(config));
}

void Instance::loadScriptFromString(const std::string& string,
                                    const std::string& sourceURL) {
  callback_->incrementPendingJSCalls();
#ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE,
    "reactbridge_xplat_loadScriptFromString",
    "sourceURL", sourceURL);
#endif
  // TODO mhorowitz: ReactMarker around loadApplicationScript
  bridge_->loadApplicationScript(string, sourceURL);
}

void Instance::loadScriptFromFile(const std::string& filename,
                                  const std::string& sourceURL) {
  // TODO mhorowitz: ReactMarker around file read
  std::string script;
  {
#ifdef WITH_FBSYSTRACE
    FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE,
      "reactbridge_xplat_loadScriptFromFile",
      "fileName", filename);
#endif

    std::ifstream jsfile(filename);
    if (!jsfile) {
      LOG(ERROR) << "Unable to load script from file" << filename;
    } else {
      jsfile.seekg(0, std::ios::end);
      script.reserve(jsfile.tellg());
      jsfile.seekg(0, std::ios::beg);
      script.assign(
        std::istreambuf_iterator<char>(jsfile),
        std::istreambuf_iterator<char>());
    }
  }

  loadScriptFromString(script, sourceURL);
}

void Instance::loadUnbundle(std::unique_ptr<JSModulesUnbundle> unbundle,
                            const std::string& startupScript,
                            const std::string& startupScriptSourceURL) {
  callback_->incrementPendingJSCalls();
#ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE,
    "reactbridge_xplat_setJSModulesUnbundle");
#endif
  bridge_->loadApplicationUnbundle(std::move(unbundle), startupScript, startupScriptSourceURL);
}

bool Instance::supportsProfiling() {
  return bridge_->supportsProfiling();
}

void Instance::startProfiler(const std::string& title) {
  return bridge_->startProfiler(title);
}

void Instance::stopProfiler(const std::string& title, const std::string& filename) {
  return bridge_->stopProfiler(title, filename);
}

void Instance::setGlobalVariable(const std::string& propName,
                                 const std::string& jsonValue) {
  bridge_->setGlobalVariable(propName, jsonValue);
}

void Instance::callJSFunction(ExecutorToken token, const std::string& module, const std::string& method,
                              folly::dynamic&& params, const std::string& tracingName) {
#ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, tracingName.c_str());
#endif
  callback_->incrementPendingJSCalls();
  bridge_->callFunction(token, module, method, std::move(params), tracingName);
}

void Instance::callJSCallback(ExecutorToken token, uint64_t callbackId, folly::dynamic&& params) {
#ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "<callback>");
#endif
  callback_->incrementPendingJSCalls();
  bridge_->invokeCallback(token, (double) callbackId, std::move(params));
}

ExecutorToken Instance::getMainExecutorToken() {
  return bridge_->getMainExecutorToken();
}

void Instance::callNativeModules(ExecutorToken token, const std::string& calls, bool isEndOfBatch) {
  // TODO mhorowitz: avoid copying calls here.
  nativeQueue_->runOnQueue([this, token, calls, isEndOfBatch] {
      try {
        // An exception anywhere in here stops processing of the batch.  This
        // was the behavior of the Android bridge, and since exception handling
        // terminates the whole bridge, there's not much point in continuing.
        for (auto& call : react::parseMethodCalls(calls)) {
          moduleRegistry_->callNativeMethod(
            token, call.moduleId, call.methodId, std::move(call.arguments), call.callId);
        }
        if (isEndOfBatch) {
          callback_->onBatchComplete();
          callback_->decrementPendingJSCalls();
        }
      } catch (const std::exception& e) {
        LOG(ERROR) << folly::exceptionStr(e).toStdString();
        callback_->onNativeException(folly::exceptionStr(e).toStdString());
      } catch (...) {
        LOG(ERROR) << "Unknown exception";
        callback_->onNativeException("Unknown exception");
      }
    });
}

MethodCallResult Instance::callSerializableNativeHook(ExecutorToken token, unsigned int moduleId, unsigned int methodId, folly::dynamic&& params) {
  return moduleRegistry_->callSerializableNativeHook(token, moduleId, methodId, std::move(params));
}

} // namespace react
} // namespace facebook
