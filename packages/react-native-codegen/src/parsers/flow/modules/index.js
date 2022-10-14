/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleArrayTypeAnnotation,
  NativeModuleBaseTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleParamTypeAnnotation,
  NativeModulePropertyShape,
  NativeModuleSchema,
  Nullable,
} from '../../../CodegenSchema.js';

import type {ParserErrorCapturer, TypeDeclarationMap} from '../../utils';
import type {NativeModuleTypeAnnotation} from '../../../CodegenSchema.js';

const {
  resolveTypeAnnotation,
  getTypes,
  visit,
  isModuleRegistryCall,
} = require('../utils.js');
const {
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
} = require('../../parsers-commons');
const {
  emitBoolean,
  emitDouble,
  emitNumber,
  emitInt32,
  emitObject,
  emitPromise,
  emitRootTag,
  emitVoid,
  emitStringish,
  typeAliasResolution,
} = require('../../parsers-primitives');
const {
  MisnamedModuleInterfaceParserError,
  MoreThanOneModuleInterfaceParserError,
  UnnamedFunctionParamParserError,
  UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedGenericParserError,
  UnsupportedTypeAnnotationParserError,
  UnsupportedFunctionParamTypeAnnotationParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError,
  UnsupportedEnumDeclarationParserError,
  UnsupportedUnionTypeAnnotationParserError,
  UnsupportedModulePropertyParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  UnsupportedObjectPropertyValueTypeAnnotationParserError,
  UnusedModuleInterfaceParserError,
  MoreThanOneModuleRegistryCallsParserError,
  UntypedModuleRegistryCallParserError,
  IncorrectModuleRegistryCallTypeParameterParserError,
  IncorrectModuleRegistryCallArityParserError,
  IncorrectModuleRegistryCallArgumentTypeParserError,
} = require('../../errors.js');

const {throwIfModuleInterfaceNotFound} = require('../../error-utils');

const language = 'Flow';

function nullGuard<T>(fn: () => T): ?T {
  return fn();
}

