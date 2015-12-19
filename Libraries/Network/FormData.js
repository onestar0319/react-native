/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FormData
 * @flow
 */
'use strict';

type FormDataValue = any;
type FormDataNameValuePair = [string, FormDataValue];

type Headers = {[name: string]: string};
type FormDataPart = {
  string: string;
  headers: Headers;
} | {
  uri: string;
  headers: Headers;
  name?: string;
  type?: string;
};

/**
 * Polyfill for XMLHttpRequest2 FormData API, allowing multipart POST requests
 * with mixed data (string, native files) to be submitted via XMLHttpRequest.
 *
 * Example:
 *
 *   var photo = {
 *     uri: uriFromCameraRoll,
 *     type: 'image/jpeg',
 *     name: 'photo.jpg',
 *   };
 *
 *   var body = new FormData();
 *   body.append('authToken', 'secret');
 *   body.append('photo', photo);
 *   body.append('title', 'A beautiful photo!');
 *
 *   xhr.open('POST', serverURL);
 *   xhr.send(body);
 */
class FormData {
  _parts: Array<FormDataNameValuePair>;

  constructor() {
    this._parts = [];
  }

  append(key: string, value: FormDataValue) {
    // The XMLHttpRequest spec doesn't specify if duplicate keys are allowed.
    // MDN says that any new values should be appended to existing values.
    // In any case, major browsers allow duplicate keys, so that's what we'll do
    // too. They'll simply get appended as additional form data parts in the
    // request body, leaving the server to deal with them.
    this._parts.push([key, value]);
  }

  getParts(): Array<FormDataPart> {
    return this._parts.map(([name, value]) => {
      var contentDisposition = 'form-data; name="' + name + '"';
      /* $FlowIssue(>=0.20.1) #9463928 */
      var headers: Headers = {'content-disposition': contentDisposition};
      if (typeof value === 'string') {
        return {string: value, headers, fieldName: name};
      }

      // The body part is a "blob", which in React Native just means
      // an object with a `uri` attribute. Optionally, it can also
      // have a `name` and `type` attribute to specify filename and
      // content type (cf. web Blob interface.)
      if (typeof value.name === 'string') {
        headers['content-disposition'] += '; filename="' + value.name + '"';
      }
      if (typeof value.type === 'string') {
        headers['content-type'] = value.type;
      }
      return {...value, headers, fieldName: name};
    });
  }
}

module.exports = FormData;
