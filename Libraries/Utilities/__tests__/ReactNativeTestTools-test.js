/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

import TextInput from '../../Components/TextInput/TextInput';
import TouchableWithoutFeedback from '../../Components/Touchable/TouchableWithoutFeedback';
import View from '../../Components/View/View';
import Text from '../../Text/Text';
import {byTestID, byTextMatching, enter, tap} from '../ReactNativeTestTools';
import * as React from 'react';

const ReactTestRenderer = require('react-test-renderer');

describe('ReactNativeTestTools', () => {
  const ExampleNull = () => null;

  it('matches byTestID()', () => {
    const renderSimple = ReactTestRenderer.create(<ExampleNull testID="foo" />);
    const foo = renderSimple.root.find(byTestID('foo'));
    expect(foo).toEqual(renderSimple.root);

    const renderNested = ReactTestRenderer.create(
      <View testID="bar">
        <View testID="baz" />
        <ExampleNull testID="bing">
          <View testID="impossible" />
        </ExampleNull>
      </View>,
    );
    const bar = renderNested.root.find(byTestID('bar'));
    const baz = renderNested.root.find(byTestID('baz'));
    const bing = renderNested.root.find(byTestID('bing'));
    expect(bar).toEqual(renderNested.root);
    expect(baz.type).toEqual(View);
    expect(bing.type).toEqual(ExampleNull);
    expect(renderNested.root.findAll(byTestID('impossible'))).toHaveLength(0);
  });

  it('matches byTextMatching()', () => {
    const hasFooText = byTextMatching(/foo/);
    const hasBarText = byTextMatching(/bar/);
    const renderSimple = ReactTestRenderer.create(<Text>foobarbaz</Text>);
    const foo = renderSimple.root.find(hasFooText);
    expect(foo).toEqual(renderSimple.root);
    expect(foo.type).toEqual(Text);
    expect(foo.props.children).toEqual('foobarbaz');

    const renderNested = ReactTestRenderer.create(
      <Text>
        foozy
        <Text>woobar</Text>
        fobarof
        <Text>barwoo</Text>
        woofoo
      </Text>,
    );

    const bar = renderNested.root.find(hasBarText);
    const barAll = renderNested.root.findAll(hasBarText);
    const barAllShallow = renderNested.root.findAll(hasBarText, {deep: false});
    expect(bar.props.children.toString()).toEqual(
      'foozy,[object Object],fobarof,[object Object],woofoo',
    );
    expect(barAll).toHaveLength(6);
    expect(barAllShallow).toHaveLength(1);
  });

  it('interacts via tap()', () => {
    const touchFn = jest.fn();
    const renderTouch = ReactTestRenderer.create(
      <TouchableWithoutFeedback onPress={touchFn}>
        <ExampleNull />
      </TouchableWithoutFeedback>,
    );
    tap(renderTouch.root);
    expect(touchFn).toBeCalled();

    // example of tapping <Text />
    const textFn = jest.fn();
    const renderText = ReactTestRenderer.create(<Text onPress={textFn} />);
    tap(renderText.root);
    expect(textFn).toBeCalled();
  });

  it('interacts via enter()', () => {
    const changeFn = jest.fn();
    const changeTextFn = jest.fn();
    const renderInput = ReactTestRenderer.create(
      <View>
        <TextInput onChange={changeFn} onChangeText={changeTextFn} />
      </View>,
    );
    const text = 'test message text';
    enter(renderInput.root, text);
    expect(changeFn).toBeCalled();
    expect(changeTextFn).toBeCalledWith(text);
  });
});
