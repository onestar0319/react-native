/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var docgen = require('react-docgen');
var docgenHelpers = require('./docgenHelpers');
var fs = require('fs');
var path = require('path');
var slugify = require('../core/slugify');
var jsDocs = require('../jsdocs/jsdocs.js');

function getNameFromPath(filepath) {
  var ext = null;
  while (ext = path.extname(filepath)) {
    filepath = path.basename(filepath, ext);
  }

  if (filepath === 'LayoutPropTypes') {
    return 'Flexbox';
  } else if (filepath === 'TransformPropTypes') {
    return 'Transforms';
  } else if (filepath === 'TabBarItemIOS') {
    return 'TabBarIOS.Item';
  }
  return filepath;
}

function getExample(componentName) {
  var path = '../Examples/UIExplorer/' + componentName + 'Example.js';
  if (!fs.existsSync(path)) {
    path = '../Examples/UIExplorer/' + componentName + 'Example.ios.js';
    if (!fs.existsSync(path)) {
      return;
    }
  }
  return {
    path: path.replace(/^\.\.\//, ''),
    content: fs.readFileSync(path).toString(),
  };
}

// Determines whether a component should have a link to a runnable example

function isRunnable(componentName) {
  if (componentName === 'AlertIOS') {
    return true;
  }

  return false;
}

// Hide a component from the sidebar by making it return false from
// this function
function shouldDisplayInSidebar(componentName) {
  if (componentName === 'Transforms') {
    return false;
  }

  return true;
}

function getNextComponent(i) {
  var next;
  var filepath = all[i];

  if (all[i + 1]) {
    var nextComponentName = getNameFromPath(all[i + 1]);

    if (shouldDisplayInSidebar(nextComponentName)) {
      return slugify(nextComponentName);
    } else {
      return getNextComponent(i + 1);
    }
  } else {
    return 'network';
  }
}

function componentsToMarkdown(type, json, filepath, i, styles) {
  var componentName = getNameFromPath(filepath);

  var docFilePath = '../docs/' + componentName + '.md';
  if (fs.existsSync(docFilePath)) {
    json.fullDescription = fs.readFileSync(docFilePath).toString();
  }
  json.type = type;
  json.filepath = filepath.replace(/^\.\.\//, '');
  json.componentName = componentName;
  if (styles) {
    json.styles = styles;
  }
  json.example = getExample(componentName);

  // Put Flexbox into the Polyfills category
  var category = (type === 'style' ? 'Polyfills' : type + 's');
  var next = getNextComponent(i);

  var res = [
    '---',
    'id: ' + slugify(componentName),
    'title: ' + componentName,
    'layout: autodocs',
    'category: ' + category,
    'permalink: docs/' + slugify(componentName) + '.html',
    'next: ' + next,
    'sidebar: ' + shouldDisplayInSidebar(componentName),
    'runnable:' + isRunnable(componentName),
    '---',
    JSON.stringify(json, null, 2),
  ].filter(function(line) { return line; }).join('\n');
  return res;
}

var n;

function renderComponent(filepath) {
  var json = docgen.parse(
    fs.readFileSync(filepath),
    docgenHelpers.findExportedOrFirst,
    docgen.defaultHandlers.concat(docgenHelpers.stylePropTypeHandler)
  );

  return componentsToMarkdown('component', json, filepath, n++, styleDocs);
}

function renderAPI(type) {
  return function(filepath) {
    var json;
    try {
      json = jsDocs(fs.readFileSync(filepath).toString());
    } catch(e) {
      console.error('Cannot parse file', filepath);
      json = {};
    }
    return componentsToMarkdown(type, json, filepath, n++);
  };
}

function renderStyle(filepath) {
  var json = docgen.parse(
    fs.readFileSync(filepath),
    docgenHelpers.findExportedObject,
    [docgen.handlers.propTypeHandler]
  );

  // Remove deprecated transform props from docs
  if (filepath === "../Libraries/StyleSheet/TransformPropTypes.js") {
    ['rotation', 'scaleX', 'scaleY', 'translateX', 'translateY'].forEach(function(key) {
      delete json['props'][key];
    });
  }

  return componentsToMarkdown('style', json, filepath, n++);
}

var components = [
  '../Libraries/Components/ActivityIndicatorIOS/ActivityIndicatorIOS.ios.js',
  '../Libraries/Components/DatePicker/DatePickerIOS.ios.js',
  '../Libraries/Image/Image.ios.js',
  '../Libraries/CustomComponents/ListView/ListView.js',
  '../Libraries/Components/MapView/MapView.js',
  '../Libraries/CustomComponents/Navigator/Navigator.js',
  '../Libraries/Components/Navigation/NavigatorIOS.ios.js',
  '../Libraries/Picker/PickerIOS.ios.js',
  '../Libraries/Components/ScrollView/ScrollView.js',
  '../Libraries/Components/SegmentedControlIOS/SegmentedControlIOS.ios.js',
  '../Libraries/Components/SliderIOS/SliderIOS.ios.js',
  '../Libraries/Components/SwitchIOS/SwitchIOS.ios.js',
  '../Libraries/Components/TabBarIOS/TabBarIOS.ios.js',
  '../Libraries/Components/TabBarIOS/TabBarItemIOS.ios.js',
  '../Libraries/Text/Text.js',
  '../Libraries/Components/TextInput/TextInput.js',
  '../Libraries/Components/Touchable/TouchableHighlight.js',
  '../Libraries/Components/Touchable/TouchableOpacity.js',
  '../Libraries/Components/Touchable/TouchableWithoutFeedback.js',
  '../Libraries/Components/View/View.js',
  '../Libraries/Components/WebView/WebView.ios.js',
];

var apis = [
  '../Libraries/ActionSheetIOS/ActionSheetIOS.js',
  '../Libraries/Utilities/AlertIOS.js',
  '../Libraries/AppRegistry/AppRegistry.js',
  '../Libraries/AppStateIOS/AppStateIOS.ios.js',
  '../Libraries/Storage/AsyncStorage.ios.js',
  '../Libraries/CameraRoll/CameraRoll.js',
  '../Libraries/Interaction/InteractionManager.js',
  '../Libraries/LayoutAnimation/LayoutAnimation.js',
  '../Libraries/LinkingIOS/LinkingIOS.js',
  '../Libraries/Network/NetInfo.js',
  '../Libraries/vendor/react/browser/eventPlugins/PanResponder.js',
  '../Libraries/Utilities/PixelRatio.js',
  '../Libraries/PushNotificationIOS/PushNotificationIOS.js',
  '../Libraries/Components/StatusBar/StatusBarIOS.ios.js',
  '../Libraries/StyleSheet/StyleSheet.js',
  '../Libraries/Vibration/VibrationIOS.ios.js',
];

var styles = [
  '../Libraries/StyleSheet/LayoutPropTypes.js',
  '../Libraries/StyleSheet/TransformPropTypes.js',
  '../Libraries/Components/View/ViewStylePropTypes.js',
  '../Libraries/Text/TextStylePropTypes.js',
  '../Libraries/Image/ImageStylePropTypes.js',
];

var polyfills = [
  '../Libraries/GeoLocation/Geolocation.js',
];

var all = components
  .concat(apis)
  .concat(styles.slice(0, 2))
  .concat(polyfills);

var styleDocs = styles.slice(2).reduce(function(docs, filepath) {
  docs[path.basename(filepath).replace(path.extname(filepath), '')] =
    docgen.parse(
      fs.readFileSync(filepath),
      docgenHelpers.findExportedObject,
      [docgen.handlers.propTypeHandler]
    );

  return docs;
}, {});

module.exports = function() {
  n = 0;
  return [].concat(
    components.map(renderComponent),
    apis.map(renderAPI('api')),
    styles.slice(0, 2).map(renderStyle),
    polyfills.map(renderAPI('Polyfill'))
  );
};
