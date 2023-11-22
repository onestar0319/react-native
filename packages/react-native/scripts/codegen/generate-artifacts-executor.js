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
 * This script crawls through a React Native application's dependencies and invokes the codegen
 * for any libraries that require it.
 * To enable codegen support, the library should include a config in the codegenConfig key
 * in a package.json file.
 */

const utils = require('./codegen-utils');
const generateSpecsCLIExecutor = require('./generate-specs-cli-executor');
const {execSync} = require('child_process');
const fs = require('fs');
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');

const REACT_NATIVE_REPOSITORY_ROOT = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
);
const REACT_NATIVE_PACKAGE_ROOT_FOLDER = path.join(__dirname, '..', '..');
const CODEGEN_REPO_PATH = `${REACT_NATIVE_REPOSITORY_ROOT}/packages/react-native-codegen`;
const CORE_LIBRARIES_WITH_OUTPUT_FOLDER = {
  rncore: path.join(REACT_NATIVE_PACKAGE_ROOT_FOLDER, 'ReactCommon'),
  FBReactNativeSpec: null,
};
const REACT_NATIVE = 'react-native';

// HELPERS

function isReactNativeCoreLibrary(libraryName) {
  return libraryName in CORE_LIBRARIES_WITH_OUTPUT_FOLDER;
}

function isAppRootValid(appRootDir) {
  if (appRootDir == null) {
    console.error('Missing path to React Native application');
    process.exitCode = 1;
    return false;
  }
  return true;
}

function readPkgJsonInDirectory(dir) {
  const pkgJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    throw `[Codegen] Error: ${pkgJsonPath} does not exist.`;
  }
  return JSON.parse(fs.readFileSync(pkgJsonPath));
}

function printDeprecationWarningIfNeeded(dependency) {
  if (dependency === REACT_NATIVE) {
    return;
  }
  console.log(`[Codegen] CodegenConfig Deprecated Setup for ${dependency}.
    The configuration file still contains the codegen in the libraries array.
    If possible, replace it with a single object.
  `);
  console.debug(`BEFORE:
    {
      // ...
      "codegenConfig": {
        "libraries": [
          {
            "name": "libName1",
            "type": "all|components|modules",
            "jsSrcsRoot": "libName1/js"
          },
          {
            "name": "libName2",
            "type": "all|components|modules",
            "jsSrcsRoot": "libName2/src"
          }
        ]
      }
    }

    AFTER:
    {
      "codegenConfig": {
        "name": "libraries",
        "type": "all",
        "jsSrcsRoot": "."
      }
    }
  `);
}

// Reading Libraries
function extractLibrariesFromConfigurationArray(configFile, dependencyPath) {
  return configFile.codegenConfig.libraries.map(config => {
    return {
      config,
      libraryPath: dependencyPath,
    };
  });
}

function extractLibrariesFromJSON(configFile, dependency, dependencyPath) {
  var isBlocking = false;
  if (dependency == null) {
    dependency = REACT_NATIVE;
    dependencyPath = REACT_NATIVE_PACKAGE_ROOT_FOLDER;
    // If we are exploring the ReactNative libraries, we want to raise an error
    // if the codegen is not properly configured.
    isBlocking = true;
  }

  if (configFile.codegenConfig == null) {
    if (isBlocking) {
      throw `[Codegen] Error: Could not find codegen config for ${dependency} .`;
    }
    return [];
  }

  console.log(`[Codegen] Found ${dependency}`);
  if (configFile.codegenConfig.libraries == null) {
    const config = configFile.codegenConfig;
    return [
      {
        config,
        libraryPath: dependencyPath,
      },
    ];
  } else {
    printDeprecationWarningIfNeeded(dependency);
    return extractLibrariesFromConfigurationArray(configFile, dependencyPath);
  }
}

function handleReactNativeCoreLibraries() {
  // Handle react-native core libraries.
  // This is required when react-native is outside of node_modules.
  console.log('[Codegen] Processing react-native core libraries');
  return extractLibrariesFromJSON(
    readPkgJsonInDirectory(REACT_NATIVE_PACKAGE_ROOT_FOLDER),
  );
}

