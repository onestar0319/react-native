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

import type {SchemaType} from '../../../CodegenSchema';
import type {MethodSerializationOutput} from './serializeMethod';

const {createAliasResolver, getModules} = require('../Utils');

const {StructCollector} = require('./StructCollector');
const {serializeStruct} = require('./header/serializeStruct');
const {serializeMethod} = require('./serializeMethod');
const {serializeModuleSource} = require('./source/serializeModule');

type FilesOutput = Map<string, string>;

const ModuleDeclarationTemplate = ({
  moduleName,
  structDeclarations,
  protocolMethods,
}: $ReadOnly<{|
  moduleName: string,
  structDeclarations: string,
  protocolMethods: string,
|}>) => `
${structDeclarations}
@protocol Native${moduleName}Spec <RCTBridgeModule, RCTTurboModule>

${protocolMethods}

@end
namespace facebook {
  namespace react {
    /**
     * ObjC++ class for module '${moduleName}'
     */
    class JSI_EXPORT Native${moduleName}SpecJSI : public ObjCTurboModule {
    public:
      Native${moduleName}SpecJSI(const ObjCTurboModule::InitParams &params);
    };
  } // namespace react
} // namespace facebook
`;

const HeaderFileTemplate = ({
  moduleDeclarations,
  structInlineMethods,
}: $ReadOnly<{|
  moduleDeclarations: string,
  structInlineMethods: string,
|}>) => `
/**
 * ${'C'}opyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${'@'}generated by codegen project: GenerateModuleHObjCpp.js
 */

#ifndef __cplusplus
#error This file must be compiled as Obj-C++. If you are importing it, you must change your file extension to .mm.
#endif

#import <vector>

#import <Foundation/Foundation.h>

#import <folly/Optional.h>

#import <RCTRequired/RCTRequired.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>
#import <RCTTypeSafety/RCTTypedModuleConstants.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTCxxConvert.h>
#import <React/RCTManagedPointer.h>

#import <ReactCommon/RCTTurboModule.h>

${moduleDeclarations}

${structInlineMethods}
`;

const SourceFileTemplate = ({
  headerFileName,
  moduleImplementations,
}: $ReadOnly<{|
  headerFileName: string,
  moduleImplementations: string,
|}>) => `
/**
 * ${'C'}opyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${'@'}generated by an internal genrule from Flow types.
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
    moduleSpecName: string,
  ): FilesOutput {
    const nativeModules = getModules(schema);

    const moduleDeclarations: Array<string> = [];
    const structInlineMethods: Array<string> = [];
    const moduleImplementations: Array<string> = [];

    const moduleNames: Array<string> = Object.keys(nativeModules).sort();
    for (const moduleName of moduleNames) {
      const {aliases, properties} = nativeModules[moduleName];
      const resolveAlias = createAliasResolver(aliases);
      const structCollector = new StructCollector();

      const methodSerializations: Array<MethodSerializationOutput> = [];
      const serializeProperty = property => {
        methodSerializations.push(
          ...serializeMethod(
            moduleName,
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
        const {methods, declaration} = serializeStruct(moduleName, struct);
        structStrs.push(declaration);
        methodStrs.push(methods);
      }

      moduleDeclarations.push(
        ModuleDeclarationTemplate({
          moduleName: moduleName,
          structDeclarations: structStrs.join('\n'),
          protocolMethods: methodSerializations
            .map(({protocolMethod}) => protocolMethod)
            .join('\n'),
        }),
      );

      structInlineMethods.push(methodStrs.join('\n'));

      moduleImplementations.push(
        serializeModuleSource(
          moduleName,
          generatedStructs,
          methodSerializations.filter(
            ({selector}) => selector !== '@selector(constantsToExport)',
          ),
        ),
      );
    }

    const headerFileName = `${moduleSpecName}.h`;
    const headerFile = HeaderFileTemplate({
      moduleDeclarations: moduleDeclarations.join('\n'),
      structInlineMethods: structInlineMethods.join('\n'),
    });

    const sourceFileName = `${moduleSpecName}-generated.mm`;
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
