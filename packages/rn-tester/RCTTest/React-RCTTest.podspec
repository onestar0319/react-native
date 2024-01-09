# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

require "json"

package = JSON.parse(File.read(File.join(__dir__, "..", "..", "react-native", "package.json")))
version = package['version']

source = { :git => 'https://github.com/facebook/react-native.git' }
if version == '1000.0.0'
  # This is an unpublished version, use the latest commit hash of the react-native repo, which we’re presumably in.
  source[:commit] = `git rev-parse HEAD`.strip if system("git rev-parse --git-dir > /dev/null 2>&1")
else
  source[:tag] = "v#{version}"
end

folly_config = get_folly_config()
folly_compiler_flags = folly_config[:compiler_flags]
folly_version = folly_config[:version]

Pod::Spec.new do |s|
  s.name                   = "React-RCTTest"
  s.version                = version
  s.summary                = "Tools for integration and snapshot testing."
  s.homepage               = "https://reactnative.dev/"
  s.license                = package["license"]
  s.author                 = "Meta Platforms, Inc. and its affiliates"
  s.platforms              = min_supported_versions
  s.compiler_flags         = folly_compiler_flags + ' -Wno-nullability-completeness'
  s.source                 = source
  s.source_files           = "**/*.{h,m,mm}"
  s.preserve_paths         = "package.json", "LICENSE", "LICENSE-docs"
  s.framework              = "XCTest"
  s.header_dir             = "RCTTest"
  s.pod_target_xcconfig    = {
                             "USE_HEADERMAP" => "YES",
                             "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
                             "HEADER_SEARCH_PATHS" => "\"$(PODS_ROOT)/RCT-Folly\""
                           }

  s.dependency "RCT-Folly", folly_version
  s.dependency "React-Core", version
  s.dependency "React-CoreModules", version
  s.dependency "ReactCommon/turbomodule/core", version
  s.dependency "React-jsi", version
end
