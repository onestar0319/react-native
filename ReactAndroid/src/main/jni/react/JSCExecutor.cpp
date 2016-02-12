// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCExecutor.h"

#include <algorithm>
#include <atomic>
#include <sstream>
#include <string>
#include <folly/json.h>
#include <folly/String.h>
#include <sys/time.h>

#include "Bridge.h"
#include "JSCHelpers.h"
#include "Platform.h"
#include "Value.h"

#ifdef WITH_JSC_EXTRA_TRACING
#include "JSCTracing.h"
#include "JSCLegacyProfiler.h"
#include <JavaScriptCore/API/JSProfilerPrivate.h>
#endif

#ifdef WITH_JSC_MEMORY_PRESSURE
#include <jsc_memory.h>
#endif

#ifdef WITH_FBSYSTRACE
#include <fbsystrace.h>
using fbsystrace::FbSystraceSection;
#endif

#ifdef WITH_FB_MEMORY_PROFILING
#include "JSCMemory.h"
#endif

#ifdef WITH_FB_JSC_TUNING
#include <jsc_config_android.h>
#endif

static const int64_t NANOSECONDS_IN_SECOND = 1000000000LL;
static const int64_t NANOSECONDS_IN_MILLISECOND = 1000000LL;

namespace facebook {
namespace react {

static std::unordered_map<JSContextRef, JSCExecutor*> s_globalContextRefToJSCExecutor;

static JSValueRef nativePerformanceNow(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception);
static JSValueRef nativeInjectHMRUpdate(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception);

static std::string executeJSCallWithJSC(
    JSGlobalContextRef ctx,
    const std::string& methodName,
    const std::vector<folly::dynamic>& arguments) {
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(
      TRACE_TAG_REACT_CXX_BRIDGE, "JSCExecutor.executeJSCall",
      "method", methodName);
  #endif

  // Evaluate script with JSC
  folly::dynamic jsonArgs(arguments.begin(), arguments.end());
  auto js = folly::to<folly::fbstring>(
      "__fbBatchedBridge.", methodName, ".apply(null, ",
      folly::toJson(jsonArgs), ")");
  auto result = evaluateScript(ctx, String(js.c_str()), nullptr);
  return Value(ctx, result).toJSONString();
}

std::unique_ptr<JSExecutor> JSCExecutorFactory::createJSExecutor(Bridge *bridge) {
  return std::unique_ptr<JSExecutor>(new JSCExecutor(bridge, cacheDir_));
}

JSCExecutor::JSCExecutor(Bridge *bridge, const std::string& cacheDir) :
    m_bridge(bridge),
    m_deviceCacheDir(cacheDir),
    m_messageQueueThread(MessageQueues::getCurrentMessageQueueThread()) {
  m_context = JSGlobalContextCreateInGroup(nullptr, nullptr);
  s_globalContextRefToJSCExecutor[m_context] = this;
  installGlobalFunction(m_context, "nativeFlushQueueImmediate", nativeFlushQueueImmediate);
  installGlobalFunction(m_context, "nativePerformanceNow", nativePerformanceNow);
  installGlobalFunction(m_context, "nativeStartWorker", nativeStartWorker);
  installGlobalFunction(m_context, "nativePostMessageToWorker", nativePostMessageToWorker);
  installGlobalFunction(m_context, "nativeTerminateWorker", nativeTerminateWorker);
  installGlobalFunction(m_context, "nativeInjectHMRUpdate", nativeInjectHMRUpdate);

  installGlobalFunction(m_context, "nativeLoggingHook", JSLogging::nativeHook);

  #ifdef WITH_FB_JSC_TUNING
  configureJSCForAndroid();
  #endif

  #ifdef WITH_JSC_EXTRA_TRACING
  addNativeTracingHooks(m_context);
  addNativeProfilingHooks(m_context);
  PerfLogging::installNativeHooks(m_context);
  #endif

  #ifdef WITH_FB_MEMORY_PROFILING
  addNativeMemoryHooks(m_context);
  #endif
}

JSCExecutor::~JSCExecutor() {
  // terminateWebWorker mutates m_webWorkers so collect all the workers to terminate first
  std::vector<int> workerIds;
  for (auto it = m_webWorkers.begin(); it != m_webWorkers.end(); it++) {
    workerIds.push_back(it->first);
  }
  for (int workerId : workerIds) {
    terminateWebWorker(workerId);
  }

  s_globalContextRefToJSCExecutor.erase(m_context);
  JSGlobalContextRelease(m_context);
}

void JSCExecutor::loadApplicationScript(
    const std::string& script,
    const std::string& sourceURL) {
  ReactMarker::logMarker("loadApplicationScript_startStringConvert");
  String jsScript = String::createExpectingAscii(script);
  ReactMarker::logMarker("loadApplicationScript_endStringConvert");

  String jsSourceURL(sourceURL.c_str());
  #ifdef WITH_FBSYSTRACE
  FbSystraceSection s(TRACE_TAG_REACT_CXX_BRIDGE, "JSCExecutor::loadApplicationScript",
    "sourceURL", sourceURL);
  #endif
  if (!jsSourceURL) {
    evaluateScript(m_context, jsScript, jsSourceURL);
  } else {
    // If we're evaluating a script, get the device's cache dir
    //  in which a cache file for that script will be stored.
    evaluateScript(m_context, jsScript, jsSourceURL, m_deviceCacheDir.c_str());
  }
  flush();
}

void JSCExecutor::loadApplicationUnbundle(
    std::unique_ptr<JSModulesUnbundle> unbundle,
    const std::string& startupCode,
    const std::string& sourceURL) {
  if (!m_unbundle) {
    installGlobalFunction(m_context, "nativeRequire", nativeRequire);
  }
  m_unbundle = std::move(unbundle);
  loadApplicationScript(startupCode, sourceURL);
}

void JSCExecutor::flush() {
  // TODO: Make this a first class function instead of evaling. #9317773
  std::string calls = executeJSCallWithJSC(m_context, "flushedQueue", std::vector<folly::dynamic>());
  m_bridge->callNativeModules(calls, true);
}

void JSCExecutor::callFunction(const double moduleId, const double methodId, const folly::dynamic& arguments) {
  // TODO:  Make this a first class function instead of evaling. #9317773
  std::vector<folly::dynamic> call{
    (double) moduleId,
    (double) methodId,
    std::move(arguments),
  };
  std::string calls = executeJSCallWithJSC(m_context, "callFunctionReturnFlushedQueue", std::move(call));
  m_bridge->callNativeModules(calls, true);
}

void JSCExecutor::invokeCallback(const double callbackId, const folly::dynamic& arguments) {
  // TODO: Make this a first class function instead of evaling. #9317773
  std::vector<folly::dynamic> call{
    (double) callbackId,
    std::move(arguments)
  };
  std::string calls = executeJSCallWithJSC(m_context, "invokeCallbackAndReturnFlushedQueue", std::move(call));
  m_bridge->callNativeModules(calls, true);
}

void JSCExecutor::setGlobalVariable(const std::string& propName, const std::string& jsonValue) {
  auto globalObject = JSContextGetGlobalObject(m_context);
  String jsPropertyName(propName.c_str());

  String jsValueJSON(jsonValue.c_str());
  auto valueToInject = JSValueMakeFromJSONString(m_context, jsValueJSON);

  JSObjectSetProperty(m_context, globalObject, jsPropertyName, valueToInject, 0, NULL);
}

bool JSCExecutor::supportsProfiling() {
  #ifdef WITH_FBSYSTRACE
  return true;
  #else
  return false;
  #endif
}

void JSCExecutor::startProfiler(const std::string &titleString) {
  #ifdef WITH_JSC_EXTRA_TRACING
  JSStringRef title = JSStringCreateWithUTF8CString(titleString.c_str());
  #if WITH_JSC_INTERNAL
  JSStartProfiling(m_context, title, false);
  #else
  JSStartProfiling(m_context, title);
  #endif
  JSStringRelease(title);
  #endif
}

void JSCExecutor::stopProfiler(const std::string &titleString, const std::string& filename) {
  #ifdef WITH_JSC_EXTRA_TRACING
  JSStringRef title = JSStringCreateWithUTF8CString(titleString.c_str());
  facebook::react::stopAndOutputProfilingFile(m_context, title, filename.c_str());
  JSStringRelease(title);
  #endif
}

void JSCExecutor::handleMemoryPressureModerate() {
  #ifdef WITH_JSC_MEMORY_PRESSURE
  JSHandleMemoryPressure(this, m_context, JSMemoryPressure::MODERATE);
  #endif
}

void JSCExecutor::handleMemoryPressureCritical() {
  #ifdef WITH_JSC_MEMORY_PRESSURE
  JSHandleMemoryPressure(this, m_context, JSMemoryPressure::CRITICAL);
  #endif
}

void JSCExecutor::flushQueueImmediate(std::string queueJSON) {
  m_bridge->callNativeModules(queueJSON, false);
}

void JSCExecutor::loadModule(uint32_t moduleId) {
  auto module = m_unbundle->getModule(moduleId);
  auto sourceUrl = String::createExpectingAscii(module.name);
  auto source = String::createExpectingAscii(module.code);
  evaluateScript(m_context, source, sourceUrl);
}

// WebWorker impl

JSGlobalContextRef JSCExecutor::getContext() {
  return m_context;
}

std::shared_ptr<MessageQueueThread> JSCExecutor::getMessageQueueThread() {
  return m_messageQueueThread;
}

void JSCExecutor::onMessageReceived(int workerId, const std::string& json) {
  Object& worker = m_webWorkerJSObjs.at(workerId);

  Value onmessageValue = worker.getProperty("onmessage");
  if (onmessageValue.isUndefined()) {
    return;
  }

  JSValueRef args[] = { JSCWebWorker::createMessageObject(m_context, json) };
  onmessageValue.asObject().callAsFunction(1, args);

  flush();
}

int JSCExecutor::addWebWorker(const std::string& script, JSValueRef workerRef) {
  static std::atomic_int nextWorkerId(0);
  int workerId = nextWorkerId++;

  m_webWorkers.emplace(std::piecewise_construct, std::forward_as_tuple(workerId), std::forward_as_tuple(workerId, this, script));
  Object workerObj = Value(m_context, workerRef).asObject();
  workerObj.makeProtected();
  m_webWorkerJSObjs.emplace(workerId, std::move(workerObj));
  return workerId;
}

void JSCExecutor::postMessageToWebWorker(int workerId, JSValueRef message, JSValueRef *exn) {
  JSCWebWorker& worker = m_webWorkers.at(workerId);
  worker.postMessage(message);
}

void JSCExecutor::terminateWebWorker(int workerId) {
  JSCWebWorker& worker = m_webWorkers.at(workerId);

  worker.terminate();

  m_webWorkers.erase(workerId);
  m_webWorkerJSObjs.erase(workerId);
}

// Native JS hooks

static JSValueRef makeInvalidModuleIdJSCException(
    JSContextRef ctx,
    const JSValueRef id,
    JSValueRef *exception) {
  std::string message = "Received invalid module ID: ";
  message += String::adopt(JSValueToStringCopy(ctx, id, exception)).str();
  return makeJSCException(ctx, message.c_str());
}

JSValueRef JSCExecutor::nativeRequire(
  JSContextRef ctx,
  JSObjectRef function,
  JSObjectRef thisObject,
  size_t argumentCount,
  const JSValueRef arguments[],
  JSValueRef *exception) {

  if (argumentCount != 1) {
    *exception = makeJSCException(ctx, "Got wrong number of args");
    return JSValueMakeUndefined(ctx);
  }

  JSCExecutor *executor;
  try {
    executor = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));
  } catch (std::out_of_range& e) {
    *exception = makeJSCException(ctx, "Global JS context didn't map to a valid executor");
    return JSValueMakeUndefined(ctx);
  }

