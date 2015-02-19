var fs = require('fs')
var glob = require('glob');
var mkdirp = require('mkdirp');
var optimist = require('optimist');
var path = require('path');
var extractDocs = require('./extractDocs');
var argv = optimist.argv;

function splitHeader(content) {
  var lines = content.split('\n');
  for (var i = 1; i < lines.length - 1; ++i) {
    if (lines[i] === '---') {
      break;
    }
  }
  return {
    header: i < lines.length - 1 ?
      lines.slice(1, i + 1).join('\n') : null,
    content: lines.slice(i + 1).join('\n')
  };
}

function backtickify(str) {
  var escaped = '`' + str.replace(/\\/g, '\\\\').replace(/`/g, '\\`') + '`';
  // Replace require( with require\( so node-haste doesn't replace example
  // require calls in the docs
  return escaped.replace(/require\(/g, 'require\\(');
}

function execute() {
  var MD_DIR = '../docs/';

  var files = glob.sync('src/react-native/docs/*.*')
  files.forEach(function(file) {
    try {
      fs.unlinkSync(file);
    } catch(e) {
      /* seriously, unlink throws when the file doesn't exist :( */
    }
  });

  var metadatas = {
    files: [],
  };

  function handleMarkdown(content) {
    var metadata = {};

    // Extract markdown metadata header
    var both = splitHeader(content);
    if (!both.header) {
      return;
    }
    var lines = both.header.split('\n');
    for (var i = 0; i < lines.length - 1; ++i) {
      var keyvalue = lines[i].split(':');
      var key = keyvalue[0].trim();
      var value = keyvalue.slice(1).join(':').trim();
      // Handle the case where you have "Community #10"
      try { value = JSON.parse(value); } catch(e) { }
      metadata[key] = value;
    }
    metadatas.files.push(metadata);

    if (metadata.permalink.match(/^https?:/)) {
      return;
    }

    // Create a dummy .js version that just calls the associated layout
    var layout = metadata.layout[0].toUpperCase() + metadata.layout.substr(1) + 'Layout';

    var content = (
      '/**\n' +
      ' * @generated\n' +
      ' * @jsx React.DOM\n' +
      ' */\n' +
      'var React = require("React");\n' +
      'var layout = require("' + layout + '");\n' +
      'var content = ' + backtickify(both.content) + '\n' +
      'var Post = React.createClass({\n' +
      '  render: function() {\n' +
      '    return layout({metadata: ' + JSON.stringify(metadata) + '}, content);\n' +
      '  }\n' +
      '});\n' +
      // TODO: Use React statics after upgrading React
      'Post.content = content;\n' +
      'module.exports = Post;\n'
    );

    var targetFile = 'src/react-native/' + metadata.permalink.replace(/\.html$/, '.js');
    mkdirp.sync(targetFile.replace(new RegExp('/[^/]*$'), ''));
    fs.writeFileSync(targetFile, content);
  }

  extractDocs().forEach(handleMarkdown);

  var files = glob.sync(MD_DIR + '**/*.*');
  files.forEach(function(file) {
    var extension = path.extname(file);
    if (extension === '.md' || extension === '.markdown') {
      var content = fs.readFileSync(file, {encoding: 'utf8'});
      handleMarkdown(content);
    }

    if (extension === '.json') {
      var content = fs.readFileSync(file, {encoding: 'utf8'});
      metadatas[path.basename(file, '.json')] = JSON.parse(content);
    }
  });

  fs.writeFileSync(
    'core/metadata.js',
    '/**\n' +
    ' * @generated\n' +
    ' * @providesModule Metadata\n' +
    ' */\n' +
    'module.exports = ' + JSON.stringify(metadatas, null, 2) + ';'
  );
}

if (argv.convert) {
  console.log('convert!');
  execute();
}

module.exports = execute;
