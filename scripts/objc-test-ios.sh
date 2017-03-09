#!/bin/bash
set -ex

SCRIPTS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT=$(dirname "$SCRIPTS")

cd "$ROOT"

# Create cleanup handler
function cleanup {
  EXIT_CODE=$?
  set +e

  if [ $EXIT_CODE -ne 0 ];
  then
    WATCHMAN_LOGS=/usr/local/Cellar/watchman/3.1/var/run/watchman/$USER.log
    [ -f "$WATCHMAN_LOGS" ] && cat "$WATCHMAN_LOGS"
  fi
  # kill backgrounded jobs
  # shellcheck disable=SC2046
  kill $(jobs -p)
  # kill whatever is occupying port 8081 (packager)
  lsof -i tcp:8081 | awk 'NR!=1 {print $2}' | xargs kill
  # kill whatever is occupying port 5555 (web socket server)
  lsof -i tcp:5555 | awk 'NR!=1 {print $2}' | xargs kill
}
trap cleanup INT TERM EXIT

# Start the packager
(exec "./packager/launchPackager.command" || echo "Can't start packager automatically") &
(exec "./IntegrationTests/launchWebSocketServer.command" || echo "Can't start web socket server automatically") &

# wait until packager is ready
PACKAGER_IS_RUNNING="packager-status:running"
SECONDS=0
STATUS=

sleep 2
test "$SECONDS" -ne 0 # Make sure the magic $SECONDS variable works

set +ex
while [ "$STATUS" != "$PACKAGER_IS_RUNNING" ] && [ "$SECONDS" -lt 60 ]; do
  STATUS=$(curl --silent 'http://localhost:8081/status')
  sleep 1
done
set -ex

if [ "$STATUS" != "$PACKAGER_IS_RUNNING" ]; then
  echo "Could not startup packager within $SECONDS seconds"
  false
fi

# Preload the UIExplorerApp bundle for better performance in integration tests
curl 'http://localhost:8081/Examples/UIExplorer/js/UIExplorerApp.ios.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/Examples/UIExplorer/js/UIExplorerApp.ios.bundle?platform=ios&dev=true&minify=false' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/IntegrationTests/IntegrationTestsApp.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle
curl 'http://localhost:8081/IntegrationTests/RCTRootViewIntegrationTestApp.bundle?platform=ios&dev=true' -o temp.bundle
rm temp.bundle

# TODO: We use xcodebuild because xctool would stall when collecting info about
# the tests before running them. Switch back when this issue with xctool has
# been resolved.
xcodebuild \
  -project "Examples/UIExplorer/UIExplorer.xcodeproj" \
  -scheme "UIExplorer" \
  -sdk "iphonesimulator" \
  -destination "platform=iOS Simulator,name=iPhone 5s,OS=10.1" \
  build test

