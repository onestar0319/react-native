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
  ComponentSchema,
  NativeModuleSchema,
  SchemaType,
} from '../../CodegenSchema.js';

const assert = require('assert');
const fs = require('fs');
const util = require('util');

const {values: args} = util.parseArgs({
  options: {
    platform: {
      type: 'string',
    },
    output: {
      type: 'string',
    },
    ['schema-query']: {
      type: 'string',
    },
  },
});
if (!['iOS', 'android'].includes(args.platform)) {
  throw new Error(`Invalid platform ${args.platform}`);
}
const platform = args.platform;
const output = args.output;
const schemaQuery: string = args['schema-query'];

if (!schemaQuery.startsWith('@')) {
  throw new Error(
    "The argument provided to --schema-query must be a filename that starts with '@'.",
  );
}

const schemaQueryOutputFile = schemaQuery.replace(/^@/, '');
const schemaQueryOutput = fs.readFileSync(schemaQueryOutputFile, 'utf8');

const schemaFiles = schemaQueryOutput.split(' ');
const modules: {
  [hasteModuleName: string]: NativeModuleSchema | ComponentSchema,
} = {};
const specNameToFile: {[hasteModuleName: string]: string} = {};

for (const file of schemaFiles) {
  const schema: SchemaType = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (schema.modules) {
    for (const specName in schema.modules) {
      const module = schema.modules[specName];
      if (modules[specName]) {
        assert.deepEqual(
          module,
          modules[specName],
          `App contained two specs with the same file name '${specName}'. Schemas: ${specNameToFile[specName]}, ${file}. Please rename one of the specs.`,
        );
      }

      if (
        module.excludedPlatforms &&
        module.excludedPlatforms.indexOf(platform) >= 0
      ) {
        continue;
      }

      modules[specName] = module;
      specNameToFile[specName] = file;
    }
  }
}

fs.writeFileSync(output, JSON.stringify({modules}, null, 2));