function translateTypeAnnotation(
  hasteModuleName: string,
  /**
   * TODO(T71778680): Flow-type this node.
   */
  flowTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
): Nullable<NativeModuleTypeAnnotation> {
  const {nullable, typeAnnotation, typeAliasResolutionStatus} =
    resolveTypeAnnotation(flowTypeAnnotation, types);

  switch (typeAnnotation.type) {
    case 'GenericTypeAnnotation': {
      switch (typeAnnotation.id.name) {
        case 'RootTag': {
          return emitRootTag(nullable);
        }
        case 'Promise': {
          return emitPromise(
            hasteModuleName,
            typeAnnotation,
            language,
            nullable,
          );
        }
        case 'Array':
        case '$ReadOnlyArray': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
            language,
          );

          try {
            /**
             * TODO(T72031674): Migrate all our NativeModule specs to not use
             * invalid Array ElementTypes. Then, make the elementType a required
             * parameter.
             */
            const [elementType, isElementTypeNullable] = unwrapNullable(
              translateTypeAnnotation(
                hasteModuleName,
                typeAnnotation.typeParameters.params[0],
                types,
                aliasMap,
                /**
                 * TODO(T72031674): Ensure that all ParsingErrors that are thrown
                 * while parsing the array element don't get captured and collected.
                 * Why? If we detect any parsing error while parsing the element,
                 * we should default it to null down the line, here. This is
                 * the correct behaviour until we migrate all our NativeModule specs
                 * to be parseable.
                 */
                nullGuard,
                cxxOnly,
              ),
            );

            if (elementType.type === 'VoidTypeAnnotation') {
              throw new UnsupportedArrayElementTypeAnnotationParserError(
                hasteModuleName,
                typeAnnotation.typeParameters.params[0],
                typeAnnotation.type,
                'void',
                language,
              );
            }

            if (elementType.type === 'PromiseTypeAnnotation') {
              throw new UnsupportedArrayElementTypeAnnotationParserError(
                hasteModuleName,
                typeAnnotation.typeParameters.params[0],
                typeAnnotation.type,
                'Promise',
                language,
              );
            }

            if (elementType.type === 'FunctionTypeAnnotation') {
              throw new UnsupportedArrayElementTypeAnnotationParserError(
                hasteModuleName,
                typeAnnotation.typeParameters.params[0],
                typeAnnotation.type,
                'FunctionTypeAnnotation',
                language,
              );
            }

            const finalTypeAnnotation: NativeModuleArrayTypeAnnotation<
              Nullable<NativeModuleBaseTypeAnnotation>,
            > = {
              type: 'ArrayTypeAnnotation',
              elementType: wrapNullable(isElementTypeNullable, elementType),
            };

            return wrapNullable(nullable, finalTypeAnnotation);
          } catch (ex) {
            return wrapNullable(nullable, {
              type: 'ArrayTypeAnnotation',
            });
          }
        }
        case '$ReadOnly': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const [paramType, isParamNullable] = unwrapNullable(
            translateTypeAnnotation(
              hasteModuleName,
              typeAnnotation.typeParameters.params[0],
              types,
              aliasMap,
              tryParse,
              cxxOnly,
            ),
          );

          return wrapNullable(nullable || isParamNullable, paramType);
        }
        case 'Stringish': {
          return emitStringish(nullable);
        }
        case 'Int32': {
          return emitInt32(nullable);
        }
        case 'Double': {
          return emitDouble(nullable);
        }
        case 'Float': {
          return wrapNullable(nullable, {
            type: 'FloatTypeAnnotation',
          });
        }
        case 'UnsafeObject':
        case 'Object': {
          return emitObject(nullable);
        }
        default: {
          const maybeEumDeclaration = types[typeAnnotation.id.name];
          if (
            cxxOnly &&
            maybeEumDeclaration &&
            maybeEumDeclaration.type === 'EnumDeclaration'
          ) {
            const memberType = maybeEumDeclaration.body.type
              .replace('EnumNumberBody', 'NumberTypeAnnotation')
              .replace('EnumStringBody', 'StringTypeAnnotation');
            if (
              memberType === 'NumberTypeAnnotation' ||
              memberType === 'StringTypeAnnotation'
            ) {
              return wrapNullable(nullable, {
                type: 'EnumDeclaration',
                memberType: memberType,
              });
            } else {
              throw new UnsupportedEnumDeclarationParserError(
                hasteModuleName,
                typeAnnotation,
                memberType,
                language,
              );
            }
          }
          throw new UnsupportedGenericParserError(
            hasteModuleName,
            typeAnnotation,
            language,
          );
        }
      }
    }
    case 'ObjectTypeAnnotation': {
      const objectTypeAnnotation = {
        type: 'ObjectTypeAnnotation',
        // $FlowFixMe[missing-type-arg]
        properties: (typeAnnotation.properties: Array<$FlowFixMe>)
          .map<?NamedShape<Nullable<NativeModuleBaseTypeAnnotation>>>(
            property => {
              return tryParse(() => {
                if (property.type !== 'ObjectTypeProperty') {
                  throw new UnsupportedObjectPropertyTypeAnnotationParserError(
                    hasteModuleName,
                    property,
                    property.type,
                    language,
                  );
                }

                const {optional, key} = property;

                const [propertyTypeAnnotation, isPropertyNullable] =
                  unwrapNullable(
                    translateTypeAnnotation(
                      hasteModuleName,
                      property.value,
                      types,
                      aliasMap,
                      tryParse,
                      cxxOnly,
                    ),
                  );

                if (propertyTypeAnnotation.type === 'FunctionTypeAnnotation') {
                  throw new UnsupportedObjectPropertyValueTypeAnnotationParserError(
                    hasteModuleName,
                    property.value,
                    property.key,
                    propertyTypeAnnotation.type,
                    language,
                  );
                }

                if (propertyTypeAnnotation.type === 'VoidTypeAnnotation') {
                  throw new UnsupportedObjectPropertyValueTypeAnnotationParserError(
                    hasteModuleName,
                    property.value,
                    property.key,
                    'void',
                    language,
                  );
                }

                if (propertyTypeAnnotation.type === 'PromiseTypeAnnotation') {
                  throw new UnsupportedObjectPropertyValueTypeAnnotationParserError(
                    hasteModuleName,
                    property.value,
                    property.key,
                    'Promise',
                    language,
                  );
                }

                return {
                  name: key.name,
                  optional,
                  typeAnnotation: wrapNullable(
                    isPropertyNullable,
                    propertyTypeAnnotation,
                  ),
                };
              });
            },
          )
          .filter(Boolean),
      };

      return typeAliasResolution(
        typeAliasResolutionStatus,
        objectTypeAnnotation,
        aliasMap,
        nullable,
      );
    }
    case 'BooleanTypeAnnotation': {
      return emitBoolean(nullable);
    }
    case 'NumberTypeAnnotation': {
      return emitNumber(nullable);
    }
    case 'VoidTypeAnnotation': {
      return emitVoid(nullable);
    }
    case 'StringTypeAnnotation': {
      return wrapNullable(nullable, {
        type: 'StringTypeAnnotation',
      });
    }
    case 'FunctionTypeAnnotation': {
      return wrapNullable(
        nullable,
        translateFunctionTypeAnnotation(
          hasteModuleName,
          typeAnnotation,
          types,
          aliasMap,
          tryParse,
          cxxOnly,
        ),
      );
    }
    case 'UnionTypeAnnotation': {
      if (cxxOnly) {
        // Remap literal names
        const unionTypes = typeAnnotation.types
          .map(
            item =>
              item.type
                .replace('NumberLiteralTypeAnnotation', 'NumberTypeAnnotation')
                .replace('StringLiteralTypeAnnotation', 'StringTypeAnnotation'),
            // ObjectAnnotation is already 'correct'
          )
          .filter((value, index, self) => self.indexOf(value) === index);
        // Only support unionTypes of the same kind
        if (unionTypes.length > 1) {
          throw new UnsupportedUnionTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
            unionTypes,
            language,
          );
        }
        return wrapNullable(nullable, {
          type: 'UnionTypeAnnotation',
          memberType: unionTypes[0],
        });
      }
      // Fallthrough
    }
    case 'MixedTypeAnnotation': {
      if (cxxOnly) {
        return wrapNullable(nullable, {
          type: 'MixedTypeAnnotation',
        });
      }
      // Fallthrough
    }
    default: {
      throw new UnsupportedTypeAnnotationParserError(
        hasteModuleName,
        typeAnnotation,
        language,
      );
    }
  }
}

