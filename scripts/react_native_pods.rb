# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

def use_react_native! (options={})
  # The prefix to react-native
  prefix = options[:path] ||= "../node_modules/react-native"

  # Include Fabric dependencies
  fabric_enabled = options[:fabric_enabled] ||= false

  # Include DevSupport dependency
  production = options[:production] ||= false

  # Include Hermes dependencies
  hermes_enabled = options[:hermes_enabled] ||= false

  # The Pods which should be included in all projects
  pod 'FBLazyVector', :path => "#{prefix}/Libraries/FBLazyVector"
  pod 'FBReactNativeSpec', :path => "#{prefix}/React/FBReactNativeSpec"
  pod 'RCTRequired', :path => "#{prefix}/Libraries/RCTRequired"
  pod 'RCTTypeSafety', :path => "#{prefix}/Libraries/TypeSafety"
  pod 'React', :path => "#{prefix}/"
  pod 'React-Core', :path => "#{prefix}/"
  pod 'React-CoreModules', :path => "#{prefix}/React/CoreModules"
  pod 'React-RCTActionSheet', :path => "#{prefix}/Libraries/ActionSheetIOS"
  pod 'React-RCTAnimation', :path => "#{prefix}/Libraries/NativeAnimation"
  pod 'React-RCTBlob', :path => "#{prefix}/Libraries/Blob"
  pod 'React-RCTImage', :path => "#{prefix}/Libraries/Image"
  pod 'React-RCTLinking', :path => "#{prefix}/Libraries/LinkingIOS"
  pod 'React-RCTNetwork', :path => "#{prefix}/Libraries/Network"
  pod 'React-RCTSettings', :path => "#{prefix}/Libraries/Settings"
  pod 'React-RCTText', :path => "#{prefix}/Libraries/Text"
  pod 'React-RCTVibration', :path => "#{prefix}/Libraries/Vibration"
  pod 'React-Core/RCTWebSocket', :path => "#{prefix}/"

  unless production
    pod 'React-Core/DevSupport', :path => "#{prefix}/"
  end

  pod 'React-cxxreact', :path => "#{prefix}/ReactCommon/cxxreact"
  pod 'React-jsi', :path => "#{prefix}/ReactCommon/jsi"
  pod 'React-jsiexecutor', :path => "#{prefix}/ReactCommon/jsiexecutor"
  pod 'React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector"
  pod 'React-callinvoker', :path => "#{prefix}/ReactCommon/callinvoker"
  pod 'React-runtimeexecutor', :path => "#{prefix}/ReactCommon/runtimeexecutor"
  pod 'React-perflogger', :path => "#{prefix}/ReactCommon/reactperflogger"
  pod 'React-logger', :path => "#{prefix}/ReactCommon/logger"
  pod 'ReactCommon/turbomodule/core', :path => "#{prefix}/ReactCommon"
  pod 'Yoga', :path => "#{prefix}/ReactCommon/yoga", :modular_headers => true

  pod 'DoubleConversion', :podspec => "#{prefix}/third-party-podspecs/DoubleConversion.podspec"
  pod 'glog', :podspec => "#{prefix}/third-party-podspecs/glog.podspec"
  pod 'boost', :podspec => "#{prefix}/third-party-podspecs/boost.podspec"
  pod 'RCT-Folly', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec"

  if fabric_enabled
    pod 'React-Fabric', :path => "#{prefix}/ReactCommon"
    pod 'React-graphics', :path => "#{prefix}/ReactCommon/react/renderer/graphics"
    pod 'React-jsi/Fabric', :path => "#{prefix}/ReactCommon/jsi"
    pod 'React-RCTFabric', :path => "#{prefix}/React"
    pod 'RCT-Folly/Fabric', :podspec => "#{prefix}/third-party-podspecs/RCT-Folly.podspec"
  end

  if hermes_enabled
    pod 'React-hermes', :path => "#{prefix}/ReactCommon/hermes"
    pod 'hermes-engine'
    pod 'libevent', '~> 2.1.12'
  end
end

