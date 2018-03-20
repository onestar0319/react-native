/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric;

import static android.view.View.MeasureSpec.AT_MOST;
import static android.view.View.MeasureSpec.EXACTLY;
import static android.view.View.MeasureSpec.UNSPECIFIED;

import android.util.Log;
import android.view.View;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.NativeViewHierarchyManager;
import com.facebook.react.uimanager.ReactRootViewTagGenerator;
import com.facebook.react.uimanager.ReactShadowNode;
import com.facebook.react.uimanager.ReactShadowNodeImpl;
import com.facebook.react.uimanager.ReactStylesDiffMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIViewOperationQueue;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.common.MeasureSpecProvider;
import com.facebook.react.uimanager.common.SizeMonitoringFrameLayout;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;

/**
 * This class is responsible to create, clone and update {@link ReactShadowNode} using the Fabric
 * API.
 */
@SuppressWarnings("unused") // used from JNI
public class FabricUIManager implements UIManager {

  private static final String TAG = FabricUIManager.class.getSimpleName();
  private static final boolean DEBUG = true;
  private final RootShadowNodeRegistry mRootShadowNodeRegistry = new RootShadowNodeRegistry();
  private final ReactApplicationContext mReactApplicationContext;
  private final ViewManagerRegistry mViewManagerRegistry;
  private final UIViewOperationQueue mUIViewOperationQueue;
  private volatile int mCurrentBatch = 0;
  private ReactShadowNode mCurrentRootShadowNode;
  private FabricReconciler mFabricReconciler;

  public FabricUIManager(
      ReactApplicationContext reactContext, ViewManagerRegistry viewManagerRegistry) {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(reactContext);
    mReactApplicationContext = reactContext;
    mViewManagerRegistry = viewManagerRegistry;
    mUIViewOperationQueue =
        new UIViewOperationQueue(
            reactContext, new NativeViewHierarchyManager(viewManagerRegistry), 0);
    mFabricReconciler = new FabricReconciler(mUIViewOperationQueue);
  }

  /** Creates a new {@link ReactShadowNode} */
  @Nullable
  public ReactShadowNode createNode(
      int reactTag, String viewName, int rootTag, ReadableNativeMap props) {
    try {
      ViewManager viewManager = mViewManagerRegistry.get(viewName);
      ReactShadowNode node = viewManager.createShadowNodeInstance(mReactApplicationContext);
      ReactShadowNode rootNode = getRootNode(rootTag);
      node.setRootNode(rootNode);
      node.setViewClassName(viewName);
      node.setReactTag(reactTag);
      node.setThemedContext(rootNode.getThemedContext());

      ReactStylesDiffMap styles = updateProps(node, props);

      if (!node.isVirtual()) {
        mUIViewOperationQueue.enqueueCreateView(
            rootNode.getThemedContext(), reactTag, viewName, styles);
      }
      return node;
    } catch (Throwable t) {
      handleException(getRootNode(rootTag), t);
      return null;
    }
  }

  private ReactShadowNode getRootNode(int rootTag) {
    return mRootShadowNodeRegistry.getNode(rootTag);
  }

