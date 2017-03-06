#!/bin/bash
set -ex

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname $SCRIPTS)

cd $ROOT

# Create cleanup handler
function cleanup {
  EXIT_CODE=$?
  set +e

  if [ $EXIT_CODE -ne 0 ];
  then
    WATCHMAN_LOGS=/usr/local/Cellar/watchman/3.1/var/run/watchman/$USER.log
    [ -f $WATCHMAN_LOGS ] && cat $WATCHMAN_LOGS
  fi
  # kill whatever is occupying port 8081 (packager)
  lsof -i tcp:8081 | awk 'NR!=1 {print $2}' | xargs kill
  # kill whatever is occupying port 5555 (web socket server)
  lsof -i tcp:5555 | awk 'NR!=1 {print $2}' | xargs kill
}
trap cleanup EXIT

# If first argument is "test", actually start the packager and run tests as in the iOS script
# Otherwise, just build UIExplorer for tvOS and exit

if [ "$1" = "test" ];
then

# Start the packager 
open "./packager/launchPackager.command" || echo "Can't start packager automatically"
open "./IntegrationTests/launchWebSocketServer.command" || echo "Can't start web socket server automatically"

# Preload the UIExplorerApp bundle for better performance in integration tests
sleep 20
curl 'http://localhost:8081/Examples/UIExplorer/js/UIExplorerApp.ios.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/Examples/UIExplorer/js/UIExplorerApp.ios.bundle?platform=ios&dev=true&minify=false' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/IntegrationTests/IntegrationTestsApp.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/IntegrationTests/RCTRootViewIntegrationTestApp.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle

# Build and test for tvOS
# TODO: We use xcodebuild because xctool would stall when collecting info about
# the tests before running them. Switch back when this issue with xctool has
# been resolved.
xcodebuild \
  -project "Examples/UIExplorer/UIExplorer.xcodeproj" \
  -scheme "UIExplorer-tvOS" \
  -sdk "appletvsimulator" \
  -destination "platform=tvOS Simulator,name=Apple TV 1080p,OS=10.1" \
  build test

else

# Build only (no test) for tvOS, to make sure there are no missing files
xcodebuild \
  -project "Examples/UIExplorer/UIExplorer.xcodeproj" \
  -scheme "UIExplorer-tvOS" \
  -sdk "appletvsimulator" \
  -destination "platform=tvOS Simulator,name=Apple TV 1080p,OS=10.1" \
  build

fi 
