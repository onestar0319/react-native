# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

Pod::Spec.new do |s|
  s.name                   = "React-jserrorhandler"
  s.version                = version
  s.summary                = "-"  # TODO
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Facebook, Inc. and its affiliates"
  s.platforms              = { :ios => "12.4", :tvos => "12.4" }
  s.public_header_files    = [ "JsErrorHandler.h" ]
  s.source                 = source
  s.source_files           = "*.{cpp,h}"
  s.pod_target_xcconfig    = { "HEADER_SEARCH_PATHS" => "" }
  s.header_dir             = "jserrorhandler"

  s.dependency "React-jsi", version
  s.dependency "React-Fabric/mapbuffer", version

end