function handleThirdPartyLibraries(baseCodegenConfigFileDir, dependencies) {
  // Determine which of these are codegen-enabled libraries
  const configDir =
    baseCodegenConfigFileDir ||
    path.join(REACT_NATIVE_PACKAGE_ROOT_FOLDER, '..');
  console.log(
    `\n\n[Codegen] >>>>> Searching for codegen-enabled libraries in ${configDir}`,
  );

  // Handle third-party libraries
  return Object.keys(dependencies).flatMap(dependency => {
    if (dependency === REACT_NATIVE) {
      // react-native should already be added.
      return [];
    }
    let configFile;
    try {
      configFile = readPkgJsonInDirectory(codegenConfigFileDir);
    } catch {
      return [];
    }
    return extractLibrariesFromJSON(
      configFile,
      dependency,
      codegenConfigFileDir,
    );
  });
}

function handleLibrariesFromReactNativeConfig(appRootDir) {
  const rnConfigFileName = 'react-native.config.js';

  console.log(
    `\n\n[Codegen] >>>>> Searching for codegen-enabled libraries in ${rnConfigFileName}`,
  );

  const rnConfigFilePath = path.resolve(appRootDir, rnConfigFileName);

  if (!fs.existsSync(rnConfigFilePath)) {
    return [];
  }
  const rnConfig = require(rnConfigFilePath);

  if (rnConfig.dependencies == null) {
    return [];
  }
  return Object.keys(rnConfig.dependencies).flatMap(name => {
    const dependencyConfig = rnConfig.dependencies[name];

    if (!dependencyConfig.root) {
      return [];
    }
    const codegenConfigFileDir = path.resolve(
      appRootDir,
      dependencyConfig.root,
    );
    let configFile;
    try {
      configFile = readPkgJsonInDirectory(codegenConfigFileDir);
    } catch {
      return [];
    }

    return extractLibrariesFromJSON(
      configFile,
      configFile.name,
      codegenConfigFileDir,
    );
  });
}

function handleInAppLibraries(pkgJson, appRootDir) {
  console.log(
    '\n\n[Codegen] >>>>> Searching for codegen-enabled libraries in the app',
  );

  return extractLibrariesFromJSON(pkgJson, pkgJson.name, appRootDir);
}

// CodeGen
function buildCodegenIfNeeded() {
  if (!fs.existsSync(CODEGEN_REPO_PATH)) {
    return;
  }
  // Assuming we are working in the react-native repo. We might need to build the codegen.
  // This will become unnecessary once we start using Babel Register for the codegen package.
  const libPath = path.join(CODEGEN_REPO_PATH, 'lib');
  if (fs.existsSync(libPath) && fs.readdirSync(libPath).length > 0) {
    return;
  }
  console.log('\n\n[Codegen] >>>>> Building react-native-codegen package');
  execSync('yarn install', {
    cwd: CODEGEN_REPO_PATH,
    stdio: 'inherit',
  });
  execSync('yarn build', {
    cwd: CODEGEN_REPO_PATH,
    stdio: 'inherit',
  });
}

function computeIOSOutputDir(outputPath, appRootDir) {
  return path.join(outputPath ? outputPath : appRootDir, 'build/generated/ios');
}

function generateSchema(library) {
  const pathToJavaScriptSources = path.join(
    library.libraryPath,
    library.config.jsSrcsDir,
  );
  console.log(`\n\n[Codegen] >>>>> Processing ${library.config.name}`);
  // Generate one schema for the entire library...
  return utils
    .getCombineJSToSchema()
    .combineSchemasInFileList([pathToJavaScriptSources], 'ios');
}

function generateCode(iosOutputDir, library, tmpDir, schema) {
  // ...then generate native code artifacts.
  const libraryTypeArg = library.config.type ? `${library.config.type}` : '';

  const tmpOutputDir = path.join(tmpDir, 'out');
  fs.mkdirSync(tmpOutputDir, {recursive: true});

  generateSpecsCLIExecutor.generateSpecFromInMemorySchema(
    'ios',
    schema,
    tmpOutputDir,
    library.config.name,
    'com.facebook.fbreact.specs',
    libraryTypeArg,
  );

  // Finally, copy artifacts to the final output directory.
  const outputDir =
    CORE_LIBRARIES_WITH_OUTPUT_FOLDER[library.config.name] ?? iosOutputDir;
  fs.mkdirSync(outputDir, {recursive: true});
  execSync(`cp -R ${tmpOutputDir}/* "${outputDir}"`);
  console.log(`[Codegen] Generated artifacts: ${iosOutputDir}`);
}

