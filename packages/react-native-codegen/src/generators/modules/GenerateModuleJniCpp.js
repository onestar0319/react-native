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

import type {
  Nullable,
  NamedShape,
  SchemaType,
  NativeModulePropertyShape,
  NativeModuleReturnTypeAnnotation,
  NativeModuleParamTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
} from '../../CodegenSchema';

import type {AliasResolver} from './Utils';
const {createAliasResolver, getModules} = require('./Utils');
const {unwrapNullable} = require('../../parsers/flow/modules/utils');

type FilesOutput = Map<string, string>;

type JSReturnType =
  | 'VoidKind'
  | 'StringKind'
  | 'BooleanKind'
  | 'NumberKind'
  | 'PromiseKind'
  | 'ObjectKind'
  | 'ArrayKind';

const HostFunctionTemplate = ({
  hasteModuleName,
  propertyName,
  jniSignature,
  jsReturnType,
}: $ReadOnly<{
  hasteModuleName: string,
  propertyName: string,
  jniSignature: string,
  jsReturnType: JSReturnType,
}>) => {
  return `static facebook::jsi::Value __hostFunction_${hasteModuleName}SpecJSI_${propertyName}(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
  return static_cast<JavaTurboModule &>(turboModule).invokeJavaMethod(rt, ${jsReturnType}, "${propertyName}", "${jniSignature}", args, count);
}`;
};

const ModuleClassConstructorTemplate = ({
  hasteModuleName,
  methods,
}: $ReadOnly<{
  hasteModuleName: string,
  methods: $ReadOnlyArray<{
    propertyName: string,
    argCount: number,
  }>,
}>) => {
  return `
${hasteModuleName}SpecJSI::${hasteModuleName}SpecJSI(const JavaTurboModule::InitParams &params)
  : JavaTurboModule(params) {
${methods
  .map(({propertyName, argCount}) => {
    return `  methodMap_["${propertyName}"] = MethodMetadata {${argCount}, __hostFunction_${hasteModuleName}SpecJSI_${propertyName}};`;
  })
  .join('\n')}
}`.trim();
};

const ModuleLookupTemplate = ({
  moduleName,
  hasteModuleName,
}: $ReadOnly<{moduleName: string, hasteModuleName: string}>) => {
  return `  if (moduleName == "${moduleName}") {
    return std::make_shared<${hasteModuleName}SpecJSI>(params);
  }`;
};

const FileTemplate = ({
  libraryName,
  include,
  modules,
  moduleLookups,
}: $ReadOnly<{
  libraryName: string,
  include: string,
  modules: string,
  moduleLookups: $ReadOnlyArray<
    $ReadOnly<{
      hasteModuleName: string,
      moduleName: string,
    }>,
  >,
}>) => {
  return `
/**
 * ${'C'}opyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${'@'}generated by codegen project: GenerateModuleJniCpp.js
 */

#include ${include}

namespace facebook {
namespace react {

${modules}

std::shared_ptr<TurboModule> ${libraryName}_ModuleProvider(const std::string moduleName, const JavaTurboModule::InitParams &params) {
${moduleLookups.map(ModuleLookupTemplate).join('\n')}
  return nullptr;
}

} // namespace react
} // namespace facebook
`;
};

function translateReturnTypeToKind(
  nullableTypeAnnotation: Nullable<NativeModuleReturnTypeAnnotation>,
  resolveAlias: AliasResolver,
): JSReturnType {
  const [typeAnnotation] = unwrapNullable<NativeModuleReturnTypeAnnotation>(
    nullableTypeAnnotation,
  );
  let realTypeAnnotation = typeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return 'NumberKind';
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(
            `Invalid ReservedFunctionValueTypeName name, got ${realTypeAnnotation.name}`,
          );
      }
    case 'VoidTypeAnnotation':
      return 'VoidKind';
    case 'StringTypeAnnotation':
      return 'StringKind';
    case 'BooleanTypeAnnotation':
      return 'BooleanKind';
    case 'NumberTypeAnnotation':
      return 'NumberKind';
    case 'DoubleTypeAnnotation':
      return 'NumberKind';
    case 'FloatTypeAnnotation':
      return 'NumberKind';
    case 'Int32TypeAnnotation':
      return 'NumberKind';
    case 'PromiseTypeAnnotation':
      return 'PromiseKind';
    case 'GenericObjectTypeAnnotation':
      return 'ObjectKind';
    case 'ObjectTypeAnnotation':
      return 'ObjectKind';
    case 'ArrayTypeAnnotation':
      return 'ArrayKind';
    default:
      (realTypeAnnotation.type: empty);
      throw new Error(
        `Unknown prop type for returning value, found: ${realTypeAnnotation.type}"`,
      );
  }
}