  double moduleId = JSValueToNumber(ctx, arguments[0], exception);
  if (moduleId <= (double) std::numeric_limits<uint32_t>::max() && moduleId >= 0.0) {
    try {
      executor->loadModule(moduleId);
    } catch (JSModulesUnbundle::ModuleNotFound&) {
      *exception = makeInvalidModuleIdJSCException(ctx, arguments[0], exception);
    }
  } else {
    *exception = makeInvalidModuleIdJSCException(ctx, arguments[0], exception);
  }
  return JSValueMakeUndefined(ctx);
}

static JSValueRef createErrorString(JSContextRef ctx, const char *msg) {
  return JSValueMakeString(ctx, String(msg));
}

JSValueRef JSCExecutor::nativeFlushQueueImmediate(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount != 1) {
    *exception = createErrorString(ctx, "Got wrong number of args");
    return JSValueMakeUndefined(ctx);
  }

  JSCExecutor *executor;
  try {
    executor = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));
  } catch (std::out_of_range& e) {
    *exception = createErrorString(ctx, "Global JS context didn't map to a valid executor");
    return JSValueMakeUndefined(ctx);
  }

  std::string resStr = Value(ctx, arguments[0]).toJSONString();

  executor->flushQueueImmediate(resStr);

  return JSValueMakeUndefined(ctx);
}

