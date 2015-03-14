/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule Game2048
 * @flow
 */
'use strict';

var React = require('react-native');
var {
  Animation,
  AppRegistry,
  StyleSheet,
  Text,
  View,
} = React;

var GameBoard = require('GameBoard');
var TouchableBounce = require('TouchableBounce');

var BOARD_PADDING = 3;
var CELL_MARGIN = 4;
var CELL_SIZE = 60;

class Cell extends React.Component {
  render() {
    return <View style={styles.cell} />;
  }
}

class Board extends React.Component {
  render() {
    return (
      <View style={styles.board}>
        <View style={styles.row}><Cell/><Cell/><Cell/><Cell/></View>
        <View style={styles.row}><Cell/><Cell/><Cell/><Cell/></View>
        <View style={styles.row}><Cell/><Cell/><Cell/><Cell/></View>
        <View style={styles.row}><Cell/><Cell/><Cell/><Cell/></View>
        {this.props.children}
      </View>
    );
  }
}

class Tile extends React.Component {
  calculateOffset(): {top: number; left: number; opacity: number} {
    var tile = this.props.tile;

    var pos = (i) => {
      return BOARD_PADDING + (i * (CELL_SIZE + CELL_MARGIN * 2) + CELL_MARGIN);
    };

    var animationPosition = (i) => {
      return pos(i) + (CELL_SIZE / 2);
    };

    var offset = {
      top: pos(tile.toRow()),
      left: pos(tile.toColumn()),
      opacity: 1,
    };

    if (tile.isNew()) {
      offset.opacity = 0;
    } else {
      var point = [
        animationPosition(tile.toColumn()),
        animationPosition(tile.toRow()),
      ];
      Animation.startAnimation(this.refs['this'], 100, 0, 'easeInOutQuad', {position: point});
    }

    return offset;
  }

  componentDidMount() {
    setTimeout(() => {
      Animation.startAnimation(this.refs['this'], 300, 0, 'easeInOutQuad', {scaleXY: [1, 1]});
      Animation.startAnimation(this.refs['this'], 100, 0, 'easeInOutQuad', {opacity: 1});
    }, 0);
  }

  render() {
    var tile = this.props.tile;

    var tileStyles = [
      styles.tile,
      styles['tile' + tile.value],
      this.calculateOffset()
    ];

    var textStyles = [
      styles.value,
      tile.value > 4 && styles.whiteText,
      tile.value > 100 && styles.threeDigits,
      tile.value > 1000 && styles.fourDigits,
    ];

    return (
      <View ref="this" style={tileStyles}>
        <Text style={textStyles}>{tile.value}</Text>
      </View>
    );
  }
}

class GameEndOverlay extends React.Component {
  render() {
    var board = this.props.board;

    if (!board.hasWon() && !board.hasLost()) {
      return <View/>;
    }

    var message = board.hasWon() ?
      'Good Job!' : 'Game Over';

    return (
      <View style={styles.overlay}>
        <Text style={styles.overlayMessage}>{message}</Text>
        <TouchableBounce onPress={this.props.onRestart}>
          <View style={styles.tryAgain}>
            <Text style={styles.tryAgainText}>Try Again?</Text>
          </View>
        </TouchableBounce>
      </View>
    );
  }
}

class Game2048 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      board: new GameBoard(),
    };
  }

  restartGame() {
    this.setState({board: new GameBoard()});
  }

  handleTouchStart(event: Object) {
    if (this.state.board.hasWon()) {
      return;
    }

    this.startX = event.nativeEvent.pageX;
    this.startY = event.nativeEvent.pageY;
  }

  handleTouchEnd(event: Object) {
    if (this.state.board.hasWon()) {
      return;
    }

    var deltaX = event.nativeEvent.pageX - this.startX;
    var deltaY = event.nativeEvent.pageY - this.startY;

    var direction = -1;
    if (Math.abs(deltaX) > 3 * Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      direction = deltaX > 0 ? 2 : 0;
    } else if (Math.abs(deltaY) > 3 * Math.abs(deltaX) && Math.abs(deltaY) > 30) {
      direction = deltaY > 0 ? 3 : 1;
    }

    if (direction !== -1) {
      this.setState({board: this.state.board.move(direction)});
    }
  }

  render() {
    var tiles = this.state.board.tiles
      .filter((tile) => tile.value)
      .map((tile) => <Tile ref={tile.id} key={tile.id} tile={tile} />);

    return (
      <View
        style={styles.container}
        onTouchStart={(event) => this.handleTouchStart(event)}
        onTouchEnd={(event) => this.handleTouchEnd(event)}>
        <Board>
          {tiles}
        </Board>
        <GameEndOverlay board={this.state.board} onRestart={() => this.restartGame()} />
      </View>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  board: {
    padding: BOARD_PADDING,
    backgroundColor: '#bbaaaa',
    borderRadius: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(221, 221, 221, 0.5)',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayMessage: {
    fontSize: 40,
    marginBottom: 20,
  },
  tryAgain: {
    backgroundColor: '#887766',
    padding: 20,
    borderRadius: 5,
  },
  tryAgainText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 5,
    backgroundColor: '#ddccbb',
    margin: CELL_MARGIN,
  },
  row: {
    flexDirection: 'row',
  },
  tile: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: '#ddccbb',
    borderRadius: 5,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    color: '#776666',
    fontFamily: 'Verdana',
    fontWeight: 'bold',
  },
  tile2: {
    backgroundColor: '#eeeeee',
  },
  tile4: {
    backgroundColor: '#eeeecc',
  },
  tile8: {
    backgroundColor: '#ffbb88',
  },
  tile16: {
    backgroundColor: '#ff9966',
  },
  tile32: {
    backgroundColor: '#ff7755',
  },
  tile64: {
    backgroundColor: '#ff5533',
  },
  tile128: {
    backgroundColor: '#eecc77',
  },
  tile256: {
    backgroundColor: '#eecc66',
  },
  tile512: {
    backgroundColor: '#eecc55',
  },
  tile1024: {
    backgroundColor: '#eecc33',
  },
  tile2048: {
    backgroundColor: '#eecc22',
  },
  whiteText: {
    color: '#ffffff',
  },
  threeDigits: {
    fontSize: 20,
  },
  fourDigits: {
    fontSize: 18,
  },
});

AppRegistry.registerComponent('Game2048', () => Game2048);

module.exports = Game2048;
