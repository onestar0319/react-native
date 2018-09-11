/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

if (!process.env.CIRCLE_PROJECT_USERNAME) {
  console.error('Missing CIRCLE_PROJECT_USERNAME. Example: facebook');
  process.exit(1);
}
if (!process.env.CIRCLE_PROJECT_REPONAME) {
  console.error('Missing CIRCLE_PROJECT_REPONAME. Example: react-native');
  process.exit(1);
}
if (!process.env.GITHUB_TOKEN) {
  console.error(
    'Missing GITHUB_TOKEN. Example: 5fd88b964fa214c4be2b144dc5af5d486a2f8c1e',
  );
  process.exit(1);
}
if (!process.env.CIRCLE_PR_NUMBER) {
  console.error('Missing CIRCLE_PR_NUMBER. Example: 4687');
  // for master branch, don't throw an error
  process.exit(0);
}

// https://octokit.github.io/rest.js/
const octokit = require('@octokit/rest')();

var path = require('path');

octokit.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_TOKEN,
});

function push(arr, key, value) {
  if (!arr[key]) {
    arr[key] = [];
  }
  arr[key].push(value);
}

/**
 * There is unfortunately no standard format to report an error, so we have
 * to write a specific converter for each tool we want to support.
 *
 * Those functions take a json object as input and fill the output with the
 * following format:
 *
 * { [ path: string ]: Array< { message: string, line: number }> }
 *
 * This is an object where the keys are the path of the files and values
 * is an array of objects of the shape message and line.
 */
var converters = {
  raw: function(output, input) {
    for (var key in input) {
      input[key].forEach(function(message) {
        push(output, key, message);
      });
    }
  },

  flow: function(output, input) {
    if (!input || !input.errors) {
      return;
    }

    input.errors.forEach(function(error) {
      push(output, error.message[0].path, {
        message: error.message.map(message => message.descr).join(' '),
        line: error.message[0].line,
      });
    });
  },

  eslint: function(output, input) {
    if (!input) {
      return;
    }

    input.forEach(function(file) {
      file.messages.forEach(function(message) {
        push(output, file.filePath, {
          message: message.ruleId + ': ' + message.message,
          line: message.line,
        });
      });
    });
  },
};

function getShaFromPullRequest(owner, repo, number, callback) {
  octokit.pullRequests.get({owner, repo, number}, (error, res) => {
    if (error) {
      console.error(error);
      return;
    }

    callback(res.data.head.sha);
  });
}

function getFilesFromCommit(owner, repo, sha, callback) {
  octokit.repos.getCommit({owner, repo, sha}, (error, res) => {
    if (error) {
      console.error(error);
      return;
    }
    // A merge commit should not have any new changes to report
    if (res.parents && res.parents.length > 1) {
      return;
    }

    callback(res.data.files);
  });
}

/**
 * Sadly we can't just give the line number to github, we have to give the
 * line number relative to the patch file which is super annoying. This
 * little function builds a map of line number in the file to line number
 * in the patch file
 */
function getLineMapFromPatch(patchString) {
  var diffLineIndex = 0;
  var fileLineIndex = 0;
  var lineMap = {};

  patchString.split('\n').forEach(line => {
    if (line.match(/^@@/)) {
      fileLineIndex = line.match(/\+([0-9]+)/)[1] - 1;
      return;
    }

    diffLineIndex++;
    if (line[0] !== '-') {
      fileLineIndex++;
      if (line[0] === '+') {
        lineMap[fileLineIndex] = diffLineIndex;
      }
    }
  });

  return lineMap;
}

function sendReview(owner, repo, number, commit_id, comments) {
  if (comments.length === 0) {
    // Do not leave an empty review.
    return;
  }

  const body =
    '`eslint` found some issues. You may run `yarn prettier` or `npm run prettier` to fix these.';
  const event = 'REQUEST_CHANGES';

  const opts = {
    owner,
    repo,
    number,
    commit_id,
    body,
    event,
    comments,
  };

  octokit.pullRequests.createReview(opts, function(error, res) {
    if (error) {
      console.error(error);
      return;
    }
  });
}

function sendComment(owner, repo, number, sha, filename, lineMap, message) {
  if (!lineMap[message.line]) {
    // Do not send messages on lines that did not change
    return;
  }

  var opts = {
    owner,
    repo,
    number,
    sha,
    commit_id: sha,
    path: filename,
    position: lineMap[message.line],
    body: message.message,
  };
  octokit.pullRequests.createComment(opts, function(error, res) {
    if (error) {
      console.error(error);
      return;
    }
  });
  console.log('Sending comment', opts);
}

function main(messages, owner, repo, number) {
  // No message, we don't need to do anything :)
  if (Object.keys(messages).length === 0) {
    return;
  }

  getShaFromPullRequest(owner, repo, number, sha => {
    getFilesFromCommit(owner, repo, sha, files => {
      var comments = [];
      files.filter(file => messages[file.filename]).forEach(file => {
        // github api sometimes does not return a patch on large commits
        if (!file.patch) {
          return;
        }
        var lineMap = getLineMapFromPatch(file.patch);
        messages[file.filename].forEach(message => {
          if (lineMap[message.line]) {
            var comment = {
              path: file.filename,
              position: lineMap[message.line],
              body: message.message,
            };

            comments.push(comment);
          }
        }); // forEach
      }); // filter

      sendReview(owner, repo, number, sha, comments);
    }); // getFilesFromCommit
  }); // getShaFromPullRequest
}

var content = '';
process.stdin.resume();
process.stdin.on('data', function(buf) {
  content += buf.toString();
});
process.stdin.on('end', function() {
  var messages = {};

  // Since we send a few http requests to setup the process, we don't want
  // to run this file one time per code analysis tool. Instead, we write all
  // the results in the same stdin stream.
  // The format of this stream is
  //
  //   name-of-the-converter
  //   {"json":"payload"}
  //   name-of-the-other-converter
  //   {"other": ["json", "payload"]}
  //
  // In order to generate such stream, here is a sample bash command:
  //
  //   cat <(echo eslint; npm run lint --silent -- --format=json; echo flow; flow --json) | node code-analysis-bot.js

  var lines = content.trim().split('\n');
  for (var i = 0; i < Math.ceil(lines.length / 2); ++i) {
    var converter = converters[lines[i * 2]];
    if (!converter) {
      throw new Error('Unknown converter ' + lines[i * 2]);
    }
    var json;
    try {
      json = JSON.parse(lines[i * 2 + 1]);
    } catch (e) {}

    converter(messages, json);
  }

  // The paths are returned in absolute from code analysis tools but github works
  // on paths relative from the root of the project. Doing the normalization here.
  var pwd = path.resolve('.');
  for (var absolutePath in messages) {
    var relativePath = path.relative(pwd, absolutePath);
    if (relativePath === absolutePath) {
      continue;
    }
    messages[relativePath] = messages[absolutePath];
    delete messages[absolutePath];
  }

  var owner = process.env.CIRCLE_PROJECT_USERNAME;
  var repo = process.env.CIRCLE_PROJECT_REPONAME;
  var number = process.env.CIRCLE_PR_NUMBER;

  // intentional lint warning to make sure that the bot is working :)
  main(messages, owner, repo, number);
});