function translateFunctionTypeAnnotation(
  hasteModuleName: string,
  // TODO(T71778680): This is a FunctionTypeAnnotation. Type this.
  flowFunctionTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
): NativeModuleFunctionTypeAnnotation {
  type Param = NamedShape<Nullable<NativeModuleParamTypeAnnotation>>;
  const params: Array<Param> = [];

  for (const flowParam of (flowFunctionTypeAnnotation.params: $ReadOnlyArray<$FlowFixMe>)) {
    const parsedParam = tryParse(() => {
      if (flowParam.name == null) {
        throw new UnnamedFunctionParamParserError(
          flowParam,
          hasteModuleName,
          language,
        );
      }

      const paramName = flowParam.name.name;
      const [paramTypeAnnotation, isParamTypeAnnotationNullable] =
        unwrapNullable(
          translateTypeAnnotation(
            hasteModuleName,
            flowParam.typeAnnotation,
            types,
            aliasMap,
            tryParse,
            cxxOnly,
          ),
        );

      if (paramTypeAnnotation.type === 'VoidTypeAnnotation') {
        throw new UnsupportedFunctionParamTypeAnnotationParserError(
          hasteModuleName,
          flowParam.typeAnnotation,
          paramName,
          'void',
          language,
        );
      }

      if (paramTypeAnnotation.type === 'PromiseTypeAnnotation') {
        throw new UnsupportedFunctionParamTypeAnnotationParserError(
          hasteModuleName,
          flowParam.typeAnnotation,
          paramName,
          'Promise',
          language,
        );
      }

      return {
        name: flowParam.name.name,
        optional: flowParam.optional,
        typeAnnotation: wrapNullable(
          isParamTypeAnnotationNullable,
          paramTypeAnnotation,
        ),
      };
    });

    if (parsedParam != null) {
      params.push(parsedParam);
    }
  }

  const [returnTypeAnnotation, isReturnTypeAnnotationNullable] = unwrapNullable(
    translateTypeAnnotation(
      hasteModuleName,
      flowFunctionTypeAnnotation.returnType,
      types,
      aliasMap,
      tryParse,
      cxxOnly,
    ),
  );

  if (!cxxOnly && returnTypeAnnotation.type === 'FunctionTypeAnnotation') {
    throw new UnsupportedFunctionReturnTypeAnnotationParserError(
      hasteModuleName,
      flowFunctionTypeAnnotation.returnType,
      'FunctionTypeAnnotation',
      language,
    );
  }

  return {
    type: 'FunctionTypeAnnotation',
    returnTypeAnnotation: wrapNullable(
      isReturnTypeAnnotationNullable,
      returnTypeAnnotation,
    ),
    params,
  };
}

