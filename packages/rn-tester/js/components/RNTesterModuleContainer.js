/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const React = require('react');
const RNTesterBlock = require('./RNTesterBlock');
const RNTesterExampleFilter = require('./RNTesterExampleFilter');
import RNTPressableRow from './RNTPressableRow';
import {RNTesterThemeContext} from './RNTesterTheme';
import {View, Text, StyleSheet, Platform} from 'react-native';

import type {
  RNTesterModule,
  RNTesterModuleExample,
} from '../types/RNTesterTypes';

type Props = {
  module: RNTesterModule,
  example?: ?RNTesterModuleExample,
  onExampleCardPress: (exampleName: string) => mixed,
};

function getExampleTitle(title, platform) {
  return platform != null ? `${title} (${platform} only)` : title;
}

export default function RNTesterModuleContainer(props: Props): React.Node {
  const {module, example, onExampleCardPress} = props;
  const theme = React.useContext(RNTesterThemeContext);
  const renderExample = (e, i) => {
    // Filter platform-specific es
    const {description, platform} = e;
    let {title} = e;
    if (platform != null && Platform.OS !== platform) {
      return null;
    }
    return module.showIndividualExamples === true ? (
      <RNTPressableRow
        key={e.name}
        onPress={() => onExampleCardPress(e.name)}
        title={e.title}
        description={description}
        accessibilityLabel={e.name + ' ' + description}
        style={StyleSheet.compose(styles.separator, {
          borderBottomColor: theme.SeparatorColor,
        })}
      />
    ) : (
      <RNTesterBlock
        key={i}
        title={getExampleTitle(title, platform)}
        description={description}>
        {e.render()}
      </RNTesterBlock>
    );
  };

  if (module.examples.length === 1) {
    const description = module.examples[0].description ?? module.description;
    return (
      <>
        <Header description={description} theme={theme} />
        {module.examples[0].render()}
      </>
    );
  }

  const filter = ({example: e, filterRegex}) => filterRegex.test(e.title);

  const sections = [
    {
      data: module.examples,
      title: 'EXAMPLES',
      key: 'e',
    },
  ];

  return (
    <View style={styles.examplesContainer}>
      {module.showIndividualExamples === true && example != null ? (
        example.render()
      ) : (
        <>
          <Header
            description={module.description}
            noBottomPadding
            theme={theme}
          />
          <RNTesterExampleFilter
            testID="example_search"
            page="examples_page"
            hideFilterPills={true}
            sections={sections}
            filter={filter}
            render={({filteredSections}) =>
              filteredSections[0].data.map(renderExample)
            }
          />
        </>
      )}
    </View>
  );
}

function Header(props: {
  description: string,
  theme: RNTesterTheme,
  noBottomPadding?: ?boolean,
}) {
  return (
    <View
      style={[
        styles.headerContainer,
        props.noBottomPadding === true ? styles.headerNoBottomPadding : null,
        {backgroundColor: props.theme.BackgroundColor},
      ]}>
      <Text style={styles.headerDescription}>{props.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: Platform.OS === 'android' ? 15 : 6,
    paddingVertical: 6,
    alignItems: 'center',
  },
  headerDescription: {
    fontSize: 14,
  },
  headerNoBottomPadding: {
    paddingBottom: 0,
  },
  examplesContainer: {
    flexGrow: 1,
    flex: 1,
  },
  separator: {
    borderBottomWidth: Platform.select({
      ios: StyleSheet.hairlineWidth,
      android: 0,
    }),
    marginHorizontal: 15,
  },
});
