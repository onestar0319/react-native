/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

const {parseArgs} = require('@pkgjs/parseargs');
// $FlowFixMe[untyped-import]: TODO type ansi-styles
const ansiStyles = require('ansi-styles');
const chalk = require('chalk');
const {execSync, spawnSync} = require('child_process');
const {promises: fs} = require('fs');
const {tmpdir, hostname, userInfo} = require('os');
const path = require('path');
// $FlowFixMe[untyped-import]: TODO type rimraf
const rimraf = require('rimraf');
// $FlowFixMe[untyped-import]: TODO type signedsource
const SignedSource = require('signedsource');
// $FlowFixMe[untyped-import]: TODO type supports-color
const supportsColor = require('supports-color');

const DEVTOOLS_FRONTEND_REPO_URL =
  'https://github.com/motiz88/rn-chrome-devtools-frontend';
const DEVTOOLS_FRONTEND_REPO_BRANCH = 'rn-0.73-chromium-5845';

const REPO_ROOT = path.resolve(__dirname, '../..');
const PACKAGES_DIR /*: string */ = path.join(REPO_ROOT, 'packages');

const config = {
  allowPositionals: true,
  options: {
    'keep-scratch': {type: 'boolean'},
    nohooks: {type: 'boolean'},
    help: {type: 'boolean'},
  },
};

async function main() {
  const {
    positionals,
    values: {help, nohooks, 'keep-scratch': keepScratch},
  } = parseArgs(config);

  if (help === true) {
    console.log(`
  Usage: node scripts/debugger-frontend/sync-and-build [OPTIONS] [checkout path]

  Sync and build the debugger frontend into @react-native/debugger-frontend.

  By default, checks out the currently pinned revision of the DevTools frontend.
  If an existing checkout path is provided, builds it instead.

  Options:
    --nohooks          Don't run gclient hooks in the devtools checkout (useful
                       for existing checkouts).
    --keep-scratch     Don't clean up temporary files.
`);
    process.exitCode = 0;
    return;
  }

  console.log('\n' + chalk.bold.inverse('Syncing debugger-frontend') + '\n');

  const scratchPath = await fs.mkdtemp(
    path.join(tmpdir(), 'debugger-frontend-build-'),
  );
  process.stdout.write(chalk.dim(`Scratch path: ${scratchPath}\n\n`));

  await checkRequiredTools();
  const localCheckoutPath = positionals.length ? positionals[0] : undefined;
  await buildDebuggerFrontend(scratchPath, localCheckoutPath, {
    gclientSyncOptions: {nohooks: nohooks === true},
  });
  await cleanup(scratchPath, keepScratch === true);
  process.stdout.write(
    chalk.green('Sync done.') +
      ' Check in any updated files under packages/debugger-frontend.\n',
  );
}

async function checkRequiredTools() {
  process.stdout.write('Checking that required tools are available' + '\n');
  await spawnSafe('git', ['--version'], {stdio: 'ignore'});
  try {
    await spawnSafe('gclient', ['--version'], {stdio: 'ignore'});
    await spawnSafe('which', ['gn'], {stdio: 'ignore'});
    await spawnSafe('which', ['autoninja'], {stdio: 'ignore'});
  } catch (e) {
    process.stderr.write(
      'Install depot_tools first: ' +
        'https://commondatastorage.googleapis.com/chrome-infra-docs/flat/depot_tools/docs/html/depot_tools_tutorial.html#_setting_up' +
        '\n',
    );
    throw e;
  }
  process.stdout.write('\n');
}

