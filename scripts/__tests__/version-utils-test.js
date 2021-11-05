/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {parseVersion} = require('../version-utils');

describe('version-utils', () => {
  describe('parseVersion', () => {
    it('should throw error if invalid match', () => {
      function testInvalidVersion() {
        parseVersion('<invalid version>');
      }
      expect(testInvalidVersion).toThrowErrorMatchingInlineSnapshot(
        `"You must pass a correctly formatted version; couldn't parse <invalid version>"`,
      );
    });

    it('should parse pre-release version with .', () => {
      const {major, minor, patch, prerelease} = parseVersion('0.66.0-rc.4');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('0');
      expect(prerelease).toBe('rc.4');
    });

    it('should parse stable version', () => {
      const {major, minor, patch, prerelease} = parseVersion('0.66.0');
      expect(major).toBe('0');
      expect(minor).toBe('66');
      expect(patch).toBe('0');
      expect(prerelease).toBeUndefined();
    });
  });
});
