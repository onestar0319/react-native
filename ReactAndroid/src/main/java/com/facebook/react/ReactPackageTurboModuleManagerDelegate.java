/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.CxxModuleWrapper;
import com.facebook.react.bridge.ModuleSpec;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.config.ReactFeatureFlags;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.turbomodule.core.TurboModuleManagerDelegate;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.inject.Provider;

public abstract class ReactPackageTurboModuleManagerDelegate extends TurboModuleManagerDelegate {
  interface ModuleProvider {
    @Nullable
    NativeModule getModule(String moduleName);
  }

  private final List<ModuleProvider> mModuleProviders = new ArrayList<>();
  private final Map<ModuleProvider, Map<String, ReactModuleInfo>> mPackageModuleInfos =
      new HashMap<>();

  private static boolean shouldSupportLegacyPackages() {
    return ReactFeatureFlags.enableBridgelessArchitecture
        && ReactFeatureFlags.unstable_useTurboModuleInterop;
  }

  protected ReactPackageTurboModuleManagerDelegate(
      ReactApplicationContext reactApplicationContext, List<ReactPackage> packages) {
    super();
    for (ReactPackage reactPackage : packages) {
      if (reactPackage instanceof TurboReactPackage) {
        final TurboReactPackage turboPkg = (TurboReactPackage) reactPackage;
        final ModuleProvider moduleProvider =
            new ModuleProvider() {
              public NativeModule getModule(String moduleName) {
                return turboPkg.getModule(moduleName, reactApplicationContext);
              }
            };
        mModuleProviders.add(moduleProvider);
        mPackageModuleInfos.put(
            moduleProvider, turboPkg.getReactModuleInfoProvider().getReactModuleInfos());
        continue;
      }

      if (shouldSupportLegacyPackages() && reactPackage instanceof LazyReactPackage) {
        // TODO(T145105887): Output warnings that LazyReactPackage was used
        final LazyReactPackage lazyPkg = ((LazyReactPackage) reactPackage);
        final List<ModuleSpec> moduleSpecs = lazyPkg.getNativeModules(reactApplicationContext);
        final Map<String, Provider<? extends NativeModule>> moduleSpecProviderMap = new HashMap<>();
        for (final ModuleSpec moduleSpec : moduleSpecs) {
          moduleSpecProviderMap.put(moduleSpec.getName(), moduleSpec.getProvider());
        }

        final ModuleProvider moduleProvider =
            (name) -> {
              Provider<? extends NativeModule> provider = moduleSpecProviderMap.get(name);
              return provider != null ? provider.get() : null;
            };

        mModuleProviders.add(moduleProvider);
        mPackageModuleInfos.put(
            moduleProvider, lazyPkg.getReactModuleInfoProvider().getReactModuleInfos());
        continue;
      }
    }
  }

  @Nullable
  @Override
  public TurboModule getModule(String moduleName) {
    TurboModule module = resolveModule(moduleName);
    if (module == null) {
      return null;
    }

    if (module instanceof CxxModuleWrapper) {
      return null;
    }

    return module;
  }

  @Nullable
  @Override
  @DoNotStrip
  public CxxModuleWrapper getLegacyCxxModule(String moduleName) {
    TurboModule module = resolveModule(moduleName);
    if (module == null) {
      return null;
    }

    if (!(module instanceof CxxModuleWrapper)) {
      return null;
    }

    return (CxxModuleWrapper) module;
  }

  @Nullable
  private TurboModule resolveModule(String moduleName) {
    NativeModule resolvedModule = null;

    for (final ModuleProvider moduleProvider : mModuleProviders) {
      try {
        final ReactModuleInfo moduleInfo = mPackageModuleInfos.get(moduleProvider).get(moduleName);
        if (moduleInfo == null
            || !moduleInfo.isTurboModule()
            || resolvedModule != null && !moduleInfo.canOverrideExistingModule()) {
          continue;
        }

        final NativeModule module = moduleProvider.getModule(moduleName);
        if (module != null) {
          resolvedModule = module;
        }
      } catch (IllegalArgumentException ex) {
        /**
         * TurboReactPackages can throw an IllegalArgumentException when a module isn't found. If
         * this happens, it's safe to ignore the exception because a later TurboReactPackage could
         * provide the module.
         */
      }
    }

    if (resolvedModule instanceof TurboModule) {
      return (TurboModule) resolvedModule;
    }

    return null;
  }

  @Override
  public List<String> getEagerInitModuleNames() {
    List<String> moduleNames = new ArrayList<>();
    for (final ModuleProvider moduleProvider : mModuleProviders) {
      for (final ReactModuleInfo moduleInfo : mPackageModuleInfos.get(moduleProvider).values()) {
        if (moduleInfo.isTurboModule() && moduleInfo.needsEagerInit()) {
          moduleNames.add(moduleInfo.name());
        }
      }
    }
    return moduleNames;
  }

  public abstract static class Builder {
    private @Nullable List<ReactPackage> mPackages;
    private @Nullable ReactApplicationContext mContext;

    public Builder setPackages(List<ReactPackage> packages) {
      mPackages = new ArrayList<>(packages);
      return this;
    }

    public Builder setReactApplicationContext(ReactApplicationContext context) {
      mContext = context;
      return this;
    }

    protected abstract ReactPackageTurboModuleManagerDelegate build(
        ReactApplicationContext context, List<ReactPackage> packages);

    public ReactPackageTurboModuleManagerDelegate build() {
      Assertions.assertNotNull(
          mContext,
          "The ReactApplicationContext must be provided to create ReactPackageTurboModuleManagerDelegate");
      Assertions.assertNotNull(
          mPackages,
          "A set of ReactPackages must be provided to create ReactPackageTurboModuleManagerDelegate");
      return build(mContext, mPackages);
    }
  }
}
