/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import <RCTTest/RCTTestRunner.h>

#define RCT_TEST(name)                  \
- (void)test##name                      \
{                                       \
  [_runner runTest:_cmd module:@#name]; \
}

@interface UIExplorerIntegrationTests : XCTestCase

@end

@implementation UIExplorerIntegrationTests
{
  RCTTestRunner *_runner;
}

- (void)setUp
{
  _runner = RCTInitRunnerForApp(@"IntegrationTests/IntegrationTestsApp", nil);
  _runner.recordMode = NO;
}

#pragma mark - Test harness

- (void)testTheTester_waitOneFrame
{
  [_runner runTest:_cmd
            module:@"IntegrationTestHarnessTest"
      initialProps:@{@"waitOneFrame": @YES}
configurationBlock:nil];
}

- (void)testTheTester_ExpectError
{
  [_runner runTest:_cmd
            module:@"IntegrationTestHarnessTest"
      initialProps:@{@"shouldThrow": @YES}
configurationBlock:nil
  expectErrorRegex:@"because shouldThrow"];
}

#pragma mark - JS tests

// This list should be kept in sync with IntegrationTestsApp.js
RCT_TEST(IntegrationTestHarnessTest)
RCT_TEST(TimersTest)
RCT_TEST(AsyncStorageTest)
RCT_TEST(AppEventsTest)
//RCT_TEST(ImageSnapshotTest) // Disabled: #8985988
//RCT_TEST(LayoutEventsTest) // Disabled due to flakiness: #8686784
RCT_TEST(SimpleSnapshotTest)
RCT_TEST(PromiseTest)


@end
