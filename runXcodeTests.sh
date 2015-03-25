#!/bin/sh

# Run from react-native root

set -e

xctool \
  -project IntegrationTests/IntegrationTests.xcodeproj \
  -scheme IntegrationTests \
  -sdk iphonesimulator8.1 \
  -destination "platform=iOS Simulator,OS=${1},name=iPhone 5" \
  build test

xctool \
  -project Examples/UIExplorer/UIExplorer.xcodeproj \
  -scheme UIExplorer \
  -sdk iphonesimulator8.1 \
  -destination "platform=iOS Simulator,OS=${1},name=iPhone 5" \
  build test
