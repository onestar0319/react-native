/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule InteractionMixin
 */
'use strict';

var InteractionManager = require('InteractionManager');

/**
 * This mixin provides safe versions of InteractionManager start/end methods
 * that ensures `clearInteractionHandle` is always called
 * once per start, even if the component is unmounted.
 */
var InteractionMixin = {
  componentWillUnmount: function() {
    while (this._interactionMixinHandles.length) {
      InteractionManager.clearInteractionHandle(
        this._interactionMixinHandles.pop()
      );
    }
  },

  _interactionMixinHandles: [],

  createInteractionHandle: function() {
    var handle = InteractionManager.createInteractionHandle();
    this._interactionMixinHandles.push(handle);
    return handle;
  },

  clearInteractionHandle: function(clearHandle) {
    InteractionManager.clearInteractionHandle(clearHandle);
    this._interactionMixinHandles = this._interactionMixinHandles.filter(
      handle => handle !== clearHandle
    );
  },

  /**
   * Schedule work for after all interactions have completed.
   *
   * @param {function} callback
   */
  runAfterInteractions: function(callback) {
    InteractionManager.runAfterInteractions(callback);
  },
};

module.exports = InteractionMixin;