type Param = NamedShape<Nullable<NativeModuleParamTypeAnnotation>>;

function translateParamTypeToJniType(
  param: Param,
  resolveAlias: AliasResolver,
): string {
  const {optional, typeAnnotation: nullableTypeAnnotation} = param;
  const [
    typeAnnotation,
    nullable,
  ] = unwrapNullable<NativeModuleParamTypeAnnotation>(nullableTypeAnnotation);
  const isRequired = !optional && !nullable;

  let realTypeAnnotation = typeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return !isRequired ? 'Ljava/lang/Double;' : 'D';
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(
            `Invalid ReservedFunctionValueTypeName name, got ${realTypeAnnotation.name}`,
          );
      }
    case 'StringTypeAnnotation':
      return 'Ljava/lang/String;';
    case 'BooleanTypeAnnotation':
      return !isRequired ? 'Ljava/lang/Boolean;' : 'Z';
    case 'NumberTypeAnnotation':
      return !isRequired ? 'Ljava/lang/Double;' : 'D';
    case 'DoubleTypeAnnotation':
      return !isRequired ? 'Ljava/lang/Double;' : 'D';
    case 'FloatTypeAnnotation':
      return !isRequired ? 'Ljava/lang/Double;' : 'D';
    case 'Int32TypeAnnotation':
      return !isRequired ? 'Ljava/lang/Double;' : 'D';
    case 'GenericObjectTypeAnnotation':
      return 'Lcom/facebook/react/bridge/ReadableMap;';
    case 'ObjectTypeAnnotation':
      return 'Lcom/facebook/react/bridge/ReadableMap;';
    case 'ArrayTypeAnnotation':
      return 'Lcom/facebook/react/bridge/ReadableArray;';
    case 'FunctionTypeAnnotation':
      return 'Lcom/facebook/react/bridge/Callback;';
    default:
      (realTypeAnnotation.type: empty);
      throw new Error(
        `Unknown prop type for method arg, found: ${realTypeAnnotation.type}"`,
      );
  }
}

function translateReturnTypeToJniType(
  nullableTypeAnnotation: Nullable<NativeModuleReturnTypeAnnotation>,
  resolveAlias: AliasResolver,
): string {
  const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);

  let realTypeAnnotation = typeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return nullable ? 'Ljava/lang/Double;' : 'D';
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(
            `Invalid ReservedFunctionValueTypeName name, got ${realTypeAnnotation.name}`,
          );
      }
    case 'VoidTypeAnnotation':
      return 'V';
    case 'StringTypeAnnotation':
      return 'Ljava/lang/String;';
    case 'BooleanTypeAnnotation':
      return nullable ? 'Ljava/lang/Boolean;' : 'Z';
    case 'NumberTypeAnnotation':
      return nullable ? 'Ljava/lang/Double;' : 'D';
    case 'DoubleTypeAnnotation':
      return nullable ? 'Ljava/lang/Double;' : 'D';
    case 'FloatTypeAnnotation':
      return nullable ? 'Ljava/lang/Double;' : 'D';
    case 'Int32TypeAnnotation':
      return nullable ? 'Ljava/lang/Double;' : 'D';
    case 'PromiseTypeAnnotation':
      return 'Lcom/facebook/react/bridge/Promise;';
    case 'GenericObjectTypeAnnotation':
      return 'Lcom/facebook/react/bridge/WritableMap;';
    case 'ObjectTypeAnnotation':
      return 'Lcom/facebook/react/bridge/WritableMap;';
    case 'ArrayTypeAnnotation':
      return 'Lcom/facebook/react/bridge/WritableArray;';
    default:
      (realTypeAnnotation.type: empty);
      throw new Error(
        `Unknown prop type for method return type, found: ${realTypeAnnotation.type}"`,
      );
  }
}

