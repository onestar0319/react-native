/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if __has_include(<React-Codegen/AppSpecsJSI.h>) // CocoaPod headers on Apple
#include <React-Codegen/AppSpecsJSI.h>
#elif __has_include("AppSpecsJSI.h") // Cmake headers on Android
#include "AppSpecsJSI.h"
#else // BUCK headers
#include <AppSpecs/AppSpecsJSI.h>
#endif
#include <memory>
#include <set>
#include <string>
#include <vector>

namespace facebook::react {

#pragma mark - Structs
using ConstantsStruct =
    NativeCxxModuleExampleCxxBaseConstantsStruct<bool, int32_t, std::string>;

template <>
struct Bridging<ConstantsStruct>
    : NativeCxxModuleExampleCxxBaseConstantsStructBridging<
          bool,
          int32_t,
          std::string> {};

using ObjectStruct = NativeCxxModuleExampleCxxBaseObjectStruct<
    int32_t,
    std::string,
    std::optional<std::string>>;

template <>
struct Bridging<ObjectStruct>
    : NativeCxxModuleExampleCxxBaseObjectStructBridging<
          int32_t,
          std::string,
          std::optional<std::string>> {};

using ValueStruct =
    NativeCxxModuleExampleCxxBaseValueStruct<double, std::string, ObjectStruct>;

template <>
struct Bridging<ValueStruct> : NativeCxxModuleExampleCxxBaseValueStructBridging<
                                   double,
                                   std::string,
                                   ObjectStruct> {};

#pragma mark - enums
enum CustomEnumInt { A = 23, B = 42 };

template <>
struct Bridging<CustomEnumInt> {
  static CustomEnumInt fromJs(jsi::Runtime& rt, int32_t value) {
    if (value == 23) {
      return CustomEnumInt::A;
    } else if (value == 42) {
      return CustomEnumInt::B;
    } else {
      throw jsi::JSError(rt, "Invalid enum value");
    }
  }

  static jsi::Value toJs(jsi::Runtime& rt, CustomEnumInt value) {
    return bridging::toJs(rt, static_cast<int32_t>(value));
  }
};

#pragma mark - jsi::HostObjects
template <typename T>
class HostObjectWrapper : public jsi::HostObject {
 public:
  HostObjectWrapper(std::shared_ptr<T> value) : value_(std::move(value)) {}

  std::shared_ptr<T> getValue() const {
    return value_;
  }

  ~HostObjectWrapper() override = default;

 private:
  std::shared_ptr<T> value_;
};

struct CustomHostObjectRef {
  CustomHostObjectRef(std::string a, int32_t b) : a_(a), b_(b) {}
  std::string a_;
  int32_t b_;
};

using CustomHostObject = HostObjectWrapper<CustomHostObjectRef>;

#pragma mark - implementation
class NativeCxxModuleExample
    : public NativeCxxModuleExampleCxxSpec<NativeCxxModuleExample> {
 public:
  NativeCxxModuleExample(std::shared_ptr<CallInvoker> jsInvoker);

  void getValueWithCallback(
      jsi::Runtime& rt,
      AsyncCallback<std::string> callback);

  std::vector<std::optional<ObjectStruct>> getArray(
      jsi::Runtime& rt,
      std::vector<std::optional<ObjectStruct>> arg);

  bool getBool(jsi::Runtime& rt, bool arg);

  ConstantsStruct getConstants(jsi::Runtime& rt);

  CustomEnumInt getCustomEnum(jsi::Runtime& rt, CustomEnumInt arg);

  std::shared_ptr<CustomHostObject> getCustomHostObject(jsi::Runtime& rt);

  std::string consumeCustomHostObject(
      jsi::Runtime& rt,
      std::shared_ptr<CustomHostObject> arg);

  NativeCxxModuleExampleCxxEnumFloat getNumEnum(
      jsi::Runtime& rt,
      NativeCxxModuleExampleCxxEnumInt arg);

  NativeCxxModuleExampleCxxEnumStr getStrEnum(
      jsi::Runtime& rt,
      NativeCxxModuleExampleCxxEnumNone arg);

  std::map<std::string, std::optional<int32_t>> getMap(
      jsi::Runtime& rt,
      std::map<std::string, std::optional<int32_t>> arg);

  double getNumber(jsi::Runtime& rt, double arg);

  ObjectStruct getObject(jsi::Runtime& rt, ObjectStruct arg);

  std::set<float> getSet(jsi::Runtime& rt, std::set<float> arg);

  std::string getString(jsi::Runtime& rt, std::string arg);

  std::string getUnion(jsi::Runtime& rt, float x, std::string y, jsi::Object z);

  ValueStruct
  getValue(jsi::Runtime& rt, double x, std::string y, ObjectStruct z);

  AsyncPromise<std::string> getValueWithPromise(jsi::Runtime& rt, bool error);

  std::optional<bool> getWithWithOptionalArgs(
      jsi::Runtime& rt,
      std::optional<bool> optionalArg);

  void voidFunc(jsi::Runtime& rt);

  void emitCustomDeviceEvent(jsi::Runtime& rt, jsi::String eventName);

  void voidFuncThrows(jsi::Runtime& rt);

  ObjectStruct getObjectThrows(jsi::Runtime& rt, ObjectStruct arg);

  AsyncPromise<jsi::Value> promiseThrows(jsi::Runtime& rt);

  void voidFuncAssert(jsi::Runtime& rt);

  ObjectStruct getObjectAssert(jsi::Runtime& rt, ObjectStruct arg);

  AsyncPromise<jsi::Value> promiseAssert(jsi::Runtime& rt);
};

} // namespace facebook::react
