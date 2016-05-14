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

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.animation.Animation;

import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.SoftAssertions;
import com.facebook.react.common.SystemClock;
import com.facebook.react.touch.OnInterceptTouchEventListener;
import com.facebook.react.touch.ReactInterceptingViewGroup;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.ReactCompoundViewGroup;
import com.facebook.react.uimanager.ReactPointerEventsView;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.views.image.ImageLoadEvent;
import com.facebook.react.views.view.ReactClippingViewGroup;
import com.facebook.react.views.view.ReactClippingViewGroupHelper;

/**
 * A view that FlatShadowNode hierarchy maps to. Performs drawing by iterating over
 * array of DrawCommands, executing them one by one.
 */
/* package */ final class FlatViewGroup extends ViewGroup
    implements ReactInterceptingViewGroup, ReactClippingViewGroup,
    ReactCompoundViewGroup, ReactPointerEventsView {
  /**
   * Helper class that allows AttachDetachListener to invalidate the hosting View.
   */
  static final class InvalidateCallback extends WeakReference<FlatViewGroup> {

    private InvalidateCallback(FlatViewGroup view) {
      super(view);
    }

    /**
     * Propagates invalidate() call up to the hosting View (if it's still alive)
     */
    public void invalidate() {
      FlatViewGroup view = get();
      if (view != null) {
        view.invalidate();
      }
    }

    public void dispatchImageLoadEvent(int reactTag, int imageLoadEvent) {
      FlatViewGroup view = get();
      if (view == null) {
        return;
      }

      ReactContext reactContext = ((ReactContext) view.getContext());
      UIManagerModule uiManagerModule = reactContext.getNativeModule(UIManagerModule.class);
      uiManagerModule.getEventDispatcher().dispatchEvent(
          new ImageLoadEvent(reactTag, SystemClock.nanoTime(), imageLoadEvent));
    }
  }

  private static final ArrayList<FlatViewGroup> LAYOUT_REQUESTS = new ArrayList<>();
  private static final Rect VIEW_BOUNDS = new Rect();

  private @Nullable InvalidateCallback mInvalidateCallback;
  private DrawCommand[] mDrawCommands = DrawCommand.EMPTY_ARRAY;
  private AttachDetachListener[] mAttachDetachListeners = AttachDetachListener.EMPTY_ARRAY;
  private NodeRegion[] mNodeRegions = NodeRegion.EMPTY_ARRAY;
  private int mDrawChildIndex = 0;
  private boolean mIsAttached = false;
  private boolean mIsLayoutRequested = false;
  private boolean mNeedsOffscreenAlphaCompositing = false;
  private Drawable mHotspot;
  private PointerEvents mPointerEvents = PointerEvents.AUTO;
  private long mLastTouchDownTime;
  private @Nullable OnInterceptTouchEventListener mOnInterceptTouchEventListener;

  private boolean mRemoveClippedSubviews;
  private @Nullable Rect mClippingRect;
  // lookups in o(1) instead of o(log n) - trade space for time
  private final Map<Integer, DrawView> mDrawViewMap = new HashMap<>();
  private final Map<Integer, FlatViewGroup> mClippedSubviews = new HashMap<>();

  /* package */ FlatViewGroup(Context context) {
    super(context);
    setClipChildren(false);
  }

  @Override
  protected void detachAllViewsFromParent() {
    super.detachAllViewsFromParent();
  }

  @Override
  public void requestLayout() {
    if (mIsLayoutRequested) {
      return;
    }

    mIsLayoutRequested = true;
    LAYOUT_REQUESTS.add(this);
  }

  @Override
  public int reactTagForTouch(float touchX, float touchY) {
    /**
     * Make sure we don't find any children if the pointer events are set to BOX_ONLY.
     * There is no need to special-case any other modes, because if PointerEvents are set to:
     * a) PointerEvents.AUTO - all children are included, nothing to exclude
     * b) PointerEvents.NONE - this method will NOT be executed, because the View will be filtered
     *    out by TouchTargetHelper.
     * c) PointerEvents.BOX_NONE - TouchTargetHelper will make sure that {@link #reactTagForTouch()}
    *     doesn't return getId().
     */
    SoftAssertions.assertCondition(
        mPointerEvents != PointerEvents.NONE,
        "TouchTargetHelper should not allow calling this method when pointer events are NONE");

    if (mPointerEvents != PointerEvents.BOX_ONLY) {
      NodeRegion nodeRegion = virtualNodeRegionWithinBounds(touchX, touchY);
      if (nodeRegion != null) {
        return nodeRegion.getReactTag(touchX, touchY);
      }
    }

    // no children found
    return getId();
  }

  @Override
  public boolean interceptsTouchEvent(float touchX, float touchY) {
    NodeRegion nodeRegion = anyNodeRegionWithinBounds(touchX, touchY);
    return nodeRegion != null && nodeRegion.mIsVirtual;
  }

  @Override
  public void dispatchDraw(Canvas canvas) {
    super.dispatchDraw(canvas);

    if (mRemoveClippedSubviews) {
      for (DrawCommand drawCommand : mDrawCommands) {
        if (drawCommand instanceof DrawView) {
          if (!((DrawView) drawCommand).isViewGroupClipped) {
            drawCommand.draw(this, canvas);
          }
          // else, don't draw, and don't increment index
        } else {
          drawCommand.draw(this, canvas);
        }
      }
    } else {
      for (DrawCommand drawCommand : mDrawCommands) {
        drawCommand.draw(this, canvas);
      }
    }

    if (mDrawChildIndex != getChildCount()) {
      throw new RuntimeException(
          "Did not draw all children: " + mDrawChildIndex + " / " + getChildCount());
    }
    mDrawChildIndex = 0;

    if (mHotspot != null) {
      mHotspot.draw(canvas);
    }
  }

  @Override
  protected boolean drawChild(Canvas canvas, View child, long drawingTime) {
    // suppress
    // no drawing -> no invalidate -> return false
    return false;
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    // nothing to do here
  }

  @Override
  protected boolean verifyDrawable(Drawable who) {
    return true;
  }

  @Override
  protected void onAttachedToWindow() {
    if (mIsAttached) {
      // this is possible, unfortunately.
      return;
    }

    mIsAttached = true;

    super.onAttachedToWindow();
    dispatchOnAttached(mAttachDetachListeners);

    if (mRemoveClippedSubviews) {
      updateClippingRect();
    }
  }

  @Override
  protected void onDetachedFromWindow() {
    if (!mIsAttached) {
      throw new RuntimeException("Double detach");
    }

    mIsAttached = false;

    super.onDetachedFromWindow();
    dispatchOnDetached(mAttachDetachListeners);
  }

  @Override
  protected void onSizeChanged(int w, int h, int oldw, int oldh) {
    if (mHotspot != null) {
      mHotspot.setBounds(0, 0, w, h);
      invalidate();
    }

    if (mRemoveClippedSubviews) {
      updateClippingRect();
    }
  }

  @Override
  public void dispatchDrawableHotspotChanged(float x, float y) {
    if (mHotspot != null) {
      mHotspot.setHotspot(x, y);
      invalidate();
    }
  }

  @Override
  protected void drawableStateChanged() {
    super.drawableStateChanged();

    if (mHotspot != null && mHotspot.isStateful()) {
        mHotspot.setState(getDrawableState());
    }
  }

  @Override
  public void jumpDrawablesToCurrentState() {
    super.jumpDrawablesToCurrentState();
    if (mHotspot != null) {
        mHotspot.jumpToCurrentState();
    }
  }

  @Override
  public void invalidate() {
    // By default, invalidate() only invalidates the View's boundaries, which works great in most
    // cases but may fail with overflow: visible (i.e. View clipping disabled) when View width or
    // height is 0. This is because invalidate() has an optimization where it will not invalidate
    // empty Views at all. A quick fix is to invalidate a slightly larger region to make sure we
    // never hit that optimization.
    //
    // Another thing to note is that this may not work correctly with software rendering because
    // in software, Android tracks dirty regions to redraw. We would need to collect information
    // about all children boundaries (recursively) to track dirty region precisely.
    invalidate(0, 0, getWidth() + 1, getHeight() + 1);
  }

  /**
   * We override this to allow developers to determine whether they need offscreen alpha compositing
   * or not. See the documentation of needsOffscreenAlphaCompositing in View.js.
   */
  @Override
  public boolean hasOverlappingRendering() {
    return mNeedsOffscreenAlphaCompositing;
  }

  @Override
  public void setOnInterceptTouchEventListener(OnInterceptTouchEventListener listener) {
    mOnInterceptTouchEventListener = listener;
  }

  @Override
  public boolean onInterceptTouchEvent(MotionEvent ev) {
    final long downTime = ev.getDownTime();
    if (downTime != mLastTouchDownTime) {
      mLastTouchDownTime = downTime;
      if (interceptsTouchEvent(ev.getX(), ev.getY())) {
        return true;
      }
    }

    if (mOnInterceptTouchEventListener != null &&
        mOnInterceptTouchEventListener.onInterceptTouchEvent(this, ev)) {
      return true;
    }
    // We intercept the touch event if the children are not supposed to receive it.
    if (mPointerEvents == PointerEvents.NONE || mPointerEvents == PointerEvents.BOX_ONLY) {
      return true;
    }
    return super.onInterceptTouchEvent(ev);
  }

  @Override
  public boolean onTouchEvent(MotionEvent ev) {
    // We do not accept the touch event if this view is not supposed to receive it.
    if (mPointerEvents == PointerEvents.NONE) {
      return false;
    }

    if (mPointerEvents == PointerEvents.BOX_NONE) {
      // We cannot always return false here because some child nodes could be flatten into this View
      NodeRegion nodeRegion = virtualNodeRegionWithinBounds(ev.getX(), ev.getY());
      if (nodeRegion == null) {
        // no child to handle this touch event, bailing out.
        return false;
      }
    }

    // The root view always assumes any view that was tapped wants the touch
    // and sends the event to JS as such.
    // We don't need to do bubbling in native (it's already happening in JS).
    // For an explanation of bubbling and capturing, see
    // http://javascript.info/tutorial/bubbling-and-capturing#capturing
    return true;
  }

  @Override
  public PointerEvents getPointerEvents() {
    return mPointerEvents;
  }

  /*package*/ void setPointerEvents(PointerEvents pointerEvents) {
    mPointerEvents = pointerEvents;
  }

  /**
   * See the documentation of needsOffscreenAlphaCompositing in View.js.
   */
  /* package */ void setNeedsOffscreenAlphaCompositing(boolean needsOffscreenAlphaCompositing) {
    mNeedsOffscreenAlphaCompositing = needsOffscreenAlphaCompositing;
  }

  /* package */ void setHotspot(Drawable hotspot) {
    if (mHotspot != null) {
      mHotspot.setCallback(null);
      unscheduleDrawable(mHotspot);
    }

    if (hotspot != null) {
      hotspot.setCallback(this);
      if (hotspot.isStateful()) {
        hotspot.setState(getDrawableState());
      }
    }

    mHotspot = hotspot;
    invalidate();
  }

  /* package */ void drawNextChild(Canvas canvas) {
    View child = getChildAt(mDrawChildIndex);
    if (child instanceof FlatViewGroup) {
      super.drawChild(canvas, child, getDrawingTime());
    } else {
      // Make sure non-React Views clip properly.
      canvas.save(Canvas.CLIP_SAVE_FLAG);
      child.getHitRect(VIEW_BOUNDS);
      canvas.clipRect(VIEW_BOUNDS);
      super.drawChild(canvas, child, getDrawingTime());
      canvas.restore();
    }

    ++mDrawChildIndex;
  }

  /* package */ void mountDrawCommands(DrawCommand[] drawCommands) {
    mDrawCommands = drawCommands;
    if (mRemoveClippedSubviews) {
      mDrawViewMap.clear();
      for (DrawCommand drawCommand : mDrawCommands) {
        if (drawCommand instanceof DrawView) {
          DrawView drawView = (DrawView) drawCommand;
          mDrawViewMap.put(drawView.reactTag, drawView);
        }
      }
    }
    invalidate();
  }

  /* package */ void mountAttachDetachListeners(AttachDetachListener[] listeners) {
    if (mIsAttached) {
      // Ordering of the following 2 statements is very important. While logically it makes sense to
      // detach old listeners first, and only then attach new listeners, this is not very efficient,
      // because a listener can be in both lists. In this case, it will be detached first and then
      // re-attached immediately. This is undesirable for a couple of reasons:
      // 1) performance. Detaching is slow because it may cancel an ongoing network request
      // 2) it may cause flicker: an image that was already loaded may get unloaded.
      //
      // For this reason, we are attaching new listeners first. What this means is that listeners
      // that are in both lists need to gracefully handle a secondary attach and detach events,
      // (i.e. onAttach() being called when already attached, followed by a detach that should be
      // ignored) turning them into no-ops. This will result in no performance loss and no flicker,
      // because ongoing network requests don't get cancelled.
      dispatchOnAttached(listeners);
      dispatchOnDetached(mAttachDetachListeners);
    }
    mAttachDetachListeners = listeners;
  }

  /* package */ void mountNodeRegions(NodeRegion[] nodeRegions) {
    mNodeRegions = nodeRegions;
  }

  /* package */ void mountViews(ViewResolver viewResolver, int[] viewsToAdd, int[] viewsToDetach) {
    for (int viewToAdd : viewsToAdd) {
      if (viewToAdd > 0) {
        View view = ensureViewHasNoParent(viewResolver.getView(viewToAdd));
        addViewInLayout(view, -1, ensureLayoutParams(view.getLayoutParams()), true);
      } else {
        View view = ensureViewHasNoParent(viewResolver.getView(-viewToAdd));
        attachViewToParent(view, -1, ensureLayoutParams(view.getLayoutParams()));
        if (mRemoveClippedSubviews) {
          mClippedSubviews.remove(-viewToAdd);
          DrawView drawView = mDrawViewMap.get(-viewToAdd);
          if (drawView != null) {
            drawView.isViewGroupClipped = false;
          }
        }
      }
    }

    for (int viewToDetach : viewsToDetach) {
      View view = viewResolver.getView(viewToDetach);
      if (view.getParent() != null) {
        removeViewInLayout(view);
      } else {
        removeDetachedView(view, false);
      }

      if (mRemoveClippedSubviews) {
        mClippedSubviews.remove(viewToDetach);
      }
    }

    invalidate();
  }

  /* package */ void processLayoutRequest() {
    mIsLayoutRequested = false;
    for (int i = 0, childCount = getChildCount(); i != childCount; ++i) {
      View child = getChildAt(i);
      if (!child.isLayoutRequested()) {
        continue;
      }

      child.measure(
        MeasureSpec.makeMeasureSpec(child.getWidth(), MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(child.getHeight(), MeasureSpec.EXACTLY));
      child.layout(child.getLeft(), child.getTop(), child.getRight(), child.getBottom());
    }
  }

  /* package */ static void processLayoutRequests() {
    for (int i = 0, numLayoutRequests = LAYOUT_REQUESTS.size(); i != numLayoutRequests; ++i) {
      FlatViewGroup flatViewGroup = LAYOUT_REQUESTS.get(i);
      flatViewGroup.processLayoutRequest();
    }
    LAYOUT_REQUESTS.clear();
  }

  private @Nullable NodeRegion virtualNodeRegionWithinBounds(float touchX, float touchY) {
    for (int i = mNodeRegions.length - 1; i >= 0; --i) {
      NodeRegion nodeRegion = mNodeRegions[i];
      if (!nodeRegion.mIsVirtual) {
        // only interested in virtual nodes
        continue;
      }
      if (nodeRegion.withinBounds(touchX, touchY)) {
        return nodeRegion;
      }
    }

    return null;
  }

  private @Nullable NodeRegion anyNodeRegionWithinBounds(float touchX, float touchY) {
    for (int i = mNodeRegions.length - 1; i >= 0; --i) {
      NodeRegion nodeRegion = mNodeRegions[i];
      if (nodeRegion.withinBounds(touchX, touchY)) {
        return nodeRegion;
      }
    }

    return null;
  }

  private View ensureViewHasNoParent(View view) {
    ViewParent oldParent = view.getParent();
    if (oldParent != null) {
      throw new RuntimeException(
          "Cannot add view " + view + " to " + this + " while it has a parent " + oldParent);
    }

    return view;
  }

  private void dispatchOnAttached(AttachDetachListener[] listeners) {
    int numListeners = listeners.length;
    if (numListeners == 0) {
      return;
    }

    InvalidateCallback callback = getInvalidateCallback();
    for (AttachDetachListener listener : listeners) {
      listener.onAttached(callback);
    }
  }

  private InvalidateCallback getInvalidateCallback() {
    if (mInvalidateCallback == null) {
      mInvalidateCallback = new InvalidateCallback(this);
    }
    return mInvalidateCallback;
  }

  private static void dispatchOnDetached(AttachDetachListener[] listeners) {
    for (AttachDetachListener listener : listeners) {
      listener.onDetached();
    }
  }

  private ViewGroup.LayoutParams ensureLayoutParams(ViewGroup.LayoutParams lp) {
    if (checkLayoutParams(lp)) {
      return lp;
    }
    return generateDefaultLayoutParams();
  }

  @Override
  public void updateClippingRect() {
    if (!mRemoveClippedSubviews) {
      return;
    }

    Assertions.assertNotNull(mClippingRect);
    ReactClippingViewGroupHelper.calculateClippingRect(this, mClippingRect);
    if (getParent() != null && mClippingRect.top != mClippingRect.bottom) {
      updateClippingToRect(mClippingRect);
    }
  }

  private void updateClippingToRect(Rect clippingRect) {
    int index = 0;
    boolean needsInvalidate = false;
    for (DrawCommand drawCommand : mDrawCommands) {
      if (drawCommand instanceof DrawView) {
        DrawView drawView = (DrawView) drawCommand;
        FlatViewGroup flatViewGroup = mClippedSubviews.get(drawView.reactTag);
        if (flatViewGroup != null) {
          // invisible
          if (clippingRect.intersects(
              flatViewGroup.getLeft(),
              flatViewGroup.getTop(),
              flatViewGroup.getRight(),
              flatViewGroup.getBottom())) {
            // now on the screen
            attachViewToParent(
                flatViewGroup,
                index++,
                ensureLayoutParams(flatViewGroup.getLayoutParams()));
            mClippedSubviews.remove(flatViewGroup.getId());
            drawView.isViewGroupClipped = false;
            needsInvalidate = true;
          }
        } else {
          // visible
          View view = getChildAt(index++);
          if (view instanceof FlatViewGroup) {
            FlatViewGroup flatChildView = (FlatViewGroup) view;
            Animation animation = flatChildView.getAnimation();
            boolean isAnimating = animation != null && !animation.hasEnded();
            if (!isAnimating &&
                !clippingRect.intersects(
                    view.getLeft(),
                    view.getTop(),
                    view.getRight(),
                    view.getBottom())) {
              // now off the screen
              mClippedSubviews.put(view.getId(), flatChildView);
              detachViewFromParent(view);
              drawView.isViewGroupClipped = true;
              index--;
              needsInvalidate = true;
            }
          }
        }
      }
    }

    if (needsInvalidate) {
      invalidate();
    }
  }

  @Override
  public void getClippingRect(Rect outClippingRect) {
    outClippingRect.set(mClippingRect);
  }

  @Override
  public void setRemoveClippedSubviews(boolean removeClippedSubviews) {
    if (removeClippedSubviews == mRemoveClippedSubviews) {
      return;
    }
    mRemoveClippedSubviews = removeClippedSubviews;
    if (removeClippedSubviews) {
      mClippingRect = new Rect();
      updateClippingRect();
    } else {
      // Add all clipped views back, deallocate additional arrays, remove layoutChangeListener
      Assertions.assertNotNull(mClippingRect);
      getDrawingRect(mClippingRect);
      updateClippingToRect(mClippingRect);
      mClippingRect = null;
    }
  }

  @Override
  public boolean getRemoveClippedSubviews() {
    return mRemoveClippedSubviews;
  }
}
