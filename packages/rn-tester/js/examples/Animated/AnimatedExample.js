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

const RNTesterButton = require('../../components/RNTesterButton');
const React = require('react');
const {Animated, Easing, StyleSheet, Text, View} = require('react-native');

import type {RNTesterExampleModuleItem} from '../../types/RNTesterTypes';

const styles = StyleSheet.create({
  content: {
    backgroundColor: 'deepskyblue',
    borderWidth: 1,
    borderColor: 'dodgerblue',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  rotatingImage: {
    width: 70,
    height: 70,
  },
});

exports.framework = 'React';
exports.title = 'Animated - Examples';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/animated';
exports.description = ('Animated provides a powerful ' +
  'and easy-to-use API for building modern, ' +
  'interactive user experiences.': string);

exports.examples = ([
  {
    title: 'FadeInView',
    name: 'fadeInView',
    description: ('Uses a simple timing animation to ' +
      'bring opacity from 0 to 1 when the component ' +
      'mounts.': string),
    render: function(): React.Node {
      class FadeInView extends React.Component<$FlowFixMeProps, any> {
        constructor(props) {
          super(props);
          this.state = {
            fadeAnim: new Animated.Value(0), // opacity 0
          };
        }
        componentDidMount() {
          Animated.timing(
            // Uses easing functions
            this.state.fadeAnim, // The value to drive
            {
              // Target
              toValue: 1,

              // Configuration
              duration: 2000,

              useNativeDriver: false,
            },
          ).start(); // Don't forget start!
        }
        render() {
          return (
            <Animated.View // Special animatable View
              style={{
                opacity: this.state.fadeAnim, // Binds
              }}>
              {this.props.children}
            </Animated.View>
          );
        }
      }

      type Props = $ReadOnly<{||}>;
      type State = {|show: boolean|};
      class FadeInExample extends React.Component<Props, State> {
        constructor(props: Props) {
          super(props);
          this.state = {
            show: true,
          };
        }
        render() {
          return (
            <View>
              <RNTesterButton
                testID="toggle-button"
                onPress={() => {
                  this.setState(state => ({show: !state.show}));
                }}>
                Press to {this.state.show ? 'Hide' : 'Show'}
              </RNTesterButton>
              {this.state.show && (
                <FadeInView>
                  <View testID="fade-in-view" style={styles.content}>
                    <Text>FadeInView</Text>
                  </View>
                </FadeInView>
              )}
            </View>
          );
        }
      }
      return <FadeInExample />;
    },
  },
  {
    title: 'Transform Bounce',
    description: ('One `Animated.Value` is driven by a ' +
      'spring with custom constants and mapped to an ' +
      'ordered set of transforms.  Each transform has ' +
      'an interpolation to convert the value into the ' +
      'right range and units.': string),
    render: function(): React.Node {
      this.anim = this.anim || new Animated.Value(0);
      return (
        <View>
          <RNTesterButton
            onPress={() => {
              Animated.spring(this.anim, {
                // Returns to the start
                toValue: 0,

                // Velocity makes it move
                velocity: 3,

                // Slow
                tension: -10,

                // Oscillate a lot
                friction: 1,

                useNativeDriver: false,
              }).start();
            }}>
            Press to Fling it!
          </RNTesterButton>
          <Animated.View
            style={[
              styles.content,
              {
                transform: [
                  // Array order matters
                  {
                    scale: this.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 4],
                    }),
                  },
                  {
                    translateX: this.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 500],
                    }),
                  },
                  {
                    rotate: this.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        '0deg',
                        '360deg', // 'deg' or 'rad'
                      ],
                    }),
                  },
                ],
              },
            ]}>
            <Text>Transforms!</Text>
          </Animated.View>
        </View>
      );
    },
  },
  {
    title: 'Composite Animations with Easing',
    description: ('Sequence, parallel, delay, and ' +
      'stagger with different easing functions.': string),
    render: function(): React.Node {
      this.anims = this.anims || [1, 2, 3].map(() => new Animated.Value(0));
      return (
        <View>
          <RNTesterButton
            onPress={() => {
              const timing = Animated.timing;
              Animated.sequence([
                // One after the other
                timing(this.anims[0], {
                  toValue: 200,
                  easing: Easing.linear,
                  useNativeDriver: false,
                }),
                Animated.delay(400), // Use with sequence
                timing(this.anims[0], {
                  toValue: 0,

                  // Springy
                  easing: Easing.elastic(2),

                  useNativeDriver: false,
                }),
                Animated.delay(400),
                Animated.stagger(
                  200,
                  this.anims
                    .map(anim =>
                      timing(anim, {
                        toValue: 200,
                        useNativeDriver: false,
                      }),
                    )
                    .concat(
                      this.anims.map(anim =>
                        timing(anim, {
                          toValue: 0,
                          useNativeDriver: false,
                        }),
                      ),
                    ),
                ),
                Animated.delay(400),
                Animated.parallel(
                  [
                    Easing.inOut(Easing.quad), // Symmetric
                    Easing.back(1.5), // Goes backwards first
                    Easing.ease, // Default bezier
                  ].map((easing, ii) =>
                    timing(this.anims[ii], {
                      toValue: 320,
                      easing,
                      duration: 3000,
                      useNativeDriver: false,
                    }),
                  ),
                ),
                Animated.delay(400),
                Animated.stagger(
                  200,
                  this.anims.map(anim =>
                    timing(anim, {
                      toValue: 0,

                      // Like a ball
                      easing: Easing.bounce,

                      duration: 2000,
                      useNativeDriver: false,
                    }),
                  ),
                ),
              ]).start();
            }}>
            Press to Animate
          </RNTesterButton>
          {['Composite', 'Easing', 'Animations!'].map((text, ii) => (
            <Animated.View
              key={text}
              style={[
                styles.content,
                {
                  left: this.anims[ii],
                },
              ]}>
              <Text>{text}</Text>
            </Animated.View>
          ))}
        </View>
      );
    },
  },
  {
    title: 'Rotating Images',
    description: 'Simple Animated.Image rotation.',
    render: function(): React.Node {
      this.anim = this.anim || new Animated.Value(0);
      return (
        <View>
          <RNTesterButton
            onPress={() => {
              Animated.spring(this.anim, {
                // Returns to the start
                toValue: 0,

                // Velocity makes it move
                velocity: 3,

                // Slow
                tension: -10,

                // Oscillate a lot
                friction: 1,

                useNativeDriver: false,
              }).start();
            }}>
            Press to Spin it!
          </RNTesterButton>
          <Animated.Image
            source={require('../../assets/bunny.png')}
            style={[
              styles.rotatingImage,
              {
                transform: [
                  {
                    scale: this.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 10],
                    }),
                  },
                  {
                    translateX: this.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 100],
                    }),
                  },
                  {
                    rotate: this.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        '0deg',
                        '360deg', // 'deg' or 'rad'
                      ],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      );
    },
  },
  {
    title: 'Moving box example',
    name: 'movingView',
    description: ('Click arrow buttons to move the box.' +
      'Then hide the box and reveal it again.' +
      'After that the box position will reset to initial position.': string),
    render: (): React.Node => {
      const containerWidth = 200;
      const boxSize = 50;

      const movingBoxStyles = StyleSheet.create({
        container: {
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          backgroundColor: '#fff',
          padding: 30,
        },
        boxContainer: {
          backgroundColor: '#d3d3d3',
          height: boxSize,
          width: containerWidth,
        },
        box: {
          width: boxSize,
          height: boxSize,
          margin: 0,
        },
        buttonsContainer: {
          marginTop: 20,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: containerWidth,
        },
      });
      type Props = $ReadOnly<{||}>;
      type State = {|boxVisible: boolean|};

      class MovingBoxExample extends React.Component<Props, State> {
        x: Animated.Value;
        constructor(props) {
          super(props);
          this.x = new Animated.Value(0);
          this.state = {
            boxVisible: true,
          };
        }

        render() {
          const {boxVisible} = this.state;
          const toggleText = boxVisible ? 'Hide' : 'Show';
          return (
            <View style={movingBoxStyles.container}>
              {this.renderBox()}
              <View style={movingBoxStyles.buttonsContainer}>
                <RNTesterButton
                  testID="move-left-button"
                  onPress={() => this.moveTo(0)}>
                  {'<-'}
                </RNTesterButton>
                <RNTesterButton onPress={this.toggleVisibility}>
                  {toggleText}
                </RNTesterButton>
                <RNTesterButton
                  testID="move-right-button"
                  onPress={() => this.moveTo(containerWidth - boxSize)}>
                  {'->'}
                </RNTesterButton>
              </View>
            </View>
          );
        }

        renderBox = () => {
          if (this.state.boxVisible) {
            const horizontalLocation = {transform: [{translateX: this.x}]};
            return (
              <View style={movingBoxStyles.boxContainer}>
                <Animated.View
                  testID="moving-view"
                  style={[
                    styles.content,
                    movingBoxStyles.box,
                    horizontalLocation,
                  ]}
                />
              </View>
            );
          } else {
            return (
              <View style={movingBoxStyles.boxContainer}>
                <Text>The box view is not being rendered</Text>
              </View>
            );
          }
        };

        moveTo = x => {
          Animated.timing(this.x, {
            toValue: x,
            duration: 1000,
            useNativeDriver: true,
          }).start();
        };

        toggleVisibility = () => {
          const {boxVisible} = this.state;
          this.setState({boxVisible: !boxVisible});
        };
      }
      return <MovingBoxExample />;
    },
  },
  {
    title: 'Continuous Interactions',
    description: ('Gesture events, chaining, 2D ' +
      'values, interrupting and transitioning ' +
      'animations, etc.': string),
    render: (): React.Node => (
      <Text>Checkout the Gratuitous Animation App!</Text>
    ),
  },
]: Array<RNTesterExampleModuleItem>);
