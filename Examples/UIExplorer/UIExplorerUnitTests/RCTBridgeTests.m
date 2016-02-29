/**
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

#import <Foundation/Foundation.h>
#import <XCTest/XCTest.h>

#import "RCTBridge.h"
#import "RCTBridge+Private.h"
#import "RCTBridgeModule.h"
#import "RCTJavaScriptExecutor.h"
#import "RCTUtils.h"

#define RUN_RUNLOOP_WHILE(CONDITION) \
{ \
  NSDate *timeout = [NSDate dateWithTimeIntervalSinceNow:5]; \
  while ((CONDITION)) { \
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]]; \
    if ([timeout timeIntervalSinceNow] <= 0) { \
      XCTFail(@"Runloop timed out before condition was met"); \
      break; \
    } \
  } \
}

@interface TestExecutor : NSObject <RCTJavaScriptExecutor>

@property (nonatomic, readonly, copy) NSMutableDictionary<NSString *, id> *injectedStuff;

@end

@implementation TestExecutor

RCT_EXPORT_MODULE()

- (void)setUp {}

- (instancetype)init
{
  if (self = [super init]) {
    _injectedStuff = [NSMutableDictionary dictionary];
  }
  return self;
}

- (BOOL)isValid
{
  return YES;
}

- (void)flushedQueue:(RCTJavaScriptCallback)onComplete
{
  onComplete(nil, nil);
}

- (void)callFunctionOnModule:(__unused NSString *)module
                      method:(__unused NSString *)method
                   arguments:(__unused NSArray *)args
                    callback:(RCTJavaScriptCallback)onComplete
{
  onComplete(nil, nil);
}

- (void)invokeCallbackID:(__unused NSNumber *)cbID
               arguments:(__unused NSArray *)args
                callback:(RCTJavaScriptCallback)onComplete
{
  onComplete(nil, nil);
}

- (void)executeApplicationScript:(__unused NSString *)script
                       sourceURL:(__unused NSURL *)url
                      onComplete:(RCTJavaScriptCompleteBlock)onComplete
{
  onComplete(nil);
}

- (void)executeBlockOnJavaScriptQueue:(dispatch_block_t)block
{
  block();
}

- (void)injectJSONText:(NSString *)script
   asGlobalObjectNamed:(NSString *)objectName
              callback:(RCTJavaScriptCompleteBlock)onComplete
{
  _injectedStuff[objectName] = script;
  onComplete(nil);
}

- (void)invalidate {}

@end

@interface RCTBridgeTests : XCTestCase <RCTBridgeModule>
{
  RCTBridge *_bridge;
  __weak TestExecutor *_jsExecutor;

  BOOL _testMethodCalled;
}
@end

@implementation RCTBridgeTests

@synthesize methodQueue = _methodQueue;

RCT_EXPORT_MODULE(TestModule)

- (void)setUp
{
  [super setUp];

  _bridge = [[RCTBridge alloc] initWithBundleURL:nil
                                  moduleProvider:^{ return @[self]; }
                                   launchOptions:nil];

  _bridge.executorClass = [TestExecutor class];

  // Force to recreate the executor with the new class
  // - reload: doesn't work here since bridge hasn't loaded yet.
  [_bridge invalidate];
  [_bridge setUp];

  _jsExecutor = [_bridge.batchedBridge valueForKey:@"javaScriptExecutor"];
  XCTAssertNotNil(_jsExecutor);
}

- (void)tearDown
{
  [super tearDown];

  _testMethodCalled = NO;

  [_bridge invalidate];
  _bridge = nil;
}

- (void)testHookRegistration
{
  NSString *injectedStuff;
  RUN_RUNLOOP_WHILE(!(injectedStuff = _jsExecutor.injectedStuff[@"__fbBatchedBridgeConfig"]));
  XCTAssertNotNil(injectedStuff);

  __block NSNumber *testModuleID = nil;
  __block NSDictionary<NSString *, id> *testConstants = nil;
  __block NSNumber *testMethodID = nil;

  NSArray *remoteModuleConfig = RCTJSONParse(injectedStuff, NULL)[@"remoteModuleConfig"];
  [remoteModuleConfig enumerateObjectsUsingBlock:^(id moduleConfig, NSUInteger i, BOOL *stop) {
    if ([moduleConfig isKindOfClass:[NSArray class]] && [moduleConfig[0] isEqualToString:@"TestModule"]) {
      testModuleID = @(i);
      testConstants = moduleConfig[1];
      testMethodID = @([moduleConfig[2] indexOfObject:@"testMethod"]);
      *stop = YES;
    }
  }];

  XCTAssertNotNil(remoteModuleConfig);
  XCTAssertNotNil(testModuleID);
  XCTAssertNotNil(testConstants);
  XCTAssertEqualObjects(testConstants[@"eleventyMillion"], @42);
  XCTAssertNotNil(testMethodID);
}

- (void)testCallNativeMethod
{
  NSString *injectedStuff;
  RUN_RUNLOOP_WHILE(!(injectedStuff = _jsExecutor.injectedStuff[@"__fbBatchedBridgeConfig"]));
  XCTAssertNotNil(injectedStuff);

  __block NSNumber *testModuleID = nil;
  __block NSNumber *testMethodID = nil;

  NSArray *remoteModuleConfig = RCTJSONParse(injectedStuff, NULL)[@"remoteModuleConfig"];
  [remoteModuleConfig enumerateObjectsUsingBlock:^(id moduleConfig, NSUInteger i, __unused BOOL *stop) {
    if ([moduleConfig isKindOfClass:[NSArray class]] && [moduleConfig[0] isEqualToString:@"TestModule"]) {
      testModuleID = @(i);
      testMethodID = @([moduleConfig[2] indexOfObject:@"testMethod"]);
      *stop = YES;
    }
  }];

  XCTAssertNotNil(testModuleID);
  XCTAssertNotNil(testMethodID);

  NSArray *args = @[@1234, @5678, @"stringy", @{@"a": @1}, @42];
  NSArray *buffer = @[@[testModuleID], @[testMethodID], @[args]];

  [_bridge.batchedBridge handleBuffer:buffer];

  dispatch_sync(_methodQueue, ^{
    // clear the queue
    XCTAssertTrue(_testMethodCalled);
  });
}

- (void)DISABLED_testBadArgumentsCount
{
  //NSArray *bufferWithMissingArgument = @[@[@1], @[@0], @[@[@1234, @5678, @"stringy", @{@"a": @1}/*, @42*/]], @[], @1234567];
  //[_bridge handleBuffer:bufferWithMissingArgument];
  NSLog(@"WARNING: testBadArgumentsCount is temporarily disabled until we have a better way to test cases that we expect to trigger redbox errors");
}

RCT_EXPORT_METHOD(testMethod:(NSInteger)integer
                  number:(nonnull NSNumber *)number
                  string:(NSString *)string
                  dictionary:(NSDictionary *)dict
                  callback:(RCTResponseSenderBlock)callback)
{
  _testMethodCalled = YES;

  XCTAssertTrue(integer == 1234);
  XCTAssertEqualObjects(number, @5678);
  XCTAssertEqualObjects(string, @"stringy");
  XCTAssertEqualObjects(dict, @{@"a": @1});
  XCTAssertNotNil(callback);
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{@"eleventyMillion": @42};
}

@end
