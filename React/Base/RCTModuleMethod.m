/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTModuleMethod.h"

#import <objc/message.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@interface RCTBridge (RCTModuleMethod)

- (void)_invokeAndProcessModule:(NSString *)module
                         method:(NSString *)method
                      arguments:(NSArray *)args;

@end

@implementation RCTModuleMethod
{
  Class _moduleClass;
  SEL _selector;
  NSMethodSignature *_methodSignature;
  NSArray *_argumentBlocks;
}

RCT_NOT_IMPLEMENTED(-init)

void RCTParseObjCMethodName(NSString **, NSArray **);
void RCTParseObjCMethodName(NSString **objCMethodName, NSArray **argTypes)
{
  static NSRegularExpression *typeNameRegex;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *unusedPattern = @"(?:__unused|__attribute__\\(\\(unused\\)\\))";
    NSString *constPattern = @"(?:const)";
    NSString *nullabilityPattern = @"(?:__nullable|__nonnull|nullable|nonnull|__attribute__\\(\\(nonnull\\)\\)|__attribute__\\(\\(nullable\\)\\))";
    NSString *annotationPattern = [NSString stringWithFormat:@"(?:(?:%@|%@|%@)\\s*)",
                                   unusedPattern, constPattern, nullabilityPattern];
    NSString *pattern = [NSString stringWithFormat:@"(?<=:)(\\s*\\(%1$@?(\\w+?)(?:\\s*\\*)?%1$@?\\))?\\s*\\w+",
                         annotationPattern];
    typeNameRegex = [[NSRegularExpression alloc] initWithPattern:pattern options:0 error:NULL];
  });

  // Extract argument types
  NSString *methodName = *objCMethodName;
  NSRange methodRange = {0, methodName.length};
  NSMutableArray *arguments = [NSMutableArray array];
  [typeNameRegex enumerateMatchesInString:methodName options:0 range:methodRange usingBlock:^(NSTextCheckingResult *result, __unused NSMatchingFlags flags, __unused BOOL *stop) {
    NSRange range = [result rangeAtIndex:2];
    [arguments addObject:range.length ? [methodName substringWithRange:range] : @"id"];
  }];
  *argTypes = [arguments copy];

  // Remove the parameter types and names
  methodName = [typeNameRegex stringByReplacingMatchesInString:methodName options:0
                                                         range:methodRange
                                                  withTemplate:@""];

  // Remove whitespace
  methodName = [methodName stringByReplacingOccurrencesOfString:@"\n" withString:@""];
  methodName = [methodName stringByReplacingOccurrencesOfString:@" " withString:@""];

  // Strip trailing semicolon
  if ([methodName hasSuffix:@";"]) {
    methodName = [methodName substringToIndex:methodName.length - 1];
  }

  *objCMethodName = methodName;
}

