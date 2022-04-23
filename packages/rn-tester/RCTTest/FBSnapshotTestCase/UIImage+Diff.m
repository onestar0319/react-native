/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UIImage+Diff.h"

@implementation UIImage (Diff)

- (UIImage *)diffWithImage:(UIImage *)image
{
  if (!image) {
    return nil;
  }
  CGSize imageSize = CGSizeMake(MAX(self.size.width, image.size.width), MAX(self.size.height, image.size.height));

  UIGraphicsImageRendererFormat *const rendererFormat = [UIGraphicsImageRendererFormat defaultFormat];
  rendererFormat.opaque = YES;
  UIGraphicsImageRenderer *const renderer = [[UIGraphicsImageRenderer alloc] initWithSize:imageSize
                                                                                   format:rendererFormat];

  return [renderer imageWithActions:^(UIGraphicsImageRendererContext *_Nonnull context) {
    [self drawInRect:CGRectMake(0, 0, self.size.width, self.size.height)];
    CGContextSetAlpha(context.CGContext, 0.5f);
    CGContextBeginTransparencyLayer(context.CGContext, NULL);
    [image drawInRect:CGRectMake(0, 0, image.size.width, image.size.height)];
    CGContextSetBlendMode(context.CGContext, kCGBlendModeDifference);
    CGContextSetFillColorWithColor(context.CGContext, [UIColor whiteColor].CGColor);
    CGContextFillRect(context.CGContext, CGRectMake(0, 0, self.size.width, self.size.height));
    CGContextEndTransparencyLayer(context.CGContext);
  }];
}

@end
