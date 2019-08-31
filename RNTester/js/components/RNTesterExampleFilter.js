/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');

const {StyleSheet, TextInput, View} = require('react-native');
import {RNTesterThemeContext} from './RNTesterTheme';

type Props = {
  filter: Function,
  render: Function,
  sections: Object,
  disableSearch?: boolean,
  testID?: string,
};

type State = {
  filter: string,
};

class RNTesterExampleFilter extends React.Component<Props, State> {
  state: State = {filter: ''};

  render(): React.Node {
    const filterText = this.state.filter;
    let filterRegex = /.*/;

    try {
      filterRegex = new RegExp(String(filterText), 'i');
    } catch (error) {
      console.warn(
        'Failed to create RegExp: %s\n%s',
        filterText,
        error.message,
      );
    }

    const filter = example =>
      this.props.disableSearch || this.props.filter({example, filterRegex});

    const filteredSections = this.props.sections.map(section => ({
      ...section,
      data: section.data.filter(filter),
    }));

    return (
      <View style={styles.container}>
        {this._renderTextInput()}
        {this.props.render({filteredSections})}
      </View>
    );
  }

  _renderTextInput(): ?React.Element<any> {
    if (this.props.disableSearch) {
      return null;
    }
    return (
      <RNTesterThemeContext.Consumer>
        {theme => {
          return (
            <View
              style={[
                styles.searchRow,
                {backgroundColor: theme.GroupedBackgroundColor},
              ]}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="always"
                onChangeText={text => {
                  this.setState(() => ({filter: text}));
                }}
                placeholder="Search..."
                placeholderTextColor={theme.PlaceholderTextColor}
                underlineColorAndroid="transparent"
                style={[
                  styles.searchTextInput,
                  {
                    color: theme.LabelColor,
                    backgroundColor: theme.SecondaryGroupedBackgroundColor,
                    borderColor: theme.QuaternaryLabelColor,
                  },
                ]}
                testID={this.props.testID}
                value={this.state.filter}
              />
            </View>
          );
        }}
      </RNTesterThemeContext.Consumer>
    );
  }
}

const styles = StyleSheet.create({
  searchRow: {
    padding: 10,
  },
  searchTextInput: {
    borderRadius: 3,
    borderWidth: 1,
    paddingLeft: 8,
    paddingVertical: 0,
    height: 35,
  },
  container: {
    flex: 1,
  },
});

module.exports = RNTesterExampleFilter;
