/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  HostComponent,
  PartialViewConfig,
} from '../Renderer/shims/ReactNativeTypes';

import getNativeComponentAttributes from '../ReactNative/getNativeComponentAttributes';
import UIManager from '../ReactNative/UIManager';
import ReactNativeViewConfigRegistry from '../Renderer/shims/ReactNativeViewConfigRegistry';
import verifyComponentAttributeEquivalence from '../Utilities/verifyComponentAttributeEquivalence';
import * as StaticViewConfigValidator from './StaticViewConfigValidator';
import {createViewConfig} from './ViewConfig';
import invariant from 'invariant';
import * as React from 'react';

let getRuntimeConfig;

/**
 * Configures a function that is called to determine whether a given component
 * should be registered using reflection of the native component at runtime.
 *
 * The provider should return null if the native component is unavailable in
 * the current environment.
 */
export function setRuntimeConfigProvider(
  runtimeConfigProvider: (name: string) => ?{
    native: boolean,
    strict: boolean,
    verify: boolean,
  },
): void {
  if (getRuntimeConfig === undefined) {
    getRuntimeConfig = runtimeConfigProvider;
  }
}

/**
 * Gets a `NativeComponent` that can be rendered by React Native.
 *
 * The supplied `viewConfigProvider` may or may not be invoked and utilized,
 * depending on how `setRuntimeConfigProvider` is configured.
 */
export function get<Config>(
  name: string,
  viewConfigProvider: () => PartialViewConfig,
): HostComponent<Config> {
  ReactNativeViewConfigRegistry.register(name, () => {
    const {native, strict, verify} = getRuntimeConfig?.(name) ?? {
      native: true,
      strict: false,
      verify: false,
    };

    const viewConfig = native
      ? getNativeComponentAttributes(name)
      : createViewConfig(viewConfigProvider());

    if (verify) {
      const nativeViewConfig = native
        ? viewConfig
        : getNativeComponentAttributes(name);
      const staticViewConfig = native
        ? createViewConfig(viewConfigProvider())
        : viewConfig;

      if (strict) {
        const validationOutput = StaticViewConfigValidator.validate(
          name,
          nativeViewConfig,
          staticViewConfig,
        );

        if (validationOutput.type === 'invalid') {
          console.error(
            StaticViewConfigValidator.stringifyValidationResult(
              name,
              validationOutput,
            ),
          );
        }
      } else {
        verifyComponentAttributeEquivalence(nativeViewConfig, staticViewConfig);
      }
    }

    return viewConfig;
  });

  // $FlowFixMe[incompatible-return] `NativeComponent` is actually string!
  return name;
}

/**
 * Same as `NativeComponentRegistry.get(...)`, except this will check either
 * the `setRuntimeConfigProvider` configuration or use native reflection (slow)
 * to determine whether this native component is available.
 *
 * If the native component is not available, a stub component is returned. Note
 * that the return value of this is not `HostComponent` because the returned
 * component instance is not guaranteed to have native methods.
 */
export function getWithFallback_DEPRECATED<Config>(
  name: string,
  viewConfigProvider: () => PartialViewConfig,
): React.AbstractComponent<Config> {
  if (getRuntimeConfig == null) {
    // `getRuntimeConfig == null` when static view configs are disabled
    // If `setRuntimeConfigProvider` is not configured, use native reflection.
    if (hasNativeViewConfig(name)) {
      return get<Config>(name, viewConfigProvider);
    }
  } else {
    // If there is no runtime config, then the native component is unavailable.
    if (getRuntimeConfig(name) != null) {
      return get<Config>(name, viewConfigProvider);
    }
  }

  const FallbackNativeComponent = function (props: Config): React.Node {
    return null;
  };
  FallbackNativeComponent.displayName = `Fallback(${name})`;
  return FallbackNativeComponent;
}

function hasNativeViewConfig(name: string): boolean {
  invariant(getRuntimeConfig == null, 'Unexpected invocation!');
  return UIManager.getViewManagerConfig(name) != null;
}

/**
 * Unstable API. Do not use!
 *
 * This method returns if there is a StaticViewConfig registered for the
 * component name received as a parameter.
 */
export function unstable_hasStaticViewConfig(name: string): boolean {
  const {native} = getRuntimeConfig?.(name) ?? {
    native: true,
  };
  return !native;
}
