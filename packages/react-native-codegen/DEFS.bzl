load("//tools/build_defs:buckconfig.bzl", "read_bool")
load("//tools/build_defs:fb_native_wrapper.bzl", "fb_native")
load(
    "//tools/build_defs/oss:rn_defs.bzl",
    "ANDROID",
    "APPLE",
    "CXX",
    "IOS",
    "MACOSX",
    "YOGA_CXX_TARGET",
    "fb_apple_library",
    "fb_xplat_cxx_test",
    "get_apple_compiler_flags",
    "get_apple_inspector_flags",
    "get_preprocessor_flags_for_build_mode",
    "react_native_dep",
    "react_native_target",
    "react_native_xplat_target",
    "react_native_xplat_target_apple",
    "rn_android_library",
    "rn_xplat_cxx_library",
)

def rn_codegen_modules(
        native_module_spec_name,
        name = "",
        schema_target = ""):
    generate_fixtures_rule_name = "generate_fixtures_modules-{}".format(name)
    generate_module_hobjcpp_name = "generate_module_hobjcpp-{}".format(name)
    generate_module_mm_name = "generate_module_mm-{}".format(name)
    generate_module_java_name = "generate_module_java-{}".format(name)
    generate_module_java_zip_name = "generate_module_java_zip-{}".format(name)
    generate_module_jni_h_name = "generate_module_jni_h-{}".format(name)
    generate_module_jni_cpp_name = "generate_module_jni_cpp-{}".format(name)

    fb_native.genrule(
        name = generate_fixtures_rule_name,
        srcs = native.glob(["src/generators/**/*.js"]),
        cmd = "$(exe //xplat/js/react-native-github/packages/react-native-codegen:rn_codegen) $(location {}) {} $OUT {}".format(schema_target, name, native_module_spec_name),
        out = "codegenfiles-{}".format(name),
        labels = ["codegen_rule"],
    )

    ##################
    # Android handling
    ##################
    fb_native.genrule(
        name = generate_module_java_name,
        cmd = "cp -r $(location :{})/java $OUT/".format(generate_fixtures_rule_name),
        out = "src",
        labels = ["codegen_rule"],
    )

    fb_native.zip_file(
        name = generate_module_java_zip_name,
        srcs = [":{}".format(generate_module_java_name)],
        out = "{}.src.zip".format(generate_module_java_zip_name),
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_module_jni_h_name,
        cmd = "cp $(location :{})/jni/{}.h $OUT".format(generate_fixtures_rule_name, native_module_spec_name),
        out = "{}.h".format(native_module_spec_name),
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_module_jni_cpp_name,
        cmd = "cp $(location :{})/jni/{}-generated.cpp $OUT".format(generate_fixtures_rule_name, native_module_spec_name),
        out = "{}-generated.cpp".format(native_module_spec_name),
        labels = ["codegen_rule"],
    )

    rn_android_library(
        name = "generated_modules-{}".format(name),
        srcs = [
            ":{}".format(generate_module_java_zip_name),
        ],
        labels = ["codegen_rule"],
        visibility = ["PUBLIC"],
        deps = [
            "//fbandroid/third-party/java/jsr-305:jsr-305",
            "//fbandroid/third-party/java/jsr-330:jsr-330",
            react_native_target("java/com/facebook/react/bridge:bridge"),
            react_native_target("java/com/facebook/react/common:common"),
        ],
        exported_deps = [
            react_native_target("java/com/facebook/react/turbomodule/core/interfaces:interfaces"),
        ],
    )

    rn_xplat_cxx_library(
        name = "generated_modules-{}-jni".format(name),
        srcs = [
            ":{}".format(generate_module_jni_cpp_name),
        ],
        header_namespace = "",
        headers = [
            ":{}".format(generate_module_jni_h_name),
        ],
        exported_headers = {
            "{}/{}.h".format(native_module_spec_name, native_module_spec_name): ":{}".format(generate_module_jni_h_name),
        },
        compiler_flags = [
            "-fexceptions",
            "-frtti",
            "-std=c++14",
            "-Wall",
        ],
        preprocessor_flags = [
            "-DLOG_TAG=\"ReactNative\"",
            "-DWITH_FBSYSTRACE=1",
        ],
        visibility = [
            "PUBLIC",
        ],
        deps = [],
        exported_deps = [
            "//xplat/jsi:jsi",
            react_native_xplat_target("react/nativemodule/core:core"),
        ],
        platforms = (ANDROID,),
        labels = ["codegen_rule"],
    )

    ##############
    # iOS handling
    ##############
    fb_native.genrule(
        name = generate_module_hobjcpp_name,
        cmd = "cp $(location :{})/{}.h $OUT".format(generate_fixtures_rule_name, native_module_spec_name),
        out = "{}.h".format(native_module_spec_name),
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_module_mm_name,
        cmd = "cp $(location :{})/{}-generated.mm $OUT".format(generate_fixtures_rule_name, native_module_spec_name),
        out = "{}-generated.mm".format(native_module_spec_name),
        labels = ["codegen_rule"],
    )

    fb_apple_library(
        name = "generated_objcpp_modules-{}Apple".format(name),
        extension_api_only = True,
        header_namespace = "",
        sdks = (IOS),
        compiler_flags = [
            "-Wno-unused-private-field",
        ],
        exported_headers = {
            "{}/{}.h".format(native_module_spec_name, native_module_spec_name): ":{}".format(generate_module_hobjcpp_name),
        },
        headers = [
            ":{}".format(generate_module_hobjcpp_name),
        ],
        srcs = [
            ":{}".format(generate_module_mm_name),
        ],
        labels = ["codegen_rule"],
        visibility = ["PUBLIC"],
        exported_deps = [
            "//xplat/js/react-native-github:RCTTypeSafety",
            "//xplat/js/react-native-github/Libraries/RCTRequired:RCTRequired",
            react_native_xplat_target_apple("react/nativemodule/core:core"),
        ],
    )

