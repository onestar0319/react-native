/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

/**
 * This script publishes a new version of react-native to NPM.
 * It is supposed to run in CI environment, not on a developer's machine.
 *
 * To make it easier for developers it uses some logic to identify with which version to publish the package.
 *
 * To cut a branch (and release RC):
 * - Developer: `git checkout -b 0.XY-stable`
 * - Developer: `git tag v0.XY.0-rc` and `git push --tags` to git@github.com:facebook/react-native.git
 * - CI: test and deploy to npm (run this script) with version 0.XY.0-rc with tag "next"
 *
 * To update RC release:
 * - Developer: `git checkout 0.XY-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `git tag v0.XY.0-rc1` and `git push --tags` to git@github.com:facebook/react-native.git
 * - CI: test and deploy to npm (run this script) with version 0.XY.0-rc1 with tag "next"
 *
 * To publish a release:
 * - Developer: `git checkout 0.XY-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `git tag latest`
 * - Developer: `git tag v0.XY.0`
 * - Developer: `git push --tags` to git@github.com:facebook/react-native.git
 * - CI: test and deploy to npm (run this script) with version 0.XY.0 with and not tag (latest is implied by npm)
 *
 * To patch old release:
 * - Developer: `git checkout 0.XY-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `git tag v0.XY.Z`
 * - Developer: `git push` to git@github.com:facebook/react-native.git (or merge as pull request)
 * - CI: test and deploy to npm (run this script) with version 0.XY.Z with no tag, npm will not mark it as latest if
 * there is a version higher than XY
 *
 * Important tags:
 * If tag v0.XY.0-rcZ is present on the commit then publish to npm with version 0.XY.0-rcZ and tag next
 * If tag v0.XY.Z is present on the commit then publish to npm with version 0.XY.Z and no tag (npm will consider it latest)
 */

/*eslint-disable no-undef */
require(`shelljs/global`);

const buildBranch = process.env.CIRCLE_BRANCH;
const requiredJavaVersion = `1.7`;

let branchVersion;
if (buildBranch.indexOf(`-stable`) !== -1) {
  branchVersion = buildBranch.slice(0, buildBranch.indexOf(`-stable`));
} else {
  echo(`Error: We publish only from stable branches`);
  exit(0);
}

// ['latest', 'v0.33.0', 'v0.33.0-rc', 'v0.33.0-rc1', 'v0.33.0-rc2', 'v0.34.0', '']
const tagsWithVersion = exec(`git tag -l --points-at HEAD`).stdout.split(/\s/)
  // ['v0.33.0', 'v0.33.0-rc', 'v0.33.0-rc1', 'v0.33.0-rc2', 'v0.34.0']
  .filter(version => !!version && version.indexOf(`v${branchVersion}`) === 0)
  // ['v0.33.0', 'v0.33.0-rc', 'v0.33.0-rc1', 'v0.33.0-rc2']
  .filter(version => version.indexOf(branchVersion) !== -1);

if (tagsWithVersion.length === 0) {
  echo(`Error: Can't find version tag in current commit. To deploy to NPM you must add tag v0.XY.Z[-rc] to your commit`);
  exit(1);
}
let releaseVersion;
if (tagsWithVersion[0].indexOf(`-rc`) === -1) {
  // if first tag on this commit is non -rc then we are making a stable release
  // '0.33.0'
  releaseVersion = tagsWithVersion[0].slice(1);
} else {
  // otherwise pick last -rc tag alphabetically
  // 0.33.0-rc2
  releaseVersion = tagsWithVersion[tagsWithVersion.length - 1].slice(1);
}

// -------- Generating Android Artifacts with JavaDoc
// Java -version outputs to stderr 0_o
const javaVersion = exec(`java -version`).stderr;
if (javaVersion.indexOf(requiredJavaVersion) === -1) {
  echo(`Java version must be 1.7.x in order to generate Javadoc. Check: java -version`);
  exit(1);
}

if (sed(`-i`, /^VERSION_NAME=[0-9\.]*-SNAPSHOT/, `VERSION_NAME=${releaseVersion}`, `ReactAndroid/gradle.properties`).code) {
  echo(`Couldn't update version for Gradle`);
  exit(1);
}

// Uncomment Javadoc generation
if (sed(`-i`, `// archives androidJavadocJar`, `archives androidJavadocJar`, `ReactAndroid/release.gradle`).code) {
  echo(`Couldn't enable Javadoc generation`);
  exit(1);
}

if (exec(`./gradlew :ReactAndroid:installArchives`).code) {
  echo(`Couldn't generate artifacts`);
  exit(1);
}

echo("Generated artifacts for Maven");

let artifacts = ['-javadoc.jar', '-sources.jar', '.aar', '.pom'].map((suffix) => {
  return `react-native-${releaseVersion}${suffix}`;
});

artifacts.forEach((name) => {
  if (!test(`-e`, `./android/com/facebook/react/react-native/${releaseVersion}/${name}`)) {
    echo(`file ${name} was not generated`);
    exit(1);
  }
});

// ----------- Reverting changes to local files

exec(`git checkout ReactAndroid/gradle.properties`);
exec(`git checkout ReactAndroid/release.gradle`);


if (exec(`npm version --no-git-tag-version ${releaseVersion}`).code) {
  echo(`Couldn't update version for npm`);
  exit(1);
}
if (sed(`-i`, `s.version             = "0.0.1-master"`, `s.version             = \"${releaseVersion}\"`, `React.podspec`).code) {
  echo(`Couldn't update version for React.podspec`);
  exit(1);
}

// shrinkwrapping without dev dependencies
exec(`npm shrinkwrap`);
if (releaseVersion.indexOf(`-rc`) === -1) {
  // release, package will be installed by default
  exec(`npm publish`);
} else {
  // RC release, package will be installed only if users specifically do it
  exec(`npm publish --tag next`);
}

exec(`git checkout package.json`);
exec(`git checkout React.podspec`);

echo(`Published to npm ${releaseVersion}`);

exit(0);
/*eslint-enable no-undef */