def use_flipper!(versions = {}, configurations: ['Debug'])
  versions['Flipper'] ||= '0.99.0'
  versions['Flipper-Boost-iOSX'] ||= '1.76.0.1.11'
  versions['Flipper-DoubleConversion'] ||= '3.1.7'
  versions['Flipper-Fmt'] ||= '7.1.7'
  versions['Flipper-Folly'] ||= '2.6.7'
  versions['Flipper-Glog'] ||= '0.3.6'
  versions['Flipper-PeerTalk'] ||= '0.0.4'
  versions['Flipper-RSocket'] ||= '1.4.3'
  versions['OpenSSL-Universal'] ||= '1.1.180'
  pod 'FlipperKit', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitLayoutPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/SKIOSNetworkPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitUserDefaultsPlugin', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitReactPlugin', versions['Flipper'], :configurations => configurations
  # List all transitive dependencies for FlipperKit pods
  # to avoid them being linked in Release builds
  pod 'Flipper', versions['Flipper'], :configurations => configurations
  pod 'Flipper-Boost-iOSX', versions['Flipper-Boost-iOSX'], :configurations => configurations
  pod 'Flipper-DoubleConversion', versions['Flipper-DoubleConversion'], :configurations => configurations
  pod 'Flipper-Fmt', versions['Flipper-Fmt'], :configurations => configurations
  pod 'Flipper-Folly', versions['Flipper-Folly'], :configurations => configurations
  pod 'Flipper-Glog', versions['Flipper-Glog'], :configurations => configurations
  pod 'Flipper-PeerTalk', versions['Flipper-PeerTalk'], :configurations => configurations
  pod 'Flipper-RSocket', versions['Flipper-RSocket'], :configurations => configurations
  pod 'FlipperKit/Core', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/CppBridge', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FBCxxFollyDynamicConvert', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FBDefines', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FKPortForwarding', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitHighlightOverlay', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitLayoutTextSearchable', versions['Flipper'], :configurations => configurations
  pod 'FlipperKit/FlipperKitNetworkPlugin', versions['Flipper'], :configurations => configurations
  pod 'OpenSSL-Universal', versions['OpenSSL-Universal'], :configurations => configurations
end

def has_pod(installer, name)
  installer.pods_project.pod_group(name) != nil
end

# Post Install processing for Flipper
def flipper_post_install(installer)
  installer.pods_project.targets.each do |target|
    if target.name == 'YogaKit'
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_VERSION'] = '4.1'
      end
    end
  end
end

def exclude_architectures(installer)
  projects = installer.aggregate_targets
    .map{ |t| t.user_project }
    .uniq{ |p| p.path }
    .push(installer.pods_project)

  arm_value = `/usr/sbin/sysctl -n hw.optional.arm64 2>&1`.to_i

  # Hermes does not support `i386` architecture
  excluded_archs_default = has_pod(installer, 'hermes-engine') ? "i386" : ""

  projects.each do |project|
    project.build_configurations.each do |config|
      if arm_value == 1 then
        config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = excluded_archs_default
      else
        config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = "arm64 " + excluded_archs_default
      end
    end

    project.save()
  end
end

def react_native_post_install(installer)
  if has_pod(installer, 'Flipper')
    flipper_post_install(installer)
  end

  exclude_architectures(installer)
end

