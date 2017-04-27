#!/bin/bash
set -ex

# Script used to run iOS tests.
# If not arguments are passed to the script, it will only compile
# the UIExplorer.
# If the script is called with a single argument "test", we'll
# also run the UIExplorer integration test (needs JS and packager):
# ./objc-test-ios.sh test

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname "$SCRIPTS")

cd "$ROOT"

SCHEME="UIExplorer"
SDK="iphonesimulator"
DESTINATION="platform=iOS Simulator,name=iPhone 5s,OS=10.1"

# If there is a "test" argument, pass it to the test script.
. ./scripts/objc-test.sh $1
