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
  SchemaType,
  NativeModulePropertySchema,
  NativeModuleMethodParamSchema,
  NativeModuleReturnTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleParamTypeAnnotation,
} from '../../CodegenSchema';

import type {AliasResolver} from './Utils';
const {createAliasResolver, getModules} = require('./Utils');
const {unwrapNullable} = require('../../parsers/flow/modules/utils');

type FilesOutput = Map<string, string>;

function FileTemplate(
  config: $ReadOnly<{|
    packageName: string,
    className: string,
    methods: string,
    imports: string,
  |}>,
): string {
  const {packageName, className, methods, imports} = config;
  return `
/**
 * ${'C'}opyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 *
 * ${'@'}generated by codegen project: GenerateModuleJavaSpec.js
 *
 * @nolint
 */

package ${packageName};

${imports}

public abstract class ${className} extends ReactContextBaseJavaModule implements ReactModuleWithSpec, TurboModule {
  public ${className}(ReactApplicationContext reactContext) {
    super(reactContext);
  }

${methods}
}
`;
}

function MethodTemplate(
  config: $ReadOnly<{|
    abstract: boolean,
    methodBody: ?string,
    methodJavaAnnotation: string,
    methodName: string,
    translatedReturnType: string,
    traversedArgs: Array<string>,
  |}>,
): string {
  const {
    abstract,
    methodBody,
    methodJavaAnnotation,
    methodName,
    translatedReturnType,
    traversedArgs,
  } = config;
  const methodQualifier = abstract ? 'abstract ' : '';
  const methodClosing = abstract
    ? ';'
    : methodBody != null && methodBody.length > 0
    ? ` { ${methodBody} }`
    : ' {}';
  return `  ${methodJavaAnnotation}
  public ${methodQualifier}${translatedReturnType} ${methodName}(${traversedArgs.join(
    ', ',
  )})${methodClosing}`;
}

function translateFunctionParamToJavaType(
  param: NativeModuleMethodParamSchema,
  createErrorMessage: (typeName: string) => string,
  resolveAlias: AliasResolver,
  imports: Set<string>,
): string {
  const {optional, typeAnnotation: nullableTypeAnnotation} = param;
  const [
    typeAnnotation,
    nullable,
  ] = unwrapNullable<NativeModuleParamTypeAnnotation>(nullableTypeAnnotation);
  const isRequired = !optional && !nullable;

  function wrapIntoNullableIfNeeded(generatedType: string) {
    if (!isRequired) {
      imports.add('javax.annotation.Nullable');
      return `@Nullable ${generatedType}`;
    }
    return generatedType;
  }

  let realTypeAnnotation = typeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return !isRequired ? 'Double' : 'double';
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(createErrorMessage(realTypeAnnotation.name));
      }
    case 'StringTypeAnnotation':
      return wrapIntoNullableIfNeeded('String');
    case 'NumberTypeAnnotation':
      return !isRequired ? 'Double' : 'double';
    case 'FloatTypeAnnotation':
      return !isRequired ? 'Double' : 'double';
    case 'DoubleTypeAnnotation':
      return !isRequired ? 'Double' : 'double';
    case 'Int32TypeAnnotation':
      return !isRequired ? 'Double' : 'double';
    case 'BooleanTypeAnnotation':
      return !isRequired ? 'Boolean' : 'boolean';
    case 'ObjectTypeAnnotation':
      imports.add('com.facebook.react.bridge.ReadableMap');
      if (typeAnnotation.type === 'TypeAliasTypeAnnotation') {
        // No class alias for args, so it still falls under ReadableMap.
        return 'ReadableMap';
      }
      return 'ReadableMap';
    case 'GenericObjectTypeAnnotation':
      // Treat this the same as ObjectTypeAnnotation for now.
      imports.add('com.facebook.react.bridge.ReadableMap');
      return 'ReadableMap';
    case 'ArrayTypeAnnotation':
      imports.add('com.facebook.react.bridge.ReadableArray');
      return 'ReadableArray';
    case 'FunctionTypeAnnotation':
      imports.add('com.facebook.react.bridge.Callback');
      return 'Callback';
    default:
      (realTypeAnnotation.type: empty);
      throw new Error(createErrorMessage(realTypeAnnotation.type));
  }
}