function translateMethodTypeToJniSignature(
  property: NativeModulePropertyShape,
  resolveAlias: AliasResolver,
): string {
  const {name, typeAnnotation} = property;
  let [
    {returnTypeAnnotation, params},
  ] = unwrapNullable<NativeModuleFunctionTypeAnnotation>(typeAnnotation);

  params = [...params];
  let processedReturnTypeAnnotation = returnTypeAnnotation;
  const isPromiseReturn = returnTypeAnnotation.type === 'PromiseTypeAnnotation';
  if (isPromiseReturn) {
    processedReturnTypeAnnotation = {
      type: 'VoidTypeAnnotation',
    };
  }

  const argsSignatureParts = params.map(t => {
    return translateParamTypeToJniType(t, resolveAlias);
  });
  if (isPromiseReturn) {
    // Additional promise arg for this case.
    argsSignatureParts.push(
      translateReturnTypeToJniType(returnTypeAnnotation, resolveAlias),
    );
  }
  const argsSignature = argsSignatureParts.join('');
  const returnSignature =
    name === 'getConstants'
      ? 'Ljava/util/Map;'
      : translateReturnTypeToJniType(
          processedReturnTypeAnnotation,
          resolveAlias,
        );

  return `(${argsSignature})${returnSignature}`;
}

function translateMethodForImplementation(
  hasteModuleName: string,
  property: NativeModulePropertyShape,
  resolveAlias: AliasResolver,
): string {
  const [
    propertyTypeAnnotation,
  ] = unwrapNullable<NativeModuleFunctionTypeAnnotation>(
    property.typeAnnotation,
  );
  const {returnTypeAnnotation} = propertyTypeAnnotation;

  if (
    property.name === 'getConstants' &&
    returnTypeAnnotation.type === 'ObjectTypeAnnotation' &&
    returnTypeAnnotation.properties.length === 0
  ) {
    return '';
  }

  return HostFunctionTemplate({
    hasteModuleName,
    propertyName: property.name,
    jniSignature: translateMethodTypeToJniSignature(property, resolveAlias),
    jsReturnType: translateReturnTypeToKind(returnTypeAnnotation, resolveAlias),
  });
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
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
      .map(hasteModuleName => {
        const {
          aliases,
          spec: {properties},
        } = nativeModules[hasteModuleName];
        const resolveAlias = createAliasResolver(aliases);

        const translatedMethods = properties
          .map(property =>
            translateMethodForImplementation(
              hasteModuleName,
              property,
              resolveAlias,
            ),
          )
          .join('\n\n');

        return (
          translatedMethods +
          '\n\n' +
          ModuleClassConstructorTemplate({
            hasteModuleName,
            methods: properties
              .map(({name: propertyName, typeAnnotation}) => {
                const [
                  {returnTypeAnnotation, params},
                ] = unwrapNullable<NativeModuleFunctionTypeAnnotation>(
                  typeAnnotation,
                );

                if (
                  propertyName === 'getConstants' &&
                  returnTypeAnnotation.type === 'ObjectTypeAnnotation' &&
                  returnTypeAnnotation.properties &&
                  returnTypeAnnotation.properties.length === 0
                ) {
                  return null;
                }

                return {
                  propertyName,
                  argCount: params.length,
                };
              })
              .filter(Boolean),
          })
        );
      })
      .join('\n');

    const moduleLookups = Object.keys(nativeModules)
      .filter(hasteModuleName => {
        const module = nativeModules[hasteModuleName];
        return !(
          module.excludedPlatforms != null &&
          module.excludedPlatforms.includes('android')
        );
      })
      .sort((a, b) => {
        const moduleA = nativeModules[a];
        const moduleB = nativeModules[b];
        const nameA = moduleA.moduleNames[0];
        const nameB = moduleB.moduleNames[0];
        if (nameA < nameB) {
          return -1;
        } else if (nameA > nameB) {
          return 1;
        }
        return 0;
      })
      .flatMap<{moduleName: string, hasteModuleName: string}>(
        (hasteModuleName: string) => {
          const {moduleNames} = nativeModules[hasteModuleName];
          return moduleNames.map(moduleName => ({
            moduleName,
            hasteModuleName,
          }));
        },
      );

    const fileName = `${libraryName}-generated.cpp`;
    const replacedTemplate = FileTemplate({
      modules: modules,
      libraryName: libraryName.replace(/-/g, '_'),
      moduleLookups,
      include: `"${libraryName}.h"`,
    });
    return new Map([[`jni/${fileName}`, replacedTemplate]]);
  },
};
