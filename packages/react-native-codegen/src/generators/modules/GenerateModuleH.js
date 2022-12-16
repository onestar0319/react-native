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

import type {
  Nullable,
  SchemaType,
  NativeModuleTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
  NativeModulePropertyShape,
  NativeModuleAliasMap,
} from '../../CodegenSchema';

import type {AliasResolver} from './Utils';
const {createAliasResolver, getModules} = require('./Utils');
const {indent} = require('../Utils');
const {unwrapNullable} = require('../../parsers/parsers-commons');

type FilesOutput = Map<string, string>;

const ModuleClassDeclarationTemplate = ({
  hasteModuleName,
  moduleProperties,
  structs,
}: $ReadOnly<{
  hasteModuleName: string,
  moduleProperties: string[],
  structs: string,
}>) => {
  return `${structs}class JSI_EXPORT ${hasteModuleName}CxxSpecJSI : public TurboModule {
protected:
  ${hasteModuleName}CxxSpecJSI(std::shared_ptr<CallInvoker> jsInvoker);

public:
  ${indent(moduleProperties.join('\n'), 2)}

};`;
};

const ModuleSpecClassDeclarationTemplate = ({
  hasteModuleName,
  moduleName,
  moduleProperties,
}: $ReadOnly<{
  hasteModuleName: string,
  moduleName: string,
  moduleProperties: string[],
}>) => {
  return `template <typename T>
class JSI_EXPORT ${hasteModuleName}CxxSpec : public TurboModule {
public:
  jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &propName) override {
    return delegate_.get(rt, propName);
  }

protected:
  ${hasteModuleName}CxxSpec(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule("${moduleName}", jsInvoker),
      delegate_(static_cast<T*>(this), jsInvoker) {}

private:
  class Delegate : public ${hasteModuleName}CxxSpecJSI {
  public:
    Delegate(T *instance, std::shared_ptr<CallInvoker> jsInvoker) :
      ${hasteModuleName}CxxSpecJSI(std::move(jsInvoker)), instance_(instance) {}

    ${indent(moduleProperties.join('\n'), 4)}

  private:
    T *instance_;
  };

  Delegate delegate_;
};`;
};

const FileTemplate = ({
  modules,
}: $ReadOnly<{
  modules: string[],
}>) => {
  return `/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GenerateModuleH.js
 */

#pragma once

#include <ReactCommon/TurboModule.h>
#include <react/bridging/Bridging.h>

namespace facebook {
namespace react {

${modules.join('\n\n')}

} // namespace react
} // namespace facebook
`;
};

function translatePrimitiveJSTypeToCpp(
  nullableTypeAnnotation: Nullable<NativeModuleTypeAnnotation>,
  optional: boolean,
  createErrorMessage: (typeName: string) => string,
  resolveAlias: AliasResolver,
) {
  const [typeAnnotation, nullable] = unwrapNullable<NativeModuleTypeAnnotation>(
    nullableTypeAnnotation,
  );
  const isRequired = !optional && !nullable;

  let realTypeAnnotation = typeAnnotation;
  if (realTypeAnnotation.type === 'TypeAliasTypeAnnotation') {
    realTypeAnnotation = resolveAlias(realTypeAnnotation.name);
  }

  function wrap(type: string) {
    return isRequired ? type : `std::optional<${type}>`;
  }

  switch (realTypeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return wrap('double');
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(createErrorMessage(realTypeAnnotation.name));
      }
    case 'VoidTypeAnnotation':
      return 'void';
    case 'StringTypeAnnotation':
      return wrap('jsi::String');
    case 'NumberTypeAnnotation':
      return wrap('double');
    case 'DoubleTypeAnnotation':
      return wrap('double');
    case 'FloatTypeAnnotation':
      return wrap('double');
    case 'Int32TypeAnnotation':
      return wrap('int');
    case 'BooleanTypeAnnotation':
      return wrap('bool');
    case 'EnumDeclaration':
      switch (realTypeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return wrap('double');
        case 'StringTypeAnnotation':
          return wrap('jsi::String');
        default:
          throw new Error(createErrorMessage(realTypeAnnotation.type));
      }
    case 'GenericObjectTypeAnnotation':
      return wrap('jsi::Object');
    case 'UnionTypeAnnotation':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return wrap('double');
        case 'ObjectTypeAnnotation':
          return wrap('jsi::Object');
        case 'StringTypeAnnotation':
          return wrap('jsi::String');
        default:
          throw new Error(createErrorMessage(realTypeAnnotation.type));
      }
    case 'ObjectTypeAnnotation':
      return wrap('jsi::Object');
    case 'ArrayTypeAnnotation':
      return wrap('jsi::Array');
    case 'FunctionTypeAnnotation':
      return wrap('jsi::Function');
    case 'PromiseTypeAnnotation':
      return wrap('jsi::Value');
    case 'MixedTypeAnnotation':
      return wrap('jsi::Value');
    default:
      (realTypeAnnotation.type: empty);
      throw new Error(createErrorMessage(realTypeAnnotation.type));
  }
}