def rn_codegen_components(
        name = "",
        schema_target = ""):
    generate_fixtures_rule_name = "generate_fixtures_components-{}".format(name)
    generate_component_descriptor_h_name = "generate_component_descriptor_h-{}".format(name)
    generate_component_hobjcpp_name = "generate_component_hobjcpp-{}".format(name)
    generate_event_emitter_cpp_name = "generate_event_emitter_cpp-{}".format(name)
    generate_event_emitter_h_name = "generate_event_emitter_h-{}".format(name)
    generate_props_cpp_name = "generate_props_cpp-{}".format(name)
    generate_props_h_name = "generated_props_h-{}".format(name)
    generate_tests_cpp_name = "generate_tests_cpp-{}".format(name)
    generate_shadow_node_cpp_name = "generated_shadow_node_cpp-{}".format(name)
    generate_shadow_node_h_name = "generated_shadow_node_h-{}".format(name)
    copy_generated_java_files = "copy_generated_java_files-{}".format(name)
    copy_generated_cxx_files = "copy_generated_cxx_files-{}".format(name)
    zip_generated_java_files = "zip_generated_java_files-{}".format(name)
    zip_generated_cxx_files = "zip_generated_cxx_files-{}".format(name)

    fb_native.genrule(
        name = generate_fixtures_rule_name,
        srcs = native.glob(["src/generators/**/*.js"]),
        cmd = "$(exe //xplat/js/react-native-github/packages/react-native-codegen:rn_codegen) $(location {}) {} $OUT {}".format(schema_target, name, name),
        out = "codegenfiles-{}".format(name),
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_component_descriptor_h_name,
        cmd = "cp $(location :{})/ComponentDescriptors.h $OUT".format(generate_fixtures_rule_name),
        out = "ComponentDescriptors.h",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_component_hobjcpp_name,
        cmd = "cp $(location :{})/RCTComponentViewHelpers.h $OUT".format(generate_fixtures_rule_name),
        out = "RCTComponentViewHelpers.h",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_event_emitter_cpp_name,
        cmd = "cp $(location :{})/EventEmitters.cpp $OUT".format(generate_fixtures_rule_name),
        out = "EventEmitters.cpp",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_event_emitter_h_name,
        cmd = "cp $(location :{})/EventEmitters.h $OUT".format(generate_fixtures_rule_name),
        out = "EventEmitters.h",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_props_cpp_name,
        cmd = "cp $(location :{})/Props.cpp $OUT".format(generate_fixtures_rule_name),
        out = "Props.cpp",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_tests_cpp_name,
        cmd = "cp $(location :{})/Tests.cpp $OUT".format(generate_fixtures_rule_name),
        out = "Tests.cpp",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_props_h_name,
        cmd = "cp $(location :{})/Props.h $OUT".format(generate_fixtures_rule_name),
        out = "Props.h",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = copy_generated_java_files,
        cmd = "mkdir $OUT && find $(location :{}) -name '*.java' -exec cp {{}} $OUT \\;".format(generate_fixtures_rule_name),
        out = "java",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = copy_generated_cxx_files,
        # The command below is filtering C++ iOS files, this will be refactored when C++ codegen is finished.
        cmd = "mkdir -p $OUT && find $(location :{}) -not -path '*/rncore*' -not -path '*Tests*' -not -path '*NativeModules*' -not -path '*RCTComponentViewHelpers*' -type f \\( -iname \\*.h -o -iname \\*.cpp \\) -print0 -exec cp {{}} $OUT \\;".format(generate_fixtures_rule_name),
        out = "cxx",
        labels = ["codegen_rule"],
    )

    fb_native.zip_file(
        name = zip_generated_cxx_files,
        srcs = [":{}".format(copy_generated_cxx_files)],
        out = "{}.src.zip".format(zip_generated_cxx_files),
        visibility = ["PUBLIC"],
        labels = ["codegen_rule"],
    )

    fb_native.zip_file(
        name = zip_generated_java_files,
        srcs = [":{}".format(copy_generated_java_files)],
        out = "{}.src.zip".format(zip_generated_java_files),
        visibility = ["PUBLIC"],
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_shadow_node_cpp_name,
        cmd = "cp $(location :{})/ShadowNodes.cpp $OUT".format(generate_fixtures_rule_name),
        out = "ShadowNodes.cpp",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_shadow_node_h_name,
        cmd = "cp $(location :{})/ShadowNodes.h $OUT".format(generate_fixtures_rule_name),
        out = "ShadowNodes.h",
        labels = ["codegen_rule"],
    )

    # libs
    if is_running_buck_project():
        rn_xplat_cxx_library(name = "generated_components-{}".format(name), visibility = ["PUBLIC"])
    else:
        rn_xplat_cxx_library(
            name = "generated_components-{}".format(name),
            srcs = [
                ":{}".format(generate_event_emitter_cpp_name),
                ":{}".format(generate_props_cpp_name),
                ":{}".format(generate_shadow_node_cpp_name),
            ],
            headers = [
                ":{}".format(generate_component_descriptor_h_name),
                ":{}".format(generate_event_emitter_h_name),
                ":{}".format(generate_props_h_name),
                ":{}".format(generate_shadow_node_h_name),
            ],
            header_namespace = "react/renderer/components/{}".format(name),
            exported_headers = {
                "ComponentDescriptors.h": ":{}".format(generate_component_descriptor_h_name),
                "EventEmitters.h": ":{}".format(generate_event_emitter_h_name),
                "Props.h": ":{}".format(generate_props_h_name),
                "RCTComponentViewHelpers.h": ":{}".format(generate_component_hobjcpp_name),
                "ShadowNodes.h": ":{}".format(generate_shadow_node_h_name),
            },
            compiler_flags = [
                "-fexceptions",
                "-frtti",
                "-std=c++14",
                "-Wall",
            ],
            fbobjc_compiler_flags = get_apple_compiler_flags(),
            fbobjc_preprocessor_flags = get_preprocessor_flags_for_build_mode() + get_apple_inspector_flags(),
            ios_exported_headers = {
                "ComponentViewHelpers.h": ":{}".format(generate_component_hobjcpp_name),
            },
            ios_headers = [
                ":{}".format(generate_component_hobjcpp_name),
            ],
            labels = ["codegen_rule"],
            platforms = (ANDROID, APPLE, CXX),
            preprocessor_flags = [
                "-DLOG_TAG=\"ReactNative\"",
                "-DWITH_FBSYSTRACE=1",
            ],
            tests = [":generated_tests-{}".format(name)],
            visibility = ["PUBLIC"],
            deps = [
                "//third-party/glog:glog",
                "//xplat/fbsystrace:fbsystrace",
                "//xplat/folly:headers_only",
                "//xplat/folly:memory",
                "//xplat/folly:molly",
                YOGA_CXX_TARGET,
                react_native_xplat_target("react/renderer/debug:debug"),
                react_native_xplat_target("react/renderer/core:core"),
                react_native_xplat_target("react/renderer/graphics:graphics"),
                react_native_xplat_target("react/renderer/components/image:image"),
                react_native_xplat_target("react/renderer/imagemanager:imagemanager"),
                react_native_xplat_target("react/renderer/components/view:view"),
            ],
        )

    if is_running_buck_project():
        rn_android_library(name = "generated_components_java-{}".format(name))
    else:
        rn_android_library(
            name = "generated_components_java-{}".format(name),
            srcs = [
                ":{}".format(zip_generated_java_files),
            ],
            labels = ["codegen_rule"],
            visibility = ["PUBLIC"],
            deps = [
                react_native_dep("third-party/android/androidx:annotation"),
                react_native_target("java/com/facebook/react/bridge:bridge"),
                react_native_target("java/com/facebook/react/common:common"),
                react_native_target("java/com/facebook/react/turbomodule/core:core"),
                react_native_target("java/com/facebook/react/uimanager:uimanager"),
            ],
        )

        rn_android_library(
            name = "generated_components_cxx-{}".format(name),
            srcs = [
                ":{}".format(zip_generated_cxx_files),
            ],
            labels = ["codegen_rule"],
            visibility = ["PUBLIC"],
            deps = [
                react_native_dep("third-party/android/androidx:annotation"),
                react_native_target("java/com/facebook/react/bridge:bridge"),
                react_native_target("java/com/facebook/react/common:common"),
                react_native_target("java/com/facebook/react/turbomodule/core:core"),
                react_native_target("java/com/facebook/react/uimanager:uimanager"),
            ],
        )

    # Tests
    fb_xplat_cxx_test(
        name = "generated_tests-{}".format(name),
        srcs = [
            ":{}".format(generate_tests_cpp_name),
        ],
        apple_sdks = (IOS, MACOSX),
        compiler_flags = [
            "-fexceptions",
            "-frtti",
            "-std=c++14",
            "-Wall",
        ],
        contacts = ["oncall+react_native@xmail.facebook.com"],
        labels = ["codegen_rule"],
        platforms = (ANDROID, APPLE, CXX),
        deps = [
            "//xplat/third-party/gmock:gtest",
            ":generated_components-{}".format(name),
        ],
    )

