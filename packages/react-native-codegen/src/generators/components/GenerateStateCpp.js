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
  NamedShape,
  SchemaType,
  StateTypeAnnotation,
} from '../../CodegenSchema';
const {capitalize} = require('../Utils.js');
const {
  getStateConstituents,
  convertGettersReturnTypeToAddressType,
  convertVarValueToPointer,
} = require('./ComponentsGeneratorUtils.js');

// File path -> contents
type FilesOutput = Map<string, string>;

const FileTemplate = ({
  libraryName,
  stateGetters,
}: {
  libraryName: string,
  stateGetters: string,
}) => `
/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GenerateStateCpp.js
 */
#include <react/renderer/components/${libraryName}/States.h>

namespace facebook {
namespace react {

${stateGetters}

} // namespace react
} // namespace facebook
`;

function generateStrings(
  componentName: string,
  state: $ReadOnlyArray<NamedShape<StateTypeAnnotation>>,
) {
  let getters = '';
  state.forEach(stateShape => {
    const {name, varName, type} = getStateConstituents(
      componentName,
      stateShape,
    );

    getters += `
${convertGettersReturnTypeToAddressType(
  type,
)} ${componentName}State::get${capitalize(name)}() const {
  return ${convertVarValueToPointer(type, varName)};
}
`;
  });

  return getters.trim();
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean = false,
  ): FilesOutput {
    const fileName = 'States.cpp';

    const stateGetters = Object.keys(schema.modules)
      .map(moduleName => {
        const module = schema.modules[moduleName];
        if (module.type !== 'Component') {
          return;
        }

        const {components} = module;
        // No components in this module
        if (components == null) {
          return null;
        }

        return Object.keys(components)
          .map(componentName => {
            const component = components[componentName];
            if (component.interfaceOnly === true) {
              return null;
            }

            const state = component.state;
            if (!state) {
              return '';
            }
            return generateStrings(componentName, state);
          })
          .filter(Boolean)
          .join('\n');
      })
      .filter(Boolean)
      .join('\n');

    const replacedTemplate = FileTemplate({
      libraryName,
      stateGetters,
    });

    return new Map([[fileName, replacedTemplate]]);
  },
};
