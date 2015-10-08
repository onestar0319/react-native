'use strict';

var path = require('path');
var yeoman = require('yeoman-environment');

// argsOrName can be:
// - A string (e.g. 'AwesomeApp'). This is the common case when
//   you run 'react-native init AwesomeApp' from the command line.
// - An array with all the arguments. This can be useful when you
//   need to pass custom arguments to the generator.
function init(projectDir, argsOrName) {
  console.log('Setting up new React Native app in ' + projectDir);
  var env = yeoman.createEnv();
  env.register(require.resolve(path.join(__dirname, 'generator')), 'react:app');
  // argv is e.g.
  // ['node', 'react-native', 'init', 'AwesomeApp', '--verbose']
  // args is ['AwesomeApp', '--verbose']
  var args = Array.isArray(argsOrName) ? argsOrName : [argsOrName].concat(process.argv.slice(4));
  var generator = env.create('react:app', {args: args});
  generator.destinationRoot(projectDir);
  generator.run();
}

module.exports = init;
