/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule deepFreezeAndThrowOnMutationInDev
 * @flow
 */

'use strict';

/**
 * If your application is accepting different values for the same field over
 * time and is doing a diff on them, you can either (1) create a copy or
 * (2) ensure that those values are not mutated behind two passes.
 * This function helps you with (2) by freezing the object and throwing if
 * the user subsequently modifies the value.
 *
 * There are two caveats with this function:
 *   - If the call site is not in strict mode, it will only throw when
 *     mutating existing fields, adding a new one
 *     will unfortunately fail silently :(
 *   - If the object is already frozen or sealed, it will not continue the
 *     deep traversal and will leave leaf nodes unfrozen.
 *
 * Freezing the object and adding the throw mechanism is expensive and will
 * only be used in DEV.
 */
function deepFreezeAndThrowOnMutationInDev<T: Object>(object: T): T {
  if (__DEV__) {
    if (typeof object !== 'object' ||
        object === null ||
        Object.isFrozen(object) ||
        Object.isSealed(object)) {
      return object;
    }

    var keys = Object.keys(object);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (object.hasOwnProperty(key)) {
        object.__defineGetter__(key, identity.bind(null, object[key]));
        object.__defineSetter__(key, throwOnImmutableMutation.bind(null, key));
      }
    }

    Object.freeze(object);
    Object.seal(object);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (object.hasOwnProperty(key)) {
        deepFreezeAndThrowOnMutationInDev(object[key]);
      }
    }
  }
  return object;
}

function throwOnImmutableMutation(key, value) {
  throw Error(
    'You attempted to set the key `' + key + '` with the value `' +
    JSON.stringify(value) + '` on an object that is meant to be immutable ' +
    'and has been frozen.'
  );
}

function identity(value) {
  return value;
}

module.exports = deepFreezeAndThrowOnMutationInDev;
