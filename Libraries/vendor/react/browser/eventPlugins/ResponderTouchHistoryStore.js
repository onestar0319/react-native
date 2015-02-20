/**
 * @providesModule ResponderTouchHistoryStore
 */

"use strict";

var EventPluginUtils = require('EventPluginUtils');

var invariant = require('invariant');

var isMoveish = EventPluginUtils.isMoveish;
var isStartish = EventPluginUtils.isStartish;
var isEndish = EventPluginUtils.isEndish;

var MAX_TOUCH_BANK = 20;

/**
 * Touch position/time tracking information by touchID. Typically, we'll only
 * see IDs with a range of 1-20 (they are recycled when touches end and then
 * start again). This data is commonly needed by many different interaction
 * logic modules so precomputing it is very helpful to do once.
 * Each touch object in `touchBank` is of the following form:
 * { touchActive: boolean,
 *   startTimeStamp: number,
 *   startPageX: number,
 *   startPageY: number,
 *   currentPageX: number,
 *   currentPageY: number,
 *   currentTimeStamp: number
 * }
 */
var touchHistory = {
  touchBank: [ ],
  numberActiveTouches: 0,
  // If there is only one active touch, we remember its location. This prevents
  // us having to loop through all of the touches all the time in the most
  // common case.
  indexOfSingleActiveTouch: -1,
  mostRecentTimeStamp: 0,
};

/**
 * TODO: Instead of making gestures recompute filtered velocity, we could
 * include a built in velocity computation that can be reused globally.
 * @param {Touch} touch Native touch object.
 */
var initializeTouchData = function(touch) {
  return {
    touchActive: true,
    startTimeStamp: touch.timeStamp,
    startPageX: touch.pageX,
    startPageY: touch.pageY,
    currentPageX: touch.pageX,
    currentPageY: touch.pageY,
    currentTimeStamp: touch.timeStamp,
    previousPageX: touch.pageX,
    previousPageY: touch.pageY,
    previousTimeStamp: touch.timeStamp,
  };
};

var reinitializeTouchTrack = function(touchTrack, touch) {
  touchTrack.touchActive = true;
  touchTrack.startTimeStamp = touch.timeStamp;
  touchTrack.startPageX = touch.pageX;
  touchTrack.startPageY = touch.pageY;
  touchTrack.currentPageX = touch.pageX;
  touchTrack.currentPageY = touch.pageY;
  touchTrack.currentTimeStamp = touch.timeStamp;
  touchTrack.previousPageX = touch.pageX;
  touchTrack.previousPageY = touch.pageY;
  touchTrack.previousTimeStamp = touch.timeStamp;
};

var validateTouch = function(touch) {
  var identifier = touch.identifier;
  invariant(identifier != null, 'Touch object is missing identifier');
  if (identifier > MAX_TOUCH_BANK) {
    console.warn(
      'Touch identifier ' + identifier + ' is greater than maximum ' +
      'supported ' + MAX_TOUCH_BANK + ' which causes performance issues ' +
      'backfilling array locations for all of the indices.'
    );
  }
};

var recordStartTouchData = function(touch) {
  var touchBank = touchHistory.touchBank;
  var identifier = touch.identifier;
  var touchTrack = touchBank[identifier];
  if (__DEV__) {
    validateTouch(touch);
  }
  if (!touchTrack) {
    touchBank[touch.identifier] = initializeTouchData(touch);
  } else {
    reinitializeTouchTrack(touchTrack, touch);
  }
  touchHistory.mostRecentTimeStamp = touch.timeStamp;
};

var recordMoveTouchData = function(touch) {
  var touchBank = touchHistory.touchBank;
  var touchTrack = touchBank[touch.identifier];
  if (__DEV__) {
    validateTouch(touch);
    invariant(touchTrack, 'Touch data should have been recorded on start');
  }
  touchTrack.touchActive = true;
  touchTrack.previousPageX = touchTrack.currentPageX;
  touchTrack.previousPageY = touchTrack.currentPageY;
  touchTrack.previousTimeStamp = touchTrack.currentTimeStamp;
  touchTrack.currentPageX = touch.pageX;
  touchTrack.currentPageY = touch.pageY;
  touchTrack.currentTimeStamp = touch.timeStamp;
  touchHistory.mostRecentTimeStamp = touch.timeStamp;
};

var recordEndTouchData = function(touch) {
  var touchBank = touchHistory.touchBank;
  var touchTrack = touchBank[touch.identifier];
  if (__DEV__) {
    validateTouch(touch);
    invariant(touchTrack, 'Touch data should have been recorded on start');
  }
  touchTrack.previousPageX = touchTrack.currentPageX;
  touchTrack.previousPageY = touchTrack.currentPageY;
  touchTrack.previousTimeStamp = touchTrack.currentTimeStamp;
  touchTrack.currentPageX = touch.pageX;
  touchTrack.currentPageY = touch.pageY;
  touchTrack.currentTimeStamp = touch.timeStamp;
  touchTrack.touchActive = false;
  touchHistory.mostRecentTimeStamp = touch.timeStamp;
};

var ResponderTouchHistoryStore = {
  recordTouchTrack: function(topLevelType, nativeEvent) {
    var touchBank = touchHistory.touchBank;
    if (isMoveish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordMoveTouchData);
    } else if (isStartish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordStartTouchData);
      touchHistory.numberActiveTouches = nativeEvent.touches.length;
      if (touchHistory.numberActiveTouches === 1) {
        touchHistory.indexOfSingleActiveTouch = nativeEvent.touches[0].identifier;
      }
    } else if (isEndish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordEndTouchData);
      touchHistory.numberActiveTouches = nativeEvent.touches.length;
      if (touchHistory.numberActiveTouches === 1) {
        for (var i = 0; i < touchBank.length; i++) {
          var touchTrackToCheck = touchBank[i];
          if (touchTrackToCheck != null && touchTrackToCheck.touchActive) {
            touchHistory.indexOfSingleActiveTouch = i;
            break;
          }
        }
        if (__DEV__) {
          var activeTouchData = touchBank[touchHistory.indexOfSingleActiveTouch];
          var foundActive = activeTouchData != null && !!activeTouchData.touchActive;
          invariant(foundActive, 'Cannot find single active touch');
        }
      }
    }
  },

  touchHistory: touchHistory,
};


module.exports = ResponderTouchHistoryStore;
