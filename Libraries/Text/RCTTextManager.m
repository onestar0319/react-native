/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextManager.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTShadowRawText.h"
#import "RCTShadowText.h"
#import "RCTSparseArray.h"
#import "RCTText.h"
#import "UIView+React.h"

@implementation RCTTextManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTText alloc] init];
}

- (RCTShadowView *)shadowView
{
  return [[RCTShadowText alloc] init];
}

#pragma mark - View properties

RCT_IGNORE_VIEW_PROPERTY(backgroundColor);
RCT_REMAP_VIEW_PROPERTY(containerBackgroundColor, backgroundColor, UIColor)

#pragma mark - Shadow properties

RCT_EXPORT_SHADOW_PROPERTY(writingDirection, NSWritingDirection)
RCT_EXPORT_SHADOW_PROPERTY(color, UIColor)
RCT_EXPORT_SHADOW_PROPERTY(fontFamily, NSString)
RCT_EXPORT_SHADOW_PROPERTY(fontSize, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(fontWeight, NSString)
RCT_EXPORT_SHADOW_PROPERTY(fontStyle, NSString)
RCT_EXPORT_SHADOW_PROPERTY(isHighlighted, BOOL)
RCT_EXPORT_SHADOW_PROPERTY(letterSpacing, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(lineHeight, CGFloat)
RCT_EXPORT_SHADOW_PROPERTY(shadowOffset, CGSize)
RCT_EXPORT_SHADOW_PROPERTY(textAlign, NSTextAlignment)
RCT_REMAP_SHADOW_PROPERTY(backgroundColor, textBackgroundColor, UIColor)
RCT_REMAP_SHADOW_PROPERTY(containerBackgroundColor, backgroundColor, UIColor)
RCT_EXPORT_SHADOW_PROPERTY(numberOfLines, NSUInteger)

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(RCTSparseArray *)shadowViewRegistry
{
  NSMutableArray *uiBlocks = [NSMutableArray new];

  for (RCTShadowView *rootView in shadowViewRegistry.allObjects) {
    if (![rootView isReactRootView]) {
      // This isn't a root view
      continue;
    }

    if (![rootView isTextDirty]) {
      // No text processing to be done
      continue;
    }

    RCTSparseArray *reactTaggedTextStorage = [[RCTSparseArray alloc] init];
    NSMutableArray *queue = [NSMutableArray arrayWithObject:rootView];
    for (NSInteger i = 0; i < [queue count]; i++) {
      RCTShadowView *shadowView = queue[i];
      RCTAssert([shadowView isTextDirty], @"Don't process any nodes that don't have dirty text");

      if ([shadowView isKindOfClass:[RCTShadowText class]]) {
        RCTShadowText *shadowText = (RCTShadowText *)shadowView;
        NSTextStorage *textStorage = [shadowText buildTextStorageForWidth:shadowView.frame.size.width];
        reactTaggedTextStorage[shadowText.reactTag] = textStorage;
      } else if ([shadowView isKindOfClass:[RCTShadowRawText class]]) {
        RCTLogError(@"Raw text cannot be used outside of a <Text> tag. Not rendering string: '%@'",
                    [(RCTShadowRawText *)shadowView text]);
      } else {
        for (RCTShadowView *child in [shadowView reactSubviews]) {
          if ([child isTextDirty]) {
            [queue addObject:child];
          }
        }
      }

      [shadowView setTextComputed];
    }

    [uiBlocks addObject:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
      [reactTaggedTextStorage enumerateObjectsUsingBlock:^(NSTextStorage *textStorage, NSNumber *reactTag, BOOL *stop) {
        RCTText *text = viewRegistry[reactTag];
        text.textStorage = textStorage;
      }];
    }];
  }

  return ^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    for (RCTViewManagerUIBlock shadowBlock in uiBlocks) {
      shadowBlock(uiManager, viewRegistry);
    }
  };
}

- (RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(RCTShadowText *)shadowView
{
  NSNumber *reactTag = shadowView.reactTag;
  UIEdgeInsets padding = shadowView.paddingAsInsets;

  return ^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {
    RCTText *text = viewRegistry[reactTag];
    text.contentInset = padding;
  };
}

@end
