/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule WebPlayer
 */

var React = require('React');
var Prism = require('Prism');

/**
 * Use the WebPlayer by including a ```ReactNativeWebPlayer``` block in markdown.
 *
 * Optionally, include url parameters directly after the block's language. For
 * the complete list of url parameters, see: https://github.com/dabbott/react-native-web-player
 *
 * E.g.
 * ```ReactNativeWebPlayer?platform=android
 * import React from 'react';
 * import { AppRegistry, Text } from 'react-native';
 *
 * const App = () => <Text>Hello World!</Text>;
 *
 * AppRegistry.registerComponent('MyApp', () => App);
 * ```
 */
var WebPlayer = React.createClass({
  parseParams: function(paramString) {
    var params = {};

    if (paramString) {
      var pairs = paramString.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        params[pair[0]] = pair[1];
      }
    }

    return params;
  },

  render: function() {
    var hash = `#code=${encodeURIComponent(this.props.children)}`;

    if (this.props.params) {
      hash += `&${this.props.params}`;
    }

    return (
      <div className={'web-player'}>
        <Prism>{this.props.children}</Prism>
        <iframe
          style={{marginTop: 4}}
          width='880'
          height={this.parseParams(this.props.params).platform === 'android' ? '425' : '420'}
          data-src={`//cdn.rawgit.com/dabbott/react-native-web-player/v0.1.3/index.html${hash}`}
          frameBorder='0'
        />
      </div>
    );
  },
});

module.exports = WebPlayer;
