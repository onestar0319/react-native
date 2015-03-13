/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule Geolocation
 */
'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTLocationObserver = require('NativeModules').RCTLocationObserver;

var invariant = require('invariant');
var logError = require('logError');
var warning = require('warning');

var subscriptions = [];

var updatesEnabled = false;

/**
 * /!\ ATTENTION /!\
 * You need to add NSLocationWhenInUseUsageDescription key
 * in Info.plist to enable geolocation, otherwise it's going
 * to *fail silently*!
 * \!/           \!/
 *
 * Geolocation follows the MDN specification:
 * https://developer.mozilla.org/en-US/docs/Web/API/Geolocation
 */
var Geolocation = {

  getCurrentPosition: function(geo_success, geo_error, geo_options) {
    invariant(
      typeof geo_success === 'function',
      'Must provide a valid geo_success callback.'
    );
    RCTLocationObserver.getCurrentPosition(
      geo_options || {},
      geo_success,
      geo_error || logError
    );
  },

  watchPosition: function(success, error, options) {
    if (!updatesEnabled) {
      RCTLocationObserver.startObserving(options || {});
      updatesEnabled = true;
    }
    var watchID = subscriptions.length;
    subscriptions.push([
      RCTDeviceEventEmitter.addListener(
        'geolocationDidChange',
        success
      ),
      error ? RCTDeviceEventEmitter.addListener(
        'geolocationError',
        error
      ) : null,
    ]);
    return watchID;
  },

  clearWatch: function(watchID) {
    var sub = subscriptions[watchID];
    if (!sub) {
      // Silently exit when the watchID is invalid or already cleared
      // This is consistent with timers
      return;
    }
    sub[0].remove();
    sub[1] && sub[1].remove();
    subscriptions[watchID] = undefined;
    var noWatchers = true;
    for (var ii = 0; ii < subscriptions.length; ii++) {
      if (subscriptions[ii]) {
        noWatchers = false; // still valid subscriptions
      }
    }
    if (noWatchers) {
      Geolocation.stopObserving();
    }
  },

  stopObserving: function() {
    if (updatesEnabled) {
      RCTLocationObserver.stopObserving();
      updatesEnabled = false;
      for (var ii = 0; ii < subscriptions.length; ii++) {
        if (subscriptions[ii]) {
          warning('Called stopObserving with existing subscriptions.');
          subscriptions[ii].remove();
        }
      }
      subscriptions = [];
    }
  }
}

module.exports = Geolocation;
