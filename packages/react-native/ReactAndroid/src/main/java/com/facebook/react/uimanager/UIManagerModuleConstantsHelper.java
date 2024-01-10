/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import androidx.annotation.Nullable;
import androidx.annotation.VisibleForTesting;
import com.facebook.common.logging.FLog;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.build.ReactBuildConfig;
import com.facebook.react.config.ReactFeatureFlags;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Helps generate constants map for {@link UIManagerModule} by collecting and merging constants from
 * registered view managers.
 */
public class UIManagerModuleConstantsHelper {
  private static final String TAG = "UIManagerModuleConstantsHelper";
  private static final String BUBBLING_EVENTS_KEY = "bubblingEventTypes";
  private static final String DIRECT_EVENTS_KEY = "directEventTypes";

  /**
   * Generates a lazy discovery enabled version of {@link UIManagerModule} constants. It only
   * contains a list of view manager names, so that JS side is aware of the managers there are.
   * Actual ViewManager instantiation happens when {@code
   * UIManager.getViewManagerConfig('SpecificViewManager')} call happens. The View Manager is then
   * registered on the JS side with the help of {@code UIManagerModule.getConstantsForViewManager}.
   */
  /* package */ static Map<String, Object> createConstants(ViewManagerResolver resolver) {
    Map<String, Object> constants = UIManagerModuleConstants.getConstants();
    constants.put("ViewManagerNames", new ArrayList<>(resolver.getViewManagerNames()));
    constants.put("LazyViewManagersEnabled", true);
    return constants;
  }

  public static Map<String, Object> getDefaultExportableEventTypes() {
    return MapBuilder.<String, Object>of(
        BUBBLING_EVENTS_KEY, UIManagerModuleConstants.getBubblingEventTypeConstants(),
        DIRECT_EVENTS_KEY, UIManagerModuleConstants.getDirectEventTypeConstants());
  }

  private static void validateDirectEventNames(
      String viewManagerName, Map<String, Object> directEvents) {
    if (!ReactBuildConfig.DEBUG || directEvents == null) {
      return;
    }

    for (String key : directEvents.keySet()) {
      Object value = directEvents.get(key);
      if (value != null && (value instanceof Map)) {
        String regName = (String) ((Map) value).get("registrationName");
        if (regName != null
            && key.startsWith("top")
            && regName.startsWith("on")
            && !key.substring(3).equals(regName.substring(2))) {
          FLog.e(
              TAG,
              String.format(
                  "Direct event name for '%s' doesn't correspond to the naming convention,"
                      + " expected 'topEventName'->'onEventName', got '%s'->'%s'",
                  viewManagerName, key, regName));
        }
      }
    }
  }

  /**
   * Generates map of constants that is then exposed by {@link UIManagerModule}. Provided list of
   * {@param viewManagers} is then used to populate content of those predefined fields using {@link
   * ViewManager#getExportedCustomBubblingEventTypeConstants} and {@link
   * ViewManager#getExportedCustomDirectEventTypeConstants} respectively. Each view manager is in
   * addition allowed to expose viewmanager-specific constants that are placed under the key that
   * corresponds to the view manager's name (see {@link ViewManager#getName}). Constants are merged
   * into the map of {@link UIManagerModule} base constants that is stored in {@link
   * UIManagerModuleConstants}. TODO(6845124): Create a test for this
   */
  /* package */ static Map<String, Object> createConstants(
      List<ViewManager> viewManagers,
      @Nullable Map<String, Object> allBubblingEventTypes,
      @Nullable Map<String, Object> allDirectEventTypes) {
    Map<String, Object> constants = UIManagerModuleConstants.getConstants();

    // Generic/default event types:
    // All view managers are capable of dispatching these events.
    // They will be automatically registered with React Fiber.
    Map genericBubblingEventTypes = UIManagerModuleConstants.getBubblingEventTypeConstants();
    Map genericDirectEventTypes = UIManagerModuleConstants.getDirectEventTypeConstants();

    // Cumulative event types:
    // View manager specific event types are collected as views are loaded.
    // This information is used later when events are dispatched.
    if (allBubblingEventTypes != null) {
      allBubblingEventTypes.putAll(genericBubblingEventTypes);
    }
    if (allDirectEventTypes != null) {
      allDirectEventTypes.putAll(genericDirectEventTypes);
    }

    for (ViewManager viewManager : viewManagers) {
      final String viewManagerName = viewManager.getName();

      Map viewManagerConstants =
          createConstantsForViewManager(
              viewManager, null, null, allBubblingEventTypes, allDirectEventTypes);
      if (!viewManagerConstants.isEmpty()) {
        constants.put(viewManagerName, viewManagerConstants);
      }
    }

    constants.put("genericBubblingEventTypes", genericBubblingEventTypes);
    constants.put("genericDirectEventTypes", genericDirectEventTypes);
    return constants;
  }

