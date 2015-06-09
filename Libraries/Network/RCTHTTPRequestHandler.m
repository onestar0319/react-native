/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTHTTPRequestHandler.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTImageLoader.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@interface RCTHTTPRequestHandler () <NSURLSessionDataDelegate>

@end

@implementation RCTHTTPRequestHandler
{
  NSMapTable *_delegates;
  NSURLSession *_session;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {
    _delegates = [[NSMapTable alloc] initWithKeyOptions:NSPointerFunctionsStrongMemory
                                           valueOptions:NSPointerFunctionsStrongMemory
                                               capacity:0];
  }
  return self;
}

- (void)invalidate
{
  [_session invalidateAndCancel];
  _session = nil;
  _delegates = nil;
}

- (BOOL)isValid
{
  return _delegates != nil;
}

#pragma mark - NSURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [@[@"http", @"https", @"file"] containsObject:[request.URL.scheme lowercaseString]];
}

- (id)sendRequest:(NSURLRequest *)request
     withDelegate:(id<RCTURLRequestDelegate>)delegate
{
  // Lazy setup
  if (!_session && [self isValid]) {
    NSOperationQueue *callbackQueue = [[NSOperationQueue alloc] init];
    NSURLSessionConfiguration *configuration = [NSURLSessionConfiguration defaultSessionConfiguration];
    _session = [NSURLSession sessionWithConfiguration:configuration
                                             delegate:self
                                        delegateQueue:callbackQueue];
  }

  NSURLSessionDataTask *task = [_session dataTaskWithRequest:request];
  [_delegates setObject:delegate forKey:task];
  [task resume];
  return task;
}

- (void)cancelRequest:(NSURLSessionDataTask *)requestToken
{
  [requestToken cancel];
}

#pragma mark - NSURLSession delegate

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)task
didReceiveResponse:(NSURLResponse *)response
 completionHandler:(void (^)(NSURLSessionResponseDisposition))completionHandler
{
  [[_delegates objectForKey:task] URLRequest:task didReceiveResponse:response];
  completionHandler(NSURLSessionResponseAllow);
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)task
    didReceiveData:(NSData *)data
{
  [[_delegates objectForKey:task] URLRequest:task didReceiveData:data];
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  [[_delegates objectForKey:task] URLRequest:task didCompleteWithError:error];
  [_delegates removeObjectForKey:task];
}

@end