JSValueRef JSCExecutor::nativeStartWorker(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount != 2) {
    *exception = createErrorString(ctx, "Got wrong number of args");
    return JSValueMakeUndefined(ctx);
  }

  std::string scriptFile = Value(ctx, arguments[0]).toString().str();

  JSValueRef worker = arguments[1];

  JSCExecutor *executor;
  try {
    executor = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));
  } catch (std::out_of_range& e) {
    *exception = createErrorString(ctx, "Global JS context didn't map to a valid executor");
    return JSValueMakeUndefined(ctx);
  }

  int workerId = executor->addWebWorker(scriptFile, worker);

  return JSValueMakeNumber(ctx, workerId);
}

JSValueRef JSCExecutor::nativePostMessageToWorker(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount != 2) {
    *exception = createErrorString(ctx, "Got wrong number of args");
    return JSValueMakeUndefined(ctx);
  }

  double workerDouble = JSValueToNumber(ctx, arguments[0], exception);
  if (workerDouble != workerDouble) {
    *exception = createErrorString(ctx, "Got invalid worker id");
    return JSValueMakeUndefined(ctx);
  }

  JSCExecutor *executor;
  try {
    executor = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));
  } catch (std::out_of_range& e) {
    *exception = createErrorString(ctx, "Global JS context didn't map to a valid executor");
    return JSValueMakeUndefined(ctx);
  }

  executor->postMessageToWebWorker((int) workerDouble, arguments[1], exception);

  return JSValueMakeUndefined(ctx);
}

