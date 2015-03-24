/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NavigationBarSample
 */
'use strict';

var JSNavigationStack = require('JSNavigationStack');
var NavigationBar = require('NavigationBar');
var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var TouchableOpacity = require('TouchableOpacity');
var View = require('View');

var cssVar = require('cssVar');


var NavigationBarRouteMapper = {

  LeftButton: function(route, navigationOperations, index, navState) {
    if (index === 0) {
      return null;
    }

    var previousRoute = navState.routeStack[index - 1];
    return (
      <TouchableOpacity onPress={() => navigationOperations.pop()}>
        <View>
          <Text style={[styles.navBarText, styles.navBarButtonText]}>
            {previousRoute.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },

  RightButton: function(route, navigationOperations, index, navState) {
    return (
      <TouchableOpacity
        onPress={() => navigationOperations.push(newRandomRoute())}>
        <View>
          <Text style={[styles.navBarText, styles.navBarButtonText]}>
            Next
          </Text>
        </View>
      </TouchableOpacity>
    );
  },

  Title: function(route, navigationOperations, index, navState) {
    return (
      <Text style={[styles.navBarText, styles.navBarTitleText]}>
        {route.title} [{index}]
      </Text>
    );
  },

};

function newRandomRoute() {
  return {
    content: 'Hello World!',
    title: 'Random ' + Math.round(Math.random() * 100),
  };
}

var NavigationBarSample = React.createClass({

  render: function() {
    return (
      <View style={styles.appContainer}>
        <JSNavigationStack
          debugOverlay={false}
          style={styles.appContainer}
          initialRoute={newRandomRoute()}
          renderScene={(route, navigationOperations) => (
            <View style={styles.scene}>
              <Text>{route.content}</Text>
            </View>
          )}
          navigationBar={
            <NavigationBar
              navigationBarRouteMapper={NavigationBarRouteMapper}
            />
          }
        />
      </View>
    );
  },

});

var styles = StyleSheet.create({
  appContainer: {
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    flex: 1,
  },
  scene: {
    paddingTop: 50,
    flex: 1,
  },
  navBarText: {
    fontSize: 16,
    marginVertical: 10,
  },
  navBarTitleText: {
    color: cssVar('fbui-bluegray-60'),
    fontWeight: 'bold',
    marginVertical: 9,
  },
  navBarButtonText: {
    color: cssVar('fbui-accent-blue'),
  },
});

module.exports = NavigationBarSample;
