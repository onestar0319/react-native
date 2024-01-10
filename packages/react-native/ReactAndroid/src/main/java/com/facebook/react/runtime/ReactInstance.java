/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import android.content.res.AssetManager;
import android.view.View;
import com.facebook.common.logging.FLog;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.infer.annotation.ThreadConfined;
import com.facebook.infer.annotation.ThreadSafe;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.ReactPackage;
import com.facebook.react.ViewManagerOnDemandReactPackage;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.JSBundleLoader;
import com.facebook.react.bridge.JSBundleLoaderDelegate;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.NativeArray;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactNoCrashSoftException;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.RuntimeExecutor;
import com.facebook.react.bridge.RuntimeScheduler;
import com.facebook.react.bridge.queue.MessageQueueThread;
import com.facebook.react.bridge.queue.MessageQueueThreadSpec;
import com.facebook.react.bridge.queue.QueueThreadExceptionHandler;
import com.facebook.react.bridge.queue.ReactQueueConfiguration;
import com.facebook.react.bridge.queue.ReactQueueConfigurationImpl;
import com.facebook.react.bridge.queue.ReactQueueConfigurationSpec;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.fabric.Binding;
import com.facebook.react.fabric.BindingImpl;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.react.fabric.FabricUIManager;
import com.facebook.react.fabric.ReactNativeConfig;
import com.facebook.react.fabric.events.EventBeatManager;
import com.facebook.react.interfaces.exceptionmanager.ReactJsExceptionHandler;
import com.facebook.react.internal.AndroidChoreographerProvider;
import com.facebook.react.internal.turbomodule.core.CallInvokerHolderImpl;
import com.facebook.react.internal.turbomodule.core.NativeMethodCallInvokerHolderImpl;
import com.facebook.react.internal.turbomodule.core.TurboModuleManager;
import com.facebook.react.internal.turbomodule.core.TurboModuleManagerDelegate;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.JavaTimerManager;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.uimanager.ComponentNameResolver;
import com.facebook.react.uimanager.ComponentNameResolverManager;
import com.facebook.react.uimanager.DisplayMetricsHolder;
import com.facebook.react.uimanager.IllegalViewOperationException;
import com.facebook.react.uimanager.UIConstantsProviderManager;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.UIManagerModuleConstantsHelper;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.uimanager.ViewManagerRegistry;
import com.facebook.react.uimanager.ViewManagerResolver;
import com.facebook.react.uimanager.events.EventDispatcher;
import com.facebook.soloader.SoLoader;
import com.facebook.systrace.Systrace;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.Nullable;