JSValueRef JSCExecutor::nativeTerminateWorker(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef *exception) {
  if (argumentCount != 1) {
    *exception = createErrorString(ctx, "Got wrong number of args");
    return JSValueMakeUndefined(ctx);
  }

  double workerDouble = JSValueToNumber(ctx, arguments[0], exception);
  if (workerDouble != workerDouble) {
    *exception = createErrorString(ctx, "Got invalid worker id");
    return JSValueMakeUndefined(ctx);
  }

  JSCExecutor *executor;
  try {
    executor = s_globalContextRefToJSCExecutor.at(JSContextGetGlobalContext(ctx));
  } catch (std::out_of_range& e) {
    *exception = createErrorString(ctx, "Global JS context didn't map to a valid executor");
    return JSValueMakeUndefined(ctx);
  }

  executor->terminateWebWorker((int) workerDouble);

  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativePerformanceNow(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  // This is equivalent to android.os.SystemClock.elapsedRealtime() in native
  struct timespec now;
  clock_gettime(CLOCK_MONOTONIC_RAW, &now);
  int64_t nano = now.tv_sec * NANOSECONDS_IN_SECOND + now.tv_nsec;
  return JSValueMakeNumber(ctx, (nano / (double)NANOSECONDS_IN_MILLISECOND));
}

static JSValueRef nativeInjectHMRUpdate(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[], JSValueRef *exception) {
  String execJSString = Value(ctx, arguments[0]).toString();
  String jsURL = Value(ctx, arguments[1]).toString();
  evaluateScript(ctx, execJSString, jsURL);
  return JSValueMakeUndefined(ctx);
}

} }
