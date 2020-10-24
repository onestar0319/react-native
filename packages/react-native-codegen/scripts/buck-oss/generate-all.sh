#!/bin/bash
# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Note: To be invoked by Buck sh_binary() in OSS environment.
# DO NOT USE outside of Buck!

set -e
set -u

pushd "$BUCK_DEFAULT_RUNTIME_RESOURCES" >/dev/null
node "build/lib/cli/generators/generate-all.js" "$@"
popd >/dev/null
