/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const RNCodegen = require('../packages/react-native-codegen/lib/generators/RNCodegen.js');
const fs = require('fs');
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');

function generateSpec(platform, schemaPath, outputDirectory) {
  const libraryName = 'FBReactNativeSpec';
  const moduleSpecName = 'FBReactNativeSpec';
  const schemaText = fs.readFileSync(schemaPath, 'utf-8');

  if (schemaText == null) {
    throw new Error(`Can't find schema at ${schemaPath}`);
  }

  const tempOutputDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'react-native-codegen-'),
  );

  let schema;
  try {
    schema = JSON.parse(schemaText);
  } catch (err) {
    throw new Error(`Can't parse schema to JSON. ${schemaPath}`);
  }

  RNCodegen.generate(
    {libraryName, schema, outputDirectory: tempOutputDirectory, moduleSpecName},
    {
      generators: ['modules'],
    },
  );

  if (!outputDirectory) {
    outputDirectory = path.resolve(
      __dirname,
      '..',
      'Libraries',
      libraryName,
      moduleSpecName,
    );
  }
  mkdirp.sync(outputDirectory);

  if (platform === 'ios') {
    const fileNames = [`${moduleSpecName}.h`, `${moduleSpecName}-generated.mm`];
    fileNames.forEach(fileName => {
      const newOutput = `${tempOutputDirectory}/${fileName}`;
      const prevOutput = `${outputDirectory}/${fileName}`;
      fs.copyFileSync(newOutput, prevOutput);
    });
  } else if (platform === 'android') {
    // Copy all .java files for now.
    // TODO: Build sufficient support for producing Java package directories based
    // on preferred package name.
    const files = fs.readdirSync(tempOutputDirectory);
    files
      .filter(f => f.endsWith('.java'))
      .forEach(f => {
        fs.copyFileSync(
          `${tempOutputDirectory}/${f}`,
          `${outputDirectory}/${f}`,
        );
      });
  }
}

function main() {
  const args = process.argv.slice(2);
  const platform = args[0];
  const schemaPath = args[1];
  const outputDir = args[2];
  generateSpec(platform, schemaPath, outputDir);
}

main();
