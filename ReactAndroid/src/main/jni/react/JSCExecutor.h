// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <cstdint>
#include <memory>
#include <unordered_map>
#include <JavaScriptCore/JSContextRef.h>
#include "Executor.h"
#include "JSCHelpers.h"
#include "JSCWebWorker.h"

namespace facebook {
namespace react {

class MessageQueueThread;

class JSCExecutorFactory : public JSExecutorFactory {
public:
  JSCExecutorFactory(const std::string& cacheDir) : cacheDir_(cacheDir) {}
  virtual std::unique_ptr<JSExecutor> createJSExecutor(Bridge *bridge) override;
private:
  std::string cacheDir_;
};

class JSCExecutor : public JSExecutor, public JSCWebWorkerOwner {
public:
  /**
   * Should be invoked from the JS thread.
   */
  explicit JSCExecutor(Bridge *bridge, const std::string& cacheDir);
  ~JSCExecutor() override;

  virtual void loadApplicationScript(
    const std::string& script,
    const std::string& sourceURL) override;
  virtual void loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    const std::string& startupCode,
    const std::string& sourceURL) override;
  virtual void callFunction(
    const double moduleId,
    const double methodId,
    const folly::dynamic& arguments) override;
  virtual void invokeCallback(
    const double callbackId,
    const folly::dynamic& arguments) override;
  virtual void setGlobalVariable(
    const std::string& propName,
    const std::string& jsonValue) override;
  virtual void* getJavaScriptContext() override;
  virtual bool supportsProfiling() override;
  virtual void startProfiler(const std::string &titleString) override;
  virtual void stopProfiler(const std::string &titleString, const std::string &filename) override;
  virtual void handleMemoryPressureModerate() override;
  virtual void handleMemoryPressureCritical() override;

  void installNativeHook(const char *name, JSObjectCallAsFunctionCallback callback);
  virtual void onMessageReceived(int workerId, const std::string& message) override;
  virtual JSGlobalContextRef getContext() override;
  virtual std::shared_ptr<MessageQueueThread> getMessageQueueThread() override;

private:
  JSGlobalContextRef m_context;
  std::unordered_map<int, JSCWebWorker> m_webWorkers;
  std::unordered_map<int, Object> m_webWorkerJSObjs;
  Bridge *m_bridge;
  std::string m_deviceCacheDir;
  std::shared_ptr<MessageQueueThread> m_messageQueueThread;
  std::unique_ptr<JSModulesUnbundle> m_unbundle;

  int addWebWorker(const std::string& script, JSValueRef workerRef);
  void postMessageToWebWorker(int worker, JSValueRef message, JSValueRef *exn);
  void flush();
  void terminateWebWorker(int worker);
  void loadModule(uint32_t moduleId);
  void flushQueueImmediate(std::string queueJSON);

  static JSValueRef nativeStartWorker(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
  static JSValueRef nativePostMessageToWorker(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
  static JSValueRef nativeTerminateWorker(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
  static JSValueRef nativeRequire(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
  static JSValueRef nativeFlushQueueImmediate(
      JSContextRef ctx,
      JSObjectRef function,
      JSObjectRef thisObject,
      size_t argumentCount,
      const JSValueRef arguments[],
      JSValueRef *exception);
};

} }
