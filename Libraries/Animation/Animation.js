/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule Animation
 * @flow
 */
'use strict';

var { RCTAnimationManager } = require('NativeModules');
var AnimationUtils = require('AnimationUtils');

type EasingFunction = (t: number) => number;

var Animation = {
  Mixin: require('AnimationMixin'),

  startAnimation: function(
    node: any,
    duration: number,
    delay: number,
    easing: (string | EasingFunction),
    properties: {[key: string]: any}
  ): number {
    var nodeHandle = +node.getNodeHandle();
    var easingSample = AnimationUtils.evaluateEasingFunction(duration, easing);
    RCTAnimationManager.startAnimation(nodeHandle, AnimationUtils.allocateTag(), duration, delay, easingSample, properties);
  },

  stopAnimation: function(tag) {
    RCTAnimationManager.stopAnimation(tag);
  },
};

module.exports = Animation;
