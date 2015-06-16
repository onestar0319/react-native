---
id: testing
title: Testing
layout: docs
category: Guides
permalink: docs/testing.html
next: runningondevice
---

## Running Tests and Contributing

The React Native repo has several tests you can run to verify you haven't caused a regression with your PR.  These tests are run with the [Travis](http://docs.travis-ci.com/) continuous integration system, and will automatically post the results to your PR.  You can also run them locally with cmd+U in the IntegrationTest and UIExplorer apps in Xcode.  You can run the jest tests via `npm test` on the command line.

If you make a change that affects a snapshot test in a PR, such as adding a new example case to one of the examples that is snapshotted, you'll need to re-record the snapshotshot reference image.  To do this, simply change to `_runner.recordMode = YES;` in UIExplorerIntegrationTests.m [here](https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/UIExplorerIntegrationTests/UIExplorerIntegrationTests.m#L46), re-run the failing tests, then flip record back to `NO` and submit/update your PR and wait to see if the travis build passes.

We don't have perfect test coverage of course, especially for complex end-to-end interactions with the user, so many changes will still require significant manual verification, but we would love it if you want to help us increase our test coverage and add more tests and test cases!

## Jest Tests

[Jest](http://facebook.github.io/jest/) tests are JS-only tests run on the command line with node.  The tests themselves live in the `__tests__` directories of the files they test, and there is a large emphasis on aggressively mocking out functionality that is not under test for failure isolation and maximum speed.  You can run the existing React Native jest tests with `npm test` from the react-native root, and we encourage you to add your own tests for any components you want to contribute to.  See [`getImageSource-test.js`](https://github.com/facebook/react-native/blob/master/Examples/Movies/__tests__/getImageSource-test.js) for a basic example.

## Integration Tests

React Native provides facilities to make it easier to test integrated components that require both native and JS components to communicate across the bridge.  The two main components are `RCTTestRunner` and `RCTTestModule`.  `RCTTestRunner` sets up the ReactNative environment and provides facilities to run the tests as `XCTestCase`s in Xcode (`runTest:module` is the simplest method).  `RCTTestModule` is exported to JS as `NativeModules.TestModule`.  The tests themselves are written in JS, and must call `TestModule.markTestCompleted()` when they are done, otherwise the test will timeout and fail.  Test failures are primarily indicated by throwing a JS exception.  It is also possible to test error conditions with `runTest:module:initialProps:expectErrorRegex:` or `runTest:module:initialProps:expectErrorBlock:` which will expect an error to be thrown and verify the error matches the provided criteria.  See [`IntegrationTestHarnessTest.js`](https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/UIExplorerIntegrationTests/js/IntegrationTestHarnessTest.js), [`IntegrationTestsTests.m`](https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/UIExplorerIntegrationTests/IntegrationTestsTests.m), and [IntegrationTestsApp.js](https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/UIExplorerIntegrationTests/js/IntegrationTestsApp.js) for example usage and integration points.

## Snapshot Tests

A common type of integration test is the snapshot test.  These tests render a component, and verify snapshots of the screen against reference images using `TestModule.verifySnapshot()`, using the [`FBSnapshotTestCase`](https://github.com/facebook/ios-snapshot-test-case) library behind the scenes.  Reference images are recorded by setting `recordMode = YES` on the `RCTTestRunner`, then running the tests.  Snapshots will differ slightly between 32 and 64 bit, and various OS versions, so it's recommended that you enforce tests are run with the correct configuration.  It's also highly recommended that all network data be mocked out, along with other potentially troublesome dependencies.  See [`SimpleSnapshotTest`](https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/UIExplorerIntegrationTests/js/SimpleSnapshotTest.js) for a basic example.
