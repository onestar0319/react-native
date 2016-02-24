// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <memory>
#include <sstream>
#include <unordered_map>
#include <vector>

#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSRetainPtr.h>
#include <JavaScriptCore/JSStringRef.h>
#include <JavaScriptCore/JSValueRef.h>

#include "noncopyable.h"

#include "AlignStack.h"

#if WITH_FBJSCEXTENSIONS
#include <jsc_stringref.h>
#endif

namespace facebook {
namespace react {

class Value;
class Context;

class String : public noncopyable {
public:
  explicit String(const char* utf8) ALIGN_STACK :
    m_string(Adopt, JSStringCreateWithUTF8CString(utf8))
  {}

  String(String&& other) ALIGN_STACK :
    m_string(Adopt, other.m_string.leakRef())
  {}

  String(const String& other) ALIGN_STACK :
    m_string(other.m_string)
  {}

  operator JSStringRef() const {
    return m_string.get();
  }

  // Length in characters
  size_t length() const ALIGN_STACK {
    return JSStringGetLength(m_string.get());
  }

  // Length in bytes of a null-terminated utf8 encoded value
  size_t utf8Size() const ALIGN_STACK {
    return JSStringGetMaximumUTF8CStringSize(m_string.get());
  }

  std::string str() const ALIGN_STACK {
    size_t reserved = utf8Size();
    char* bytes = new char[reserved];
    size_t length = JSStringGetUTF8CString(m_string.get(), bytes, reserved) - 1;
    std::unique_ptr<char[]> retainedBytes(bytes);
    return std::string(bytes, length);
  }

  // Assumes that utf8 is null terminated
  bool equals(const char* utf8) ALIGN_STACK {
    return JSStringIsEqualToUTF8CString(m_string.get(), utf8);
  }

  static String createExpectingAscii(std::string const &utf8) ALIGN_STACK {
  #if WITH_FBJSCEXTENSIONS
    return String(Adopt, JSStringCreateWithUTF8CStringExpectAscii(utf8.c_str(), utf8.size()));
  #else
    return String(Adopt, JSStringCreateWithUTF8CString(utf8.c_str()));
  #endif
  }

  static String ref(JSStringRef string) {
    return String(string);
  }

  static String adopt(JSStringRef string) {
    return String(Adopt, string);
  }

private:
  explicit String(JSStringRef string) ALIGN_STACK :
    m_string(string)
  {}

  String(AdoptTag tag, JSStringRef string) ALIGN_STACK :
    m_string(tag, string)
  {}

  JSRetainPtr<JSStringRef> m_string;
};

class Object : public noncopyable {
public:
  Object(JSContextRef context, JSObjectRef obj) :
    m_context(context),
    m_obj(obj)
  {}

  Object(Object&& other) :
      m_context(other.m_context),
      m_obj(other.m_obj),
      m_isProtected(other.m_isProtected) {
    other.m_obj = nullptr;
    other.m_isProtected = false;
  }

  ~Object() ALIGN_STACK {
    if (m_isProtected && m_obj) {
      JSValueUnprotect(m_context, m_obj);
    }
  }

  operator JSObjectRef() const {
    return m_obj;
  }

  operator Value() const;

  bool isFunction() const ALIGN_STACK {
    return JSObjectIsFunction(m_context, m_obj);
  }

  Value callAsFunction(int nArgs, JSValueRef args[]) ALIGN_STACK;

  Value getProperty(const String& propName) const ALIGN_STACK;
  Value getProperty(const char *propName) const;
  Value getPropertyAtIndex(unsigned index) const ALIGN_STACK;
  void setProperty(const String& propName, const Value& value) const ALIGN_STACK;
  void setProperty(const char *propName, const Value& value) const;
  std::vector<std::string> getPropertyNames() const ALIGN_STACK;
  std::unordered_map<std::string, std::string> toJSONMap() const ALIGN_STACK;

  void makeProtected() ALIGN_STACK {
    if (!m_isProtected && m_obj) {
      JSValueProtect(m_context, m_obj);
      m_isProtected = true;
    }
  }

  static Object getGlobalObject(JSContextRef ctx) ALIGN_STACK {
    auto globalObj = JSContextGetGlobalObject(ctx);
    return Object(ctx, globalObj);
  }

  /**
   * Creates an instance of the default object class.
   */
  static Object create(JSContextRef ctx) ALIGN_STACK;

private:
  JSContextRef m_context;
  JSObjectRef m_obj;
  bool m_isProtected = false;
};

class Value : public noncopyable {
public:
  Value(JSContextRef context, JSValueRef value);
  Value(Value&&);

  operator JSValueRef() const {
    return m_value;
  }

  bool isBoolean() const ALIGN_STACK {
    return JSValueIsBoolean(context(), m_value);
  }

  bool asBoolean() const ALIGN_STACK {
    return JSValueToBoolean(context(), m_value);
  }

  bool isNumber() const ALIGN_STACK {
    return JSValueIsNumber(context(), m_value);
  }

  bool isNull() const ALIGN_STACK {
    return JSValueIsNull(context(), m_value);
  }

  bool isUndefined() const ALIGN_STACK {
    return JSValueIsUndefined(context(), m_value);
  }

  double asNumber() const ALIGN_STACK {
    if (isNumber()) {
      return JSValueToNumber(context(), m_value, nullptr);
    } else {
      return 0.0f;
    }
  }

  int32_t asInteger() const {
    return static_cast<int32_t>(asNumber());
  }

  uint32_t asUnsignedInteger() const {
    return static_cast<uint32_t>(asNumber());
  }

  bool isObject() const ALIGN_STACK {
    return JSValueIsObject(context(), m_value);
  }

  Object asObject() ALIGN_STACK;

  bool isString() const ALIGN_STACK {
    return JSValueIsString(context(), m_value);
  }

  String toString() ALIGN_STACK {
    return String::adopt(JSValueToStringCopy(context(), m_value, nullptr));
  }

  std::string toJSONString(unsigned indent = 0) const ALIGN_STACK;
  static Value fromJSON(JSContextRef ctx, const String& json) ALIGN_STACK;
protected:
  JSContextRef context() const;
  JSContextRef m_context;
  JSValueRef m_value;
};

} }
