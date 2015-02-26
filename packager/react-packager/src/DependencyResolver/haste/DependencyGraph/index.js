'use strict';

var ModuleDescriptor = require('../../ModuleDescriptor');
var q = require('q');
var fs = require('fs');
var docblock = require('./docblock');
var path = require('path');
var isAbsolutePath = require('absolute-path');
var debug = require('debug')('DependecyGraph');
var util = require('util');
var declareOpts = require('../../../lib/declareOpts');

var readFile = q.nfbind(fs.readFile);
var readDir = q.nfbind(fs.readdir);
var lstat = q.nfbind(fs.lstat);
var realpath = q.nfbind(fs.realpath);

var validateOpts = declareOpts({
  roots: {
    type: 'array',
    required: true,
  },
  ignoreFilePath: {
    type: 'function',
    default: function(){}
  },
  fileWatcher: {
    type: 'object',
    required: true,
  },
});

function DependecyGraph(options) {
  var opts = validateOpts(options);

  this._roots = opts.roots;
  this._ignoreFilePath = opts.ignoreFilePath;
  this._fileWatcher = options.fileWatcher;

  this._loaded = false;
  this._queue = this._roots.slice();
  this._graph = Object.create(null);
  this._packageByRoot = Object.create(null);
  this._packagesById = Object.create(null);
  this._moduleById = Object.create(null);
  this._debugUpdateEvents = [];

  // Kick off the search process to precompute the dependency graph.
  this._init();
}

DependecyGraph.prototype.load = function() {
  return this._loading || (this._loading = this._search());
};

/**
 * Given an entry file return an array of all the dependent module descriptors.
 */
DependecyGraph.prototype.getOrderedDependencies = function(entryPath) {
  var absolutePath = this._getAbsolutePath(entryPath);
  if (absolutePath == null) {
    throw new Error('Cannot find entry file in any of the roots: ' + entryPath);
  }

  var module = this._graph[absolutePath];
  if (module == null) {
    throw new Error('Module with path "' + entryPath + '" is not in graph');
  }

  var self = this;
  var deps = [];
  var visited = Object.create(null);

  // Node haste sucks. Id's aren't unique. So to make sure our entry point
  // is the thing that ends up in our dependency list.
  var graphMap = Object.create(this._moduleById);
  graphMap[module.id] = module;

  // Recursively collect the dependency list.
  function collect(module) {
    deps.push(module);

    module.dependencies.forEach(function(name) {
      var id = sansExtJs(name);
      var dep = self.resolveDependency(module, id);

      if (dep == null) {
        debug(
          'WARNING: Cannot find required module `%s` from module `%s`.',
          name,
          module.id
        );
        return;
      }

      if (!visited[dep.id]) {
        visited[dep.id] = true;
        collect(dep);
      }
    });
  }

  visited[module.id] = true;
  collect(module);

  return deps;
};

/**
 * Given a module descriptor `fromModule` return the module descriptor for
 * the required module `depModuleId`. It could be top-level or relative,
 * or both.
 */
DependecyGraph.prototype.resolveDependency = function(
  fromModule,
  depModuleId
) {
  var packageJson, modulePath, dep;

  // Package relative modules starts with '.' or '..'.
  if (depModuleId[0] !== '.') {

    // 1. `depModuleId` is simply a top-level `providesModule`.
    // 2. `depModuleId` is a package module but given the full path from the
    //     package, i.e. package_name/module_name
    if (this._moduleById[sansExtJs(depModuleId)]) {
      return this._moduleById[sansExtJs(depModuleId)];
    }

    // 3. `depModuleId` is a package and it's depending on the "main"
    //    resolution.
    packageJson = this._packagesById[depModuleId];

    // We are being forgiving here and raising an error because we could be
    // processing a file that uses it's own require system.
    if (packageJson == null) {
      debug(
        'WARNING: Cannot find required module `%s` from module `%s`.',
        depModuleId,
        fromModule.id
      );
      return;
    }

    var main = packageJson.main || 'index';
    modulePath = withExtJs(path.join(packageJson._root, main));
    dep = this._graph[modulePath];
    if (dep == null) {
      throw new Error(
        'Cannot find package main file for package: ' + packageJson._root
      );
    }
    return dep;
  } else {

    // 4. `depModuleId` is a module defined in a package relative to
    //    `fromModule`.
    packageJson = this._lookupPackage(fromModule.path);

    if (packageJson == null) {
      throw new Error(
        'Expected relative module lookup from ' + fromModule.id + ' to ' +
        depModuleId + ' to be within a package but no package.json found.'
      );
    }

    // Example: depModuleId: ../a/b
    //          fromModule.path: /x/y/z
    //          modulePath: /x/y/a/b
    var dir = path.dirname(fromModule.path);
    modulePath = withExtJs(path.join(dir, depModuleId));

    dep = this._graph[modulePath];
    if (dep == null) {
      debug(
        'WARNING: Cannot find required module `%s` from module `%s`.' +
        ' Inferred required module path is %s',
        depModuleId,
        fromModule.id,
        modulePath
      );
      return null;
    }

    return dep;
  }
};

