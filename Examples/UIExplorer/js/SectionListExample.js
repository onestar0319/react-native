/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  StyleSheet,
  Text,
  View,
} = ReactNative;

const SectionList = require('SectionList');
const UIExplorerPage = require('./UIExplorerPage');

const infoLog = require('infoLog');

const {
  FooterComponent,
  ItemComponent,
  PlainInput,
  SeparatorComponent,
  StackedItemComponent,
  genItemData,
  pressItem,
  renderSmallSwitchOption,
} = require('./ListExampleShared');

const SectionHeaderComponent = ({section}) =>
  <View>
    <Text style={styles.headerText}>SECTION HEADER: {section.key}</Text>
    <SeparatorComponent />
  </View>;

class SectionListExample extends React.PureComponent {
  static title = '<SectionList>';
  static description = 'Performant, scrollable list of data.';

  state = {
    data: genItemData(1000),
    filterText: '',
    logViewable: false,
    virtualized: true,
  };
  render() {
    const filterRegex = new RegExp(String(this.state.filterText), 'i');
    const filter = (item) => (filterRegex.test(item.text) || filterRegex.test(item.title));
    const filteredData = this.state.data.filter(filter);
    return (
      <UIExplorerPage
        noSpacer={true}
        noScroll={true}>
        <View style={styles.searchRow}>
          <PlainInput
            onChangeText={filterText => {
              this.setState(() => ({filterText}));
            }}
            placeholder="Search..."
            value={this.state.filterText}
          />
          <View style={styles.optionSection}>
            {renderSmallSwitchOption(this, 'virtualized')}
            {renderSmallSwitchOption(this, 'logViewable')}
          </View>
        </View>
        <SeparatorComponent />
        <SectionList
          FooterComponent={FooterComponent}
          ItemComponent={this._renderItemComponent}
          SectionHeaderComponent={SectionHeaderComponent}
          SeparatorComponent={SeparatorComponent}
          enableVirtualization={this.state.virtualized}
          onRefresh={() => alert('onRefresh: nothing to refresh :P')}
          onViewableItemsChanged={this._onViewableItemsChanged}
          refreshing={false}
          shouldItemUpdate={(prev, next) => prev.item !== next.item}
          sections={[
            {ItemComponent: StackedItemComponent, key: 's1', data: [
              {title: 'Item In Header Section', text: 's1', key: '0'}
            ]},
            {key: 's2', data: filteredData},
          ]}
          viewablePercentThreshold={100}
        />
      </UIExplorerPage>
    );
  }
  _renderItemComponent = ({item}) => <ItemComponent item={item} onPress={this._pressItem} />;
  // This is called when items change viewability by scrolling into our out of the viewable area.
  _onViewableItemsChanged = (info: {
    changed: Array<{
      key: string, isViewable: boolean, item: {columns: Array<*>}, index: ?number, section?: any
    }>},
  ) => {
    // Impressions can be logged here
    if (this.state.logViewable) {
      infoLog('onViewableItemsChanged: ', info.changed.map((v: Object) => (
        {...v, item: '...', section: v.section.key}
      )));
    }
  };
  _pressItem = (index: number) => {
    pressItem(this, index);
  };
}

const styles = StyleSheet.create({
  headerText: {
    padding: 4,
  },
  optionSection: {
    flexDirection: 'row',
  },
  searchRow: {
    paddingHorizontal: 10,
  },
});

module.exports = SectionListExample;
