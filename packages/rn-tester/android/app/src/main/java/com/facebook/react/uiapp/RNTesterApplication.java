/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp;

import android.app.Application;
import android.content.Context;
import androidx.annotation.Nullable;
import com.facebook.fbreact.specs.SampleTurboModule;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.JSIModule;
import com.facebook.react.bridge.JSIModulePackage;
import com.facebook.react.bridge.JSIModuleProvider;
import com.facebook.react.bridge.JSIModuleSpec;
import com.facebook.react.bridge.JSIModuleType;
import com.facebook.react.bridge.JavaScriptContextHolder;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.UIManager;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.fabric.ComponentFactory;
import com.facebook.react.fabric.CoreComponentsRegistry;
import com.facebook.react.fabric.FabricJSIModuleProvider;
import com.facebook.react.fabric.ReactNativeConfig;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.react.turbomodule.core.TurboModuleManager;
import com.facebook.react.views.text.ReactFontManager;
import com.facebook.soloader.SoLoader;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RNTesterApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public String getJSMainModuleName() {
          return "packages/rn-tester/js/RNTesterApp.android";
        }

        @Override
        public String getBundleAssetName() {
          return "RNTesterApp.android.bundle";
        }

        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        public List<ReactPackage> getPackages() {
          return Arrays.<ReactPackage>asList(
              new MainReactPackage(),
              new TurboReactPackage() {
                public NativeModule getModule(
                    final String name, final ReactApplicationContext reactContext) {
                  if (!ReactFeatureFlags.useTurboModules) {
                    return null;
                  }

                  if (SampleTurboModule.NAME.equals(name)) {
                    return new SampleTurboModule(reactContext);
                  }

                  return null;
                }

                // Note: Specialized annotation processor for @ReactModule isn't configured in OSS
                // yet. For now, hardcode this information, though it's not necessary for most
                // modules.
                public ReactModuleInfoProvider getReactModuleInfoProvider() {
                  return new ReactModuleInfoProvider() {
                    public Map<String, ReactModuleInfo> getReactModuleInfos() {
                      final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
                      if (ReactFeatureFlags.useTurboModules) {
                        moduleInfos.put(
                            SampleTurboModule.NAME,
                            new ReactModuleInfo(
                                SampleTurboModule.NAME,
                                "SampleTurboModule",
                                false, // canOverrideExistingModule
                                false, // needsEagerInit
                                true, // hasConstants
                                false, // isCxxModule
                                true // isTurboModule
                                ));
                      }
                      return moduleInfos;
                    }
                  };
                }
              });
        }

        @Nullable
        @Override
        protected JSIModulePackage getJSIModulePackage() {
          if (!BuildConfig.ENABLE_FABRIC && !ReactFeatureFlags.useTurboModules) {
            return null;
          }

          return new JSIModulePackage() {
            @Override
            public List<JSIModuleSpec> getJSIModules(
                final ReactApplicationContext reactApplicationContext,
                final JavaScriptContextHolder jsContext) {
              final List<JSIModuleSpec> specs = new ArrayList<>();

              // Install the new native module system.
              if (ReactFeatureFlags.useTurboModules) {
                specs.add(
                    new JSIModuleSpec() {
                      @Override
                      public JSIModuleType getJSIModuleType() {
                        return JSIModuleType.TurboModuleManager;
                      }

                      @Override
                      public JSIModuleProvider getJSIModuleProvider() {
                        return new JSIModuleProvider() {
                          @Override
                          public JSIModule get() {
                            final ReactInstanceManager reactInstanceManager =
                                getReactInstanceManager();
                            final List<ReactPackage> packages = reactInstanceManager.getPackages();

                            return new TurboModuleManager(
                                jsContext,
                                new RNTesterTurboModuleManagerDelegate(
                                    reactApplicationContext, packages),
                                reactApplicationContext
                                    .getCatalystInstance()
                                    .getJSCallInvokerHolder(),
                                reactApplicationContext
                                    .getCatalystInstance()
                                    .getNativeCallInvokerHolder());
                          }
                        };
                      }
                    });
              }

              // Install the new renderer.
              if (BuildConfig.ENABLE_FABRIC) {
                specs.add(
                    new JSIModuleSpec() {
                      @Override
                      public JSIModuleType getJSIModuleType() {
                        return JSIModuleType.UIManager;
                      }

                      @Override
                      public JSIModuleProvider<UIManager> getJSIModuleProvider() {
                        final ComponentFactory ComponentFactory = new ComponentFactory();
                        CoreComponentsRegistry.register(ComponentFactory);
                        return new FabricJSIModuleProvider(
                            reactApplicationContext,
                            ComponentFactory,
                            // TODO: T71362667 add ReactNativeConfig's support in RNTester
                            new ReactNativeConfig() {
                              @Override
                              public boolean getBool(final String s) {
                                return false;
                              }

                              @Override
                              public int getInt64(final String s) {
                                return 0;
                              }

                              @Override
                              public String getString(final String s) {
                                return "";
                              }

                              @Override
                              public double getDouble(final String s) {
                                return 0;
                              }
                            });
                      }
                    });
              }

              return specs;
            }
          };
        }
      };

  @Override
  public void onCreate() {
    ReactFeatureFlags.useTurboModules = BuildConfig.ENABLE_TURBOMODULE;
    ReactFontManager.getInstance().addCustomFont(this, "Rubik", R.font.rubik);
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   *
   * @param context
   * @param reactInstanceManager
   */
  private static void initializeFlipper(
      final Context context, final ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        final Class<?> aClass = Class.forName("com.facebook.react.uiapp.ReactNativeFlipper");
        aClass
            .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
            .invoke(null, context, reactInstanceManager);
      } catch (final ClassNotFoundException e) {
        e.printStackTrace();
      } catch (final NoSuchMethodException e) {
        e.printStackTrace();
      } catch (final IllegalAccessException e) {
        e.printStackTrace();
      } catch (final InvocationTargetException e) {
        e.printStackTrace();
      }
    }
  }
};
