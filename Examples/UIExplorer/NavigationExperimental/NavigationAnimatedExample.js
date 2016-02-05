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
*/
'use strict';

var React = require('react-native');
var {
  NavigationExperimental,
  StyleSheet,
  ScrollView,
} = React;
var NavigationExampleRow = require('./NavigationExampleRow');
var {
  AnimatedView: NavigationAnimatedView,
  Card: NavigationCard,
  RootContainer: NavigationRootContainer,
  Reducer: NavigationReducer,
  Header: NavigationHeader,
} = NavigationExperimental;

const NavigationBasicReducer = NavigationReducer.StackReducer({
  initialStates: [
    {key: 'First Route'}
  ],
  matchAction: action => true,
  actionStateMap: actionString => ({key: actionString}),
});

class NavigationAnimatedExample extends React.Component {
  componentWillMount() {
    this._renderNavigated = this._renderNavigated.bind(this);
  }
  render() {
    return (
      <NavigationRootContainer
        reducer={NavigationBasicReducer}
        persistenceKey="NavigationAnimatedExampleState"
        renderNavigation={this._renderNavigated}
      />
    );
  }
  _renderNavigated(navigationState, onNavigate) {
    if (!navigationState) {
      return null;
    }
    return (
      <NavigationAnimatedView
        navigationState={navigationState}
        style={styles.animatedView}
        renderOverlay={(position, layout) => (
          <NavigationHeader
            navigationState={navigationState}
            position={position}
            getTitle={state => state.key}
          />
        )}
        renderScene={(state, index, position, layout) => (
          <NavigationCard
            key={state.key}
            index={index}
            navigationState={navigationState}
            position={position}
            layout={layout}>
            <ScrollView style={styles.scrollView}>
              <NavigationExampleRow
                text={navigationState.children[navigationState.index].key}
              />
              <NavigationExampleRow
                text="Push!"
                onPress={() => {
                  onNavigate('Route #' + navigationState.children.length);
                }}
              />
              <NavigationExampleRow
                text="Exit Animated Nav Example"
                onPress={this.props.onExampleExit}
              />
            </ScrollView>
          </NavigationCard>
        )}
      />
    );
  }
}

const styles = StyleSheet.create({
  animatedView: {
    flex: 1,
  },
  scrollView: {
    marginTop: 64
  },
});

module.exports = NavigationAnimatedExample;
