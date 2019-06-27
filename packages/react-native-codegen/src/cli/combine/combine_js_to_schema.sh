#!/bin/bash

set -e
set -u

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

# shellcheck source=xplat/js/env-utils/setup_env_vars.sh
source "$THIS_DIR/../../../../../../env-utils/setup_env_vars.sh"

pushd "$THIS_DIR/../../.." >/dev/null
  "$INSTALL_NODE_MODULES"
popd >/dev/null

exec "$FLOW_NODE_BINARY" "$THIS_DIR/combine-js-to-schema-cli.js" "$@"
