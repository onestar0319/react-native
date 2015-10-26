// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.views.recyclerview;

import javax.annotation.Nullable;

import android.view.View;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.views.scroll.ReactScrollViewCommandHelper;

/**
 * View manager for {@link RecyclerViewBackedScrollView}.
 */
public class RecyclerViewBackedScrollViewManager extends
    ViewGroupManager<RecyclerViewBackedScrollView>
    implements ReactScrollViewCommandHelper.ScrollCommandHandler<RecyclerViewBackedScrollView> {

  private static final String REACT_CLASS = "AndroidRecyclerViewBackedScrollView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  // TODO(8624925): Implement removeClippedSubviews support for native ListView

  @Override
  protected RecyclerViewBackedScrollView createViewInstance(ThemedReactContext reactContext) {
    return new RecyclerViewBackedScrollView(reactContext);
  }

  @Override
  public void addView(RecyclerViewBackedScrollView parent, View child, int index) {
    parent.addViewToAdapter(child, index);
  }

  @Override
  public int getChildCount(RecyclerViewBackedScrollView parent) {
    return parent.getChildCountFromAdapter();
  }

  @Override
  public View getChildAt(RecyclerViewBackedScrollView parent, int index) {
    return parent.getChildAtFromAdapter(index);
  }

  @Override
  public void removeView(RecyclerViewBackedScrollView parent, View child) {
    parent.removeViewFromAdapter(child);
  }

  /**
   * Provides implementation of commands supported by {@link ReactScrollViewManager}
   */
  @Override
  public void receiveCommand(
      RecyclerViewBackedScrollView view,
      int commandId,
      @Nullable ReadableArray args) {
    ReactScrollViewCommandHelper.receiveCommand(this, view, commandId, args);
  }

  @Override
  public void scrollTo(
      RecyclerViewBackedScrollView view,
      ReactScrollViewCommandHelper.ScrollToCommandData data) {
    view.scrollTo(data.mDestX, data.mDestY, true);
  }

  @Override
  public void scrollWithoutAnimationTo(
      RecyclerViewBackedScrollView view,
      ReactScrollViewCommandHelper.ScrollToCommandData data) {
    view.scrollTo(data.mDestX, data.mDestY, false);
  }
}