function translateFunctionReturnTypeToJavaType(
  nullableReturnTypeAnnotation: Nullable<NativeModuleReturnTypeAnnotation>,
  createErrorMessage: (typeName: string) => string,
  resolveAlias: AliasResolver,
  imports: Set<string>,
): string {
  const [
    returnTypeAnnotation,
    nullable,
  ] = unwrapNullable<NativeModuleReturnTypeAnnotation>(
    nullableReturnTypeAnnotation,
  );

  function wrapIntoNullableIfNeeded(generatedType: string) {
    if (nullable) {
      imports.add('javax.annotation.Nullable');
      return `@Nullable ${generatedType}`;
    }
    return generatedType;
  }

  let realTypeAnnotation = returnTypeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return nullable ? 'Double' : 'double';
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(createErrorMessage(realTypeAnnotation.name));
      }
    case 'VoidTypeAnnotation':
      return 'void';
    case 'PromiseTypeAnnotation':
      return 'void';
    case 'StringTypeAnnotation':
      return wrapIntoNullableIfNeeded('String');
    case 'NumberTypeAnnotation':
      return nullable ? 'Double' : 'double';
    case 'FloatTypeAnnotation':
      return nullable ? 'Double' : 'double';
    case 'DoubleTypeAnnotation':
      return nullable ? 'Double' : 'double';
    case 'Int32TypeAnnotation':
      return nullable ? 'Double' : 'double';
    case 'BooleanTypeAnnotation':
      return nullable ? 'Boolean' : 'boolean';
    case 'ObjectTypeAnnotation':
      imports.add('com.facebook.react.bridge.WritableMap');
      return 'WritableMap';
    case 'GenericObjectTypeAnnotation':
      imports.add('com.facebook.react.bridge.WritableMap');
      return 'WritableMap';
    case 'ArrayTypeAnnotation':
      imports.add('com.facebook.react.bridge.WritableArray');
      return 'WritableArray';
    default:
      (realTypeAnnotation.type: empty);
      throw new Error(createErrorMessage(realTypeAnnotation.type));
  }
}

function getFalsyReturnStatementFromReturnType(
  nullableReturnTypeAnnotation: Nullable<NativeModuleReturnTypeAnnotation>,
  createErrorMessage: (typeName: string) => string,
  resolveAlias: AliasResolver,
): string {
  const [
    returnTypeAnnotation,
    nullable,
  ] = unwrapNullable<NativeModuleReturnTypeAnnotation>(
    nullableReturnTypeAnnotation,
  );

  let realTypeAnnotation = returnTypeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return 'return 0.0;';
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(createErrorMessage(realTypeAnnotation.name));
      }
    case 'VoidTypeAnnotation':
      return '';
    case 'PromiseTypeAnnotation':
      return '';
    case 'NumberTypeAnnotation':
      return nullable ? 'return null;' : 'return 0;';
    case 'FloatTypeAnnotation':
      return nullable ? 'return null;' : 'return 0.0;';
    case 'DoubleTypeAnnotation':
      return nullable ? 'return null;' : 'return 0.0;';
    case 'Int32TypeAnnotation':
      return nullable ? 'return null;' : 'return 0;';
    case 'BooleanTypeAnnotation':
      return nullable ? 'return null;' : 'return false;';
    case 'StringTypeAnnotation':
      return nullable ? 'return null;' : 'return "";';
    case 'ObjectTypeAnnotation':
      return 'return null;';
    case 'GenericObjectTypeAnnotation':
      return 'return null;';
    case 'ArrayTypeAnnotation':
      return 'return null;';
    default:
      (realTypeAnnotation.type: empty);
      throw new Error(createErrorMessage(realTypeAnnotation.type));
  }
}

