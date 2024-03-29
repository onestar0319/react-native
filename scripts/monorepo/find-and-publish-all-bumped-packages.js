/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {publishPackage} = require('../npm-utils');
const {PUBLISH_PACKAGES_TAG} = require('./constants');
const forEachPackage = require('./for-each-package');
const {spawnSync} = require('child_process');
const path = require('path');

const ROOT_LOCATION = path.join(__dirname, '..', '..');
const NPM_CONFIG_OTP = process.env.NPM_CONFIG_OTP;

function getTagsFromCommitMessage(msg) {
  // ex message we're trying to parse tags out of
  // `_some_message_here_${PUBLISH_PACKAGES_TAG}&tagA&tagB\n`;
  return msg
    .substring(msg.indexOf(PUBLISH_PACKAGES_TAG))
    .trim()
    .split('&')
    .slice(1);
}

const findAndPublishAllBumpedPackages = () => {
  console.log('Traversing all packages inside /packages...');

  forEachPackage(
    (packageAbsolutePath, packageRelativePathFromRoot, packageManifest) => {
      if (packageManifest.private) {
        console.log(`\u23ED Skipping private package ${packageManifest.name}`);

        return;
      }

      const {stdout: diff, stderr: commitDiffStderr} = spawnSync(
        'git',
        [
          'log',
          '-p',
          '--format=""',
          'HEAD~1..HEAD',
          `${packageRelativePathFromRoot}/package.json`,
        ],
        {cwd: ROOT_LOCATION, shell: true, stdio: 'pipe', encoding: 'utf-8'},
      );

      if (commitDiffStderr) {
        console.log(
          `\u274c Failed to get latest committed changes for ${packageManifest.name}:`,
        );
        console.log(commitDiffStderr);

        process.exit(1);
      }

      const previousVersionPatternMatches = diff.match(
        /- {2}"version": "([0-9]+.[0-9]+.[0-9]+)"/,
      );

      if (!previousVersionPatternMatches) {
        console.log(`\uD83D\uDD0E No version bump for ${packageManifest.name}`);

        return;
      }

      const {stdout: commitMessage, stderr: commitMessageStderr} = spawnSync(
        'git',
        [
          'log',
          '-n',
          '1',
          '--format=format:%B',
          `${packageRelativePathFromRoot}/package.json`,
        ],
        {cwd: ROOT_LOCATION, shell: true, stdio: 'pipe', encoding: 'utf-8'},
      );

      if (commitMessageStderr) {
        console.log(
          `\u274c Failed to get latest commit message for ${packageManifest.name}:`,
        );
        console.log(commitMessageStderr);

        process.exit(1);
      }

      const hasSpecificPublishTag =
        commitMessage.includes(PUBLISH_PACKAGES_TAG);

      if (!hasSpecificPublishTag) {
        throw new Error(
          `Package ${packageManifest.name} was updated, but not through CI script`,
        );
      }

      const [, previousVersion] = previousVersionPatternMatches;
      const nextVersion = packageManifest.version;

      console.log(
        `\uD83D\uDCA1 ${packageManifest.name} was updated: ${previousVersion} -> ${nextVersion}`,
      );

      if (!nextVersion.startsWith('0.')) {
        throw new Error(
          `Package version expected to be 0.x.y, but received ${nextVersion}`,
        );
      }

      const tags = getTagsFromCommitMessage(commitMessage);

      const result = publishPackage(packageAbsolutePath, {
        tags,
        otp: NPM_CONFIG_OTP,
      });
      if (result.code !== 0) {
        console.log(
          `\u274c Failed to publish version ${nextVersion} of ${packageManifest.name}. npm publish exited with code ${result.code}:`,
        );
        console.log(result.stderr);

        process.exit(1);
      } else {
        console.log(
          `\u2705 Successfully published new version of ${packageManifest.name}`,
        );
      }
    },
  );

  process.exit(0);
};

if (require.main === module) {
  findAndPublishAllBumpedPackages();
}

module.exports = {
  findAndPublishAllBumpedPackages,
  getTagsFromCommitMessage,
};