async function buildDebuggerFrontend(
  scratchPath /*: string */,
  localCheckoutPath /*: ?string */,
  {
    gclientSyncOptions,
  } /*: $ReadOnly<{gclientSyncOptions: $ReadOnly<{nohooks: boolean}>}>*/,
) {
  let checkoutPath;
  if (localCheckoutPath == null) {
    const scratchCheckoutPath = path.join(scratchPath, 'devtools-frontend');

    await fs.mkdir(scratchPath, {recursive: true});

    await checkoutDevToolsFrontend(scratchCheckoutPath);
    checkoutPath = scratchCheckoutPath;
  } else {
    checkoutPath = localCheckoutPath;
  }

  await setupGclientWorkspace(scratchPath, checkoutPath, gclientSyncOptions);

  const {buildPath, gnArgsSummary} = await performReleaseBuild(checkoutPath);

  const packagePath = path.join(PACKAGES_DIR, 'debugger-frontend');
  const destPathInPackage = path.join(packagePath, 'dist', 'third-party');
  await cleanPackageFiles(destPathInPackage);

  await copyFrontendFilesToPackage(buildPath, destPathInPackage);
  await copyLicenseToPackage(checkoutPath, destPathInPackage);
  await generateBuildInfo({
    checkoutPath,
    packagePath,
    isLocalCheckout: localCheckoutPath != null,
    gclientSyncOptions,
    gnArgsSummary,
  });
}

async function checkoutDevToolsFrontend(checkoutPath /*: string */) {
  process.stdout.write('Checking out devtools-frontend\n');
  await fs.mkdir(checkoutPath, {recursive: true});
  await spawnSafe('git', [
    'clone',
    DEVTOOLS_FRONTEND_REPO_URL,
    '--branch',
    DEVTOOLS_FRONTEND_REPO_BRANCH,
    '--single-branch',
    '--depth',
    '1',
    checkoutPath,
  ]);
  process.stdout.write('\n');
}

async function setupGclientWorkspace(
  scratchPath /*: string */,
  checkoutPath /*: string */,
  {nohooks} /*: $ReadOnly<{nohooks: boolean}> */,
) {
  process.stdout.write('Setting up gclient workspace' + '\n');
  await spawnSafe(
    'gclient',
    ['config', '--unmanaged', checkoutPath, '--name', 'devtools-frontend'],
    {
      cwd: scratchPath,
    },
  );
  await spawnSafe(
    'gclient',
    ['sync', '--no-history', ...(nohooks ? ['--nohooks'] : [])],
    {
      env: {
        ...process.env,
        DEPOT_TOOLS_UPDATE: '0',
      },
      cwd: scratchPath,
    },
  );
  process.stdout.write('\n');
}

