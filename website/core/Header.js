/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Header
 */

var React = require('React');
var slugify = require('slugify');

var Header = React.createClass({
  getDefaultProps: function() {
    return {permalink: ''};
  },

  render: function() {
    var slug = slugify(this.props.toSlug || this.props.children);
    var H = 'h' + this.props.level;
    return (
      <H {...this.props}>
        <a className="anchor" name={slug}></a>
        {this.props.children}
        {' '}<a className="hash-link" href={this.props.permalink + '#' + slug}>#</a>
      </H>
    );
  }
});

module.exports = Header;