function buildPropertySchema(
  hasteModuleName: string,
  // TODO(T71778680): This is an ObjectTypeProperty containing either:
  // - a FunctionTypeAnnotation or GenericTypeAnnotation
  // - a NullableTypeAnnoation containing a FunctionTypeAnnotation or GenericTypeAnnotation
  // Flow type this node
  property: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
): NativeModulePropertyShape {
  let nullable = false;
  let {key, value} = property;

  const methodName: string = key.name;

  ({nullable, typeAnnotation: value} = resolveTypeAnnotation(value, types));

  if (value.type !== 'FunctionTypeAnnotation') {
    throw new UnsupportedModulePropertyParserError(
      hasteModuleName,
      property.value,
      property.key.name,
      value.type,
      language,
    );
  }

  return {
    name: methodName,
    optional: property.optional,
    typeAnnotation: wrapNullable(
      nullable,
      translateFunctionTypeAnnotation(
        hasteModuleName,
        value,
        types,
        aliasMap,
        tryParse,
        cxxOnly,
      ),
    ),
  };
}

function isModuleInterface(node: $FlowFixMe) {
  return (
    node.type === 'InterfaceDeclaration' &&
    node.extends.length === 1 &&
    node.extends[0].type === 'InterfaceExtends' &&
    node.extends[0].id.name === 'TurboModule'
  );
}

