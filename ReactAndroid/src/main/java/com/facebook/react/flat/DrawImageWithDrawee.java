/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import android.graphics.Canvas;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffColorFilter;

import com.facebook.drawee.drawable.ScalingUtils.ScaleType;
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.RoundingParams;
import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.views.image.ImageResizeMode;

/**
 * DrawImageWithDrawee is DrawCommand that can draw a local or remote image.
 * It uses DraweeRequestHelper internally to fetch and cache the images.
 */
/* package */ final class DrawImageWithDrawee extends AbstractDrawCommand implements DrawImage {

  private @Nullable DraweeRequestHelper mRequestHelper;
  private @Nullable PorterDuffColorFilter mColorFilter;
  private ScaleType mScaleType = ImageResizeMode.defaultValue();
  private float mBorderWidth;
  private float mBorderRadius;
  private int mBorderColor;

  @Override
  public boolean hasImageRequest() {
    return mRequestHelper != null;
  }

  @Override
  public void setImageRequest(@Nullable ImageRequest imageRequest) {
    if (imageRequest == null) {
      mRequestHelper = null;
    } else {
      mRequestHelper = new DraweeRequestHelper(imageRequest);
    }
  }

  @Override
  public void setTintColor(int tintColor) {
    if (tintColor == 0) {
      mColorFilter = null;
    } else {
      mColorFilter = new PorterDuffColorFilter(tintColor, PorterDuff.Mode.SRC_ATOP);
    }
  }

  @Override
  public void setScaleType(ScaleType scaleType) {
    mScaleType = scaleType;
  }

  @Override
  public ScaleType getScaleType() {
    return mScaleType;
  }

  @Override
  public void setBorderWidth(float borderWidth) {
    mBorderWidth = borderWidth;
  }

  @Override
  public float getBorderWidth() {
    return mBorderWidth;
  }

  @Override
  public void setBorderRadius(float borderRadius) {
    mBorderRadius = borderRadius;
  }

  @Override
  public float getBorderRadius() {
    return mBorderRadius;
  }

  @Override
  public void setBorderColor(int borderColor) {
    mBorderColor = borderColor;
  }

  @Override
  public int getBorderColor() {
    return mBorderColor;
  }

  @Override
  public void onDraw(Canvas canvas) {
    Assertions.assumeNotNull(mRequestHelper).getDrawable().draw(canvas);
  }

  @Override
  public void onAttached(FlatViewGroup.InvalidateCallback callback) {
    GenericDraweeHierarchy hierarchy = Assertions.assumeNotNull(mRequestHelper).getHierarchy();

    RoundingParams roundingParams = hierarchy.getRoundingParams();
    if (shouldDisplayBorder()) {
      if (roundingParams == null) {
        roundingParams = new RoundingParams();
      }

      roundingParams.setBorder(mBorderColor, mBorderWidth);
      roundingParams.setCornersRadius(mBorderRadius);

      // changes won't take effect until we re-apply rounding params, so do it now.
      hierarchy.setRoundingParams(roundingParams);
    } else if (roundingParams != null) {
      // clear rounding params
      hierarchy.setRoundingParams(null);
    }

    hierarchy.setActualImageScaleType(mScaleType);
    hierarchy.setActualImageColorFilter(mColorFilter);

    hierarchy.getTopLevelDrawable().setBounds(
        Math.round(getLeft()),
        Math.round(getTop()),
        Math.round(getRight()),
        Math.round(getBottom()));

    mRequestHelper.attach(callback);
  }

  @Override
  public void onDetached() {
    Assertions.assumeNotNull(mRequestHelper).detach();
  }

  private boolean shouldDisplayBorder() {
    return mBorderColor != 0 || mBorderRadius >= 0.5f;
  }
}