  private ReactStylesDiffMap updateProps(ReactShadowNode node, @Nullable ReadableNativeMap props) {
    ReactStylesDiffMap styles = null;
    if (props != null) {
      styles = new ReactStylesDiffMap(props);
      node.updateProperties(styles);
    }
    return styles;
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   *     ReactShadowNode will contain a copy of all the internal data of the original node,
   *     including its children set (note that the children nodes will not be cloned).
   */
  @Nullable
  public ReactShadowNode cloneNode(ReactShadowNode node) {
    try {
      ReactShadowNode clone = node.mutableCopy();
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   *     ReactShadowNode will contain a copy of all the internal data of the original node, but its
   *     children set will be empty.
   */
  @Nullable
  public ReactShadowNode cloneNodeWithNewChildren(ReactShadowNode node) {
    try {
      ReactShadowNode clone = node.mutableCopyWithNewChildren();
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   *     ReactShadowNode will contain a copy of all the internal data of the original node, but its
   *     props will be overridden with the {@link ReadableMap} received by parameter.
   */
  @Nullable
  public ReactShadowNode cloneNodeWithNewProps(
      ReactShadowNode node, @Nullable ReadableNativeMap newProps) {
    try {
      ReactShadowNode clone =
          node.mutableCopyWithNewProps(newProps == null ? null : new ReactStylesDiffMap(newProps));
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
  }

  /**
   * @return a clone of the {@link ReactShadowNode} received by parameter. The cloned
   *     ReactShadowNode will contain a copy of all the internal data of the original node, but its
   *     props will be overridden with the {@link ReadableMap} received by parameter and its
   *     children set will be empty.
   */
  @Nullable
  public ReactShadowNode cloneNodeWithNewChildrenAndProps(
      ReactShadowNode node, ReadableNativeMap newProps) {
    try {
      ReactShadowNode clone =
          node.mutableCopyWithNewChildrenAndProps(
              newProps == null ? null : new ReactStylesDiffMap(newProps));
      assertReactShadowNodeCopy(node, clone);
      return clone;
    } catch (Throwable t) {
      handleException(node, t);
      return null;
    }
  }

  private void assertReactShadowNodeCopy(ReactShadowNode source, ReactShadowNode target) {
    Assertions.assertCondition(
        source.getClass().equals(target.getClass()),
        "Found "
            + target.getClass()
            + " class when expecting: "
            + source.getClass()
            + ". Check that "
            + source.getClass()
            + " implements the copy() method correctly.");
  }

  /**
   * Appends the child {@link ReactShadowNode} to the children set of the parent {@link
   * ReactShadowNode}.
   */
  @Nullable
  public void appendChild(ReactShadowNode parent, ReactShadowNode child) {
    try {
      parent.addChildAt(child, parent.getChildCount());
    } catch (Throwable t) {
      handleException(parent, t);
    }
  }

  /**
   * @return an empty {@link List<ReactShadowNode>} that will be used to append the {@link
   *     ReactShadowNode} elements of the root. Typically this List will contain one element.
   */
  public List<ReactShadowNode> createChildSet(int rootTag) {
    return new ArrayList<>(1);
  }

  /**
   * Adds the {@link ReactShadowNode} to the {@link List<ReactShadowNode>} received by parameter.
   */
  public void appendChildToSet(List<ReactShadowNode> childList, ReactShadowNode child) {
    childList.add(child);
  }

  public synchronized void completeRoot(int rootTag, List<ReactShadowNode> childList) {
    try {
      ReactShadowNode rootNode = getRootNode(rootTag);
      Assertions.assertNotNull(
          rootNode,
          "Root view with tag " + rootTag + " must be added before completeRoot is called");


      rootNode = calculateDiffingAndCreateNewRootNode(rootNode, childList);

      if (DEBUG) {
        Log.d(TAG, "ReactShadowNodeHierarchy after diffing: " + rootNode.getHierarchyInfo());
      }

      notifyOnBeforeLayoutRecursive(rootNode);
      rootNode.calculateLayout();

      if (DEBUG) {
        Log.d(
          TAG,
          "ReactShadowNodeHierarchy after calculate Layout: " + rootNode.getHierarchyInfo());
      }

      applyUpdatesRecursive(rootNode, 0, 0);
      mUIViewOperationQueue.dispatchViewUpdates(
        mCurrentBatch++, System.currentTimeMillis(), System.currentTimeMillis());

      mCurrentRootShadowNode = rootNode;
    } catch (Exception e) {
      handleException(getRootNode(rootTag), e);
    }
  }

  private void notifyOnBeforeLayoutRecursive(ReactShadowNode node) {
    if (!node.hasUpdates()) {
      return;
    }
    for (int i = 0; i < node.getChildCount(); i++) {
      notifyOnBeforeLayoutRecursive(node.getChildAt(i));
    }
    node.onBeforeLayout();
  }

  private ReactShadowNode calculateDiffingAndCreateNewRootNode(
    ReactShadowNode currentRootShadowNode, List<ReactShadowNode> newChildList) {
    ReactShadowNode newRootShadowNode = currentRootShadowNode.mutableCopyWithNewChildren();
    for (ReactShadowNode child : newChildList) {
      appendChild(newRootShadowNode, child);
    }

    mFabricReconciler.manageChildren(mCurrentRootShadowNode, newRootShadowNode);
    return newRootShadowNode;
  }

  private void applyUpdatesRecursive(ReactShadowNode node, float absoluteX, float absoluteY) {
    if (!node.hasUpdates()) {
      return;
    }

    if (!node.isVirtualAnchor()) {
      for (int i = 0; i < node.getChildCount(); i++) {
        applyUpdatesRecursive(
            node.getChildAt(i),
            absoluteX + node.getLayoutX(),
            absoluteY + node.getLayoutY());
      }
    }

    int tag = node.getReactTag();
    if (mRootShadowNodeRegistry.getNode(tag) == null) {
      boolean frameDidChange =
          node.dispatchUpdates(absoluteX, absoluteY, mUIViewOperationQueue, null);
    }
    node.markUpdateSeen();
  }

  @Override
  public <T extends SizeMonitoringFrameLayout & MeasureSpecProvider> int addRootView(
      final T rootView) {
    int rootTag = ReactRootViewTagGenerator.getNextRootViewTag();
    ThemedReactContext themedRootContext =
        new ThemedReactContext(mReactApplicationContext, rootView.getContext());

    ReactShadowNode rootShadowNode = createRootShadowNode(rootTag, themedRootContext);

    int widthMeasureSpec = rootView.getWidthMeasureSpec();
    int heightMeasureSpec = rootView.getHeightMeasureSpec();
    updateRootView(rootShadowNode, widthMeasureSpec, heightMeasureSpec);

    mRootShadowNodeRegistry.addNode(rootShadowNode);
    mUIViewOperationQueue.addRootView(rootTag, rootView, themedRootContext);
    return rootTag;
  }

  public void removeRootView(int rootTag) {
    mRootShadowNodeRegistry.removeNode(rootTag);
  }

  private ReactShadowNode createRootShadowNode(int rootTag, ThemedReactContext themedReactContext) {
    ReactShadowNode rootNode = new ReactShadowNodeImpl();
    I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();
    // TODO: setLayoutDirection for the rootNode
    rootNode.setViewClassName("Root");
    rootNode.setReactTag(rootTag);
    rootNode.setThemedContext(themedReactContext);
    return rootNode;
  }

  /**
   * Updates the styles of the {@link ReactShadowNode} based on the Measure specs received by
   * parameters.
   */
  public void updateRootView(
      ReactShadowNode node, int widthMeasureSpec, int heightMeasureSpec) {
    int widthMode = View.MeasureSpec.getMode(widthMeasureSpec);
    int widthSize = View.MeasureSpec.getSize(widthMeasureSpec);
    switch (widthMode) {
      case EXACTLY:
        node.setStyleWidth(widthSize);
        break;
      case AT_MOST:
        node.setStyleMaxWidth(widthSize);
        break;
      case UNSPECIFIED:
        node.setStyleWidthAuto();
        break;
    }

    int heightMode = View.MeasureSpec.getMode(heightMeasureSpec);
    int heightSize = View.MeasureSpec.getSize(heightMeasureSpec);
    switch (heightMode) {
      case EXACTLY:
        node.setStyleHeight(heightSize);
        break;
      case AT_MOST:
        node.setStyleMaxHeight(heightSize);
        break;
      case UNSPECIFIED:
        node.setStyleHeightAuto();
        break;
    }
  }

  private void handleException(ReactShadowNode node, Throwable t) {
    try {
      ThemedReactContext context = node.getThemedContext();
      // TODO move exception management to JNI side, and refactor to avoid wrapping Throwable into
      // a RuntimeException
      context.handleException(new RuntimeException(t));
    } catch (Exception ex) {
      Log.e(TAG, "Exception while executing a Fabric method", t);
      throw new RuntimeException(ex.getMessage(), t);
    }
  }
}
