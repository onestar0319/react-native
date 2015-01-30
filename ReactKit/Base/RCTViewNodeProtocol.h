// Copyright 2004-present Facebook. All Rights Reserved.

/**

 * Logical node in a tree of application components. Both `ShadowView`s and
 * `UIView+ReactKit`s conform to this. Allows us to write utilities that
 * reason about trees generally.
 */
@protocol RCTViewNodeProtocol <NSObject>

@property (nonatomic, strong) NSNumber *reactTag;

- (void)insertReactSubview:(id<RCTViewNodeProtocol>)subview atIndex:(NSInteger)atIndex;
- (void)removeReactSubview:(id<RCTViewNodeProtocol>)subview;
- (NSMutableArray *)reactSubviews;

// View is an RCTRootView
- (BOOL)isReactRootView;

@optional

// TODO: Deprecate this
- (void)reactBridgeDidFinishTransaction;

// Invoked when react determines that the view will be removed from the view
// hierarchy and never replaced.
- (void)reactWillDestroy;

@end
