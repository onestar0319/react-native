/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const ReactNativeStyleAttributes = require('ReactNativeStyleAttributes');

const processColor = require('processColor');

const colorHandler = {diff: null, process: processColor};

const viewConfig = {
  directEventTypes: {
    topError: {registrationName: 'onError'},
    topLoad: {registrationName: 'onLoad'},
    topLoadEnd: {registrationName: 'onLoadEnd'},
    topLoadStart: {registrationName: 'onLoadStart'},
  },
  NativeProps: {
    accessibilityComponentType: 'String',
    accessibilityHint: 'String',
    accessibilityLabel: 'String',
    accessibilityLiveRegion: 'String',
    accessibilityRole: 'String',
    accessibilityStates: 'Array',
    alignContent: 'String',
    alignItems: 'String',
    alignSelf: 'String',
    aspectRatio: 'number',
    backgroundColor: 'Color',
    blurRadius: 'number',
    borderBottomLeftRadius: 'number',
    borderBottomRightRadius: 'number',
    borderBottomWidth: 'number',
    borderColor: 'Color',
    borderEndWidth: 'number',
    borderLeftWidth: 'number',
    borderRadius: 'number',
    borderRightWidth: 'number',
    borderStartWidth: 'number',
    borderTopLeftRadius: 'number',
    borderTopRightRadius: 'number',
    borderTopWidth: 'number',
    borderWidth: 'number',
    bottom: 'Dynamic',
    defaultSrc: 'String',
    display: 'String',
    elevation: 'number',
    end: 'Dynamic',
    fadeDuration: 'number',
    flex: 'number',
    flexBasis: 'Dynamic',
    flexDirection: 'String',
    flexGrow: 'number',
    flexShrink: 'number',
    flexWrap: 'String',
    headers: 'Map',
    height: 'Dynamic',
    importantForAccessibility: 'String',
    justifyContent: 'String',
    left: 'Dynamic',
    loadingIndicatorSrc: 'String',
    margin: 'Dynamic',
    marginBottom: 'Dynamic',
    marginEnd: 'Dynamic',
    marginHorizontal: 'Dynamic',
    marginLeft: 'Dynamic',
    marginRight: 'Dynamic',
    marginStart: 'Dynamic',
    marginTop: 'Dynamic',
    marginVertical: 'Dynamic',
    maxHeight: 'Dynamic',
    maxWidth: 'Dynamic',
    minHeight: 'Dynamic',
    minWidth: 'Dynamic',
    nativeID: 'String',
    onLayout: 'boolean',
    opacity: 'number',
    overflow: 'String',
    overlayColor: 'number',
    padding: 'Dynamic',
    paddingBottom: 'Dynamic',
    paddingEnd: 'Dynamic',
    paddingHorizontal: 'Dynamic',
    paddingLeft: 'Dynamic',
    paddingRight: 'Dynamic',
    paddingStart: 'Dynamic',
    paddingTop: 'Dynamic',
    paddingVertical: 'Dynamic',
    position: 'String',
    progressiveRenderingEnabled: 'boolean',
    renderToHardwareTextureAndroid: 'boolean',
    resizeMethod: 'String',
    resizeMode: 'String',
    right: 'Dynamic',
    rotation: 'number',
    scaleX: 'number',
    scaleY: 'number',
    shouldNotifyLoadEvents: 'boolean',
    src: 'Array',
    start: 'Dynamic',
    testID: 'String',
    tintColor: 'Color',
    top: 'Dynamic',
    transform: 'Array',
    translateX: 'number',
    translateY: 'number',
    width: 'Dynamic',
    zIndex: 'number',
  },
  uiViewClassName: 'RCTImageView',
  validAttributes: {
    accessibilityComponentType: true,
    accessibilityHint: true,
    accessibilityLabel: true,
    accessibilityLiveRegion: true,
    accessibilityRole: true,
    accessibilityStates: true,
    alignContent: true,
    alignItems: true,
    alignSelf: true,
    aspectRatio: true,
    backgroundColor: colorHandler,
    blurRadius: true,
    borderBottomLeftRadius: true,
    borderBottomRightRadius: true,
    borderBottomWidth: true,
    borderColor: colorHandler,
    borderEndWidth: true,
    borderLeftWidth: true,
    borderRadius: true,
    borderRightWidth: true,
    borderStartWidth: true,
    borderTopLeftRadius: true,
    borderTopRightRadius: true,
    borderTopWidth: true,
    borderWidth: true,
    bottom: true,
    defaultSrc: true,
    display: true,
    elevation: true,
    end: true,
    fadeDuration: true,
    flex: true,
    flexBasis: true,
    flexDirection: true,
    flexGrow: true,
    flexShrink: true,
    flexWrap: true,
    headers: true,
    height: true,
    importantForAccessibility: true,
    justifyContent: true,
    left: true,
    loadingIndicatorSrc: true,
    margin: true,
    marginBottom: true,
    marginEnd: true,
    marginHorizontal: true,
    marginLeft: true,
    marginRight: true,
    marginStart: true,
    marginTop: true,
    marginVertical: true,
    maxHeight: true,
    maxWidth: true,
    minHeight: true,
    minWidth: true,
    nativeID: true,
    onLayout: true,
    opacity: true,
    overflow: true,
    overlayColor: true,
    padding: true,
    paddingBottom: true,
    paddingEnd: true,
    paddingHorizontal: true,
    paddingLeft: true,
    paddingRight: true,
    paddingStart: true,
    paddingTop: true,
    paddingVertical: true,
    position: true,
    progressiveRenderingEnabled: true,
    renderToHardwareTextureAndroid: true,
    resizeMethod: true,
    resizeMode: true,
    right: true,
    rotation: true,
    scaleX: true,
    scaleY: true,
    shouldNotifyLoadEvents: true,
    src: true,
    start: true,
    testID: true,
    tintColor: colorHandler,
    top: true,
    transform: true,
    translateX: true,
    translateY: true,
    width: true,
    zIndex: true,
    style: ReactNativeStyleAttributes,
  },
};

module.exports = viewConfig;
