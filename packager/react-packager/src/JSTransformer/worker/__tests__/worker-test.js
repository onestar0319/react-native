/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.autoMockOff();
jest.mock('../constant-folding');
jest.mock('../extract-dependencies');
jest.mock('../inline');
jest.mock('../minify');

const {transformCode} = require('..');
const {any, objectContaining} = jasmine;

describe('code transformation worker:', () => {
  let extractDependencies, transform;
  beforeEach(() => {
    extractDependencies =
      require('../extract-dependencies').mockReturnValue({});
    transform = jest.genMockFunction();
  });

  it('calls the transform with file name, source code, and transform options', function() {
    const filename = 'arbitrary/file.js';
    const sourceCode = 'arbitrary(code)';
    const transformOptions = {arbitrary: 'options'};
    transformCode(transform, filename, sourceCode, {transform: transformOptions});
    expect(transform).toBeCalledWith(
      {filename, sourceCode, options: transformOptions}, any(Function));
  });

  it('prefixes JSON files with an assignment to module.exports to make the code valid', function() {
    const filename = 'arbitrary/file.json';
    const sourceCode = '{"arbitrary":"property"}';
    transformCode(transform, filename, sourceCode, {});
    expect(transform).toBeCalledWith(
      {filename, sourceCode: `module.exports=${sourceCode}`}, any(Function));
  });

  it('calls back with the result of the transform', done => {
    const result = {
      code: 'some.other(code)',
      map: {}
    };
    transform.mockImplementation((_, callback) =>
      callback(null, result));

    transformCode(transform, 'filename', 'code', {}, (_, data) => {
      expect(data).toEqual(objectContaining(result));
      done();
    });
  });

  it('removes the leading assignment to `module.exports` before passing on the result if the file is a JSON file, even if minified', done => {
    const result = {
      code: 'p.exports={a:1,b:2}',
    };
    transform.mockImplementation((_, callback) =>
      callback(null, result));

    transformCode(transform, 'aribtrary/file.json', 'b', {}, (_, data) => {
      expect(data.code).toBe('{a:1,b:2}');
      done();
    });
  });

  it('calls back with any error yielded by the transform', done => {
    const error = Error('arbitrary error');
    transform.mockImplementation((_, callback) => callback(error));
    transformCode(transform, 'filename', 'code', {}, e => {
      expect(e).toBe(error);
      done();
    });
  });

  it('puts an empty `moduleLocals` object on the result', done => {
    transform.mockImplementation(
      (_, callback) => callback(null, {code: 'arbitrary'}));
    transformCode(transform, 'filename', 'code', {}, (_, data) => {
      expect(data.moduleLocals).toEqual({});
      done();
    });
  });

  it('if a `moduleLocals` array is passed, the `moduleLocals` object is a key mirror of its items', done => {
    transform.mockImplementation(
      (_, callback) => callback(null, {code: 'arbitrary'}));
    const moduleLocals =
      ['arbitrary', 'list', 'containing', 'variable', 'names'];

    transformCode(transform, 'filename', 'code', {moduleLocals}, (_, data) => {
      expect(data.moduleLocals).toEqual({
        arbitrary: 'arbitrary',
        list: 'list',
        containing: 'containing',
        variable: 'variable',
        names: 'names',
      });
      done();
    });
  });

  describe('dependency extraction:', () => {
    let code;

    beforeEach(() => {
      transform.mockImplementation(
        (_, callback) => callback(null, {code}));
    });

    it('passes the transformed code the `extractDependencies`', done => {
      code = 'arbitrary(code)';

      transformCode(transform, 'filename', 'code', {}, (_, data) => {
        expect(extractDependencies).toBeCalledWith(code);
        done();
      });
    });

    it('uses `dependencies` and `dependencyOffsets` provided by `extractDependencies` for the result', done => {
      const dependencyData = {
        dependencies: ['arbitrary', 'list', 'of', 'dependencies'],
        dependencyOffsets: [12,  119, 185, 328, 471],
      };
      extractDependencies.mockReturnValue(dependencyData);

      transformCode(transform, 'filename', 'code', {}, (_, data) => {
        expect(data).toEqual(objectContaining(dependencyData));
        done();
      });
    });

    it('does not extract requires if files are marked as "extern"', done => {
      transformCode(transform, 'filename', 'code', {extern: true}, (_, {dependencies, dependencyOffsets}) => {
        expect(extractDependencies).not.toBeCalled();
        expect(dependencies).toEqual([]);
        expect(dependencyOffsets).toEqual([]);
        done();
      });
    });

    it('does not extract requires of JSON files', done => {
      transformCode(transform, 'arbitrary.json', '{"arbitrary":"json"}', {}, (_, {dependencies, dependencyOffsets}) => {
        expect(extractDependencies).not.toBeCalled();
        expect(dependencies).toEqual([]);
        expect(dependencyOffsets).toEqual([]);
        done();
      });
    });
  });

  describe('Minifications:', () => {
    let constantFolding, extractDependencies, inline, minify, options;
    let transformResult, dependencyData, moduleLocals;
    const filename = 'arbitrary/file.js';
    const foldedCode = 'arbitrary(folded(code));'
    const foldedMap = {version: 3, sources: ['fold.js']}

    beforeEach(() => {
      constantFolding = require('../constant-folding')
        .mockReturnValue({code: foldedCode, map: foldedMap});
      extractDependencies = require('../extract-dependencies');
      inline = require('../inline');
      minify = require('../minify').mockReturnValue({});

      moduleLocals = ['module', 'require', 'exports'];
      options = {moduleLocals, minify: true};
      dependencyData = {
        dependencies: ['a', 'b', 'c'],
        dependencyOffsets: [100, 120, 140]
      };

      extractDependencies.mockImplementation(
        code => code === foldedCode ? dependencyData : {});

      transform.mockImplementation(
        (_, callback) => callback(null, transformResult));
    });

    it('passes the transform result to `inline` for constant inlining', done => {
      transformResult = {map: {version: 3}, code: 'arbitrary(code)'};
      transformCode(transform, filename, 'code', options, () => {
        expect(inline).toBeCalledWith(filename, transformResult, options);
        done();
      });
    });

    it('passes the result obtained from `inline` on to `constant-folding`', done => {
      const inlineResult = {map: {version: 3, sources: []}, ast: {}};
      inline.mockReturnValue(inlineResult);
      transformCode(transform, filename, 'code', options, () => {
        expect(constantFolding).toBeCalledWith(filename, inlineResult);
        done();
      });
    });

    it('Uses the code obtained from `constant-folding` to extract dependencies', done => {
      transformCode(transform, filename, 'code', options, () => {
        expect(extractDependencies).toBeCalledWith(foldedCode);
        done();
      });
    });

    it('passes the code obtained from `constant-folding` to `minify`', done => {
      transformCode(transform, filename, 'code', options, () => {
        expect(minify).toBeCalledWith(
          filename,
          foldedCode,
          foldedMap,
          dependencyData.dependencyOffsets,
          moduleLocals
        );
        done();
      });
    });

    it('uses the dependencies obtained from the optimized result', done => {
      transformCode(transform, filename, 'code', options, (_, result) => {
        expect(result.dependencies).toEqual(dependencyData.dependencies);
        done();
      });
    });

    it('uses data produced by `minify` for the result', done => {
      const minifyResult = {
        code: 'minified(code)',
        dependencyOffsets: [10, 30, 60],
        map: {version: 3, sources: ['minified.js']},
        moduleLocals: {module: 'x', require: 'y', exports: 'z'},
      };
      minify.mockReturnValue(minifyResult);

      transformCode(transform, 'filename', 'code', options, (_, result) => {
        expect(result).toEqual(objectContaining(minifyResult))
        done();
      });
    });
  });
});