/**
 * Intiates the filewatcher and kicks off the search process.
 */
DependecyGraph.prototype._init = function() {
  var processChange = this._processFileChange.bind(this);
  var watcher = this._fileWatcher;

  this._loading = this.load().then(function() {
    watcher.on('all', processChange);
  });
};

/**
 * Implements a DFS over the file system looking for modules and packages.
 */
DependecyGraph.prototype._search = function() {
  var self = this;
  var dir = this._queue.shift();

  if (dir == null) {
    return q.Promise.resolve(this._graph);
  }

  // Steps:
  // 1. Read a dir and stat all the entries.
  // 2. Filter the files and queue up the directories.
  // 3. Process any package.json in the files
  // 4. recur.
  return readDir(dir)
    .then(function(files){
      return q.all(files.map(function(filePath) {
        return realpath(path.join(dir, filePath)).catch(handleBrokenLink);
      }));
    })
    .then(function(filePaths) {
      filePaths = filePaths.filter(function(filePath) {
        if (filePath == null) {
          return false
        }

        return !self._ignoreFilePath(filePath);
      });

      var statsP = filePaths.map(function(filePath) {
        return lstat(filePath).catch(handleBrokenLink);
      });

      return [
        filePaths,
        q.all(statsP)
      ];
    })
    .spread(function(files, stats) {
      var modulePaths = files.filter(function(filePath, i) {
        if (stats[i].isDirectory()) {
          self._queue.push(filePath);
          return false;
        }

        if (stats[i].isSymbolicLink()) {
          return false;
        }

        return filePath.match(/\.js$/);
      });

      var processing = self._findAndProcessPackage(files, dir)
        .then(function() {
          return q.all(modulePaths.map(self._processModule.bind(self)));
        });

      return q.all([
        processing,
        self._search()
      ]);
    })
    .then(function() {
      return self;
    });
};

/**
 * Given a list of files find a `package.json` file, and if found parse it
 * and update indices.
 */
DependecyGraph.prototype._findAndProcessPackage = function(files, root) {
  var self = this;

  var packagePath;
  for (var i = 0; i < files.length ; i++) {
    var file = files[i];
    if (path.basename(file) === 'package.json') {
      packagePath = file;
      break;
    }
  }

  if (packagePath != null) {
    return readFile(packagePath, 'utf8')
      .then(function(content) {
        var packageJson;
        try {
          packageJson = JSON.parse(content);
        } catch (e) {
          debug('WARNING: malformed package.json: ', packagePath);
          return q();
        }

        if (packageJson.name == null) {
          debug(
            'WARNING: package.json `%s` is missing a name field',
            packagePath
          );
          return q();
        }

        packageJson._root = root;
        self._packageByRoot[root] = packageJson;
        self._packagesById[packageJson.name] = packageJson;

        return packageJson;
      });
  } else {
    return q();
  }
};

/**
 * Parse a module and update indices.
 */
DependecyGraph.prototype._processModule = function(modulePath) {
  var self = this;
  return readFile(modulePath, 'utf8')
    .then(function(content) {
      var moduleDocBlock = docblock.parseAsObject(content);
      var moduleData = { path: path.resolve(modulePath) };
      if (moduleDocBlock.providesModule || moduleDocBlock.provides) {
        moduleData.id =
          moduleDocBlock.providesModule || moduleDocBlock.provides;
      } else {
        moduleData.id = self._lookupName(modulePath);
      }
      moduleData.dependencies = extractRequires(content);

      var module = new ModuleDescriptor(moduleData);
      self._updateGraphWithModule(module);
      return module;
    });
};

/**
 * Compute the name of module relative to a package it may belong to.
 */
