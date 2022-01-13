/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

pluginManagement {
    repositories {
        mavenCentral()
        google()
        gradlePluginPortal()
    }
}

include(
    ":ReactAndroid",
    ":packages:react-native-codegen:android",
    ":packages:rn-tester:android:app"
)

// Include this to enable codegen Gradle plugin.
includeBuild("packages/react-native-gradle-plugin/")

