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
 */
'use strict';

var React = require('react-native');
var {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
} = React;
var ToastAndroid = require('ToastAndroid');
var AccessibilityInfo = require('AccessibilityInfo');

var UIExplorerBlock = require('./UIExplorerBlock');
var UIExplorerPage = require('./UIExplorerPage');

var AccessibilityAndroidExample = React.createClass({

  statics: {
    title: 'Accessibility',
    description: 'Examples of using Accessibility API.',
  },

  getInitialState: function() {
    return {
      count: 0,
      talkbackEnabled: false,
    };
  },

   componentDidMount: function() {
    AccessibilityInfo.addEventListener(
      'change',
      this._handleTouchExplorationChange
    );
    AccessibilityInfo.fetch().done((enabled) => {
      this.setState({
        count: this.state.count,
        talkbackEnabled: enabled}); }
    );
  },

  componentWillUnmount: function() {
    AccessibilityInfo.removeEventListener(
      'change',
      this._handleTouchExplorationChange
    );
  },

  _handleTouchExplorationChange: function(isEnabled) {
    this.setState({
      count: this.state.count,
      talkbackEnabled: isEnabled,
    });
  },

  _showAccessibilityToast: function() {
    var text = 'TouchExploration is ' + (this.state.talkbackEnabled ? 'enabled' : 'disabled');
    ToastAndroid.show(text, ToastAndroid.SHORT);
  },

  _addOne: function() {
    this.setState({
      count: ++this.state.count,
      talkbackEnabled: this.state.talkbackEnabled,
    });
  },

  render: function() {
    return (
      <UIExplorerPage title={'Accessibility'}>

        <UIExplorerBlock title="Nonaccessible view with TextViews">
          <View>
            <Text style={{color: 'green',}}>
              This is
            </Text>
            <Text style={{color: 'blue'}}>
              nontouchable normal view.
            </Text>
          </View>
        </UIExplorerBlock>

        <UIExplorerBlock title="Accessible view with TextViews wihout label">
          <View accessible={true}>
            <Text style={{color: 'green',}}>
              This is
            </Text>
            <Text style={{color: 'blue'}}>
              nontouchable accessible view without label.
            </Text>
          </View>
        </UIExplorerBlock>

        <UIExplorerBlock title="Accessible view with TextViews with label">
          <View accessible={true}
            accessibilityLabel="I have label, so I read it instead of embedded text.">
            <Text style={{color: 'green',}}>
              This is
            </Text>
            <Text style={{color: 'blue'}}>
              nontouchable accessible view with label.
            </Text>
          </View>
        </UIExplorerBlock>

        <UIExplorerBlock title="Touchable with component type = button">
          <TouchableWithoutFeedback
            onPress={() => ToastAndroid.show('Toasts work by default', ToastAndroid.SHORT)}>
            <View style={styles.embedded} accessibilityComponentType="button">
              <Text>Click me</Text>
              <Text>Or not</Text>
            </View>
          </TouchableWithoutFeedback>
        </UIExplorerBlock>

        <UIExplorerBlock title="LiveRegion">
          <TouchableWithoutFeedback onPress={this._addOne}>
            <View style={styles.embedded} accessibilityComponentType="button">
              <Text>Click me</Text>
            </View>
          </TouchableWithoutFeedback>
          <Text accessibilityLiveRegion="polite">
            Clicked {this.state.count} times
          </Text>
        </UIExplorerBlock>

        <UIExplorerBlock title="Check if TouchExploration is enabled">
          <TouchableWithoutFeedback onPress={this._showAccessibilityToast}>
            <View style={styles.embedded}>
              <Text>
                Click to check TouchExploration
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </UIExplorerBlock>

      </UIExplorerPage>
    );
  },
});

var styles = StyleSheet.create({
   embedded: {
    backgroundColor: 'yellow',
    padding:10,
  },
});

module.exports = AccessibilityAndroidExample;
