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
import type {ComponentShape, PropTypeAnnotation} from '../../CodegenSchema';
import type {SchemaType} from '../../CodegenSchema';

const {getImports} = require('./CppHelpers');

const {toSafeCppString} = require('../Utils');

type FilesOutput = Map<string, string>;
type PropValueType = string | number | boolean;

type TestCase = $ReadOnly<{
  propName: string,
  propValue: ?PropValueType,
  testName?: string,
  raw?: boolean,
}>;

const FileTemplate = ({
  libraryName,
  imports,
  componentTests,
}: {
  libraryName: string,
  imports: string,
  componentTests: string,
}) =>
  `
/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GenerateTests.js
 * */

#include <gtest/gtest.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/components/${libraryName}/Props.h>
${imports}

using namespace facebook::react;
${componentTests}
`.trim();

const TestTemplate = ({
  componentName,
  testName,
  propName,
  propValue,
}: {
  componentName: string,
  testName: string,
  propName: string,
  propValue: string,
}) => `
TEST(${componentName}_${testName}, etc) {
  auto propParser = RawPropsParser();
  propParser.prepare<${componentName}>();
  auto const &sourceProps = ${componentName}();
  auto const &rawProps = RawProps(folly::dynamic::object("${propName}", ${propValue}));

  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  rawProps.parse(propParser, parserContext);
  ${componentName}(parserContext, sourceProps, rawProps);
}
`;

function getTestCasesForProp(
  propName: string,
  typeAnnotation: PropTypeAnnotation,
) {
  const cases = [];
  if (typeAnnotation.type === 'StringEnumTypeAnnotation') {
    typeAnnotation.options.forEach(option =>
      cases.push({
        propName,
        testName: `${propName}_${toSafeCppString(option)}`,
        propValue: option,
      }),
    );
  } else if (typeAnnotation.type === 'StringTypeAnnotation') {
    cases.push({
      propName,
      propValue:
        typeAnnotation.default != null && typeAnnotation.default !== ''
          ? typeAnnotation.default
          : 'foo',
    });
  } else if (typeAnnotation.type === 'BooleanTypeAnnotation') {
    cases.push({
      propName: propName,
      propValue: typeAnnotation.default != null ? typeAnnotation.default : true,
    });
    // $FlowFixMe[incompatible-type]
  } else if (typeAnnotation.type === 'IntegerTypeAnnotation') {
    cases.push({
      propName,
      propValue: typeAnnotation.default || 10,
    });
  } else if (typeAnnotation.type === 'FloatTypeAnnotation') {
    cases.push({
      propName,
      propValue: typeAnnotation.default != null ? typeAnnotation.default : 0.1,
    });
  } else if (typeAnnotation.type === 'ReservedPropTypeAnnotation') {
    if (typeAnnotation.name === 'ColorPrimitive') {
      cases.push({
        propName,
        propValue: 1,
      });
    } else if (typeAnnotation.name === 'PointPrimitive') {
      cases.push({
        propName,
        propValue: 'folly::dynamic::object("x", 1)("y", 1)',
        raw: true,
      });
    } else if (typeAnnotation.name === 'ImageSourcePrimitive') {
      cases.push({
        propName,
        propValue: 'folly::dynamic::object("url", "testurl")',
        raw: true,
      });
    }
  }

  return cases;
}

function generateTestsString(name: string, component: ComponentShape) {
  function createTest({testName, propName, propValue, raw = false}: TestCase) {
    const value =
      !raw && typeof propValue === 'string' ? `"${propValue}"` : propValue;

    return TestTemplate({
      componentName: name,
      testName: testName != null ? testName : propName,
      propName,
      propValue: String(value),
    });
  }

  const testCases = component.props.reduce((cases: Array<TestCase>, prop) => {
    return cases.concat(getTestCasesForProp(prop.name, prop.typeAnnotation));
  }, []);

  const baseTest = {
    testName: 'DoesNotDie',
    propName: 'xx_invalid_xx',
    propValue: 'xx_invalid_xx',
  };

  return [baseTest, ...testCases].map(createTest).join('');
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean = false,
  ): FilesOutput {
    const fileName = 'Tests.cpp';
    const allImports = new Set([
      '#include <react/renderer/core/propsConversions.h>',
      '#include <react/renderer/core/RawProps.h>',
      '#include <react/renderer/core/RawPropsParser.h>',
    ]);

    const componentTests = Object.keys(schema.modules)
      .map(moduleName => {
        const module = schema.modules[moduleName];
        if (module.type !== 'Component') {
          return;
        }

        const {components} = module;
        if (components == null) {
          return null;
        }

        return Object.keys(components)
          .map(componentName => {
            const component = components[componentName];
            const name = `${componentName}Props`;

            const imports = getImports(component.props);
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            imports.forEach(allImports.add, allImports);

            return generateTestsString(name, component);
          })
          .join('');
      })
      .filter(Boolean)
      .join('');

    const imports = Array.from(allImports).sort().join('\n').trim();

    const replacedTemplate = FileTemplate({
      imports,
      libraryName,
      componentTests,
    });

    return new Map([[fileName, replacedTemplate]]);
  },
};