function buildModuleSchema(
  hasteModuleName: string,
  /**
   * TODO(T71778680): Flow-type this node.
   */
  ast: $FlowFixMe,
  tryParse: ParserErrorCapturer,
): NativeModuleSchema {
  const types = getTypes(ast);
  const moduleSpecs = (Object.values(types): $ReadOnlyArray<$FlowFixMe>).filter(
    isModuleInterface,
  );

  throwIfModuleInterfaceNotFound(
    moduleSpecs.length,
    hasteModuleName,
    ast,
    language,
  );

  if (moduleSpecs.length > 1) {
    throw new MoreThanOneModuleInterfaceParserError(
      hasteModuleName,
      moduleSpecs,
      moduleSpecs.map(node => node.id.name),
      language,
    );
  }

  const [moduleSpec] = moduleSpecs;

  if (moduleSpec.id.name !== 'Spec') {
    throw new MisnamedModuleInterfaceParserError(
      hasteModuleName,
      moduleSpec.id,
      language,
    );
  }

  // Parse Module Names
  const moduleName = tryParse((): string => {
    const callExpressions = [];
    visit(ast, {
      CallExpression(node) {
        if (isModuleRegistryCall(node)) {
          callExpressions.push(node);
        }
      },
    });

    if (callExpressions.length === 0) {
      throw new UnusedModuleInterfaceParserError(
        hasteModuleName,
        moduleSpec,
        language,
      );
    }

    if (callExpressions.length > 1) {
      throw new MoreThanOneModuleRegistryCallsParserError(
        hasteModuleName,
        callExpressions,
        callExpressions.length,
        language,
      );
    }

    const [callExpression] = callExpressions;
    const {typeArguments} = callExpression;
    const methodName = callExpression.callee.property.name;

    if (callExpression.arguments.length !== 1) {
      throw new IncorrectModuleRegistryCallArityParserError(
        hasteModuleName,
        callExpression,
        methodName,
        callExpression.arguments.length,
        language,
      );
    }

    if (callExpression.arguments[0].type !== 'Literal') {
      const {type} = callExpression.arguments[0];
      throw new IncorrectModuleRegistryCallArgumentTypeParserError(
        hasteModuleName,
        callExpression.arguments[0],
        methodName,
        type,
        language,
      );
    }

    const $moduleName = callExpression.arguments[0].value;

    if (typeArguments == null) {
      throw new UntypedModuleRegistryCallParserError(
        hasteModuleName,
        callExpression,
        methodName,
        $moduleName,
        language,
      );
    }

    if (
      typeArguments.type !== 'TypeParameterInstantiation' ||
      typeArguments.params.length !== 1 ||
      typeArguments.params[0].type !== 'GenericTypeAnnotation' ||
      typeArguments.params[0].id.name !== 'Spec'
    ) {
      throw new IncorrectModuleRegistryCallTypeParameterParserError(
        hasteModuleName,
        typeArguments,
        methodName,
        $moduleName,
        language,
      );
    }

    return $moduleName;
  });

  const moduleNames = moduleName == null ? [] : [moduleName];

  // Some module names use platform suffix to indicate platform-exclusive modules.
  // Eventually this should be made explicit in the Flow type itself.
  // Also check the hasteModuleName for platform suffix.
  // Note: this shape is consistent with ComponentSchema.
  let cxxOnly = false;
  const excludedPlatforms = [];
  const namesToValidate = [...moduleNames, hasteModuleName];
  namesToValidate.forEach(name => {
    if (name.endsWith('Android')) {
      excludedPlatforms.push('iOS');
    } else if (name.endsWith('IOS')) {
      excludedPlatforms.push('android');
    } else if (name.endsWith('Cxx')) {
      cxxOnly = true;
      excludedPlatforms.push('iOS', 'android');
    }
  });

  // $FlowFixMe[missing-type-arg]
  return (moduleSpec.body.properties: $ReadOnlyArray<$FlowFixMe>)
    .filter(property => property.type === 'ObjectTypeProperty')
    .map<?{
      aliasMap: NativeModuleAliasMap,
      propertyShape: NativeModulePropertyShape,
    }>(property => {
      const aliasMap: {...NativeModuleAliasMap} = {};

      return tryParse(() => ({
        aliasMap: aliasMap,
        propertyShape: buildPropertySchema(
          hasteModuleName,
          property,
          types,
          aliasMap,
          tryParse,
          cxxOnly,
        ),
      }));
    })
    .filter(Boolean)
    .reduce(
      (moduleSchema: NativeModuleSchema, {aliasMap, propertyShape}) => {
        return {
          type: 'NativeModule',
          aliases: {...moduleSchema.aliases, ...aliasMap},
          spec: {
            properties: [...moduleSchema.spec.properties, propertyShape],
          },
          moduleNames: moduleSchema.moduleNames,
          excludedPlatforms: moduleSchema.excludedPlatforms,
        };
      },
      {
        type: 'NativeModule',
        aliases: {},
        spec: {properties: []},
        moduleNames: moduleNames,
        excludedPlatforms:
          excludedPlatforms.length !== 0 ? [...excludedPlatforms] : undefined,
      },
    );
}

module.exports = {
  buildModuleSchema,
};
