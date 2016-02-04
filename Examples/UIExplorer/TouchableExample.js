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
  PixelRatio,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  UIManager,
  View,
} = React;

exports.displayName = (undefined: ?string);
exports.description = 'Touchable and onPress examples.';
exports.title = '<Touchable*> and onPress';
exports.examples = [
{
  title: '<TouchableHighlight>',
  description: 'TouchableHighlight works by adding an extra view with a ' +
    'black background under the single child view.  This works best when the ' +
    'child view is fully opaque, although it can be made to work as a simple ' +
    'background color change as well with the activeOpacity and ' +
    'underlayColor props.',
  render: function() {
    return (
      <View>
        <View style={styles.row}>
          <TouchableHighlight
            style={styles.wrapper}
            onPress={() => console.log('stock THW image - highlight')}>
            <Image
              source={heartImage}
              style={styles.image}
            />
          </TouchableHighlight>
          <TouchableHighlight
            style={styles.wrapper}
            activeOpacity={1}
            animationVelocity={0}
            underlayColor="rgb(210, 230, 255)"
            onPress={() => console.log('custom THW text - hightlight')}>
            <View style={styles.wrapperCustom}>
              <Text style={styles.text}>
                Tap Here For Custom Highlight!
              </Text>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    );
  },
}, {
  title: '<Text onPress={fn}> with highlight',
  render: function(): ReactElement {
    return <TextOnPressBox />;
  },
}, {
  title: 'Touchable feedback events',
  description: '<Touchable*> components accept onPress, onPressIn, ' +
    'onPressOut, and onLongPress as props.',
  render: function(): ReactElement {
    return <TouchableFeedbackEvents />;
  },
}, {
  title: 'Touchable delay for events',
  description: '<Touchable*> components also accept delayPressIn, ' +
    'delayPressOut, and delayLongPress as props. These props impact the ' +
    'timing of feedback events.',
  render: function(): ReactElement {
    return <TouchableDelayEvents />;
  },
}, {
  title: '3D Touch / Force Touch',
  description: 'iPhone 6s and 6s plus support 3D touch, which adds a force property to touches',
  render: function(): ReactElement {
    return <ForceTouchExample />;
  },
  platform: 'ios',
}];

var TextOnPressBox = React.createClass({
  getInitialState: function() {
    return {
      timesPressed: 0,
    };
  },
  textOnPress: function() {
    this.setState({
      timesPressed: this.state.timesPressed + 1,
    });
  },
  render: function() {
    var textLog = '';
    if (this.state.timesPressed > 1) {
      textLog = this.state.timesPressed + 'x text onPress';
    } else if (this.state.timesPressed > 0) {
      textLog = 'text onPress';
    }

    return (
      <View>
        <Text
          style={styles.textBlock}
          onPress={this.textOnPress}>
          Text has built-in onPress handling
        </Text>
        <View style={styles.logBox}>
          <Text>
            {textLog}
          </Text>
        </View>
      </View>
    );
  }
});

var TouchableFeedbackEvents = React.createClass({
  getInitialState: function() {
    return {
      eventLog: [],
    };
  },
  render: function() {
    return (
      <View testID="touchable_feedback_events">
        <View style={[styles.row, {justifyContent: 'center'}]}>
          <TouchableOpacity
            style={styles.wrapper}
            testID="touchable_feedback_events_button"
            accessibilityLabel="touchable feedback events"
            accessibilityTraits="button"
            accessibilityComponentType="button"
            onPress={() => this._appendEvent('press')}
            onPressIn={() => this._appendEvent('pressIn')}
            onPressOut={() => this._appendEvent('pressOut')}
            onLongPress={() => this._appendEvent('longPress')}>
            <Text style={styles.button}>
              Press Me
            </Text>
          </TouchableOpacity>
        </View>
        <View testID="touchable_feedback_events_console" style={styles.eventLogBox}>
          {this.state.eventLog.map((e, ii) => <Text key={ii}>{e}</Text>)}
        </View>
      </View>
    );
  },
  _appendEvent: function(eventName) {
    var limit = 6;
    var eventLog = this.state.eventLog.slice(0, limit - 1);
    eventLog.unshift(eventName);
    this.setState({eventLog});
  },
});

var TouchableDelayEvents = React.createClass({
  getInitialState: function() {
    return {
      eventLog: [],
    };
  },
  render: function() {
    return (
      <View testID="touchable_delay_events">
        <View style={[styles.row, {justifyContent: 'center'}]}>
          <TouchableOpacity
            style={styles.wrapper}
            testID="touchable_delay_events_button"
            onPress={() => this._appendEvent('press')}
            delayPressIn={400}
            onPressIn={() => this._appendEvent('pressIn - 400ms delay')}
            delayPressOut={1000}
            onPressOut={() => this._appendEvent('pressOut - 1000ms delay')}
            delayLongPress={800}
            onLongPress={() => this._appendEvent('longPress - 800ms delay')}>
            <Text style={styles.button}>
              Press Me
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.eventLogBox} testID="touchable_delay_events_console">
          {this.state.eventLog.map((e, ii) => <Text key={ii}>{e}</Text>)}
        </View>
      </View>
    );
  },
  _appendEvent: function(eventName) {
    var limit = 6;
    var eventLog = this.state.eventLog.slice(0, limit - 1);
    eventLog.unshift(eventName);
    this.setState({eventLog});
  },
});

var ForceTouchExample = React.createClass({
  getInitialState: function() {
    return {
      force: 0,
    };
  },
  _renderConsoleText: function() {
    return View.forceTouchAvailable ?
      'Force: ' + this.state.force.toFixed(3) :
      '3D Touch is not available on this device';
  },
  render: function() {
    return (
      <View testID="touchable_3dtouch_event">
        <View style={styles.forceTouchBox} testID="touchable_3dtouch_output">
          <Text>{this._renderConsoleText()}</Text>
        </View>
        <View style={[styles.row, {justifyContent: 'center'}]}>
          <View
            style={styles.wrapper}
            testID="touchable_3dtouch_button"
            onStartShouldSetResponder={() => true}
            onResponderMove={(event) => this.setState({force: event.nativeEvent.force})}
            onResponderRelease={(event) => this.setState({force: 0})}>
            <Text style={styles.button}>
              Press Me
            </Text>
          </View>
        </View>
      </View>
    );
  },
});

var heartImage = {uri: 'https://pbs.twimg.com/media/BlXBfT3CQAA6cVZ.png:small'};

var styles = StyleSheet.create({
  row: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  icon: {
    width: 24,
    height: 24,
  },
  image: {
    width: 50,
    height: 50,
  },
  text: {
    fontSize: 16,
  },
  button: {
    color: '#007AFF',
  },
  wrapper: {
    borderRadius: 8,
  },
  wrapperCustom: {
    borderRadius: 8,
    padding: 6,
  },
  logBox: {
    padding: 20,
    margin: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  eventLogBox: {
    padding: 10,
    margin: 10,
    height: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
  },
  forceTouchBox: {
    padding: 10,
    margin: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  textBlock: {
    fontWeight: '500',
    color: 'blue',
  },
});
