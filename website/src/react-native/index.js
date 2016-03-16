/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var Prism = require('Prism');
var React = require('React');
var Site = require('Site');

var index = React.createClass({
  render: function() {
    return (
      <Site>
        <div className="hero">
          <div className="wrap">
            <div className="text"><strong>React Native</strong></div>
            <div className="minitext">
              A framework for building native apps using React
            </div>
          </div>
        </div>

        <section className="content wrap">
          <div style={{margin: '40px auto', maxWidth: 800}}>

          <p>
            React Native enables you to build world-class application experiences on native platforms using a consistent developer experience based on JavaScript and
            {' '}<a href="http://facebook.github.io/react/" >React</a>{'. '}
            The focus of React Native is on developer efficiency across all the platforms you care about &mdash; learn once, write anywhere.
            Facebook uses React Native in multiple production apps and will continue investing in React Native.
          </p>
          </div>

          <div className="buttons-unit">
            <a href="docs/getting-started.html#content" className="button">Get started with React Native</a>
          </div>

          <div style={{margin: '40px auto', maxWidth: 800}}>

          <h2>Native Components</h2>
          <p>
            With React Native, you can use the standard platform components such as UITabBar on iOS and Drawer on Android.  This gives your app a consistent look and feel with the rest of the platform ecosystem, and keeps the quality bar high.  These components are easily incorporated into your app using their React component counterparts, such as TabBarIOS and DrawerLayoutAndroid.
          </p>
          <Prism>
{`// iOS

import React, { 
  Component,
  TabBarIOS, 
  NavigatorIOS 
} from 'react-native';

class App extends Component {
  render() {
    return (
      <TabBarIOS>
        <TabBarIOS.Item title="React Native" selected={true}>
          <NavigatorIOS initialRoute={{ title: 'React Native' }} />
        </TabBarIOS.Item>
      </TabBarIOS>
    );
  }
}`}
          </Prism>

<Prism>
{`// Android

import React, { 
  Component,
  DrawerLayoutAndroid, 
  ProgressBarAndroid, 
  Text 
} from 'react-native';

class App extends Component {
  render() {
    return (
      <DrawerLayoutAndroid
        renderNavigationView={() => <Text>React Native</Text>}>
        <ProgressBarAndroid />
      </DrawerLayoutAndroid>
    );
  }
}`}
          </Prism>

          <h2>Asynchronous Execution</h2>
          <p>
            All operations between the JavaScript application code and the native platform are performed asynchronously, and the native modules can also make use of additional threads as well.  This means we can decode images off of the main thread, save to disk in the background, measure text and compute layouts without blocking the UI, and more.  As a result, React Native apps are naturally fluid and responsive.  The communication is also fully serializable, which allows us to leverage Chrome Developer Tools to debug the JavaScript while running the complete app, either in the simulator or on a physical device.
          </p>
          <p>
            See <a href="docs/debugging.html#content">Debugging</a>.
          </p>
          <img src="img/chrome_breakpoint.png" width="800" height="443" />

          <h2>Touch Handling</h2>
          <p>
            React Native implements a powerful system to negotiate touches in complex view hierarchies and provides high level components such as TouchableHighlight that integrate properly with scroll views and other elements without any additional configuration.
          </p>
          <Prism>
{`// iOS & Android

import React, { 
  Component,
  ScrollView,
  TouchableHighlight,
  Text
} from 'react-native';

class TouchDemo extends Component {
  render() {
    return (
      <ScrollView>
        <TouchableHighlight onPress={() => console.log('pressed')}>
          <Text>Proper Touch Handling</Text>
        </TouchableHighlight>
      </ScrollView>
    );
  }
}`}
          </Prism>

          <h2>Flexbox and Styling</h2>
          <p>
            Laying out views should be easy, which is why we brought the flexbox layout model from the web to React Native.  Flexbox makes it simple to build the most common UI layouts, such as stacked and nested boxes with margin and padding.  React Native also supports common web styles, such as fontWeight, and the StyleSheet abstraction provides an optimized mechanism to declare all your styles and layout right along with the components that use them and apply them inline.
          </p>
          <Prism>
{`// iOS & Android

var React, {
  Component,
  Image, 
  StyleSheet, 
  Text, 
  View 
} from 'react-native';

class ReactNative extends Component {
  render() {
    return (
      <View style={styles.row}>
        <Image
          source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
          style={styles.image}
        />
        <View style={styles.text}>
          <Text style={styles.title}>
            React Native
          </Text>
          <Text style={styles.subtitle}>
            Build high quality mobile apps using React
          </Text>
        </View>
      </View>
    );
  }
}
var styles = StyleSheet.create({
  row: { flexDirection: 'row', margin: 40 },
  image: { width: 40, height: 40, marginRight: 10 },
  text: { flex: 1, justifyContent: 'center'},
  title: { fontSize: 11, fontWeight: 'bold' },
  subtitle: { fontSize: 10 },
});`}
          </Prism>

          <h2>Polyfills</h2>
          <p>
            React Native is focused on changing the way view code is written.  For the rest, we look to the web for universal standards and polyfill those APIs where appropriate. You can use npm to install JavaScript libraries that work on top of the functionality baked into React Native, such as XMLHttpRequest, window.requestAnimationFrame, and navigator.geolocation.  We are working on expanding the available APIs, and are excited for the Open Source community to contribute as well.
          </p>
          <Prism>
{`// iOS & Android

import React, { 
  Component,
  Text 
} from 'react-native';

class GeoInfo extends Component {
  constructor(props) {
    super(props);
    this.state = { position: 'unknown' };
  },
  componentDidMount() {
    navigator.geolocation.getCurrentPosition(
      (position) => this.setState({position}),
      (error) => console.error(error)
    );
  }
  render() {
    return (
      <Text>
        Position: {JSON.stringify(this.state.position)}
      </Text>
    );
  }
}`}
          </Prism>

          <h2>Extensibility</h2>
          <p>
            It is certainly possible to create a great app using React Native without writing a single line of native code, but React Native is also designed to be easily extended with custom native views and modules - that means you can reuse anything you{"'"}ve already built, and can import and use your favorite native libraries.
          </p>
          <h3>Creating iOS modules</h3>
          <p>
            To create a simple iOS module, create a new class that implements the RCTBridgeModule protocol, and wrap the function that you want to make available to JavaScript in RCT_EXPORT_METHOD. Additionally, the class itself must be explicitly exported with RCT_EXPORT_MODULE();.
          </p>
          <Prism>
{`// Objective-C

#import "RCTBridgeModule.h"

@interface MyCustomModule : NSObject <RCTBridgeModule>
@end

@implementation MyCustomModule

RCT_EXPORT_MODULE();

// Available as NativeModules.MyCustomModule.processString
RCT_EXPORT_METHOD(processString:(NSString *)input callback:(RCTResponseSenderBlock)callback)
{
  callback(@[[input stringByReplacingOccurrencesOfString:@"Goodbye" withString:@"Hello"]]);
}
@end`}
          </Prism>
          <Prism>
{`// JavaScript

import React, {
  Component,
  NativeModules,
  Text
} from 'react-native';

class Message extends Component {
  constructor(props) {
    super(props);
    this.state = { text: 'Goodbye World.' };
  }
  componentDidMount() {
    NativeModules.MyCustomModule.processString(this.state.text, (text) => {
      this.setState({text});
    });
  }
  render() {
    return (
      <Text>{this.state.text}</Text>
    );
  }
}`}
          </Prism>

          <h3>Creating iOS views</h3>
          <p>
            Custom iOS views can be exposed by subclassing RCTViewManager, implementing a -(UIView *)view method, and exporting properties with the RCT_EXPORT_VIEW_PROPERTY macro.  Then a simple JavaScript file connects the dots.
          </p>
          <Prism>
{`// Objective-C

#import "RCTViewManager.h"

@interface MyCustomViewManager : RCTViewManager
@end

@implementation MyCustomViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[MyCustomView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(myCustomProperty, NSString);
@end`}
          </Prism>
          <Prism>
{`// JavaScript

import React, { 
  Component,
  requireNativeComponent
} from 'react-native';

var NativeMyCustomView = requireNativeComponent('MyCustomView', MyCustomView);

export default class MyCustomView extends Component {
  static propTypes = {
    myCustomProperty: React.PropTypes.oneOf(['a', 'b']),
  };
  render() {
    return <NativeMyCustomView {...this.props} />;
  }
}
`}
          </Prism>

          <h3>Creating Android modules</h3>
          <p>
            Likewise, Android also supports custom extensions, the methods are just slightly different.
          </p>
          <p>
            To create a simple module in Android, create a new class that extends the ReactContextBaseJavaModule class, and annotate the function that you want to make available to JavaScript with @ReactMethod. Additionally, the class itself must be registered in the ReactPackage of your React Native application.
          </p>
          <Prism>
{`// Java

public class MyCustomModule extends ReactContextBaseJavaModule {

// Available as NativeModules.MyCustomModule.processString
  @ReactMethod
  public void processString(String input, Callback callback) {
    callback.invoke(input.replace("Goodbye", "Hello"));
  }
}
`}
</Prism>

<Prism>
{`// JavaScript

import React, {
  Component,
  NativeModules,
  Text
} from 'react-native';
class Message extends Component {
  constructor(props) {
    super(props);
    this.state = { text: 'Goodbye World.' };
  },
  componentDidMount() {
    NativeModules.MyCustomModule.processString(this.state.text, (text) => {
      this.setState({text});
    });
  }
  render() {
    return (
      <Text>{this.state.text}</Text>
    );
  }
}
`}
          </Prism>

          <h3>Creating Android views</h3>
          <p>
          Custom Android views can be exposed by extending SimpleViewManager, implementing a createViewInstance and getName methods, and exporting properties with the @ReactProp annotation. Then a simple JavaScript file connects the dots.
          </p>
          <Prism>
{`// Java

public class MyCustomViewManager extends SimpleViewManager<MyCustomView> {
  @Override
  public String getName() {
    return "MyCustomView";
  }

  @Override
  protected MyCustomView createViewInstance(ThemedReactContext reactContext) {
    return new MyCustomView(reactContext);
  }

  @ReactProp(name = "myCustomProperty")
  public void setMyCustomProperty(MyCustomView view, String value) {
    view.setMyCustomProperty(value);
  }
}
`}
          </Prism>
          <Prism>
{`// JavaScript

import React, {
  Component,
  requireNativeComponent 
} from 'react-native';

var NativeMyCustomView = requireNativeComponent('MyCustomView', MyCustomView);

export default class MyCustomView extends Component {
  static propTypes = {
    myCustomProperty: React.PropTypes.oneOf(['a', 'b']),
  };
  render() {
    return <NativeMyCustomView {...this.props} />;
  }
}
`}
          </Prism>
          </div>
          <section className="home-bottom-section">
            <div className="buttons-unit">
              <a href="docs/getting-started.html#content" className="button">Get started with React Native</a>
            </div>
          </section>
        </section>
      </Site>
    );
  }
});

module.exports = index;
