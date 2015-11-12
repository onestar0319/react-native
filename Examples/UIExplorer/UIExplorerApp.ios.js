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
 * @providesModule UIExplorerApp
 * @flow
 */
'use strict';

var React = require('react-native');
var UIExplorerList = require('./UIExplorerList.ios');
var {
  AppRegistry,
  NavigatorIOS,
  StyleSheet,
  Text,
  View
} = React;

var UIExplorerApp = React.createClass({

  getInitialState: function() {
    return {
      openExternalExample: (null: ?React.Component),
    };
  },

  render: function() {
    if (this.state.openExternalExample) {
      var Example = this.state.openExternalExample;
      return (
        <Example
          onExampleExit={() => {
            this.setState({ openExternalExample: null, });
          }}
        />
      );
    }

    return (
      <NavigatorIOS
        style={styles.container}
        initialRoute={{
          title: 'UIExplorer',
          component: UIExplorerList,
          passProps: {
            onExternalExampleRequested: (example) => {
              this.setState({ openExternalExample: example, });
            },
          }
        }}
        itemWrapperStyle={styles.itemWrapper}
        tintColor="#008888"
      />
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemWrapper: {
    backgroundColor: '#eaeaea',
  },
});

var SetPropertiesExampleApp = React.createClass({

  render: function() {
    var wrapperStyle = {
      backgroundColor: this.props.color,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    };

    return (
      <View style={wrapperStyle}>
        <Text>
          Embedded React Native view
        </Text>
      </View>
    );
  },
});

AppRegistry.registerComponent('SetPropertiesExampleApp', () => SetPropertiesExampleApp);
AppRegistry.registerComponent('UIExplorerApp', () => UIExplorerApp);
UIExplorerList.registerComponents();

module.exports = UIExplorerApp;
