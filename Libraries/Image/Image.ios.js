/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule Image
 */
'use strict';

var EdgeInsetsPropType = require('EdgeInsetsPropType');
var NativeMethodsMixin = require('NativeMethodsMixin');
var NativeModulesDeprecated = require('NativeModulesDeprecated');
var PropTypes = require('ReactPropTypes');
var ImageResizeMode = require('ImageResizeMode');
var ImageSourcePropType = require('ImageSourcePropType');
var ImageStylePropTypes = require('ImageStylePropTypes');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var flattenStyle = require('flattenStyle');
var insetsDiffer = require('insetsDiffer');
var invariant = require('invariant');
var merge = require('merge');
var warning = require('warning');

/**
 * A react component for displaying different types of images,
 * including network images, static resources, temporary local images, and
 * images from local disk, such as the camera roll.
 *
 * Example usage:
 *
 * ```
 * renderImages: function() {
 *   return (
 *     <View>
 *       <Image
 *         style={styles.icon}
 *         source={ix('myIcon')}
 *       />
 *       <Image
 *         style={styles.logo}
 *         source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
 *       />
 *     </View>
 *   );
 * },
 * ```
 */

var Image = React.createClass({
  propTypes: {
    source: ImageSourcePropType,
    /**
     * accessible - Whether this element should be revealed as an accessible
     * element.
     */
    accessible: PropTypes.bool,
    /**
     * accessibilityLabel - Custom string to display for accessibility.
     */
    accessibilityLabel: PropTypes.string,
    /**
     * capInsets - When the image is resized, the corners of the size specified
     * by capInsets will stay a fixed size, but the center content and borders
     * of the image will be stretched.  This is useful for creating resizable
     * rounded buttons, shadows, and other resizable assets.  More info:
     *
     *   https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIImage_Class/index.html#//apple_ref/occ/instm/UIImage/resizableImageWithCapInsets:
     */
    capInsets: EdgeInsetsPropType,
    style: StyleSheetPropType(ImageStylePropTypes),
    /**
     * testID - A unique identifier for this element to be used in UI Automation
     * testing scripts.
     */
    testID: PropTypes.string,
  },

  statics: {
    resizeMode: ImageResizeMode,
  },

  mixins: [NativeMethodsMixin],

  /**
   * `NativeMethodsMixin` will look for this when invoking `setNativeProps`. We
   * make `this` look like an actual native component class.
   */
  viewConfig: {
    uiViewClassName: 'UIView',
    validAttributes: ReactIOSViewAttributes.UIView
  },

  render: function() {
    var style = flattenStyle([styles.base, this.props.style]);
    var source = this.props.source;
    var isNetwork = source.uri && source.uri.match(/^https?:/);
    invariant(
      !(isNetwork && source.isStatic),
      'static image uris cannot start with "http": "' + source.uri + '"'
    );
    var isStored = !source.isStatic && !isNetwork;
    var RawImage = isNetwork ? RKNetworkImage : RKStaticImage;

    if (this.props.style && this.props.style.tintColor) {
      warning(RawImage === RKStaticImage, 'tintColor style only supported on static images.');
    }

    var contentModes = NativeModulesDeprecated.RKUIManager.UIView.ContentMode;
    var resizeMode;
    if (style.resizeMode === ImageResizeMode.stretch) {
      resizeMode = contentModes.ScaleToFill;
    } else if (style.resizeMode === ImageResizeMode.contain) {
      resizeMode = contentModes.ScaleAspectFit;
    } else { // ImageResizeMode.cover or undefined
      resizeMode = contentModes.ScaleAspectFill;
    }

    var nativeProps = merge(this.props, {
      style,
      resizeMode,
      tintColor: style.tintColor,
    });

    if (isStored) {
      nativeProps.imageTag = source.uri;
    } else {
      nativeProps.src = source.uri;
    }
    return <RawImage {...nativeProps} />;
  }
});

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

var CommonImageViewAttributes = merge(ReactIOSViewAttributes.UIView, {
  accessible: true,
  accessibilityLabel: true,
  capInsets: {diff: insetsDiffer}, // UIEdgeInsets=UIEdgeInsetsZero
  imageTag: true,
  resizeMode: true,
  src: true,
  testID: PropTypes.string,
});

var RKStaticImage = createReactIOSNativeComponentClass({
  validAttributes: merge(CommonImageViewAttributes, { tintColor: true }),
  uiViewClassName: 'RCTStaticImage',
});

var RKNetworkImage = createReactIOSNativeComponentClass({
  validAttributes: merge(CommonImageViewAttributes, { defaultImageSrc: true }),
  uiViewClassName: 'RCTNetworkImageView',
});

module.exports = Image;
