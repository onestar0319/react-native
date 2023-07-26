/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import org.gradle.api.internal.classpath.ModuleRegistry
import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.gradle.configurationcache.extensions.serviceOf
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm") version "1.8.0"
  id("java-gradle-plugin")
}

repositories {
  google()
  mavenCentral()
}

gradlePlugin {
  plugins {
    create("react") {
      id = "com.facebook.react"
      implementationClass = "com.facebook.react.ReactPlugin"
    }
  }
}

group = "com.facebook.react"

dependencies {
  implementation(gradleApi())

  // The KGP/AGP version is defined by React Native Gradle plugin.
  // Therefore we specify an implementation dep rather than a compileOnly.
  implementation("org.jetbrains.kotlin:kotlin-gradle-plugin:1.8.0")
  implementation("com.android.tools.build:gradle:8.1.0")

  implementation("com.google.code.gson:gson:2.8.9")
  implementation("com.google.guava:guava:31.0.1-jre")
  implementation("com.squareup:javapoet:1.13.0")

  testImplementation("junit:junit:4.13.2")

  testRuntimeOnly(
      files(
          serviceOf<ModuleRegistry>()
              .getModule("gradle-tooling-api-builders")
              .classpath
              .asFiles
              .first()))
}

// We intentionally don't build for Java 17 as users will see a cryptic bytecode version
// error first. Instead we produce a Java 11-compatible Gradle Plugin, so that AGP can print their
// nice message showing that JDK 11 (or 17) is required first
java { targetCompatibility = JavaVersion.VERSION_11 }

kotlin { jvmToolchain(17) }

tasks.withType<KotlinCompile>().configureEach {
  kotlinOptions {
    apiVersion = "1.5"
    // See comment above on JDK 11 support
    jvmTarget = "11"
  }
}

tasks.withType<Test>().configureEach {
  testLogging {
    exceptionFormat = TestExceptionFormat.FULL
    showExceptions = true
    showCauses = true
    showStackTraces = true
  }
}
