# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

def yarn_workspace(name, srcs = [], transform_ignore = None, visibility = None):
    # Noop for OSS vs FB build compatibility for now
    native.genrule(
        name = name,
        cmd = "echo {} > $OUT".format(name),
        out = "{}.txt".format(name),
        visibility = visibility,
    )
