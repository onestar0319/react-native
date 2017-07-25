/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ShowcaseAppIcon
 */

'use strict';

var React = require('React');

class ShowcaseAppIcon extends React.Component {
  render() {
    return (
      <a href={this.props.linkUri}>
        <img src={this.props.iconUri} alt={this.props.name} />
      </a>
    );
  }
}

module.exports = ShowcaseAppIcon;
