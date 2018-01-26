/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule File
 * @flow
 * @format
 */
'use strict';

const Blob = require('Blob');

const invariant = require('fbjs/lib/invariant');

import type {BlobOptions} from 'BlobTypes';

/**
 * The File interface provides information about files.
 */
class File extends Blob {
  /**
   * Constructor for JS consumers.
   */
  constructor(
    parts: Array<Blob | string>,
    name: string,
    options?: BlobOptions,
  ) {
    invariant(
      parts != null && name != null,
      'Failed to construct `File`: Must pass both `parts` and `name` arguments.',
    );

    super(parts, options);
    this.data.name = name;
  }

  /**
   * Name of the file.
   */
  get name(): string {
    invariant(this.data.name != null, 'Files must have a name set.');
    return this.data.name;
  }

  /*
   * Last modified time of the file.
   */
  get lastModified(): number {
    return this.data.lastModified || 0;
  }
}

module.exports = File;
