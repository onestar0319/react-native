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

// File path -> contents
type FilesOutput = Map<string, string>;

const FileTemplate = ({
  componentNames,
  headerPrefix,
}: {
  componentNames: string,
  headerPrefix: string,
}) => `
/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * ${'@'}generated by codegen project: GenerateShadowNodeCpp.js
 */

#include <${headerPrefix}ShadowNodes.h>

namespace facebook::react {

${componentNames}

} // namespace facebook::react
`;

const ComponentTemplate = ({className}: {className: string}) =>
  `
extern const char ${className}ComponentName[] = "${className}";
`.trim();

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
    assumeNonnull: boolean = false,
    headerPrefix?: string,
  ): FilesOutput {
    const fileName = 'ShadowNodes.cpp';

    const componentNames = Object.keys(schema.modules)
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
            if (components[componentName].interfaceOnly === true) {
              return;
            }
            const replacedTemplate = ComponentTemplate({
              className: componentName,
            });

            return replacedTemplate;
          })
          .join('\n');
      })
      .filter(Boolean)
      .join('\n');

    const replacedTemplate = FileTemplate({
      componentNames,
      headerPrefix: headerPrefix ?? '',
    });

    return new Map([[fileName, replacedTemplate]]);
  },
};
