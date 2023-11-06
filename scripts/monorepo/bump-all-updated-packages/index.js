/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const alignPackageVersions = require('../align-package-versions');
const checkForGitChanges = require('../check-for-git-changes');
const {
  COMMIT_WITH_CUSTOM_MESSAGE_CHOICE,
  COMMIT_WITH_GENERIC_MESSAGE_CHOICE,
  GENERIC_COMMIT_MESSAGE,
  NO_COMMIT_CHOICE,
  PUBLISH_PACKAGES_TAG,
} = require('../constants');
const forEachPackage = require('../for-each-package');
const bumpPackageVersion = require('./bump-package-version');
const detectPackageUnreleasedChanges = require('./bump-utils');
const chalk = require('chalk');
const {execSync} = require('child_process');
const inquirer = require('inquirer');
const path = require('path');
const {echo, exec, exit} = require('shelljs');
const yargs = require('yargs');

const ROOT_LOCATION = path.join(__dirname, '..', '..', '..');

const {
  argv: {releaseBranchCutoff},
} = yargs
  .option('release-branch-cutoff', {
    type: 'boolean',
    describe: 'Should force bump minor version for each public package',
  })
  .strict();

const buildExecutor =
  (packageAbsolutePath, packageRelativePathFromRoot, packageManifest) =>
  async () => {
    const {name: packageName} = packageManifest;
    if (packageManifest.private) {
      echo(`\u23ED Skipping private package ${chalk.dim(packageName)}`);

      return;
    }

    if (releaseBranchCutoff) {
      const updatedVersion = bumpPackageVersion(
        packageAbsolutePath,
        packageManifest,
        'minor',
      );
      echo(
        `\u2705 Successfully bumped ${chalk.green(
          packageName,
        )} to ${chalk.green(updatedVersion)}`,
      );

      return;
    }

    if (
      !detectPackageUnreleasedChanges(
        packageRelativePathFromRoot,
        packageName,
        ROOT_LOCATION,
      )
    ) {
      return;
    }

    await inquirer
      .prompt([
        {
          type: 'list',
          name: 'shouldBumpPackage',
          message: `Do you want to bump ${packageName}?`,
          choices: ['Yes', 'No'],
          filter: val => val === 'Yes',
        },
      ])
      .then(({shouldBumpPackage}) => {
        if (!shouldBumpPackage) {
          echo(`Skipping bump for ${packageName}`);
          return;
        }

        return inquirer
          .prompt([
            {
              type: 'list',
              name: 'increment',
              message: 'Which version you want to increment?',
              choices: ['patch', 'minor'],
            },
          ])
          .then(({increment}) => {
            const updatedVersion = bumpPackageVersion(
              packageAbsolutePath,
              packageManifest,
              increment,
            );
            echo(
              `\u2705 Successfully bumped ${chalk.green(
                packageName,
              )} to ${chalk.green(updatedVersion)}`,
            );
          });
      });
  };

const buildAllExecutors = () => {
  const executors = [];

  forEachPackage((...params) => {
    executors.push(buildExecutor(...params));
  });

  return executors;
};

const main = async () => {
  if (checkForGitChanges()) {
    echo(
      chalk.red(
        'Found uncommitted changes. Please commit or stash them before running this script',
      ),
    );
    exit(1);
  }

  const executors = buildAllExecutors();
  for (const executor of executors) {
    await executor()
      .catch(() => exit(1))
      .then(() => echo());
  }

  if (!checkForGitChanges()) {
    echo('No changes have been made. Finishing the process...');
    exit(0);
  }

  echo('Aligning new versions across monorepo...');
  alignPackageVersions();
  echo(chalk.green('Done!\n'));

  await inquirer
    .prompt([
      {
        type: 'list',
        name: 'commitChoice',
        message: 'Do you want to submit a commit with these changes?',
        choices: [
          {
            name: 'Yes, with generic message',
            value: COMMIT_WITH_GENERIC_MESSAGE_CHOICE,
          },
          {
            name: 'Yes, with custom message',
            value: COMMIT_WITH_CUSTOM_MESSAGE_CHOICE,
          },
          {
            name: 'No',
            value: NO_COMMIT_CHOICE,
          },
        ],
      },
    ])
    .then(({commitChoice}) => {
      switch (commitChoice) {
        case NO_COMMIT_CHOICE: {
          echo('Not submitting a commit, but keeping all changes');

          break;
        }

        case COMMIT_WITH_GENERIC_MESSAGE_CHOICE: {
          exec(`git commit -am "${GENERIC_COMMIT_MESSAGE}"`, {
            cwd: ROOT_LOCATION,
            silent: true,
          });

          break;
        }

        case COMMIT_WITH_CUSTOM_MESSAGE_CHOICE: {
          // exec from shelljs currently does not support interactive input
          // https://github.com/shelljs/shelljs/wiki/FAQ#running-interactive-programs-with-exec
          execSync('git commit -a', {cwd: ROOT_LOCATION, stdio: 'inherit'});

          const enteredCommitMessage = exec('git log -n 1 --format=format:%B', {
            cwd: ROOT_LOCATION,
            silent: true,
          }).stdout.trim();
          const commitMessageWithTag =
            enteredCommitMessage + `\n\n${PUBLISH_PACKAGES_TAG}`;

          exec(`git commit --amend -m "${commitMessageWithTag}"`, {
            cwd: ROOT_LOCATION,
            silent: true,
          });

          break;
        }

        default:
          throw new Error('');
      }
    })
    .then(() => echo());

  echo(chalk.green('Successfully finished the process of bumping packages'));
  exit(0);
};

main();