DependecyGraph.prototype._lookupName = function(modulePath) {
  var packageJson = this._lookupPackage(modulePath);
  if (packageJson == null) {
    return path.resolve(modulePath);
  } else {
    var relativePath =
      sansExtJs(path.relative(packageJson._root, modulePath));
    return path.join(packageJson.name, relativePath);
  }
};

DependecyGraph.prototype._deleteModule = function(module) {
  delete this._graph[module.path];

  // Others may keep a reference so we mark it as deleted.
  module.deleted = true;

  // Haste allows different module to have the same id.
  if (this._moduleById[module.id] === module) {
    delete this._moduleById[module.id];
  }
};

/**
 * Update the graph and indices with the module.
 */
DependecyGraph.prototype._updateGraphWithModule = function(module) {
  if (this._graph[module.path]) {
    this._deleteModule(this._graph[module.path]);
  }

  this._graph[module.path] = module;

  if (this._moduleById[module.id]) {
    debug(
      'WARNING: Top-level module name conflict `%s`.\n' +
      'module with path `%s` will replace `%s`',
      module.id,
      module.path,
      this._moduleById[module.id].path
    );
  }

  this._moduleById[module.id] = module;
};

/**
 * Find the nearest package to a module.
 */
DependecyGraph.prototype._lookupPackage = function(modulePath) {
  var packageByRoot = this._packageByRoot;

  /**
   * Auxiliary function to recursively lookup a package.
   */
  function lookupPackage(currDir) {
    // ideally we stop once we're outside root and this can be a simple child
    // dir check. However, we have to support modules that was symlinked inside
    // our project root.
    if (currDir === '/') {
      return null;
    } else {
      var packageJson = packageByRoot[currDir];
      if (packageJson) {
        return packageJson;
      } else {
        return lookupPackage(path.dirname(currDir));
      }
    }
  }

  return lookupPackage(path.dirname(modulePath));
};

/**
 * Process a filewatcher change event.
 */
DependecyGraph.prototype._processFileChange = function(eventType, filePath, root, stat) {
  var absPath = path.join(root, filePath);
  if (this._ignoreFilePath(absPath)) {
    return;
  }

  this._debugUpdateEvents.push({event: eventType, path: filePath});

  if (eventType === 'delete') {
    var module = this._graph[absPath];
    if (module == null) {
      return;
    }

    this._deleteModule(module);
  } else if (!(stat && stat.isDirectory())) {
    var self = this;
    this._loading = this._loading.then(function() {
      return self._processModule(absPath);
    });
  }
};

DependecyGraph.prototype.getDebugInfo = function() {
  return '<h1>FileWatcher Update Events</h1>' +
    '<pre>' + util.inspect(this._debugUpdateEvents) + '</pre>' +
    '<h1> Graph dump </h1>' +
    '<pre>' + util.inspect(this._graph) + '</pre>';
};

/**
 * Searches all roots for the file and returns the first one that has file of the same path.
 */
DependecyGraph.prototype._getAbsolutePath = function(filePath) {
  if (isAbsolutePath(filePath)) {
    return filePath;
  }

  for (var i = 0, root; root = this._roots[i]; i++) {
    var absPath = path.join(root, filePath);
    if (this._graph[absPath]) {
      return absPath;
    }
  }

  return null;
};

/**
 * Extract all required modules from a `code` string.
 */
var requireRe = /\brequire\s*\(\s*[\'"]([^"\']+)["\']\s*\)/g;
var blockCommentRe = /\/\*(.|\n)*?\*\//g;
var lineCommentRe = /\/\/.+(\n|$)/g;
function extractRequires(code) {
  var deps = [];

  code
    .replace(blockCommentRe, '')
    .replace(lineCommentRe, '')
    .replace(requireRe, function(match, dep) {
      deps.push(dep);
    });

  return deps;
}

/**
 * `file` without the .js extension.
 */
function sansExtJs(file) {
  if (file.match(/\.js$/)) {
    return file.slice(0, -3);
  } else {
    return file;
  }
}

/**
 * `file` with the .js extension.
 */
function withExtJs(file) {
  if (file.match(/\.js$/)) {
    return file;
  } else {
    return file + '.js';
  }
}

function handleBrokenLink(e) {
  debug('WARNING: error stating, possibly broken symlink', e.message);
  return q();
}

module.exports = DependecyGraph;
