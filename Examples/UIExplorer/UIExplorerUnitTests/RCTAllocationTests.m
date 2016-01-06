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
#import "RCTJSCExecutor.h"
#import "RCTModuleMethod.h"
#import "RCTRootView.h"

#define RUN_RUNLOOP_WHILE(CONDITION) \
{ \
  NSDate *timeout = [NSDate dateWithTimeIntervalSinceNow:5]; \
  while ((CONDITION) && [timeout timeIntervalSinceNow] > 0) { \
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]]; \
  } \
}

@interface RCTJavaScriptContext : NSObject

@property (nonatomic, assign, readonly) JSGlobalContextRef ctx;

@end

@interface AllocationTestModule : NSObject<RCTBridgeModule, RCTInvalidating>

@property (nonatomic, assign, getter=isValid) BOOL valid;

@end

@implementation AllocationTestModule

RCT_EXPORT_MODULE();

- (instancetype)init
{
  if ((self = [super init])) {
    _valid = YES;
  }
  return self;
}

- (void)invalidate
{
  _valid = NO;
}

RCT_EXPORT_METHOD(test:(__unused NSString *)a
                      :(__unused NSNumber *)b
                      :(__unused RCTResponseSenderBlock)c
                      :(__unused RCTResponseErrorBlock)d) {}

@end

@interface RCTAllocationTests : XCTestCase
@end

@implementation RCTAllocationTests {
  NSURL *_bundleURL;
}

- (void)setUp
{
  [super setUp];

  NSString *bundleContents =
  @"var __fbBatchedBridge = {"
   "  callFunctionReturnFlushedQueue: function() {},"
   "  invokeCallbackAndReturnFlushedQueue: function() {},"
   "  flushedQueue: function() {},"
   "};";

  NSURL *tempDir = [NSURL fileURLWithPath:NSTemporaryDirectory() isDirectory:YES];
  [[NSFileManager defaultManager] createDirectoryAtURL:tempDir withIntermediateDirectories:YES attributes:nil error:NULL];

  _bundleURL = [tempDir URLByAppendingPathComponent:@"rctallocationtests-bundle.js"];
  [bundleContents writeToURL:_bundleURL atomically:YES encoding:NSUTF8StringEncoding error:NULL];
}

- (void)tearDown
{
  [super tearDown];

  [[NSFileManager defaultManager] removeItemAtURL:_bundleURL error:NULL];
}

- (void)testBridgeIsDeallocated
{
  __weak RCTBridge *weakBridge;
  @autoreleasepool {
    RCTRootView *view = [[RCTRootView alloc] initWithBundleURL:_bundleURL
                                                    moduleName:@""
                                             initialProperties:nil
                                                 launchOptions:nil];
    weakBridge = view.bridge;
    XCTAssertNotNil(weakBridge, @"RCTBridge should have been created");
    (void)view;
  }

  XCTAssertNil(weakBridge, @"RCTBridge should have been deallocated");
}

- (void)testModulesAreInvalidated
{
  AllocationTestModule *module = [AllocationTestModule new];
  @autoreleasepool {
    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                              moduleProvider:^{
                                                return @[module];
                                              }
                                               launchOptions:nil];
    XCTAssertTrue(module.isValid, @"AllocationTestModule should be valid");
    (void)bridge;
  }

  RUN_RUNLOOP_WHILE(module.isValid)
  XCTAssertFalse(module.isValid, @"AllocationTestModule should have been invalidated by the bridge");
}

- (void)testModulesAreDeallocated
{
  __weak AllocationTestModule *weakModule;
  @autoreleasepool {
    AllocationTestModule *module = [AllocationTestModule new];
    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                              moduleProvider:^{
                                                return @[module];
                                              }
                                               launchOptions:nil];
    weakModule = module;
    XCTAssertNotNil(weakModule, @"AllocationTestModule should have been created");
    (void)bridge;
  }

  RUN_RUNLOOP_WHILE(weakModule)
  XCTAssertNil(weakModule, @"AllocationTestModule should have been deallocated");
}

- (void)testModuleMethodsAreDeallocated
{
  __weak RCTModuleMethod *weakMethod;
  @autoreleasepool {
    __autoreleasing RCTModuleMethod *method = [[RCTModuleMethod alloc] initWithMethodSignature:@"test:(NSString *)a :(nonnull NSNumber *)b :(RCTResponseSenderBlock)c :(RCTResponseErrorBlock)d" JSMethodName:@"" moduleClass:[AllocationTestModule class]];
    weakMethod = method;
    XCTAssertNotNil(method, @"RCTModuleMethod should have been created");
  }

  RUN_RUNLOOP_WHILE(weakMethod)
  XCTAssertNil(weakMethod, @"RCTModuleMethod should have been deallocated");
}

- (void)testJavaScriptExecutorIsDeallocated
{
  __weak id<RCTJavaScriptExecutor> weakExecutor;
  @autoreleasepool {
    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                              moduleProvider:nil
                                               launchOptions:nil];
    weakExecutor = [bridge.batchedBridge valueForKey:@"javaScriptExecutor"];
    XCTAssertNotNil(weakExecutor, @"JavaScriptExecutor should have been created");
    (void)bridge;
  }

  RUN_RUNLOOP_WHILE(weakExecutor);
  XCTAssertNil(weakExecutor, @"JavaScriptExecutor should have been released");
}

- (void)testJavaScriptContextIsDeallocated
{
  __weak id weakContext;
  @autoreleasepool {
    RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                              moduleProvider:nil
                                               launchOptions:nil];
    id executor = [bridge.batchedBridge valueForKey:@"javaScriptExecutor"];
    RUN_RUNLOOP_WHILE(!(weakContext = [executor valueForKey:@"_context"]));
    XCTAssertNotNil(weakContext, @"RCTJavaScriptContext should have been created");
    (void)bridge;
  }

  RUN_RUNLOOP_WHILE(weakContext);
  XCTAssertNil(weakContext, @"RCTJavaScriptContext should have been deallocated");
}

- (void)testContentViewIsInvalidated
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL
                                            moduleProvider:nil
                                             launchOptions:nil];
  __weak UIView *rootContentView;
  @autoreleasepool {
    RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"" initialProperties:nil];
    RUN_RUNLOOP_WHILE(!(rootContentView = [rootView valueForKey:@"contentView"]))
    XCTAssertTrue(rootContentView.userInteractionEnabled, @"RCTContentView should be valid");
    (void)rootView;
  }

  XCTAssertFalse(rootContentView.userInteractionEnabled, @"RCTContentView should have been invalidated");
}

- (void)testUnderlyingBridgeIsDeallocated
{
  RCTBridge *bridge;
  __weak id batchedBridge;
  @autoreleasepool {
    bridge = [[RCTBridge alloc] initWithBundleURL:_bundleURL moduleProvider:nil launchOptions:nil];
    batchedBridge = bridge.batchedBridge;
    XCTAssertTrue([batchedBridge isValid], @"RCTBatchedBridge should be valid");
    [bridge reload];
  }

  RUN_RUNLOOP_WHILE(batchedBridge != nil)

  XCTAssertNotNil(bridge, @"RCTBridge should not have been deallocated");
  XCTAssertNil(batchedBridge, @"RCTBatchedBridge should have been deallocated");

  // Wait to complete the test until the new batchedbridge is also deallocated
  @autoreleasepool {
    batchedBridge = bridge.batchedBridge;
    bridge = nil;
  }

  RUN_RUNLOOP_WHILE(batchedBridge != nil);
  XCTAssertNil(batchedBridge);
}

@end