async function performReleaseBuild(
  checkoutPath /*: string */,
) /*: Promise<{buildPath: string, gnArgsSummary: string}> */ {
  process.stdout.write('Performing release build of devtools-frontend' + '\n');
  const buildPath = path.join(checkoutPath, 'out/Release');
  await fs.mkdir(buildPath, {recursive: true});
  await fs.writeFile(
    path.join(buildPath, 'args.gn'),
    // NOTE: Per the DevTools repo's documentation, is_official_build has nothing
    // to do with branding and only controls certain release build optimisations.
    'is_official_build=true\n',
  );
  await spawnSafe('gn', ['gen', 'out/Release'], {
    cwd: checkoutPath,
  });
  const {stdout: gnArgsStdout} = await spawnSafe(
    'gn',
    ['args', 'out/Release', '--list', '--short', '--overrides-only'],
    {
      cwd: checkoutPath,
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  const gnArgsSummary = gnArgsStdout.toString().trim();
  process.stdout.write(chalk.dim(gnArgsSummary) + '\n');
  await spawnSafe('autoninja', ['-C', 'out/Release'], {cwd: checkoutPath});
  process.stdout.write('\n');
  return {gnArgsSummary, buildPath};
}

async function cleanPackageFiles(destPathInPackage /*: string */) {
  process.stdout.write(
    'Cleaning stale generated files in debugger-frontend' + '\n',
  );
  rimraf.sync(destPathInPackage);
  process.stdout.write('\n');
}

async function copyFrontendFilesToPackage(
  buildPath /*: string */,
  destPathInPackage /*: string */,
) {
  process.stdout.write(
    'Copying built devtools-frontend files to debugger-frontend' + '\n\n',
  );
  // The DevTools build generates a manifest of all files meant for packaging
  // into Chrome. These are exactly the files we need to ship.
  const files = JSON.parse(
    await fs.readFile(
      path.join(buildPath, 'gen', 'input_grd_files.json'),
      'utf8',
    ),
  );
  await Promise.all(
    files.map(async file => {
      const destPath = path.join(destPathInPackage, file);
      const destDir = path.dirname(destPath);
      await fs.mkdir(destDir, {recursive: true});
      await fs.copyFile(path.join(buildPath, 'gen', file), destPath);
    }),
  );
}

async function copyLicenseToPackage(
  checkoutPath /*: string */,
  destPathInPackage /*: string */,
) {
  process.stdout.write(
    'Copying LICENSE from devtools-frontend to debugger-frontend package\n\n',
  );
  await fs.copyFile(
    path.join(checkoutPath, 'LICENSE'),
    path.join(destPathInPackage, 'LICENSE'),
  );
}

async function generateBuildInfo(
  info /*: $ReadOnly<{
  checkoutPath: string,
  isLocalCheckout: boolean,
  packagePath: string,
  gclientSyncOptions: $ReadOnly<{nohooks: boolean}>,
  gnArgsSummary: string,
}> */,
) {
  process.stdout.write('Generating BUILD_INFO for debugger-frontend\n\n');
  const gitStatusLines = execSync('git status --porcelain', {
    cwd: info.checkoutPath,
    encoding: 'utf-8',
  })
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => '  ' + line);
  if (!gitStatusLines.length) {
    gitStatusLines.push('  <no changes>');
  }
  const gnSummaryLines = info.gnArgsSummary
    .split('\n')
    .map(line => '  ' + line.trim());
  if (!gnSummaryLines.length) {
    gnSummaryLines.push('  <none>');
  }
  const contents = [
    SignedSource.getSigningToken(),
    'Git revision: ' +
      execSync('git rev-parse HEAD', {
        cwd: info.checkoutPath,
        encoding: 'utf-8',
      }).trim(),
    'Built with --nohooks: ' + String(info.gclientSyncOptions.nohooks),
    'Is local checkout: ' + String(info.isLocalCheckout),
    ...(!info.isLocalCheckout
      ? [
          'Remote URL: ' + DEVTOOLS_FRONTEND_REPO_URL,
          'Remote branch: ' + DEVTOOLS_FRONTEND_REPO_BRANCH,
        ]
      : ['Hostname: ' + hostname(), 'User: ' + userInfo().username]),
    'GN build args (overrides only): ',
    ...gnSummaryLines,
    'Git status in checkout:',
    ...gitStatusLines,
    '',
  ].join('\n');
  await fs.writeFile(
    path.join(info.packagePath, 'BUILD_INFO'),
    SignedSource.signFile(contents),
  );
}
async function cleanup(scratchPath /*: string */, keepScratch /*: boolean */) {
  if (!keepScratch) {
    process.stdout.write('Cleaning up temporary files\n\n');
    await rimraf.sync(scratchPath);
  } else {
    process.stdout.write(
      'Not cleaning up temporary files because of --keep-scratch\n\n',
    );
  }
}
async function spawnSafe(
  cmd /*: string */,
  args /*: Array<string> */ = [],
  opts /*: child_process$spawnSyncOpts */ = {},
) /*: Promise<{
  stdout: string | Buffer,
  stderr: string | Buffer,
}> */ {
  process.stdout.write(` > ${cmd} ${args.join(' ')}\n`);
  if (supportsColor.stdout) {
    process.stdout.write(ansiStyles.dim.open);
  }
  if (supportsColor.stderr) {
    process.stderr.write(ansiStyles.dim.open);
  }
  try {
    const {error, status, signal, stdout, stderr} = spawnSync(cmd, args, {
      stdio: ['ignore', 'inherit', 'inherit'],
      ...opts,
    });
    if (error) {
      throw error;
    }
    if (status != null && status !== 0) {
      throw new Error(`Command failed with exit code ${status}`);
    }
    if (signal != null) {
      throw new Error(`Command terminated by signal ${signal}`);
    }
    return {stdout, stderr};
  } finally {
    if (supportsColor.stdout) {
      process.stdout.write(ansiStyles.dim.close);
    }
    if (supportsColor.stderr) {
      process.stderr.write(ansiStyles.dim.close);
    }
  }
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
