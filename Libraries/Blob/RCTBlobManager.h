/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTURLRequestHandler.h>

@interface RCTBlobManager : NSObject <RCTBridgeModule, RCTURLRequestHandler>

- (NSString *)store:(NSData *)data;

- (void)store:(NSData *)data withId:(NSString *)blobId;

- (NSData *)resolve:(NSDictionary<NSString *, id> *)blob;

- (NSData *)resolve:(NSString *)blobId offset:(NSInteger)offset size:(NSInteger)size;

- (NSData *)resolveURL:(NSURL *)url;

- (void)remove:(NSString *)blobId;

- (void)createFromParts:(NSArray<NSDictionary<NSString *, id> *> *)parts withId:(NSString *)blobId;

@end
