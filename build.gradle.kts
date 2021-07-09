/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

buildscript {
    repositories {
        mavenLocal()
        google()
        mavenCentral()
    }
    dependencies {
        val kotlin_version: String by project
        classpath("com.android.tools.build:gradle:4.2.1")
        classpath("de.undercouch:gradle-download-task:4.1.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version")
        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
}

allprojects {
    repositories {
        maven {
            url = uri("$rootDir/node_modules/jsc-android/dist")
        }
        maven {
            // https://github.com/wix/Detox/blob/master/docs/Introduction.Android.md
            // All of Detox's artifacts are provided via the npm module
            url = uri("$rootDir/node_modules/detox/Detox-android")
        }
        mavenLocal()
        google()
        mavenCentral()
    }

    // used to override ndk path/version from env variables on CI
    ext["ANDROID_NDK_PATH"] = null
    if (System.getenv("LOCAL_ANDROID_NDK_VERSION") != null) {
        setProperty("ANDROID_NDK_VERSION", System.getenv("LOCAL_ANDROID_NDK_VERSION"))
        ext["ANDROID_NDK_PATH"] =  System.getenv("ANDROID_NDK")
    }
}
