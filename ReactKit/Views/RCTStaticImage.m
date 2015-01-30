// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTStaticImage.h"

@implementation RCTStaticImage

- (void)_updateImage
{
  UIImage *image = self.image;
  if (!image) {
    return;
  }
  
  // Apply rendering mode
  if (_renderingMode != image.renderingMode) {
    image = [image imageWithRenderingMode:_renderingMode];
  }
  
  // Applying capInsets of 0 will switch the "resizingMode" of the image to "tile" which is undesired
  if (!UIEdgeInsetsEqualToEdgeInsets(UIEdgeInsetsZero, _capInsets)) {
    image = [image resizableImageWithCapInsets:_capInsets resizingMode:UIImageResizingModeStretch];
  }
  
  super.image = image;
}

- (void)setImage:(UIImage *)image
{
  if (image != super.image) {
    super.image = image;
    [self _updateImage];
  }
}

- (void)setCapInsets:(UIEdgeInsets)capInsets
{
  if (!UIEdgeInsetsEqualToEdgeInsets(_capInsets, capInsets)) {
    _capInsets = capInsets;
    [self _updateImage];
  }
}

- (void)setRenderingMode:(UIImageRenderingMode)renderingMode
{
  if (_renderingMode != renderingMode) {
    _renderingMode = renderingMode;
    [self _updateImage];
  }
}

@end
