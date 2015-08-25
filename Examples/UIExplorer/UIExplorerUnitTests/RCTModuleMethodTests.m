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

#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

#import "RCTBridgeModule.h"
#import "RCTModuleMethod.h"
#import "RCTLog.h"

static BOOL RCTLogsError(void (^block)(void))
{
  __block BOOL loggedError = NO;
  RCTPerformBlockWithLogFunction(block, ^(RCTLogLevel level,
                                          __unused NSString *fileName,
                                          __unused NSNumber *lineNumber,
                                          __unused NSString *message) {
    loggedError = (level == RCTLogLevelError);
  });
  return loggedError;
}

@interface RCTModuleMethodTests : XCTestCase <RCTBridgeModule>

@end

@implementation RCTModuleMethodTests
{
  CGRect _s;
}

+ (NSString *)moduleName { return nil; }

- (void)doFooWithBar:(__unused NSString *)bar { }

- (void)testNonnull
{
  NSString *methodName = @"doFooWithBar:(nonnull NSString *)bar";
  RCTModuleMethod *method = [[RCTModuleMethod alloc] initWithObjCMethodName:methodName
                                                               JSMethodName:nil
                                                                moduleClass:[self class]];
  XCTAssertFalse(RCTLogsError(^{
    [method invokeWithBridge:nil module:self arguments:@[@"Hello World"]];
  }));

  XCTAssertTrue(RCTLogsError(^{
    [method invokeWithBridge:nil module:self arguments:@[[NSNull null]]];
  }));
}

- (void)doFooWithNumber:(__unused NSNumber *)n { }
- (void)doFooWithDouble:(__unused double)n { }
- (void)doFooWithInteger:(__unused NSInteger)n { }
- (void)doFooWithCGRect:(CGRect)s { _s = s; }

- (void)testNumbersNonnull
{
  {
    // Specifying an NSNumber param without nonnull isn't allowed
    XCTAssertTrue(RCTLogsError(^{
      NSString *methodName = @"doFooWithNumber:(NSNumber *)n";
      RCTModuleMethod *method = [[RCTModuleMethod alloc] initWithObjCMethodName:methodName
                                                                   JSMethodName:nil
                                                                    moduleClass:[self class]];
      // Invoke method to trigger parsing
      [method invokeWithBridge:nil module:self arguments:@[@1]];
    }));
  }

  {
    NSString *methodName = @"doFooWithNumber:(nonnull NSNumber *)n";
    RCTModuleMethod *method = [[RCTModuleMethod alloc] initWithObjCMethodName:methodName
                                                                 JSMethodName:nil
                                                                  moduleClass:[self class]];
    XCTAssertTrue(RCTLogsError(^{
      [method invokeWithBridge:nil module:self arguments:@[[NSNull null]]];
    }));
  }

  {
    NSString *methodName = @"doFooWithDouble:(double)n";
    RCTModuleMethod *method = [[RCTModuleMethod alloc] initWithObjCMethodName:methodName
                                                                 JSMethodName:nil
                                                                  moduleClass:[self class]];
    XCTAssertTrue(RCTLogsError(^{
      [method invokeWithBridge:nil module:self arguments:@[[NSNull null]]];
    }));
  }

  {
    NSString *methodName = @"doFooWithInteger:(NSInteger)n";
    RCTModuleMethod *method = [[RCTModuleMethod alloc] initWithObjCMethodName:methodName
                                                                 JSMethodName:nil
                                                                  moduleClass:[self class]];
    XCTAssertTrue(RCTLogsError(^{
      [method invokeWithBridge:nil module:self arguments:@[[NSNull null]]];
    }));
  }
}

- (void)testStructArgument
{
  NSString *methodName = @"doFooWithCGRect:(CGRect)s";
  RCTModuleMethod *method = [[RCTModuleMethod alloc] initWithObjCMethodName:methodName
                                                               JSMethodName:nil
                                                                moduleClass:[self class]];

  CGRect r = CGRectMake(10, 20, 30, 40);
  [method invokeWithBridge:nil module:self arguments:@[@[@10, @20, @30, @40]]];
  XCTAssertTrue(CGRectEqualToRect(r, _s));
}

@end
