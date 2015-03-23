#!/bin/bash

# Copyright (c) 2015-present, Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the BSD-style license found in the
# LICENSE file in the root directory of this source tree. An additional grant
# of patent rights can be found in the PATENTS file in the same directory.

cd ../../
git clone git@github.com:facebook/react-native.git react-native-gh-pages
cd react-native-gh-pages
git checkout origin/gh-pages
git checkout -b gh-pages
git push --set-upstream origin gh-pages
cd ../react-native/website
