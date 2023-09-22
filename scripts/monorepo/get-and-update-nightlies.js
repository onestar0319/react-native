/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const forEachPackage = require('./for-each-package');
const {publishPackage} = require('../npm-utils');
const path = require('path');
const {writeFileSync} = require('fs');
const {getPackageVersionStrByTag} = require('../npm-utils');

/**
 * Get the latest nightly version of each monorepo package and publishes a new nightly if there have been updates.
 * Returns a map of monorepo packages and its latest nightly version.
 *
 * This is called by `react-native`'s nightly job.
 * Note: This does not publish `package/react-native`'s nightly. That is handled in `publish-npm`.
 */
function getAndUpdateNightlies(
  nightlyVersion /*: string */,
) /*: {| [string]: string|}*/ {
  const packages = getPackagesToPublish();

  updateDependencies(packages, nightlyVersion);

  publishPackages(packages);

  return reducePackagesToNameVersion(packages);
}

/*::
type PackageMap = {|[string]: PackageMetadata |}
type PackageMetadata = {|
    // The absolute path to the package
    path: string,

    // The parsed package.json contents
    packageJson: Object,
|};
*/

/**
 * Extract package metadata from the monorepo
 * It skips react-native, the packages marked as private and packages not already published on NPM.
 *
 * @return Dictionary<String, PackageMetadata> where the string is the name of the package and the PackageMetadata
 * is an object that contains the absolute path to the package and the packageJson.
 */
function getPackagesToPublish() /*: PackageMap */ {
  let packages = {};

  forEachPackage(
    (packageAbsolutePath, packageRelativePathFromRoot, packageManifest) => {
      if (packageManifest.private || !isPublishedOnNPM(packageManifest.name)) {
        console.log(
          `\u23F1 Skipping nightly for ${packageManifest.name}. It is either pivate or unpublished`,
        );
        return;
      }
      packages[packageManifest.name] = {
        path: packageAbsolutePath,
        packageJson: packageManifest,
      };
    },
  );

  return packages;
}

function isPublishedOnNPM(packageName /*: string */) /*: boolean */ {
  try {
    getPackageVersionStrByTag(packageName);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Update the dependencies in the packages to the passed nightlyVersion.
 * The function update the packages dependencies and devDepenencies if they contains other packages in the monorepo.
 * The function also writes the updated package.json to disk.
 */
function updateDependencies(
  packages /*: PackageMap */,
  nightlyVersion /*: string */,
) {
  Object.keys(packages).forEach(packageName => {
    const package = packages[packageName];
    const packageManifest = package.packageJson;

    if (packageManifest.dependencies) {
      for (const dependency of Object.keys(packageManifest.dependencies)) {
        if (packages[dependency]) {
          // the dependency is in the monorepo
          packages[packageName].packageJson.dependencies[dependency] =
            nightlyVersion;
        }
      }
    }

    if (packageManifest.devDependencies) {
      for (const dependency of Object.keys(packageManifest.devDependencies)) {
        if (packages[dependency]) {
          // the dependency is in the monorepo
          packages[packageName].packageJson.devDependencies[dependency] =
            nightlyVersion;
        }
      }
    }

    packages[packageName].packageJson.version = nightlyVersion;

    writeFileSync(
      path.join(packages[packageName].path, 'package.json'),
      JSON.stringify(packages[packageName].packageJson, null, 2) + '\n',
      'utf-8',
    );
  });
}

/**
 * Publish the passed set of packages to npm with the `nightly` tag.
 * In case a package fails to be published, it throws an error, stopping the nightly publishing completely
 */
function publishPackages(packages /*: PackageMap */) {
  for (const [packageName, packageMetadata] of Object.entries(packages)) {
    const packageAbsolutePath = packageMetadata.path;
    const nightlyVersion = packageMetadata.packageJson.version;

    const result = publishPackage(packageAbsolutePath, {
      tag: 'nightly',
      otp: process.env.NPM_CONFIG_OTP,
    });

    if (result.code !== 0) {
      throw new Error(
        `\u274c Failed to publish version ${nightlyVersion} of ${packageName}. npm publish exited with code ${result.code}:`,
      );
    }

    console.log(`\u2705 Successfully published new version of ${packageName}`);
  }
}

/**
 * Reduces the Dictionary<String, PackageMetadata> to a Dictionary<String, String>.
 * where the key is the name of the package and the value is the version number.
 *
 * @return Dictionary<String, String> with package name and the new version number.
 */
function reducePackagesToNameVersion(
  packages /*: PackageMap */,
) /*: {| [string]: string |} */ {
  return Object.keys(packages).reduce(
    (result /*: {| [string]: string |} */, name /*: string */) => {
      result[name] = packages[name].packageJson.version;
      return result;
    },
    {},
  );
}

module.exports = getAndUpdateNightlies;