/**
 * An experimental replacement for {@link com.facebook.react.ReactInstanceManager} responsible for
 * creating and managing a React Native instance
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
@ThreadSafe
final class ReactInstance {

  private static final String TAG = ReactInstance.class.getSimpleName();

  @DoNotStrip private final HybridData mHybridData;

  private final ReactHostDelegate mDelegate;
  private final BridgelessReactContext mBridgelessReactContext;
  private final List<ReactPackage> mReactPackages;

  private final ReactQueueConfiguration mQueueConfiguration;
  private final TurboModuleManager mTurboModuleManager;
  private final FabricUIManager mFabricUIManager;
  private final JavaTimerManager mJavaTimerManager;
  private final BridgelessViewManagerResolver mViewManagerResolver;

  @DoNotStrip @Nullable private ComponentNameResolverManager mComponentNameResolverManager;
  @DoNotStrip @Nullable private UIConstantsProviderManager mUIConstantsProviderManager;

  static {
    loadLibraryIfNeeded();
  }

  private static volatile boolean sIsLibraryLoaded;

  /* package */ ReactInstance(
      BridgelessReactContext bridgelessReactContext,
      ReactHostDelegate delegate,
      ComponentFactory componentFactory,
      DevSupportManager devSupportManager,
      QueueThreadExceptionHandler exceptionHandler,
      ReactJsExceptionHandler reactExceptionManager,
      boolean useDevSupport) {
    mBridgelessReactContext = bridgelessReactContext;
    mDelegate = delegate;

    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.initialize");

    /**
     * Prepare the ReactInstance by installing JSI bindings, initializing Fabric + TurboModules, and
     * loading the JS bundle.
     */
    MessageQueueThreadSpec nativeModulesSpec =
        MessageQueueThreadSpec.newBackgroundThreadSpec("v_native");
    ReactQueueConfigurationSpec spec =
        ReactQueueConfigurationSpec.builder()
            .setJSQueueThreadSpec(MessageQueueThreadSpec.newBackgroundThreadSpec("v_js"))
            .setNativeModulesQueueThreadSpec(nativeModulesSpec)
            .build();
    mQueueConfiguration = ReactQueueConfigurationImpl.create(spec, exceptionHandler);
    FLog.d(TAG, "Calling initializeMessageQueueThreads()");
    mBridgelessReactContext.initializeMessageQueueThreads(mQueueConfiguration);
    MessageQueueThread jsMessageQueueThread = mQueueConfiguration.getJSQueueThread();
    MessageQueueThread nativeModulesMessageQueueThread =
        mQueueConfiguration.getNativeModulesQueueThread();

    ReactChoreographer.initialize(AndroidChoreographerProvider.getInstance());
    if (useDevSupport) {
      devSupportManager.startInspector();
    }
    JSTimerExecutor jsTimerExecutor = createJSTimerExecutor();
    mJavaTimerManager =
        new JavaTimerManager(
            mBridgelessReactContext,
            jsTimerExecutor,
            ReactChoreographer.getInstance(),
            devSupportManager);

    mBridgelessReactContext.addLifecycleEventListener(
        new LifecycleEventListener() {
          @Override
          public void onHostResume() {
            mJavaTimerManager.onHostResume();
          }

          @Override
          public void onHostPause() {
            mJavaTimerManager.onHostPause();
          }

          @Override
          public void onHostDestroy() {
            mJavaTimerManager.onHostDestroy();
          }
        });

    JSRuntimeFactory jsRuntimeFactory = mDelegate.getJsRuntimeFactory();
    BindingsInstaller bindingsInstaller = mDelegate.getBindingsInstaller();
    // Notify JS if profiling is enabled
    boolean isProfiling =
        Systrace.isTracing(Systrace.TRACE_TAG_REACT_APPS | Systrace.TRACE_TAG_REACT_JS_VM_CALLS);
    // TODO(T166383606): Remove this parameter when we remove the legacy runtime scheduler or we
    // have access to ReactNativeConfig before we initialize it.
    boolean useModernRuntimeScheduler = ReactFeatureFlags.useModernRuntimeScheduler;
    mHybridData =
        initHybrid(
            jsRuntimeFactory,
            jsMessageQueueThread,
            nativeModulesMessageQueueThread,
            mJavaTimerManager,
            jsTimerExecutor,
            reactExceptionManager,
            bindingsInstaller,
            isProfiling,
            useModernRuntimeScheduler);

    // Set up TurboModules
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.initialize#initTurboModules");

    mReactPackages = new ArrayList<>();
    mReactPackages.add(
        new CoreReactPackage(
            bridgelessReactContext.getDevSupportManager(),
            bridgelessReactContext.getDefaultHardwareBackBtnHandler()));
    mReactPackages.addAll(mDelegate.getReactPackages());

    TurboModuleManagerDelegate turboModuleManagerDelegate =
        mDelegate
            .getTurboModuleManagerDelegateBuilder()
            .setPackages(mReactPackages)
            .setReactApplicationContext(mBridgelessReactContext)
            .build();

    RuntimeExecutor unbufferedRuntimeExecutor = getUnbufferedRuntimeExecutor();
    mTurboModuleManager =
        new TurboModuleManager(
            // Use unbuffered RuntimeExecutor to install binding
            unbufferedRuntimeExecutor,
            turboModuleManagerDelegate,
            getJSCallInvokerHolder(),
            getNativeMethodCallInvokerHolder());

    // Eagerly initialize TurboModules
    for (String moduleName : mTurboModuleManager.getEagerInitModuleNames()) {
      mTurboModuleManager.getModule(moduleName);
    }

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);

    // Set up Fabric
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.initialize#initFabric");

    mViewManagerResolver =
        new BridgelessViewManagerResolver(mReactPackages, mBridgelessReactContext);

    // Initialize function for JS's UIManager.hasViewManagerConfig()
    mComponentNameResolverManager =
        new ComponentNameResolverManager(
            // Use unbuffered RuntimeExecutor to install binding
            unbufferedRuntimeExecutor,
            (ComponentNameResolver)
                () -> {
                  Collection<String> viewManagerNames = mViewManagerResolver.getViewManagerNames();
                  if (viewManagerNames.size() < 1) {
                    FLog.e(TAG, "No ViewManager names found");
                    return new String[0];
                  }
                  return viewManagerNames.toArray(new String[0]);
                });

    // Initialize function for JS's UIManager.getViewManagerConfig()
    // It should come after getTurboModuleManagerDelegate as it relies on react packages being
    // initialized.
    // This happens inside getTurboModuleManagerDelegate getter.
    if (ReactFeatureFlags.useNativeViewConfigsInBridgelessMode) {
      Map<String, Object> customDirectEvents = new HashMap<>();

      mUIConstantsProviderManager =
          new UIConstantsProviderManager(
              // Use unbuffered RuntimeExecutor to install binding
              unbufferedRuntimeExecutor,
              // Here we are construncting the return value for UIManager.getConstants call.
              // The old architectre relied on the constatnts struct to contain:
              // 1. Eagerly loaded view configs for all native components.
              // 2. genericBubblingEventTypes.
              // 3. genericDirectEventTypes.
              // We want to match this beahavior.
              () -> {
                return (NativeMap)
                    Arguments.makeNativeMap(
                        UIManagerModuleConstantsHelper.getDefaultExportableEventTypes());
              },
              (String viewManagerName) -> {
                ViewManager viewManager = mViewManagerResolver.getViewManager(viewManagerName);
                if (viewManager == null) {
                  return null;
                }
                return (NativeMap)
                    UIManagerModule.getConstantsForViewManager(viewManager, customDirectEvents);
              },
              () -> {
                List<ViewManager> viewManagers =
                    new ArrayList<ViewManager>(
                        mViewManagerResolver.getEagerViewManagerMap().values());

                Map<String, Object> constants =
                    UIManagerModule.createConstants(viewManagers, null, customDirectEvents);

                Collection<String> lazyViewManagers =
                    mViewManagerResolver.getLazyViewManagerNames();
                if (lazyViewManagers.size() > 0) {
                  constants.put("ViewManagerNames", new ArrayList<>(lazyViewManagers));
                  constants.put("LazyViewManagersEnabled", true);
                }

                return Arguments.makeNativeMap(constants);
              });
    }

    EventBeatManager eventBeatManager = new EventBeatManager();
    mFabricUIManager =
        new FabricUIManager(
            mBridgelessReactContext,
            new ViewManagerRegistry(mViewManagerResolver),
            eventBeatManager);

    ReactNativeConfig config = mDelegate.getReactNativeConfig();

    // Misc initialization that needs to be done before Fabric init
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(mBridgelessReactContext);

    Binding binding = new BindingImpl();
    binding.register(
        getBufferedRuntimeExecutor(),
        getRuntimeScheduler(),
        mFabricUIManager,
        eventBeatManager,
        componentFactory,
        config);
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);

    // Initialize the FabricUIManager
    mFabricUIManager.initialize();
  }

  private static synchronized void loadLibraryIfNeeded() {
    if (!sIsLibraryLoaded) {
      SoLoader.loadLibrary("rninstance");
      sIsLibraryLoaded = true;
    }
  }

  public ReactQueueConfiguration getReactQueueConfiguration() {
    return mQueueConfiguration;
  }

  public void loadJSBundle(JSBundleLoader bundleLoader) {
    // Load the JS bundle
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.loadJSBundle");
    bundleLoader.loadScript(
        new JSBundleLoaderDelegate() {
          @Override
          public void loadScriptFromFile(
              String fileName, String sourceURL, boolean loadSynchronously) {
            mBridgelessReactContext.setSourceURL(sourceURL);
            loadJSBundleFromFile(fileName, sourceURL);
          }

          @Override
          public void loadSplitBundleFromFile(String fileName, String sourceURL) {
            loadJSBundleFromFile(fileName, sourceURL);
          }

          @Override
          public void loadScriptFromAssets(
              AssetManager assetManager, String assetURL, boolean loadSynchronously) {
            mBridgelessReactContext.setSourceURL(assetURL);
            loadJSBundleFromAssets(assetManager, assetURL);
          }

          @Override
          public void setSourceURLs(String deviceURL, String remoteURL) {
            mBridgelessReactContext.setSourceURL(deviceURL);
          }
        });
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  public <T extends NativeModule> boolean hasNativeModule(Class<T> nativeModuleInterface) {
    ReactModule annotation = nativeModuleInterface.getAnnotation(ReactModule.class);
    if (annotation != null) {
      return mTurboModuleManager.hasModule(annotation.name());
    }
    return false;
  }

  public Collection<NativeModule> getNativeModules() {
    return new ArrayList<>(mTurboModuleManager.getModules());
  }

  public @Nullable <T extends NativeModule> T getNativeModule(Class<T> nativeModuleInterface) {
    ReactModule annotation = nativeModuleInterface.getAnnotation(ReactModule.class);
    if (annotation != null) {
      return (T) getNativeModule(annotation.name());
    }
    return null;
  }

  public @Nullable NativeModule getNativeModule(String nativeModuleName) {
    synchronized (mTurboModuleManager) {
      return mTurboModuleManager.getModule(nativeModuleName);
    }
  }

  /* package */ void prerenderSurface(ReactSurfaceImpl surface) {
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.prerenderSurface");
    FLog.d(TAG, "call prerenderSurface with surface: " + surface.getModuleName());
    mFabricUIManager.startSurface(surface.getSurfaceHandler(), surface.getContext(), null);
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  /**
   * Renders a React Native surface.
   *
   * @param surface The {@link ReactSurface} to render.
   */
  @ThreadConfined("ReactHost")
  /* package */ void startSurface(ReactSurfaceImpl surface) {
    FLog.d(TAG, "startSurface() is called with surface: " + surface.getSurfaceID());
    Systrace.beginSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "ReactInstance.startSurface");

    View view = surface.getView();
    if (view == null) {
      throw new IllegalStateException(
          "Starting surface without a view is not supported, use prerenderSurface instead.");
    }

    /*
     This is a temporary mitigation for 646912b2590a6d5e760316cc064d1e27,
     <p>TODO T83828172 investigate why surface.getView() has id NOT equal to View.NO_ID
    */
    if (view.getId() != View.NO_ID) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new IllegalViewOperationException(
              "surfaceView's is NOT equal to View.NO_ID before calling startSurface."));
      view.setId(View.NO_ID);
    }
    if (surface.isRunning()) {
      // surface was initialized beforehand, only attaching view
      mFabricUIManager.attachRootView(surface.getSurfaceHandler(), view);
    } else {
      mFabricUIManager.startSurface(surface.getSurfaceHandler(), surface.getContext(), view);
    }
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE);
  }

  @ThreadConfined("ReactHost")
  /* package */ void stopSurface(ReactSurfaceImpl surface) {
    FLog.d(TAG, "stopSurface() is called with surface: " + surface.getSurfaceID());
    mFabricUIManager.stopSurface(surface.getSurfaceHandler());
  }

  /* --- Lifecycle methods --- */
  @ThreadConfined("ReactHost")
  /* package */ void destroy() {
    FLog.d(TAG, "ReactInstance.destroy() is called.");
    mQueueConfiguration.destroy();
    mTurboModuleManager.invalidate();
    mFabricUIManager.invalidate();
    mHybridData.resetNative();
    mComponentNameResolverManager = null;
    mUIConstantsProviderManager = null;
  }

  /* --- Native methods --- */

  @DoNotStrip
  private native HybridData initHybrid(
      JSRuntimeFactory jsRuntimeFactory,
      MessageQueueThread jsMessageQueueThread,
      MessageQueueThread nativeModulesMessageQueueThread,
      JavaTimerManager timerManager,
      JSTimerExecutor jsTimerExecutor,
      ReactJsExceptionHandler jReactExceptionsManager,
      @Nullable BindingsInstaller jBindingsInstaller,
      boolean isProfiling,
      boolean useModernRuntimeScheduler);

  @DoNotStrip
  private static native JSTimerExecutor createJSTimerExecutor();

  @DoNotStrip
  private native void installGlobals(boolean isProfiling);

  private native void loadJSBundleFromFile(String fileName, String sourceURL);

  private native void loadJSBundleFromAssets(AssetManager assetManager, String assetURL);

  private native CallInvokerHolderImpl getJSCallInvokerHolder();

  private native NativeMethodCallInvokerHolderImpl getNativeMethodCallInvokerHolder();

  private native RuntimeExecutor getUnbufferedRuntimeExecutor();

  private native RuntimeExecutor getBufferedRuntimeExecutor();

  private native RuntimeScheduler getRuntimeScheduler();

  /* package */ native void callFunctionOnModule(
      String moduleName, String methodName, NativeArray args);

  private native void registerSegmentNative(int segmentId, String segmentPath);

  private native void handleMemoryPressureJs(int pressureLevel);

  public void handleMemoryPressure(int level) {
    try {
      handleMemoryPressureJs(level);
    } catch (NullPointerException e) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          new ReactNoCrashSoftException(
              "Native method handleMemoryPressureJs is called earlier than librninstance.so got ready."));
    }
  }

  /**
   * @return The {@link EventDispatcher} used by {@link FabricUIManager} to emit UI events to JS.
   */
  /* package */ EventDispatcher getEventDispatcher() {
    return mFabricUIManager.getEventDispatcher();
  }

  /** @return The {@link FabricUIManager} if it's been initialized. */
  /* package */ FabricUIManager getUIManager() {
    return mFabricUIManager;
  }

  public void registerSegment(int segmentId, String path) {
    registerSegmentNative(segmentId, path);
  }

  private static class BridgelessViewManagerResolver implements ViewManagerResolver {
    private List<ReactPackage> mReactPackages;
    private BridgelessReactContext mBridgelessReactContext;
    private Map<String, ViewManager> mLazyViewManagerMap = new HashMap<>();
    private @Nullable Map<String, ViewManager> mEagerViewManagerMap = null;

    public BridgelessViewManagerResolver(
        List<ReactPackage> reactPackages, BridgelessReactContext context) {
      mReactPackages = reactPackages;
      mBridgelessReactContext = context;
    }

    @Override
    public synchronized @Nullable ViewManager getViewManager(String viewManagerName) {
      ViewManager viewManager = getLazyViewManager(viewManagerName);
      if (viewManager != null) {
        return viewManager;
      }

      // Once a view manager is not found in all react packages via lazy loading, fall back to
      // default implementation: eagerly initialize all view managers
      return getEagerViewManagerMap().get(viewManagerName);
    }

    @Override
    public synchronized Collection<String> getViewManagerNames() {
      Set<String> allViewManagerNames = new HashSet<>();
      allViewManagerNames.addAll(getLazyViewManagerNames());
      allViewManagerNames.addAll(getEagerViewManagerMap().keySet());
      return allViewManagerNames;
    }

    public synchronized Map<String, ViewManager> getEagerViewManagerMap() {
      if (mEagerViewManagerMap != null) {
        return mEagerViewManagerMap;
      }

      Map<String, ViewManager> viewManagerMap = new HashMap<>();
      for (ReactPackage reactPackage : mReactPackages) {
        if (reactPackage instanceof ViewManagerOnDemandReactPackage) {
          continue;
        }

        List<ViewManager> viewManagersInPackage =
            reactPackage.createViewManagers(mBridgelessReactContext);
        for (ViewManager viewManager : viewManagersInPackage) {
          // TODO(T173624687): Should we throw/warn when the same view manager name is registered
          // twice?
          viewManagerMap.put(viewManager.getName(), viewManager);
        }
      }

      mEagerViewManagerMap = viewManagerMap;
      return mEagerViewManagerMap;
    }

    private @Nullable ViewManager getLazyViewManager(String viewManagerName) {
      if (mLazyViewManagerMap.containsKey(viewManagerName)) {
        return mLazyViewManagerMap.get(viewManagerName);
      }

      for (ReactPackage reactPackage : mReactPackages) {
        if (reactPackage instanceof ViewManagerOnDemandReactPackage) {
          ViewManager viewManager =
              ((ViewManagerOnDemandReactPackage) reactPackage)
                  .createViewManager(mBridgelessReactContext, viewManagerName);
          if (viewManager != null) {
            // TODO(T173624687): Should we throw/warn when the same view manager name is registered
            // twice?
            mLazyViewManagerMap.put(viewManagerName, viewManager);
            return viewManager;
          }
        }
      }

      return null;
    }

    public synchronized Collection<String> getLazyViewManagerNames() {
      Set<String> uniqueNames = new HashSet<>();
      for (ReactPackage reactPackage : mReactPackages) {
        if (reactPackage instanceof ViewManagerOnDemandReactPackage) {
          Collection<String> names =
              ((ViewManagerOnDemandReactPackage) reactPackage)
                  .getViewManagerNames(mBridgelessReactContext);
          if (names != null) {
            uniqueNames.addAll(names);
          }
        }
      }
      return uniqueNames;
    }
  }
}
