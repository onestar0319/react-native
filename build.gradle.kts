/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

val ndkPath by extra(System.getenv("ANDROID_NDK"))
val ndkVersion by extra(System.getenv("ANDROID_NDK_VERSION"))

buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath("com.android.tools.build:gradle:7.3.0")
    classpath("de.undercouch:gradle-download-task:5.0.1")
  }
}

allprojects {
  repositories {
    maven { url = uri("$rootDir/node_modules/jsc-android/dist") }
    maven { url = uri("$rootDir/android") }
    google()
    mavenCentral {
      // We don't want to fetch react-native from Maven Central as there are
      // older versions over there.
      content { excludeGroup("com.facebook.react") }
    }
  }
}

tasks.register("cleanAll", Delete::class.java) {
  description = "Remove all the build files and intermediate build outputs"
  dependsOn(gradle.includedBuild("react-native-gradle-plugin").task(":clean"))
  dependsOn(":ReactAndroid:clean")
  dependsOn(":ReactAndroid:hermes-engine:clean")
  dependsOn(":packages:rn-tester:android:app:clean")
  delete(allprojects.map { it.buildDir })
  delete(rootProject.file("./ReactAndroid/.cxx"))
  delete(rootProject.file("./ReactAndroid/hermes-engine/.cxx"))
  delete(rootProject.file("./sdks/download/"))
  delete(rootProject.file("./sdks/hermes/"))
  delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/arm64-v8a/"))
  delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/armeabi-v7a/"))
  delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/x86/"))
  delete(rootProject.file("./ReactAndroid/src/main/jni/prebuilt/lib/x86_64/"))
  delete(rootProject.file("./packages/react-native-codegen/lib"))
  delete(rootProject.file("./packages/rn-tester/android/app/.cxx"))
}

tasks.register("buildAll") {
  description = "Build and test all the React Native relevant projects."
  dependsOn(gradle.includedBuild("react-native-gradle-plugin").task(":build"))
  // This builds both the React Native framework for both debug and release
  dependsOn(":ReactAndroid:assemble")
  // This creates all the Maven artifacts and makes them available in the /android folder
  dependsOn(":ReactAndroid:installArchives")
  // This builds RN Tester for Hermes/JSC for debug only
  dependsOn(":packages:rn-tester:android:app:assembleDebug")
  // This compiles the Unit Test sources (without running them as they're partially broken)
  dependsOn(":ReactAndroid:compileDebugUnitTestSources")
  dependsOn(":ReactAndroid:compileReleaseUnitTestSources")
}

tasks.register("downloadAll") {
  description = "Download all the depedencies needed locally so they can be cached on CI."
  dependsOn(gradle.includedBuild("react-native-gradle-plugin").task(":dependencies"))
  dependsOn(":ReactAndroid:downloadNdkBuildDependencies")
  dependsOn(":ReactAndroid:dependencies")
  dependsOn(":ReactAndroid:androidDependencies")
  dependsOn(":ReactAndroid:hermes-engine:dependencies")
  dependsOn(":ReactAndroid:hermes-engine:androidDependencies")
}

tasks.register("publishAllInsideNpmPackage") {
  description =
      "Publish all the artifacts to be available inside the NPM package in the `android` folder."
  // Due to size constraints of NPM, we publish only react-native and hermes-engine inside
  // the NPM package.
  dependsOn(":ReactAndroid:installArchives")
  dependsOn(":ReactAndroid:hermes-engine:installArchives")
}

tasks.register("publishAllToMavenLocal") {
  description = "Publish all the artifacts to be available inside Maven Local."
  dependsOn(":ReactAndroid:publishToMavenLocal")
  dependsOn(":ReactAndroid:external-artifacts:publishToMavenLocal")
  dependsOn(":ReactAndroid:hermes-engine:publishToMavenLocal")
}

tasks.register("publishAllToMavenSnapshots") {
  description =
      "Publish all the artifacts as a snapshot (used for testing/nightly) on Maven Central."
  dependsOn(":ReactAndroid:publishAllPublicationsToMavenSnapshotsRepository")
  dependsOn(":ReactAndroid:external-artifacts:publishAllPublicationsToMavenSnapshotsRepository")
  dependsOn(":ReactAndroid:hermes-engine:publishAllPublicationsToMavenSnapshotsRepository")
}

tasks.register("publishAllToMavenCentral") {
  description = "Publish all the artifacts as a release on Maven Central."
  dependsOn(":ReactAndroid:publishAllPublicationsToMavenCentralRepository")
  dependsOn(":ReactAndroid:external-artifacts:publishAllPublicationsToMavenCentralRepository")
  dependsOn(":ReactAndroid:hermes-engine:publishAllPublicationsToMavenCentralRepository")
}
