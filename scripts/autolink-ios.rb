def use_react_native! (options={})

  # The prefix to the react-native
  prefix = options[:path] ||= "../node_modules/react-native"
  
  # Include Fabric dependencies
  fabric_enabled = options[:fabric_enabled] ||= false
  
  # Include Turbo Modules dependencies
  turbo_modules_enabled = options[:turbo_modules_enabled] ||= false

  # Include DevSupport dependency
  production = options[:production] ||= false

  # The Pods which should be included in all projects
  pod 'React', :path => "#{prefix}/"
  pod 'React-Core', :path => "#{prefix}/React"
  pod 'React-fishhook', :path => "#{prefix}/Libraries/fishhook"
  pod 'React-RCTActionSheet', :path => "#{prefix}/Libraries/ActionSheetIOS"
  pod 'React-RCTAnimation', :path => "#{prefix}/Libraries/NativeAnimation"
  pod 'React-RCTBlob', :path => "#{prefix}/Libraries/Blob"
  pod 'React-RCTImage', :path => "#{prefix}/Libraries/Image"
  pod 'React-RCTLinking', :path => "#{prefix}/Libraries/LinkingIOS"
  pod 'React-RCTNetwork', :path => "#{prefix}/Libraries/Network"
  pod 'React-RCTSettings', :path => "#{prefix}/Libraries/Settings"
  pod 'React-RCTText', :path => "#{prefix}/Libraries/Text"
  pod 'React-RCTVibration', :path => "#{prefix}/Libraries/Vibration"
  pod 'React-RCTWebSocket', :path => "#{prefix}/Libraries/WebSocket"

  unless production
    pod 'React-DevSupport', :path => "#{prefix}/React"
  end

  pod 'React-cxxreact', :path => "#{prefix}/ReactCommon/cxxreact"
  pod 'React-jscallinvoker', :path => "#{prefix}/ReactCommon/jscallinvoker"
  pod 'React-jsi', :path => "#{prefix}/ReactCommon/jsi"
  pod 'React-jsiexecutor', :path => "#{prefix}/ReactCommon/jsiexecutor"
  pod 'React-jsinspector', :path => "#{prefix}/ReactCommon/jsinspector"
  pod 'yoga', :path => "#{prefix}/ReactCommon/yoga"

  pod 'DoubleConversion', :podspec => "#{prefix}/third-party-podspecs/DoubleConversion.podspec"
  pod 'glog', :podspec => "#{prefix}/third-party-podspecs/glog.podspec"
  pod 'Folly', :podspec => "#{prefix}/third-party-podspecs/Folly.podspec"

  if fabric_enabled
    pod 'React-Fabric', :path => "#{prefix}/ReactCommon"
    pod 'React-graphics', :path => "#{prefix}/ReactCommon/fabric/graphics"
    pod 'React-jsi/Fabric', :path => "#{prefix}/ReactCommon/jsi"
    pod 'React-RCTFabric', :path => "#{prefix}/React"
    pod 'Folly/Fabric', :podspec => "#{prefix}/third-party-podspecs/Folly.podspec"
  end
  
  if turbo_modules_enabled
    pod 'React-turbomodule-core', :path => "#{prefix}/ReactCommon/turbomodule/core"
  end
end
