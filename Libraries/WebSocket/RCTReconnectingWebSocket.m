/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTReconnectingWebSocket.h"

#import <React/RCTConvert.h>
#import <React/RCTDefines.h>
#import <fishhook/fishhook.h>

#import "RCTSRWebSocket.h"

#if RCT_DEV // Only supported in dev mode

static void (*orig_nwlog_legacy_v)(int, char*, va_list);

static void my_nwlog_legacy_v(int level, char *format, va_list args) {
  static const uint buffer_size = 256;
  static char buffer[buffer_size];
  va_list copy;
  va_copy(copy, args);
  vsnprintf(buffer, buffer_size, format, copy);
  va_end(copy);

  if (strstr(buffer, "nw_connection_get_connected_socket_block_invoke") == NULL) {
    orig_nwlog_legacy_v(level, format, args);
  }
}

@interface RCTReconnectingWebSocket () <RCTSRWebSocketDelegate>
@end

@implementation RCTReconnectingWebSocket {
  NSURL *_url;
  RCTSRWebSocket *_socket;
}

@synthesize delegate = _delegate;

+ (void)load
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    rebind_symbols((struct rebinding[1]){
      {"nwlog_legacy_v", my_nwlog_legacy_v, (void *)&orig_nwlog_legacy_v}
    }, 1);
  });
}

- (instancetype)initWithURL:(NSURL *)url
{
  if (self = [super init]) {
    _url = url;
  }
  return self;
}

- (void)send:(id)data
{
  [_socket send:data];
}

- (void)start
{
  [self stop];
  _socket = [[RCTSRWebSocket alloc] initWithURL:_url];
  _socket.delegate = self;
  if (_delegateDispatchQueue) {
    [_socket setDelegateDispatchQueue:_delegateDispatchQueue];
  }
  [_socket open];
}

- (void)stop
{
  _socket.delegate = nil;
  [_socket closeWithCode:1000 reason:@"Invalidated"];
  _socket = nil;
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didReceiveMessage:(id)message
{
  if (_delegate) {
    [_delegate webSocket:webSocket didReceiveMessage:message];
  }
}

- (void)reconnect
{
  __weak RCTSRWebSocket *socket = _socket;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    // Only reconnect if the observer wasn't stoppped while we were waiting
    if (socket) {
      [self start];
    }
  });
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didFailWithError:(NSError *)error
{
  [self reconnect];
}

- (void)webSocket:(RCTSRWebSocket *)webSocket didCloseWithCode:(NSInteger)code reason:(NSString *)reason wasClean:(BOOL)wasClean
{
  [self.delegate webSocket:webSocket didCloseWithCode:code reason:reason wasClean:wasClean];
  [self reconnect];
}

@end

#endif