- (instancetype)initWithObjCMethodName:(NSString *)objCMethodName
                          JSMethodName:(NSString *)JSMethodName
                           moduleClass:(Class)moduleClass
{
  if ((self = [super init])) {

    NSArray *argTypes;
    RCTParseObjCMethodName(&objCMethodName, &argTypes);

    _moduleClass = moduleClass;
    _selector = NSSelectorFromString(objCMethodName);
    RCTAssert(_selector, @"%@ is not a valid selector", objCMethodName);

    _JSMethodName = JSMethodName.length > 0 ? JSMethodName : ({
      NSString *methodName = objCMethodName;
      NSRange colonRange = [methodName rangeOfString:@":"];
      if (colonRange.location != NSNotFound) {
        methodName = [methodName substringToIndex:colonRange.location];
      }
      RCTAssert(methodName.length, @"%@ is not a valid JS function name, please"
                " supply an alternative using RCT_REMAP_METHOD()", objCMethodName);
      methodName;
    });

    // Get method signature
    _methodSignature = [_moduleClass instanceMethodSignatureForSelector:_selector];

    // Process arguments
    NSUInteger numberOfArguments = _methodSignature.numberOfArguments;
    NSMutableArray *argumentBlocks = [[NSMutableArray alloc] initWithCapacity:numberOfArguments - 2];

#define RCT_ARG_BLOCK(_logic) \
  [argumentBlocks addObject:^(__unused RCTBridge *bridge, NSInvocation *invocation, NSUInteger index, id json) { \
    _logic \
    [invocation setArgument:&value atIndex:index]; \
  }];

    void (^addBlockArgument)(void) = ^{
      RCT_ARG_BLOCK(

        if (RCT_DEBUG && json && ![json isKindOfClass:[NSNumber class]]) {
          RCTLogError(@"Argument %tu (%@) of %@.%@ should be a number", index,
                      json, RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName);
          return;
        }

        // Marked as autoreleasing, because NSInvocation doesn't retain arguments
        __autoreleasing id value = (json ? ^(NSArray *args) {
          [bridge _invokeAndProcessModule:@"BatchedBridge"
                                   method:@"invokeCallbackAndReturnFlushedQueue"
                                arguments:@[json, args]];
        } : ^(__unused NSArray *unused) {});
      )
    };

    void (^defaultCase)(const char *) = ^(const char *argumentType) {
      static const char *blockType = @encode(typeof(^{}));
      if (!strcmp(argumentType, blockType)) {
        addBlockArgument();
      } else {
        RCT_ARG_BLOCK( id value = json; )
      }
    };

    for (NSUInteger i = 2; i < numberOfArguments; i++) {
      const char *argumentType = [_methodSignature getArgumentTypeAtIndex:i];

      NSString *selName = argTypes[i - 2];
      SEL selector = NSSelectorFromString([selName stringByAppendingString:@":"]);
      if ([RCTConvert respondsToSelector:selector]) {
        switch (argumentType[0]) {

#define RCT_CONVERT_CASE(_value, _type) \
case _value: { \
  _type (*convert)(id, SEL, id) = (typeof(convert))objc_msgSend; \
  RCT_ARG_BLOCK( _type value = convert([RCTConvert class], selector, json); ) \
  break; \
}

            RCT_CONVERT_CASE(':', SEL)
            RCT_CONVERT_CASE('*', const char *)
            RCT_CONVERT_CASE('c', char)
            RCT_CONVERT_CASE('C', unsigned char)
            RCT_CONVERT_CASE('s', short)
            RCT_CONVERT_CASE('S', unsigned short)
            RCT_CONVERT_CASE('i', int)
            RCT_CONVERT_CASE('I', unsigned int)
            RCT_CONVERT_CASE('l', long)
            RCT_CONVERT_CASE('L', unsigned long)
            RCT_CONVERT_CASE('q', long long)
            RCT_CONVERT_CASE('Q', unsigned long long)
            RCT_CONVERT_CASE('f', float)
            RCT_CONVERT_CASE('d', double)
            RCT_CONVERT_CASE('B', BOOL)
            RCT_CONVERT_CASE('@', id)
            RCT_CONVERT_CASE('^', void *)

            case '{': {
              [argumentBlocks addObject:^(__unused RCTBridge *bridge, NSInvocation *invocation, NSUInteger index, id json) {
                NSMethodSignature *methodSignature = [RCTConvert methodSignatureForSelector:selector];
                void *returnValue = malloc(methodSignature.methodReturnLength);
                NSInvocation *_invocation = [NSInvocation invocationWithMethodSignature:methodSignature];
                [_invocation setTarget:[RCTConvert class]];
                [_invocation setSelector:selector];
                [_invocation setArgument:&json atIndex:2];
                [_invocation invoke];
                [_invocation getReturnValue:returnValue];

                [invocation setArgument:returnValue atIndex:index];

                  free(returnValue);
                }];
                break;
              }

            default:
              defaultCase(argumentType);
          }
        } else if ([selName isEqualToString:@"RCTResponseSenderBlock"]) {
          addBlockArgument();
        } else if ([selName isEqualToString:@"RCTResponseErrorBlock"]) {
          RCT_ARG_BLOCK(

            if (RCT_DEBUG && json && ![json isKindOfClass:[NSNumber class]]) {
              RCTLogError(@"Argument %tu (%@) of %@.%@ should be a number", index,
                          json, RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName);
              return;
            }

            // Marked as autoreleasing, because NSInvocation doesn't retain arguments
            __autoreleasing id value = (json ? ^(NSError *error) {
              [bridge _invokeAndProcessModule:@"BatchedBridge"
                                       method:@"invokeCallbackAndReturnFlushedQueue"
                                    arguments:@[json, @[RCTJSErrorFromNSError(error)]]];
            } : ^(__unused NSError *error) {});
          )
        } else if ([selName isEqualToString:@"RCTPromiseResolveBlock"]) {
          RCTAssert(i == numberOfArguments - 2,
                    @"The RCTPromiseResolveBlock must be the second to last parameter in -[%@ %@]",
                    _moduleClass, objCMethodName);
          RCT_ARG_BLOCK(
            if (RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
              RCTLogError(@"Argument %tu (%@) of %@.%@ must be a promise resolver ID", index,
                          json, RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName);
              return;
            }

            // Marked as autoreleasing, because NSInvocation doesn't retain arguments
            __autoreleasing RCTPromiseResolveBlock value = (^(id result) {
              NSArray *arguments = result ? @[result] : @[];
              [bridge _invokeAndProcessModule:@"BatchedBridge"
                                       method:@"invokeCallbackAndReturnFlushedQueue"
                                    arguments:@[json, arguments]];
            });
          )
          _functionKind = RCTJavaScriptFunctionKindAsync;
        } else if ([selName isEqualToString:@"RCTPromiseRejectBlock"]) {
          RCTAssert(i == numberOfArguments - 1,
                    @"The RCTPromiseRejectBlock must be the last parameter in -[%@ %@]",
                    _moduleClass, objCMethodName);
          RCT_ARG_BLOCK(
            if (RCT_DEBUG && ![json isKindOfClass:[NSNumber class]]) {
              RCTLogError(@"Argument %tu (%@) of %@.%@ must be a promise rejecter ID", index,
                          json, RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName);
              return;
            }

            // Marked as autoreleasing, because NSInvocation doesn't retain arguments
            __autoreleasing RCTPromiseRejectBlock value = (^(NSError *error) {
              NSDictionary *errorJSON = RCTJSErrorFromNSError(error);
              [bridge _invokeAndProcessModule:@"BatchedBridge"
                                       method:@"invokeCallbackAndReturnFlushedQueue"
                                    arguments:@[json, @[errorJSON]]];
            });
          )
          _functionKind = RCTJavaScriptFunctionKindAsync;
        } else {

          // Unknown argument type
          RCTLogError(@"Unknown argument type '%@' in method %@. Extend RCTConvert"
              " to support this type.", selName, [self methodName]);
        }
    }

    _argumentBlocks = [argumentBlocks copy];
  }

  return self;
}

