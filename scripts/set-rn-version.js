/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script updates relevant React Native files with supplied version:
 *   * Prepares a package.json suitable for package consumption
 *   * Updates package.json for template project
 *   * Updates the version in gradle files and makes sure they are consistent between each other
 *   * Creates a gemfile
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {cat, echo, exec, exit, sed} = require('shelljs');
const yargs = require('yargs');
const {parseVersion, validateBuildType} = require('./version-utils');
const {saveFiles} = require('./scm-utils');

let argv = yargs
  .option('v', {
    alias: 'to-version',
    type: 'string',
    required: true,
  })
  .option('b', {
    alias: 'build-type',
    type: 'string',
    required: true,
  }).argv;

const buildType = argv.buildType;
const version = argv.toVersion;

try {
  validateBuildType(buildType);
} catch (e) {
  throw e;
}

let major,
  minor,
  patch,
  prerelease = -1;
try {
  ({major, minor, patch, prerelease} = parseVersion(version, buildType));
} catch (e) {
  throw e;
}

const tmpVersioningFolder = fs.mkdtempSync(
  path.join(os.tmpdir(), 'rn-set-version'),
);
echo(`The temp versioning folder is ${tmpVersioningFolder}`);

saveFiles(
  [
    'packages/react-native/package.json',
    'packages/react-native/template/package.json',
  ],
  tmpVersioningFolder,
);

fs.writeFileSync(
  'packages/react-native/ReactAndroid/src/main/java/com/facebook/react/modules/systeminfo/ReactNativeVersion.java',
  cat('scripts/versiontemplates/ReactNativeVersion.java.template')
    .replace('${major}', major)
    .replace('${minor}', minor)
    .replace('${patch}', patch)
    .replace(
      '${prerelease}',
      prerelease !== undefined ? `"${prerelease}"` : 'null',
    ),
  'utf-8',
);

fs.writeFileSync(
  'packages/react-native/React/Base/RCTVersion.m',
  cat('scripts/versiontemplates/RCTVersion.m.template')
    .replace('${major}', `@(${major})`)
    .replace('${minor}', `@(${minor})`)
    .replace('${patch}', `@(${patch})`)
    .replace(
      '${prerelease}',
      prerelease !== undefined ? `@"${prerelease}"` : '[NSNull null]',
    ),
  'utf-8',
);

fs.writeFileSync(
  'packages/react-native/ReactCommon/cxxreact/ReactNativeVersion.h',
  cat('scripts/versiontemplates/ReactNativeVersion.h.template')
    .replace('${major}', major)
    .replace('${minor}', minor)
    .replace('${patch}', patch)
    .replace(
      '${prerelease}',
      prerelease !== undefined ? `"${prerelease}"` : '""',
    ),
  'utf-8',
);

fs.writeFileSync(
  'packages/react-native/Libraries/Core/ReactNativeVersion.js',
  cat('scripts/versiontemplates/ReactNativeVersion.js.template')
    .replace('${major}', major)
    .replace('${minor}', minor)
    .replace('${patch}', patch)
    .replace(
      '${prerelease}',
      prerelease !== undefined ? `'${prerelease}'` : 'null',
    ),
  'utf-8',
);

const packageJson = JSON.parse(cat('packages/react-native/package.json'));
packageJson.version = version;

fs.writeFileSync(
  'packages/react-native/package.json',
  JSON.stringify(packageJson, null, 2),
  'utf-8',
);

// Change ReactAndroid/gradle.properties
saveFiles(
  ['packages/react-native/ReactAndroid/gradle.properties'],
  tmpVersioningFolder,
);
if (
  sed(
    '-i',
    /^VERSION_NAME=.*/,
    `VERSION_NAME=${version}`,
    'packages/react-native/ReactAndroid/gradle.properties',
  ).code
) {
  echo("Couldn't update version for Gradle");
  exit(1);
}

// Change react-native version in the template's package.json
exec(`node scripts/set-rn-template-version.js ${version}`);

// Verify that files changed, we just do a git diff and check how many times version is added across files
const filesToValidate = [
  'packages/react-native/package.json',
  'packages/react-native/ReactAndroid/gradle.properties',
  'packages/react-native/template/package.json',
];

const numberOfChangedLinesWithNewVersion = exec(
  `diff -r ${tmpVersioningFolder} . | grep '^[>]' | grep -c ${version} `,
  {silent: true},
).stdout.trim();

if (+numberOfChangedLinesWithNewVersion !== filesToValidate.length) {
  // TODO: the logic that checks whether all the changes have been applied
  // is missing several files. For example, it is not checking Ruby version nor that
  // the Objecive-C files, the codegen and other files are properly updated.
  // We are going to work on this in another PR.
  echo('WARNING:');
  echo(
    `Failed to update all the files: [${filesToValidate.join(
      ', ',
    )}] must have versions in them`,
  );
  echo(`These files already had version ${version} set.`);
}

exit(0);
