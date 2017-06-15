Pod::Spec.new do |spec|
  spec.name = 'Folly'
  spec.version = '2016.09.26.00'
  spec.license = { :type => 'Apache License, Version 2.0' }
  spec.homepage = 'https://github.com/facebook/folly'
  spec.summary = 'An open-source C++ library developed and used at Facebook.'
  spec.authors = 'Facebook'
  spec.source = { :git => 'https://github.com/facebook/folly.git',
                  :tag => "v#{spec.version}" }
  spec.module_name = 'folly'
  spec.dependency 'boost'
  spec.dependency 'DoubleConversion'
  spec.dependency 'GLog'
  spec.compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1'
  spec.header_mappings_dir = 'folly'
  spec.source_files = 'folly/Bits.cpp',
                      'folly/Conv.cpp',
                      'folly/Demangle.cpp',
                      'folly/StringBase.cpp',
                      'folly/Unicode.cpp',
                      'folly/dynamic.cpp',
                      'folly/json.cpp'
  # workaround for https://github.com/facebook/react-native/issues/14326
  spec.preserve_paths = 'folly/*.h'
  spec.libraries           = "stdc++"
  spec.pod_target_xcconfig = { "USE_HEADERMAP" => "NO",
                               "CLANG_CXX_LANGUAGE_STANDARD" => "c++14",
                               "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)\" \"$(PODS_ROOT)/boost\" \"$(PODS_ROOT)/DoubleConversion\"" }

  # Pinning to the same version as React.podspec.
  spec.platform = :ios, '8.0'

  spec.subspec "detail" do |ss|
    ss.header_dir = 'folly/detail'
    ss.source_files = 'folly/detail/*.h',
                      'folly/detail/MallocImpl.cpp'
  end

  spec.subspec "portability" do |ss|
    ss.header_dir = 'folly/portability'
    ss.source_files = 'folly/portability/*.h',
                      'folly/portability/BitsFunctexcept.cpp'
  end

end
