/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule JSTimersExecution
 */
'use strict';

const Systrace = require('Systrace');

const invariant = require('fbjs/lib/invariant');
const keyMirror = require('fbjs/lib/keyMirror');
const performanceNow = require('fbjs/lib/performanceNow');
const warning = require('fbjs/lib/warning');

// These timing contants should be kept in sync with the ones in native ios and
// android `RCTTiming` module.
const FRAME_DURATION = 1000 / 60;
const IDLE_CALLBACK_FRAME_DEADLINE = 1;

let hasEmittedTimeDriftWarning = false;

/**
 * JS implementation of timer functions. Must be completely driven by an
 * external clock signal, all that's stored here is timerID, timer type, and
 * callback.
 */
const JSTimersExecution = {
  GUID: 1,
  Type: keyMirror({
    setTimeout: null,
    setInterval: null,
    requestAnimationFrame: null,
    setImmediate: null,
    requestIdleCallback: null,
  }),

  // Parallel arrays:
  callbacks: [],
  types: [],
  timerIDs: [],
  immediates: [],
  requestIdleCallbacks: [],

  /**
   * Calls the callback associated with the ID. Also unregister that callback
   * if it was a one time timer (setTimeout), and not unregister it if it was
   * recurring (setInterval).
   */
  callTimer(timerID, frameTime) {
    warning(
      timerID <= JSTimersExecution.GUID,
      'Tried to call timer with ID %s but no such timer exists.',
      timerID
    );
    const timerIndex = JSTimersExecution.timerIDs.indexOf(timerID);
    // timerIndex of -1 means that no timer with that ID exists. There are
    // two situations when this happens, when a garbage timer ID was given
    // and when a previously existing timer was deleted before this callback
    // fired. In both cases we want to ignore the timer id, but in the former
    // case we warn as well.
    if (timerIndex === -1) {
      return;
    }
    const type = JSTimersExecution.types[timerIndex];
    const callback = JSTimersExecution.callbacks[timerIndex];

    // Clear the metadata
    if (type === JSTimersExecution.Type.setTimeout ||
        type === JSTimersExecution.Type.setImmediate ||
        type === JSTimersExecution.Type.requestAnimationFrame ||
        type === JSTimersExecution.Type.requestIdleCallback) {
      JSTimersExecution._clearIndex(timerIndex);
    }

    try {
      if (type === JSTimersExecution.Type.setTimeout ||
          type === JSTimersExecution.Type.setInterval ||
          type === JSTimersExecution.Type.setImmediate) {
        callback();
      } else if (type === JSTimersExecution.Type.requestAnimationFrame) {
        const currentTime = performanceNow();
        callback(currentTime);
      } else if (type === JSTimersExecution.Type.requestIdleCallback) {
        callback({
          timeRemaining: function() {
            // TODO: Optimisation: allow running for longer than one frame if
            // there are no pending JS calls on the bridge from native. This
            // would require a way to check the bridge queue synchronously.
            return Math.max(0, FRAME_DURATION - (performanceNow() - frameTime));
          },
        });
      } else {
        console.error('Tried to call a callback with invalid type: ' + type);
        return;
      }
    } catch (e) {
      // Don't rethrow so that we can run every other timer.
      JSTimersExecution.errors = JSTimersExecution.errors || [];
      JSTimersExecution.errors.push(e);
    }
  },

  /**
   * This is called from the native side. We are passed an array of timerIDs,
   * and
   */
  callTimers(timerIDs) {
    invariant(
      timerIDs.length !== 0,
      'Cannot call `callTimers` with an empty list of IDs.'
    );

    JSTimersExecution.errors = null;
    timerIDs.forEach((id) => { JSTimersExecution.callTimer(id); });

    const errors = JSTimersExecution.errors;
    if (errors) {
      const errorCount = errors.length;
      if (errorCount > 1) {
        // Throw all the other errors in a setTimeout, which will throw each
        // error one at a time
        for (let ii = 1; ii < errorCount; ii++) {
          require('JSTimers').setTimeout(
            ((error) => { throw error; }).bind(null, errors[ii]),
            0
          );
        }
      }
      throw errors[0];
    }
  },

  callIdleCallbacks: function(frameTime) {
    const { Timing } = require('NativeModules');

    if (FRAME_DURATION - (performanceNow() - frameTime) < IDLE_CALLBACK_FRAME_DEADLINE) {
      return;
    }

    JSTimersExecution.errors = null;

    if (JSTimersExecution.requestIdleCallbacks.length > 0) {
      const passIdleCallbacks = JSTimersExecution.requestIdleCallbacks.slice();
      JSTimersExecution.requestIdleCallbacks = [];

      for (let i = 0; i < passIdleCallbacks.length; ++i) {
        JSTimersExecution.callTimer(passIdleCallbacks[i], frameTime);
      }
    }

    if (JSTimersExecution.requestIdleCallbacks.length === 0) {
      Timing.setSendIdleEvents(false);
    }

    if (JSTimersExecution.errors) {
      JSTimersExecution.errors.forEach((error) =>
        require('JSTimers').setTimeout(() => { throw error; }, 0)
      );
    }
  },

  /**
   * Performs a single pass over the enqueued immediates. Returns whether
   * more immediates are queued up (can be used as a condition a while loop).
   */
  callImmediatesPass() {
    Systrace.beginEvent('JSTimersExecution.callImmediatesPass()');

    // The main reason to extract a single pass is so that we can track
    // in the system trace
    if (JSTimersExecution.immediates.length > 0) {
      const passImmediates = JSTimersExecution.immediates.slice();
      JSTimersExecution.immediates = [];

      // Use for loop rather than forEach as per @vjeux's advice
      // https://github.com/facebook/react-native/commit/c8fd9f7588ad02d2293cac7224715f4af7b0f352#commitcomment-14570051
      for (let i = 0; i < passImmediates.length; ++i) {
        JSTimersExecution.callTimer(passImmediates[i]);
      }
    }

    Systrace.endEvent();

    return JSTimersExecution.immediates.length > 0;
  },

  /**
   * This is called after we execute any command we receive from native but
   * before we hand control back to native.
   */
  callImmediates() {
    JSTimersExecution.errors = null;
    while (JSTimersExecution.callImmediatesPass()) {}
    if (JSTimersExecution.errors) {
      JSTimersExecution.errors.forEach((error) =>
        require('JSTimers').setTimeout(() => { throw error; }, 0)
      );
    }
  },

  /**
   * Called from native (in development) when environment times are out-of-sync.
   */
  emitTimeDriftWarning(warningMessage) {
    if (hasEmittedTimeDriftWarning) {
      return;
    }
    hasEmittedTimeDriftWarning = true;
    console.warn(warningMessage);
  },

  _clearIndex(i) {
    JSTimersExecution.timerIDs[i] = null;
    JSTimersExecution.callbacks[i] = null;
    JSTimersExecution.types[i] = null;
  },
};

module.exports = JSTimersExecution;
