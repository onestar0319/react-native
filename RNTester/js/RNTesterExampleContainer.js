/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const React = require('react');
const {Platform} = require('react-native');
const RNTesterBlock = require('./RNTesterBlock');
const RNTesterExampleFilter = require('./RNTesterExampleFilter');
const RNTesterPage = require('./RNTesterPage');

class RNTesterExampleContainer extends React.Component {
  renderExample(example, i) {
    // Filter platform-specific examples
    const {description, platform} = example;
    let {title} = example;
    if (platform) {
      if (Platform.OS !== platform) {
        return null;
      }
      title += ' (' + platform + ' only)';
    }
    return (
      <RNTesterBlock key={i} title={title} description={description}>
        {example.render()}
      </RNTesterBlock>
    );
  }

  render(): React.Element<any> {
    if (!this.props.module.examples) {
      return <this.props.module />;
    }

    if (this.props.module.examples.length === 1) {
      const Example = this.props.module.examples[0].render;
      return <Example />;
    }

    const filter = ({example, filterRegex}) => filterRegex.test(example.title);

    const sections = [
      {
        data: this.props.module.examples,
        title: 'EXAMPLES',
        key: 'e',
      },
    ];

    return (
      <RNTesterPage title={this.props.title}>
        <RNTesterExampleFilter
          sections={sections}
          filter={filter}
          render={({filteredSections}) =>
            filteredSections[0].data.map(this.renderExample)
          }
        />
      </RNTesterPage>
    );
  }
}

module.exports = RNTesterExampleContainer;