// Build special-cased runtime check for getConstants().
function buildGetConstantsMethod(
  method: NativeModulePropertySchema,
  imports: Set<string>,
): string {
  const [
    methodTypeAnnotation,
  ] = unwrapNullable<NativeModuleFunctionTypeAnnotation>(method.typeAnnotation);
  if (
    methodTypeAnnotation.returnTypeAnnotation.type === 'ObjectTypeAnnotation'
  ) {
    const requiredProps = [];
    const optionalProps = [];
    const rawProperties =
      methodTypeAnnotation.returnTypeAnnotation.properties || [];
    rawProperties.forEach(p => {
      if (p.optional || p.typeAnnotation.type === 'NullableTypeAnnotation') {
        optionalProps.push(p.name);
      } else {
        requiredProps.push(p.name);
      }
    });
    if (requiredProps.length === 0 && optionalProps.length === 0) {
      // Nothing to validate during runtime.
      return '';
    }

    imports.add('com.facebook.react.common.build.ReactBuildConfig');
    imports.add('java.util.Arrays');
    imports.add('java.util.HashSet');
    imports.add('java.util.Map');
    imports.add('java.util.Set');
    imports.add('javax.annotation.Nullable');

    const requiredPropsFragment =
      requiredProps.length > 0
        ? `Arrays.asList(
          ${requiredProps
            .sort()
            .map(p => `"${p}"`)
            .join(',\n          ')}
      )`
        : '';
    const optionalPropsFragment =
      optionalProps.length > 0
        ? `Arrays.asList(
          ${optionalProps
            .sort()
            .map(p => `"${p}"`)
            .join(',\n          ')}
      )`
        : '';

    return `  protected abstract Map<String, Object> getTypedExportedConstants();

  @Override
  public final @Nullable Map<String, Object> getConstants() {
    Map<String, Object> constants = getTypedExportedConstants();
    if (ReactBuildConfig.DEBUG || ReactBuildConfig.IS_INTERNAL_BUILD) {
      Set<String> obligatoryFlowConstants = new HashSet<>(${requiredPropsFragment});
      Set<String> optionalFlowConstants = new HashSet<>(${optionalPropsFragment});
      Set<String> undeclaredConstants = new HashSet<>(constants.keySet());
      undeclaredConstants.removeAll(obligatoryFlowConstants);
      undeclaredConstants.removeAll(optionalFlowConstants);
      if (!undeclaredConstants.isEmpty()) {
        throw new IllegalStateException(String.format("Native Module Flow doesn't declare constants: %s", undeclaredConstants));
      }
      undeclaredConstants = obligatoryFlowConstants;
      undeclaredConstants.removeAll(constants.keySet());
      if (!undeclaredConstants.isEmpty()) {
        throw new IllegalStateException(String.format("Native Module doesn't fill in constants: %s", undeclaredConstants));
      }
    }
    return constants;
  }`;
  }

  return '';
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
    packageName?: string,
  ): FilesOutput {
    const files = new Map();
    const normalizedPackageName =
      packageName != null ? packageName : 'com.facebook.fbreact.specs';
    const outputDir = `java/${normalizedPackageName.replace(/\./g, '/')}`;
    const nativeModules = getModules(schema);

    Object.keys(nativeModules).forEach(hasteModuleName => {
      const {
        aliases,
        excludedPlatforms,
        spec: {properties},
      } = nativeModules[hasteModuleName];
      if (excludedPlatforms != null && excludedPlatforms.includes('android')) {
        return;
      }
      const resolveAlias = createAliasResolver(aliases);
      const className = `${hasteModuleName}Spec`;

      const imports: Set<string> = new Set([
        // Always required.
        'com.facebook.react.bridge.ReactApplicationContext',
        'com.facebook.react.bridge.ReactContextBaseJavaModule',
        'com.facebook.react.bridge.ReactMethod',
        'com.facebook.react.bridge.ReactModuleWithSpec',
        'com.facebook.react.turbomodule.core.interfaces.TurboModule',
      ]);

      const methods = properties.map(method => {
        if (method.name === 'getConstants') {
          return buildGetConstantsMethod(method, imports);
        }

        const [
          methodTypeAnnotation,
        ] = unwrapNullable<NativeModuleFunctionTypeAnnotation>(
          method.typeAnnotation,
        );

        // Handle return type
        const translatedReturnType = translateFunctionReturnTypeToJavaType(
          methodTypeAnnotation.returnTypeAnnotation,
          typeName =>
            `Unsupported return type for method ${method.name}. Found: ${typeName}`,
          resolveAlias,
          imports,
        );
        const returningPromise =
          methodTypeAnnotation.returnTypeAnnotation.type ===
          'PromiseTypeAnnotation';
        const isSyncMethod =
          methodTypeAnnotation.returnTypeAnnotation.type !==
            'VoidTypeAnnotation' && !returningPromise;

        // Handle method args
        const traversedArgs = methodTypeAnnotation.params.map(param => {
          const translatedParam = translateFunctionParamToJavaType(
            param,
            typeName =>
              `Unsupported type for param "${param.name}" in ${method.name}. Found: ${typeName}`,
            resolveAlias,
            imports,
          );
          return `${translatedParam} ${param.name}`;
        });

        if (returningPromise) {
          // Promise return type requires an extra arg at the end.
          imports.add('com.facebook.react.bridge.Promise');
          traversedArgs.push('Promise promise');
        }

        const methodJavaAnnotation = `@ReactMethod${
          isSyncMethod ? '(isBlockingSynchronousMethod = true)' : ''
        }`;
        const methodBody = method.optional
          ? getFalsyReturnStatementFromReturnType(
              methodTypeAnnotation.returnTypeAnnotation,
              typeName =>
                `Cannot build falsy return statement for return type for method ${method.name}. Found: ${typeName}`,
              resolveAlias,
            )
          : null;
        return MethodTemplate({
          abstract: !method.optional,
          methodBody,
          methodJavaAnnotation,
          methodName: method.name,
          translatedReturnType,
          traversedArgs,
        });
      });

      files.set(
        `${outputDir}/${className}.java`,
        FileTemplate({
          packageName: normalizedPackageName,
          className,
          methods: methods.filter(Boolean).join('\n\n'),
          imports: Array.from(imports)
            .sort()
            .map(p => `import ${p};`)
            .join('\n'),
        }),
      );
    });

    return files;
  },
};