def use_react_native_codegen!(spec, options={})
  return if ENV['DISABLE_CODEGEN'] == '1'

  # The prefix to react-native
  prefix = options[:react_native_path] ||= "../.."

  # The path to JavaScript files
  js_srcs = options[:js_srcs_dir] ||= "#{prefix}/Libraries"

  # Library name (e.g. FBReactNativeSpec)
  library_name = options[:library_name] ||= "#{spec.name}Spec"

  # Output dir, relative to podspec that invoked this method
  output_dir = options[:output_dir] ||= "#{prefix}/React/#{library_name}"

  generated_dirs = [ "#{output_dir}/#{library_name}" ]
  generated_filenames = [ "#{library_name}.h", "#{library_name}-generated.mm" ]
  generated_files = generated_filenames.map { |filename| "#{output_dir}/#{library_name}/#{filename}" }

  # Run the codegen as part of the Xcode build pipeline.
  codegen_script_args = [ "'${PODS_TARGET_SRCROOT}/#{js_srcs}'" ]
  codegen_script_args.push "'#{library_name}'"
  codegen_script_args.push "'${PODS_TARGET_SRCROOT}/#{output_dir}/#{library_name}'"

  # We use a different library name for components, as well as an additional set of files.
  # Eventually, we want these to be part of the same library as #{library_name} above.
  component_library_name = options[:component_library_name] ||= library_name
  component_output_dir = options[:component_output_dir] ||= output_dir
  generated_dirs.push "#{component_output_dir}/#{component_library_name}"
  codegen_script_args.push "'#{component_library_name}'"
  codegen_script_args.push "'${PODS_TARGET_SRCROOT}/#{component_output_dir}/#{component_library_name}'"
  components_generated_filenames = [
    "ComponentDescriptors.h",
    "EventEmitters.cpp",
    "EventEmitters.h",
    "Props.cpp",
    "Props.h",
    "RCTComponentViewHelpers.h",
    "ShadowNodes.cpp",
    "ShadowNodes.h"
  ]
  generated_files = generated_files.concat(components_generated_filenames.map { |filename| "#{component_output_dir}/#{component_library_name}/#{filename}" })

  # Prepare filesystem by creating empty files that will be picked up as references by CocoaPods.
  prepare_command = "mkdir -p #{generated_dirs.join(" ")} && touch -a #{generated_files.join(" ")}"
  system(prepare_command) # Always run prepare_command when a podspec uses the codegen, as CocoaPods may skip invoking this command in certain scenarios
  spec.prepare_command = prepare_command

  spec.script_phase = {
    :name => 'Generate Specs',
    :input_files => [ "${PODS_TARGET_SRCROOT}/#{js_srcs}" ], # This also needs to be relative to Xcode
    :output_files => ["${DERIVED_FILE_DIR}/codegen-#{library_name}.log"].concat(generated_files.map { |filename| " ${PODS_TARGET_SRCROOT}/#{filename}"} ),
    # The final generated files will be created when this script is invoked at Xcode build time.
    :script => %{set -o pipefail

bash -l -c '$\{PODS_TARGET_SRCROOT\}/#{prefix}/scripts/generate-specs.sh #{codegen_script_args.join(" ")}' 2>&1 | tee "${SCRIPT_OUTPUT_FILE_0}"
    },
    :execution_position => :before_compile,
    :show_env_vars_in_log => true
  }
end

# This provides a post_install workaround for build issues related Xcode 12.5 and Apple Silicon (M1) machines.
# Call this in the app's main Podfile's post_install hook.
# See https://github.com/facebook/react-native/issues/31480#issuecomment-902912841 for more context.
# Actual fix was authored by https://github.com/mikehardy.
# New app template will call this for now until the underlying issue is resolved.
def __apply_Xcode_12_5_M1_post_install_workaround(installer)
  # Apple Silicon builds require a library path tweak for Swift library discovery to resolve Swift-related "symbol not found".
  # Note: this was fixed via https://github.com/facebook/react-native/commit/eb938863063f5535735af2be4e706f70647e5b90
  # Keeping this logic here but commented out for future reference.
  #
  # installer.aggregate_targets.each do |aggregate_target|
  #   aggregate_target.user_project.native_targets.each do |target|
  #     target.build_configurations.each do |config|
  #       config.build_settings['LIBRARY_SEARCH_PATHS'] = ['$(SDKROOT)/usr/lib/swift', '$(inherited)']
  #     end
  #   end
  #   aggregate_target.user_project.save
  # end

  # Flipper podspecs are still targeting an older iOS deployment target, and may cause an error like:
  #   "error: thread-local storage is not supported for the current target"
  # The most reliable known workaround is to bump iOS deployment target to match react-native (iOS 11 now).
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '11.0'
      end
  end

  # But... doing so caused another issue in Flipper:
  #   "Time.h:52:17: error: typedef redefinition with different types"
  # We need to make a patch to RCT-Folly - set `__IPHONE_10_0` to our iOS target + 1.
  # See https://github.com/facebook/flipper/issues/834 for more details.
  `sed -i -e  $'s/__IPHONE_10_0/__IPHONE_12_0/' Pods/RCT-Folly/folly/portability/Time.h`
end
