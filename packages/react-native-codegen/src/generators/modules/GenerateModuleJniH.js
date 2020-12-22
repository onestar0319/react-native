/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {SchemaType} from '../../CodegenSchema';

type FilesOutput = Map<string, string>;

const {getModules} = require('./Utils');

const ModuleClassDeclarationTemplate = ({
  hasteModuleName,
}: $ReadOnly<{hasteModuleName: string}>) => {
  return `/**
 * JNI C++ class for module '${hasteModuleName}'
 */
class JSI_EXPORT ${hasteModuleName}SpecJSI : public JavaTurboModule {
public:
  ${hasteModuleName}SpecJSI(const JavaTurboModule::InitParams &params);
};
`;
};

const HeaderFileTemplate = ({
  modules,
  libraryName,
}: $ReadOnly<{modules: string, libraryName: string}>) => {
  return `
/**
 * ${'C'}opyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${'@'}generated by codegen project: GenerateModuleJniH.js
 */

#pragma once

#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>

namespace facebook {
namespace react {

${modules}

std::shared_ptr<TurboModule> ${libraryName}_ModuleProvider(const std::string moduleName, const JavaTurboModule::InitParams &params);

} // namespace react
} // namespace facebook
`;
};

// Note: this Android.mk template includes dependencies for both NativeModule and components.
const AndroidMkTemplate = ({libraryName}: $ReadOnly<{libraryName: string}>) => {
  return `# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := react_codegen_${libraryName}

LOCAL_C_INCLUDES := $(LOCAL_PATH)

LOCAL_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp) $(wildcard $(LOCAL_PATH)/react/renderer/components/${libraryName}/*.cpp)

LOCAL_EXPORT_C_INCLUDES := $(LOCAL_PATH) $(LOCAL_PATH)/react/renderer/components/${libraryName}

LOCAL_SHARED_LIBRARIES := libglog libfolly_json libyoga libreact_nativemodule_core libreact_render_components_view libreact_render_core libreact_render_graphics

LOCAL_STATIC_LIBRARIES := libjsi

LOCAL_CFLAGS := \\
  -DLOG_TAG=\\"ReactNative\\"

LOCAL_CFLAGS += -fexceptions -frtti -std=c++14 -Wall

include $(BUILD_SHARED_LIBRARY)
`;
};

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
    packageName?: string,
  ): FilesOutput {
    const nativeModules = getModules(schema);
    const modules = Object.keys(nativeModules)
      .filter(hasteModuleName => {
        const module = nativeModules[hasteModuleName];
        return !(
          module.excludedPlatforms != null &&
          module.excludedPlatforms.includes('android')
        );
      })
      .sort()
      .map(hasteModuleName => ModuleClassDeclarationTemplate({hasteModuleName}))
      .join('\n');

    const fileName = `${moduleSpecName}.h`;
    const replacedTemplate = HeaderFileTemplate({
      modules: modules,
      libraryName: libraryName.replace(/-/g, '_'),
    });
    return new Map([
      [`jni/${fileName}`, replacedTemplate],
      [
        'jni/Android.mk',
        AndroidMkTemplate({
          libraryName: `${libraryName.toLowerCase()}`,
        }),
      ],
    ]);
  },
};
