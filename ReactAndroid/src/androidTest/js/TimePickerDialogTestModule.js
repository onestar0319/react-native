/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule TimePickerDialogTestModule
 */

'use strict';

var BatchedBridge = require('BatchedBridge');
var TimePickerAndroid = require('TimePickerAndroid');
var React = require('React');
var RecordingModule = require('NativeModules').TimePickerDialogRecordingModule;
var View = require('View');

class TimePickerDialogTestApp extends React.Component {
  render() {
    return <View />;
  }
}

var TimePickerDialogTestModule = {
  TimePickerDialogTestApp: TimePickerDialogTestApp,
  showTimePickerDialog: function(options) {
    TimePickerAndroid.open(options).then(
      ({action, hour, minute}) => {
        if (action === TimePickerAndroid.timeSetAction) {
          RecordingModule.recordTime(hour, minute);
        } else if (action === TimePickerAndroid.dismissedAction) {
          RecordingModule.recordDismissed();
        }
      },
      ({code, message}) => RecordingModule.recordError()
    );
  },
};

BatchedBridge.registerCallableModule(
  'TimePickerDialogTestModule',
  TimePickerDialogTestModule
);

module.exports = TimePickerDialogTestModule;