  /* package */ static Map<String, Object> createConstantsForViewManager(
      ViewManager viewManager,
      @Nullable Map defaultBubblingEvents,
      @Nullable Map defaultDirectEvents,
      @Nullable Map cumulativeBubblingEventTypes,
      @Nullable Map cumulativeDirectEventTypes) {
    Map<String, Object> viewManagerConstants = MapBuilder.newHashMap();

    Map viewManagerBubblingEvents = viewManager.getExportedCustomBubblingEventTypeConstants();
    if (viewManagerBubblingEvents != null) {
      if (ReactFeatureFlags.enableFabricRenderer && ReactFeatureFlags.unstable_useFabricInterop) {
        // For Fabric, events needs to be fired with a "top" prefix.
        // For the sake of Fabric Interop, here we normalize events adding "top" in their
        // name if the user hasn't provided it.
        normalizeEventTypes(viewManagerBubblingEvents);
      }
      recursiveMerge(cumulativeBubblingEventTypes, viewManagerBubblingEvents);
      recursiveMerge(viewManagerBubblingEvents, defaultBubblingEvents);
      viewManagerConstants.put(BUBBLING_EVENTS_KEY, viewManagerBubblingEvents);
    } else if (defaultBubblingEvents != null) {
      viewManagerConstants.put(BUBBLING_EVENTS_KEY, defaultBubblingEvents);
    }

    Map viewManagerDirectEvents = viewManager.getExportedCustomDirectEventTypeConstants();
    validateDirectEventNames(viewManager.getName(), viewManagerDirectEvents);
    if (viewManagerDirectEvents != null) {
      if (ReactFeatureFlags.enableFabricRenderer && ReactFeatureFlags.unstable_useFabricInterop) {
        // For Fabric, events needs to be fired with a "top" prefix.
        // For the sake of Fabric Interop, here we normalize events adding "top" in their
        // name if the user hasn't provided it.
        normalizeEventTypes(viewManagerDirectEvents);
      }
      recursiveMerge(cumulativeDirectEventTypes, viewManagerDirectEvents);
      recursiveMerge(viewManagerDirectEvents, defaultDirectEvents);
      viewManagerConstants.put(DIRECT_EVENTS_KEY, viewManagerDirectEvents);
    } else if (defaultDirectEvents != null) {
      viewManagerConstants.put(DIRECT_EVENTS_KEY, defaultDirectEvents);
    }

    Map customViewConstants = viewManager.getExportedViewConstants();
    if (customViewConstants != null) {
      viewManagerConstants.put("Constants", customViewConstants);
    }
    Map viewManagerCommands = viewManager.getCommandsMap();
    if (viewManagerCommands != null) {
      viewManagerConstants.put("Commands", viewManagerCommands);
    }
    Map<String, String> viewManagerNativeProps = viewManager.getNativeProps();
    if (!viewManagerNativeProps.isEmpty()) {
      viewManagerConstants.put("NativeProps", viewManagerNativeProps);
    }

    return viewManagerConstants;
  }

  @VisibleForTesting
  /* package */ static void normalizeEventTypes(Map events) {
    if (events == null) {
      return;
    }
    Set<String> keysToNormalize = new HashSet<>();
    for (Object key : events.keySet()) {
      if (key instanceof String) {
        String keyString = (String) key;
        if (!keyString.startsWith("top")) {
          keysToNormalize.add(keyString);
        }
      }
    }
    for (String oldKey : keysToNormalize) {
      Object value = events.get(oldKey);
      String newKey = "top" + oldKey.substring(0, 1).toUpperCase() + oldKey.substring(1);
      events.put(newKey, value);
    }
  }

  /** Merges {@param source} map into {@param dest} map recursively */
  private static void recursiveMerge(@Nullable Map dest, @Nullable Map source) {
    if (dest == null || source == null || source.isEmpty()) {
      return;
    }

    for (Object key : source.keySet()) {
      Object sourceValue = source.get(key);
      Object destValue = dest.get(key);
      if (destValue != null && (sourceValue instanceof Map) && (destValue instanceof Map)) {
        // Since event maps are client based Map interface, it could be immutable
        if (!(destValue instanceof HashMap)) {
          destValue = new HashMap((Map) destValue);
          dest.replace(key, (Map) destValue);
        }
        recursiveMerge((Map) destValue, (Map) sourceValue);
      } else {
        dest.put(key, sourceValue);
      }
    }
  }
}
