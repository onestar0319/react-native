/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

plugins {
  id("io.github.gradle-nexus.publish-plugin") version "1.1.0"
  id("com.android.library") version "8.1.0" apply false
  id("com.android.application") version "8.1.0" apply false
  id("de.undercouch.download") version "5.0.1" apply false
  kotlin("android") version "1.8.0" apply false
}

val reactAndroidProperties = java.util.Properties()

File("$rootDir/packages/react-native/ReactAndroid/gradle.properties").inputStream().use {
  reactAndroidProperties.load(it)
}

version =
    if (project.hasProperty("isNightly") &&
        (project.property("isNightly") as? String).toBoolean()) {
      "${reactAndroidProperties.getProperty("VERSION_NAME")}-SNAPSHOT"
    } else {
      reactAndroidProperties.getProperty("VERSION_NAME")
    }

group = "com.facebook.react"

val ndkPath by extra(System.getenv("ANDROID_NDK"))
val ndkVersion by extra(System.getenv("ANDROID_NDK_VERSION") ?: "25.1.8937393")
val sonatypeUsername = findProperty("SONATYPE_USERNAME")?.toString()
val sonatypePassword = findProperty("SONATYPE_PASSWORD")?.toString()

nexusPublishing {
  repositories {
    sonatype {
      username.set(sonatypeUsername)
      password.set(sonatypePassword)
    }
  }
}

tasks.register("clean", Delete::class.java) {
  description = "Remove all the build files and intermediate build outputs"
  dependsOn(gradle.includedBuild("react-native-gradle-plugin").task(":clean"))
  subprojects.forEach {
    if (it.project.plugins.hasPlugin("com.android.library") ||
        it.project.plugins.hasPlugin("com.android.application")) {
      dependsOn(it.tasks.named("clean"))
    }
  }
  delete(allprojects.map { it.buildDir })
  delete(rootProject.file("./packages/react-native/ReactAndroid/.cxx"))
  delete(rootProject.file("./packages/react-native/ReactAndroid/hermes-engine/.cxx"))
  delete(rootProject.file("./packages/react-native/sdks/download/"))
  delete(rootProject.file("./packages/react-native/sdks/hermes/"))
  delete(
      rootProject.file("./packages/react-native/ReactAndroid/src/main/jni/prebuilt/lib/arm64-v8a/"))
  delete(
      rootProject.file(
          "./packages/react-native/ReactAndroid/src/main/jni/prebuilt/lib/armeabi-v7a/"))
  delete(rootProject.file("./packages/react-native/ReactAndroid/src/main/jni/prebuilt/lib/x86/"))
  delete(rootProject.file("./packages/react-native/ReactAndroid/src/main/jni/prebuilt/lib/x86_64/"))
  delete(rootProject.file("./packages/react-native-codegen/lib"))
  delete(rootProject.file("./node_modules/@react-native/codegen/lib"))
  delete(rootProject.file("./packages/rn-tester/android/app/.cxx"))
}

tasks.register("build") {
  description = "Build and test all the React Native relevant projects."
  dependsOn(gradle.includedBuild("react-native-gradle-plugin").task(":build"))
}

tasks.register("downloadAll") {
  description = "Download all the depedencies needed locally so they can be cached on CI."
  dependsOn(gradle.includedBuild("react-native-gradle-plugin").task(":dependencies"))
  dependsOn(":packages:react-native:ReactAndroid:downloadNdkBuildDependencies")
  dependsOn(":packages:react-native:ReactAndroid:dependencies")
  dependsOn(":packages:react-native:ReactAndroid:androidDependencies")
  dependsOn(":packages:react-native:ReactAndroid:hermes-engine:dependencies")
  dependsOn(":packages:react-native:ReactAndroid:hermes-engine:androidDependencies")
  dependsOn(":packages:rn-tester:android:app:dependencies")
  dependsOn(":packages:rn-tester:android:app:androidDependencies")
}

tasks.register("publishAllInsideNpmPackage") {
  description =
      "Publish all the artifacts to be available inside the NPM package in the `android` folder."
  // Due to size constraints of NPM, we publish only react-native and hermes-engine inside
  // the NPM package.
  dependsOn(":packages:react-native:ReactAndroid:installArchives")
  dependsOn(":packages:react-native:ReactAndroid:hermes-engine:installArchives")
}

tasks.register("publishAllToMavenTempLocal") {
  description = "Publish all the artifacts to be available inside a Maven Local repository on /tmp."
  dependsOn(":packages:react-native:ReactAndroid:publishAllPublicationsToMavenTempLocalRepository")
  // We don't publish the external-artifacts to Maven Local as CircleCI is using it via workspace.
  dependsOn(
      ":packages:react-native:ReactAndroid:flipper-integration:publishAllPublicationsToMavenTempLocalRepository")
  dependsOn(
      ":packages:react-native:ReactAndroid:hermes-engine:publishAllPublicationsToMavenTempLocalRepository")
}

tasks.register("publishAllToSonatype") {
  description = "Publish all the artifacts to Sonatype (Maven Central or Snapshot repository)"
  dependsOn(":packages:react-native:ReactAndroid:publishToSonatype")
  dependsOn(":packages:react-native:ReactAndroid:external-artifacts:publishToSonatype")
  dependsOn(":packages:react-native:ReactAndroid:flipper-integration:publishToSonatype")
  dependsOn(":packages:react-native:ReactAndroid:hermes-engine:publishToSonatype")
}
