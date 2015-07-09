/**
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

var React = require('react-native');
var {
  AppRegistry,
  ListView,
  PixelRatio,
  Platform,
  Settings,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} = React;

var { TestModule } = React.addons;

import type { ExampleModule } from 'ExampleTypes';
import type { NavigationContext } from 'NavigationContext';

var createExamplePage = require('./createExamplePage');

var COMMON_COMPONENTS = [
  require('./ImageExample'),
  require('./LayoutEventsExample'),
  require('./ListViewExample'),
  require('./ListViewPagingExample'),
  require('./MapViewExample'),
  require('./Navigator/NavigatorExample'),
  require('./ScrollViewExample'),
  require('./TextInputExample'),
  require('./TouchableExample'),
  require('./ViewExample'),
  require('./WebViewExample'),
];

var COMMON_APIS = [
  require('./AnimationExample/AnExApp'),
  require('./GeolocationExample'),
  require('./LayoutExample'),
  require('./PanResponderExample'),
  require('./PointerEventsExample'),
];

if (Platform.OS === 'ios') {
  var COMPONENTS = COMMON_COMPONENTS.concat([
    require('./ActivityIndicatorIOSExample'),
    require('./DatePickerIOSExample'),
    require('./NavigatorIOSColorsExample'),
    require('./NavigatorIOSExample'),
    require('./PickerIOSExample'),
    require('./ProgressViewIOSExample'),
    require('./SegmentedControlIOSExample'),
    require('./SliderIOSExample'),
    require('./SwitchIOSExample'),
    require('./TabBarIOSExample'),
    require('./TextExample.ios'),
  ]);

  var APIS = COMMON_APIS.concat([
    require('./AccessibilityIOSExample'),
    require('./ActionSheetIOSExample'),
    require('./AdSupportIOSExample'),
    require('./AlertIOSExample'),
    require('./AppStateIOSExample'),
    require('./AsyncStorageExample'),
    require('./BorderExample'),
    require('./CameraRollExample.ios'),
    require('./NetInfoExample'),
    require('./PushNotificationIOSExample'),
    require('./StatusBarIOSExample'),
    require('./TimerExample'),
    require('./VibrationIOSExample'),
    require('./XHRExample'),
  ]);

} else if (Platform.OS === 'android') {
  var COMPONENTS = COMMON_COMPONENTS.concat([
  ]);

  var APIS = COMMON_APIS.concat([
  ]);
}

var ds = new ListView.DataSource({
  rowHasChanged: (r1, r2) => r1 !== r2,
  sectionHeaderHasChanged: (h1, h2) => h1 !== h2,
});

function makeRenderable(example: any): ReactClass<any, any, any> {
  return example.examples ?
    createExamplePage(null, example) :
    example;
}

// Register suitable examples for snapshot tests
COMPONENTS.concat(APIS).forEach((Example) => {
  if (Example.displayName) {
    var Snapshotter = React.createClass({
      componentDidMount: function() {
        // View is still blank after first RAF :\
        global.requestAnimationFrame(() =>
          global.requestAnimationFrame(() => TestModule.verifySnapshot(
            TestModule.markTestPassed
          )
        ));
      },
      render: function() {
        var Renderable = makeRenderable(Example);
        return <Renderable />;
      },
    });
    AppRegistry.registerComponent(Example.displayName, () => Snapshotter);
  }
});

type Props = {
  navigator: {
    navigationContext: NavigationContext,
    push: (route: {title: string, component: ReactClass<any,any,any>}) => void,
  },
  onExternalExampleRequested: Function,
  onSelectExample: Function,
  isInDrawer: bool,
};

class UIExplorerList extends React.Component {
  props: Props;

  constructor(props: Props) {
    super(props);
    this.state = {
      dataSource: ds.cloneWithRowsAndSections({
        components: COMPONENTS,
        apis: APIS,
      }),
      searchText: Platform.OS === 'ios' ? Settings.get('searchText') : '',
    };
  }

  componentWillMount() {
    this.props.navigator.navigationContext.addListener('didfocus', function(event) {
      if (event.data.route.title === 'UIExplorer') {
        Settings.set({visibleExample: null});
      }
    });
  }

  componentDidMount() {
    this._search(this.state.searchText);

    var visibleExampleTitle = Settings.get('visibleExample');
    if (visibleExampleTitle) {
      var predicate = (example) => example.title === visibleExampleTitle;
      var foundExample = APIS.find(predicate) || COMPONENTS.find(predicate);
      if (foundExample) {
        setTimeout(() => this._openExample(foundExample), 100);
      }
    }
  }

  render() {
    if (Platform.OS === 'ios' ||
      (Platform.OS === 'android' && !this.props.isInDrawer)) {
      var platformTextInputStyle =
        Platform.OS === 'ios' ? styles.searchTextInputIOS :
        Platform.OS === 'android' ? styles.searchTextInputAndroid : {};
      var textInput = (
        <View style={styles.searchRow}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="always"
            onChangeText={this._search.bind(this)}
            placeholder="Search..."
            style={[styles.searchTextInput, platformTextInputStyle]}
            value={this.state.searchText}
          />
        </View>);
    }

    var homePage;
    if (Platform.OS === 'android' && this.props.isInDrawer) {
      homePage = this._renderRow({
        title: 'UIExplorer',
        description: 'List of examples',
      }, -1);
    }

    return (
      <View style={styles.listContainer}>
        {textInput}
        {homePage}
        <ListView
          style={styles.list}
          dataSource={this.state.dataSource}
          renderRow={this._renderRow.bind(this)}
          renderSectionHeader={this._renderSectionHeader}
          keyboardShouldPersistTaps={true}
          automaticallyAdjustContentInsets={false}
          keyboardDismissMode="on-drag"
        />
      </View>
    );
  }

  _renderSectionHeader(data: any, section: string) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>
          {section.toUpperCase()}
        </Text>
      </View>
    );
  }

  _renderRow(example: any, i: number) {
    return (
      <View key={i}>
        <TouchableHighlight onPress={() => this._onPressRow(example)}>
          <View style={styles.row}>
            <Text style={styles.rowTitleText}>
              {example.title}
            </Text>
            <Text style={styles.rowDetailText}>
              {example.description}
            </Text>
          </View>
        </TouchableHighlight>
        <View style={styles.separator} />
      </View>
    );
  }

  _search(text: mixed) {
    var regex = new RegExp(text, 'i');
    var filter = (component) => regex.test(component.title);

    this.setState({
      dataSource: ds.cloneWithRowsAndSections({
        components: COMPONENTS.filter(filter),
        apis: APIS.filter(filter),
      }),
      searchText: text,
    });
    Settings.set({searchText: text});
  }

  _openExample(example: any) {
    if (example.external) {
      this.props.onExternalExampleRequested(example);
      return;
    }

    var Component = makeRenderable(example);
    if (Platform.OS === 'ios') {
      this.props.navigator.push({
        title: Component.title,
        component: Component,
      });
    } else if (Platform.OS === 'android') {
      this.props.onSelectExample({
        title: Component.title,
        component: Component,
      });
    }
  }

  _onPressRow(example: any) {
    Settings.set({visibleExample: example.title});
    this._openExample(example);
  }
}

var styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  list: {
    backgroundColor: '#eeeeee',
  },
  sectionHeader: {
    padding: 5,
  },
  group: {
    backgroundColor: 'white',
  },
  sectionHeaderTitle: {
    fontWeight: '500',
    fontSize: 11,
  },
  row: {
    backgroundColor: 'white',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  separator: {
    height: 1 / PixelRatio.get(),
    backgroundColor: '#bbbbbb',
    marginLeft: 15,
  },
  rowTitleText: {
    fontSize: 17,
    fontWeight: '500',
  },
  rowDetailText: {
    fontSize: 15,
    color: '#888888',
    lineHeight: 20,
  },
  searchRow: {
    backgroundColor: '#eeeeee',
    paddingTop: 75,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
  },
  searchTextInput: {
    backgroundColor: 'white',
    borderColor: '#cccccc',
    borderRadius: 3,
    borderWidth: 1,
    paddingLeft: 8,
  },
  searchTextInputIOS: {
    height: 30,
  },
  searchTextInputAndroid: {
    padding: 2,
  },
});

module.exports = UIExplorerList;