- (void)invokeWithBridge:(RCTBridge *)bridge
                  module:(id)module
               arguments:(NSArray *)arguments
{
  if (RCT_DEBUG) {

    // Sanity check
    RCTAssert([module class] == _moduleClass, @"Attempted to invoke method \
              %@ on a module of class %@", [self methodName], [module class]);

    // Safety check
    if (arguments.count != _argumentBlocks.count) {
      NSInteger actualCount = arguments.count;
      NSInteger expectedCount = _argumentBlocks.count;

      // Subtract the implicit Promise resolver and rejecter functions for implementations of async functions
      if (_functionKind == RCTJavaScriptFunctionKindAsync) {
        actualCount -= 2;
        expectedCount -= 2;
      }

      RCTLogError(@"%@.%@ was called with %zd arguments, but expects %zd",
                  RCTBridgeModuleNameForClass(_moduleClass), _JSMethodName,
                  actualCount, expectedCount);
      return;
    }
  }

  // Create invocation (we can't re-use this as it wouldn't be thread-safe)
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:_methodSignature];
  [invocation setArgument:&_selector atIndex:1];
  [invocation retainArguments];

  // Set arguments
  NSUInteger index = 0;
  for (id json in arguments) {
    id arg = RCTNilIfNull(json);
    void (^block)(RCTBridge *, NSInvocation *, NSUInteger, id) = _argumentBlocks[index];
    block(bridge, invocation, index + 2, arg);
    index++;
  }

  // Invoke method
  [invocation invokeWithTarget:module];
}

- (NSString *)methodName
{
  return [NSString stringWithFormat:@"-[%@ %@]", _moduleClass,
          NSStringFromSelector(_selector)];
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<%@: %p; exports %@ as %@();>",
          [self class], self, [self methodName], _JSMethodName];
}

@end