function generateNativeCodegenFiles(libraries, iosOutputDir) {
  const schemas = {};
  libraries.forEach(library => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), library.config.name));
    const schema = generateSchema(library);
    generateCode(iosOutputDir, library, tmpDir, schema);

    // Filter the react native core library out.
    // In the future, core library and third party library should
    // use the same way to generate/register the fabric components.
    if (!isReactNativeCoreLibrary(library.config.name)) {
      schemas[library.config.name] = schema;
    }
  });
  return schemas;
}

function createComponentProvider(schemas) {
  console.log('\n\n>>>>> Creating component provider');
  const outputDir = path.join(
    REACT_NATIVE_PACKAGE_ROOT_FOLDER,
    'React',
    'Fabric',
  );
  mkdirp.sync(outputDir);
  utils.getCodegen().generateFromSchemas(
    {
      schemas: schemas,
      outputDirectory: outputDir,
    },
    {
      generators: ['providerIOS'],
    },
  );
  console.log(`Generated provider in: ${outputDir}`);
}

function findCodegenEnabledLibraries(appRootDir, baseCodegenConfigFileDir) {
  const pkgJson = readPkgJsonInDirectory(appRootDir);
  const dependencies = {...pkgJson.dependencies, ...pkgJson.devDependencies};
  return [
    ...handleReactNativeCoreLibraries(),
    ...handleThirdPartyLibraries(baseCodegenConfigFileDir, dependencies),
    ...handleLibrariesFromReactNativeConfig(appRootDir),
    ...handleInAppLibraries(pkgJson, appRootDir),
  ];
}

// It removes all the empty files and empty folders
// it finds, starting from `filepath`, recursively.
//
// This function is needed since, after aligning the codegen between
// iOS and Android, we have to create empty folders in advance and
// we don't know whether they will be populated up until the end of the process.
//
// @parameter filepath: the root path from which we want to remove the empty files and folders.
function cleanupEmptyFilesAndFolders(filepath) {
  const stats = fs.statSync(filepath);

  if (stats.isFile() && stats.size === 0) {
    fs.rmSync(filepath);
    return;
  } else if (stats.isFile()) {
    return;
  }

  const dirContent = fs.readdirSync(filepath);
  dirContent.forEach(contentPath =>
    cleanupEmptyFilesAndFolders(path.join(filepath, contentPath)),
  );

  // The original folder may be filled with empty folders
  // if that the case, we would also like to remove the parent.
  // Hence, we need to read the folder again.
  const newContent = fs.readdirSync(filepath);
  if (newContent.length === 0) {
    fs.rmdirSync(filepath);
    return;
  }
}

// Execute

/**
 * This function is the entry point for the codegen. It:
 * - reads the package json
 * - extracts the libraries
 * - setups the CLI to generate the code
 * - generate the code
 *
 * @parameter appRootDir: the directory with the app source code, where the package.json lives.
 * @parameter outputPath: the base output path for the CodeGen.
 * @parameter baseCodegenConfigFileDir: the directory of the codeGenConfigFile.
 * @throws If it can't find a config file for react-native.
 * @throws If it can't find a CodeGen configuration in the file.
 * @throws If it can't find a cli for the CodeGen.
 */
function execute(appRootDir, outputPath, baseCodegenConfigFileDir) {
  if (!isAppRootValid(appRootDir)) {
    return;
  }

  buildCodegenIfNeeded();

  try {
    const libraries = findCodegenEnabledLibraries(
      appRootDir,
      baseCodegenConfigFileDir,
    );

    if (libraries.length === 0) {
      console.log('[Codegen] No codegen-enabled libraries found.');
      return;
    }

    const iosOutputDir = computeIOSOutputDir(outputPath, appRootDir);

    const schemas = generateNativeCodegenFiles(libraries, iosOutputDir);

    createComponentProvider(schemas);
    cleanupEmptyFilesAndFolders(iosOutputDir);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }

  console.log('\n\n[Codegen] Done.');
  return;
}

module.exports = {
  execute: execute,
  // exported for testing purposes only:
  _extractLibrariesFromJSON: extractLibrariesFromJSON,
  _findCodegenEnabledLibraries: findCodegenEnabledLibraries,
  _generateCode: generateCode,
  _cleanupEmptyFilesAndFolders: cleanupEmptyFilesAndFolders,
};
