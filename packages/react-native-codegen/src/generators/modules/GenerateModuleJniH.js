/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {SchemaType} from '../../CodegenSchema';

const {getModules} = require('./Utils');

type FilesOutput = Map<string, string>;

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
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GenerateModuleJniH.js
 */

#pragma once

#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <jsi/jsi.h>

namespace facebook::react {

${modules}

JSI_EXPORT
std::shared_ptr<TurboModule> ${libraryName}_ModuleProvider(const std::string &moduleName, const JavaTurboModule::InitParams &params);

} // namespace facebook::react
`;
};

// Note: this CMakeLists.txt template includes dependencies for both NativeModule and components.
const CMakeListsTemplate = ({
  libraryName,
}: $ReadOnly<{libraryName: string}>) => {
  return `# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

file(GLOB react_codegen_SRCS CONFIGURE_DEPENDS *.cpp react/renderer/components/${libraryName}/*.cpp)

add_library(
  react_codegen_${libraryName}
  SHARED
  \${react_codegen_SRCS}
)

target_include_directories(react_codegen_${libraryName} PUBLIC . react/renderer/components/${libraryName})

target_link_libraries(
  react_codegen_${libraryName}
  fbjni
  folly_runtime
  glog
  jsi
  ${libraryName !== 'rncore' ? 'react_codegen_rncore' : ''}
  react_debug
  react_nativemodule_core
  react_render_core
  react_render_debug
  react_render_graphics
  react_render_imagemanager
  rrc_image
  rrc_view
  turbomodulejsijni
  yoga
)

target_compile_options(
  react_codegen_${libraryName}
  PRIVATE
  -DLOG_TAG=\\"ReactNative\\"
  -fexceptions
  -frtti
  -std=c++20
  -Wall
)
`;
};

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean = false,
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

    const fileName = `${libraryName}.h`;
    const replacedTemplate = HeaderFileTemplate({
      modules: modules,
      libraryName: libraryName.replace(/-/g, '_'),
    });
    return new Map([
      [`jni/${fileName}`, replacedTemplate],
      ['jni/CMakeLists.txt', CMakeListsTemplate({libraryName: libraryName})],
    ]);
  },
};