function createStructs(
  moduleName: string,
  aliasMap: NativeModuleAliasMap,
  resolveAlias: AliasResolver,
): string {
  return Object.keys(aliasMap)
    .map(alias => {
      const value = aliasMap[alias];
      if (value.properties.length === 0) {
        return '';
      }
      const structName = `${moduleName}Base${alias}`;
      const templateParameterWithTypename = value.properties
        .map((v, i) => 'typename P' + i)
        .join(', ');
      const templateParameter = value.properties
        .map((v, i) => 'P' + i)
        .join(', ');
      const paramemterConversion = value.properties
        .map((v, i) => {
          const translatedParam = translatePrimitiveJSTypeToCpp(
            v.typeAnnotation,
            false,
            typeName =>
              `Unsupported type for param "${v.name}". Found: ${typeName}`,
            resolveAlias,
          );
          return `  static ${translatedParam} ${v.name}ToJs(jsi::Runtime &rt, P${i} value) {
    return bridging::toJs(rt, value);
  }`;
        })
        .join('\n');
      return `#pragma mark - ${structName}

template <${templateParameterWithTypename}>
struct ${structName} {
${value.properties.map((v, i) => '  P' + i + ' ' + v.name).join(';\n')};
  bool operator==(const ${structName} &other) const {
    return ${value.properties
      .map(v => `${v.name} == other.${v.name}`)
      .join(' && ')};
  }
};

template <${templateParameterWithTypename}>
struct ${structName}Bridging {
  static ${structName}<${templateParameter}> fromJs(
      jsi::Runtime &rt,
      const jsi::Object &value,
      const std::shared_ptr<CallInvoker> &jsInvoker) {
    ${structName}<${templateParameter}> result{
${value.properties
  .map(
    (v, i) =>
      `      bridging::fromJs<P${i}>(rt, value.getProperty(rt, "${v.name}"), jsInvoker)`,
  )
  .join(',\n')}};
    return result;
  }

#ifdef DEBUG
${paramemterConversion}
#endif

  static jsi::Object toJs(
    jsi::Runtime &rt,
    const ${structName}<${templateParameter}> &value,
    const std::shared_ptr<CallInvoker> &jsInvoker) {
      auto result = facebook::jsi::Object(rt);
      ${value.properties
        .map((v, i) => {
          if (v.optional) {
            return `    if (value.${v.name}) {
            result.setProperty(rt, "${v.name}", bridging::toJs(rt, value.${v.name}.value(), jsInvoker));
          }`;
          } else {
            return `    result.setProperty(rt, "${v.name}", bridging::toJs(rt, value.${v.name}, jsInvoker));`;
          }
        })
        .join('\n')}
          return result;
        }
      };

`;
    })
    .join('\n');
}

function translatePropertyToCpp(
  prop: NativeModulePropertyShape,
  resolveAlias: AliasResolver,
  abstract: boolean = false,
) {
  const [propTypeAnnotation] =
    unwrapNullable<NativeModuleFunctionTypeAnnotation>(prop.typeAnnotation);

  const params = propTypeAnnotation.params.map(
    param => `std::move(${param.name})`,
  );

  const paramTypes = propTypeAnnotation.params.map(param => {
    const translatedParam = translatePrimitiveJSTypeToCpp(
      param.typeAnnotation,
      param.optional,
      typeName =>
        `Unsupported type for param "${param.name}" in ${prop.name}. Found: ${typeName}`,
      resolveAlias,
    );
    return `${translatedParam} ${param.name}`;
  });

  const returnType = translatePrimitiveJSTypeToCpp(
    propTypeAnnotation.returnTypeAnnotation,
    false,
    typeName => `Unsupported return type for ${prop.name}. Found: ${typeName}`,
    resolveAlias,
  );

  // The first param will always be the runtime reference.
  paramTypes.unshift('jsi::Runtime &rt');

  const method = `${returnType} ${prop.name}(${paramTypes.join(', ')})`;

  if (abstract) {
    return `virtual ${method} = 0;`;
  }

  return `${method} override {
  static_assert(
      bridging::getParameterCount(&T::${prop.name}) == ${paramTypes.length},
      "Expected ${prop.name}(...) to have ${paramTypes.length} parameters");

  return bridging::callFromJs<${returnType}>(
      rt, &T::${prop.name}, jsInvoker_, ${['instance_', ...params].join(', ')});
}`;
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean = false,
  ): FilesOutput {
    const nativeModules = getModules(schema);

    const modules = Object.keys(nativeModules).flatMap(hasteModuleName => {
      const {
        aliases,
        spec: {properties},
        moduleName,
      } = nativeModules[hasteModuleName];
      const resolveAlias = createAliasResolver(aliases);
      const structs = createStructs(moduleName, aliases, resolveAlias);

      return [
        ModuleClassDeclarationTemplate({
          hasteModuleName,
          moduleProperties: properties.map(prop =>
            translatePropertyToCpp(prop, resolveAlias, true),
          ),
          structs,
        }),
        ModuleSpecClassDeclarationTemplate({
          hasteModuleName,
          moduleName,
          moduleProperties: properties.map(prop =>
            translatePropertyToCpp(prop, resolveAlias),
          ),
        }),
      ];
    });

    const fileName = `${libraryName}JSI.h`;
    const replacedTemplate = FileTemplate({modules});

    return new Map([[fileName, replacedTemplate]]);
  },
};
