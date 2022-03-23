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
import type {NativeModulePropertyShape} from '../../../CodegenSchema';

import type {SchemaType} from '../../../CodegenSchema';
import type {MethodSerializationOutput} from './serializeMethod';

const {createAliasResolver, getModules} = require('../Utils');

const {StructCollector} = require('./StructCollector');
const {serializeStruct} = require('./header/serializeStruct');
const {serializeMethod} = require('./serializeMethod');
const {serializeModuleSource} = require('./source/serializeModule');

type FilesOutput = Map<string, string>;

const ModuleDeclarationTemplate = ({
  hasteModuleName,
  structDeclarations,
  protocolMethods,
}: $ReadOnly<{
  hasteModuleName: string,
  structDeclarations: string,
  protocolMethods: string,
}>) => `${structDeclarations}
@protocol ${hasteModuleName}Spec <RCTBridgeModule, RCTTurboModule>

${protocolMethods}

@end
namespace facebook {
  namespace react {
    /**
     * ObjC++ class for module '${hasteModuleName}'
     */
    class JSI_EXPORT ${hasteModuleName}SpecJSI : public ObjCTurboModule {
    public:
      ${hasteModuleName}SpecJSI(const ObjCTurboModule::InitParams &params);
    };
  } // namespace react
} // namespace facebook`;

const HeaderFileTemplate = ({
  moduleDeclarations,
  structInlineMethods,
  assumeNonnull,
}: $ReadOnly<{
  moduleDeclarations: string,
  structInlineMethods: string,
  assumeNonnull: boolean,
}>) =>
  `/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GenerateModuleObjCpp
 *
 * We create an umbrella header (and corresponding implementation) here since
 * Cxx compilation in BUCK has a limitation: source-code producing genrule()s
 * must have a single output. More files => more genrule()s => slower builds.
 */

#ifndef __cplusplus
#error This file must be compiled as Obj-C++. If you are importing it, you must change your file extension to .mm.
#endif
#import <Foundation/Foundation.h>
#import <RCTRequired/RCTRequired.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>
#import <RCTTypeSafety/RCTTypedModuleConstants.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTCxxConvert.h>
#import <React/RCTManagedPointer.h>
#import <ReactCommon/RCTTurboModule.h>
#import <optional>
#import <vector>

` +
  (assumeNonnull ? '\nNS_ASSUME_NONNULL_BEGIN\n' : '') +
  moduleDeclarations +
  '\n' +
  structInlineMethods +
  (assumeNonnull ? '\nNS_ASSUME_NONNULL_END\n' : '\n');

const SourceFileTemplate = ({
  headerFileName,
  moduleImplementations,
}: $ReadOnly<{
  headerFileName: string,
  moduleImplementations: string,
}>) => `/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GenerateModuleObjCpp
 *
 * We create an umbrella header (and corresponding implementation) here since
 * Cxx compilation in BUCK has a limitation: source-code producing genrule()s
 * must have a single output. More files => more genrule()s => slower builds.
 */

#import "${headerFileName}"

${moduleImplementations}
`;

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean,
  ): FilesOutput {
    const nativeModules = getModules(schema);

    const moduleDeclarations: Array<string> = [];
    const structInlineMethods: Array<string> = [];
    const moduleImplementations: Array<string> = [];

    const hasteModuleNames: Array<string> = Object.keys(nativeModules).sort();
    for (const hasteModuleName of hasteModuleNames) {
      const {
        aliases,
        excludedPlatforms,
        spec: {properties},
      } = nativeModules[hasteModuleName];
      if (excludedPlatforms != null && excludedPlatforms.includes('iOS')) {
        continue;
      }
      const resolveAlias = createAliasResolver(aliases);
      const structCollector = new StructCollector();

      const methodSerializations: Array<MethodSerializationOutput> = [];
      const serializeProperty = (property: NativeModulePropertyShape) => {
        methodSerializations.push(
          ...serializeMethod(
            hasteModuleName,
            property,
            structCollector,
            resolveAlias,
          ),
        );
      };

      /**
       * Note: As we serialize NativeModule methods, we insert structs into
       * StructCollector, as we encounter them.
       */
      properties
        .filter(property => property.name !== 'getConstants')
        .forEach(serializeProperty);
      properties
        .filter(property => property.name === 'getConstants')
        .forEach(serializeProperty);

      const generatedStructs = structCollector.getAllStructs();
      const structStrs = [];
      const methodStrs = [];

      for (const struct of generatedStructs) {
        const {methods, declaration} = serializeStruct(hasteModuleName, struct);
        structStrs.push(declaration);
        methodStrs.push(methods);
      }

      moduleDeclarations.push(
        ModuleDeclarationTemplate({
          hasteModuleName: hasteModuleName,
          structDeclarations: structStrs.join('\n'),
          protocolMethods: methodSerializations
            .map(({protocolMethod}) => protocolMethod)
            .join('\n'),
        }),
      );

      structInlineMethods.push(methodStrs.join('\n'));

      moduleImplementations.push(
        serializeModuleSource(
          hasteModuleName,
          generatedStructs,
          methodSerializations.filter(
            ({selector}) => selector !== '@selector(constantsToExport)',
          ),
        ),
      );
    }

    const headerFileName = `${libraryName}.h`;
    const headerFile = HeaderFileTemplate({
      moduleDeclarations: moduleDeclarations.join('\n'),
      structInlineMethods: structInlineMethods.join('\n'),
      assumeNonnull,
    });

    const sourceFileName = `${libraryName}-generated.mm`;
    const sourceFile = SourceFileTemplate({
      headerFileName,
      moduleImplementations: moduleImplementations.join('\n'),
    });

    return new Map([
      [headerFileName, headerFile],
      [sourceFileName, sourceFile],
    ]);
  },
};
