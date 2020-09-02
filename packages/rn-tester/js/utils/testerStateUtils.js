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

import {AsyncStorage} from 'react-native';

import RNTesterList from './RNTesterList';

import type {
  ExamplesList,
  RNTesterState,
  ComponentList,
} from '../types/RNTesterTypes';

export const Screens = {
  COMPONENTS: 'components',
  APIS: 'apis',
  BOOKMARKS: 'bookmarks',
};

export const initialState: RNTesterState = {
  openExample: null,
  screen: null,
  bookmarks: null,
  recentlyUsed: null,
};

const filterEmptySections = (examplesList: ExamplesList): any => {
  const filteredSections = {};
  const sectionKeys = Object.keys(examplesList);

  sectionKeys.forEach(key => {
    filteredSections[key] = examplesList[key].filter(
      section => section.data.length > 0,
    );
  });

  return filteredSections;
};

export const getExamplesListWithBookmarksAndRecentlyUsed = ({
  bookmarks,
  recentlyUsed,
}: {
  bookmarks: ComponentList,
  recentlyUsed: ComponentList,
}): ExamplesList | null => {
  // Return early if state has not been initialized from storage
  if (!bookmarks || !recentlyUsed) {
    return null;
  }

  const components = RNTesterList.ComponentExamples.map(c => ({
    ...c,
    isBookmarked: bookmarks.components.includes(c.key),
    exampleType: Screens.COMPONENTS,
  }));

  const recentlyUsedComponents = recentlyUsed.components
    .map(k => components.find(c => c.key === k))
    .filter(Boolean);

  const bookmarkedComponents = components.filter(c => c.isBookmarked);

  const apis = RNTesterList.APIExamples.map(c => ({
    ...c,
    isBookmarked: bookmarks.apis.includes(c.key),
    exampleType: Screens.APIS,
  }));

  const recentlyUsedAPIs = recentlyUsed.apis
    .map(k => apis.find(c => c.key === k))
    .filter(Boolean);

  const bookmarkedAPIs = apis.filter(c => c.isBookmarked);

  const examplesList: ExamplesList = {
    [Screens.COMPONENTS]: [
      {
        key: 'RECENT_COMPONENTS',
        data: recentlyUsedComponents,
        title: 'Recently Viewed',
      },
      {
        key: 'COMPONENTS',
        data: components,
        title: 'Components',
      },
    ],
    [Screens.APIS]: [
      {
        key: 'RECENT_APIS',
        data: recentlyUsedAPIs,
        title: 'Recently viewed',
      },
      {
        key: 'APIS',
        data: apis,
        title: 'APIs',
      },
    ],
    [Screens.BOOKMARKS]: [
      {
        key: 'COMPONENTS',
        data: bookmarkedComponents,
        title: 'Components',
      },
      {
        key: 'APIS',
        data: bookmarkedAPIs,
        title: 'APIs',
      },
    ],
  };

  return filterEmptySections(examplesList);
};

export const getInitialStateFromAsyncStorage = async (
  storageKey: string,
): Promise<RNTesterState> => {
  const initialStateString = await AsyncStorage.getItem(storageKey);

  if (!initialStateString) {
    return {
      openExample: null,
      screen: Screens.COMPONENTS,
      bookmarks: {components: [], apis: []},
      recentlyUsed: {components: [], apis: []},
    };
  } else {
    return JSON.parse(initialStateString);
  }
};
