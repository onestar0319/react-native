/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule createExamplePage
 */
'use strict';

var React = require('react-native');
var UIExplorerBlock = require('./UIExplorerBlock');
var UIExplorerPage = require('./UIExplorerPage');

var invariant = require('invariant');

var createExamplePage = function(title, exampleModule) {
  invariant(!!exampleModule.examples, 'The module must have examples');

  var ExamplePage = React.createClass({
    statics: {
      title: exampleModule.title,
      description: exampleModule.description,
    },

    getBlock: function(example, i) {
      // Hack warning: This is a hack because the www UI explorer requires
      // renderComponent to be called.
      var originalRenderComponent = React.renderComponent;
      var originalRender = React.render;
      var renderedComponent;
      React.render = React.renderComponent = function(element, container) {
        renderedComponent = element;
      };
      var result = example.render(null);
      if (result) {
        renderedComponent = result;
      }
      React.renderComponent = originalRenderComponent;
      React.render = originalRender;
      return (
        <UIExplorerBlock
          key={i}
          title={example.title}
          description={example.description}>
          {renderedComponent}
        </UIExplorerBlock>
      );
    },

    render: function() {
      return (
        <UIExplorerPage title={title}>
          {exampleModule.examples.map(this.getBlock)}
        </UIExplorerPage>
      );
    }
  });

  return ExamplePage;
};

module.exports = createExamplePage;