def rn_codegen_cxx_modules(
        name = "",
        schema_target = ""):
    generate_fixtures_rule_name = "generate_fixtures_cxx-{}".format(name)
    generate_module_h_name = "generate_module_h-{}".format(name)
    generate_module_cpp_name = "generate_module_cpp-{}".format(name)

    fb_native.genrule(
        name = generate_fixtures_rule_name,
        srcs = native.glob(["src/generators/**/*.js"]),
        cmd = "$(exe //xplat/js/react-native-github/packages/react-native-codegen:rn_codegen) $(location {}) {} $OUT {}".format(schema_target, name, name),
        out = "codegenfiles-{}".format(name),
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_module_h_name,
        cmd = "cp $(location :{})/NativeModules.h $OUT".format(generate_fixtures_rule_name),
        out = "NativeModules.h",
        labels = ["codegen_rule"],
    )

    fb_native.genrule(
        name = generate_module_cpp_name,
        cmd = "cp $(location :{})/NativeModules.cpp $OUT".format(generate_fixtures_rule_name),
        out = "NativeModules.cpp",
        labels = ["codegen_rule"],
    )

    if is_running_buck_project():
        rn_xplat_cxx_library(name = "generated_cxx_modules-{}".format(name))
    else:
        rn_xplat_cxx_library(
            name = "generated_cxx_modules-{}".format(name),
            srcs = [
                ":{}".format(generate_module_cpp_name),
            ],
            headers = [
                ":{}".format(generate_module_h_name),
            ],
            header_namespace = "react/modules/{}".format(name),
            exported_headers = {
                "NativeModules.cpp": ":{}".format(generate_module_cpp_name),
                "NativeModules.h": ":{}".format(generate_module_h_name),
            },
            compiler_flags = [
                "-fexceptions",
                "-frtti",
                "-std=c++14",
                "-Wall",
            ],
            fbobjc_compiler_flags = get_apple_compiler_flags(),
            fbobjc_preprocessor_flags = get_preprocessor_flags_for_build_mode() + get_apple_inspector_flags(),
            labels = ["codegen_rule"],
            platforms = (ANDROID, APPLE),
            preprocessor_flags = [
                "-DLOG_TAG=\"ReactNative\"",
                "-DWITH_FBSYSTRACE=1",
            ],
            visibility = ["PUBLIC"],
            exported_deps = [
                react_native_xplat_target("react/nativemodule/core:core"),
            ],
        )

def is_running_buck_project():
    return read_bool("fbandroid", "is_running_buck_project", False)
