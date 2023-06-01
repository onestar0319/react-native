/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import com.android.build.api.variant.AndroidComponentsExtension
import com.facebook.react.utils.PropertyUtils.INTERNAL_DISABLE_JAVA_VERSION_ALIGNMENT
import org.gradle.api.Action
import org.gradle.api.JavaVersion
import org.gradle.api.Project
import org.gradle.api.plugins.AppliedPlugin
import org.jetbrains.kotlin.gradle.dsl.KotlinTopLevelExtension

internal object JdkConfiguratorUtils {
  /**
   * Function that takes care of configuring the JDK toolchain for all the projects projects. As we
   * do decide the JDK version based on the AGP version that RNGP brings over, here we can safely
   * configure the toolchain to 11.
   */
  fun configureJavaToolChains(input: Project) {
    if (input.hasProperty(INTERNAL_DISABLE_JAVA_VERSION_ALIGNMENT)) {
      return
    }
    input.rootProject.allprojects { project ->
      val action =
          Action<AppliedPlugin> {
            project.extensions.getByType(AndroidComponentsExtension::class.java).finalizeDsl { ext
              ->
              ext.compileOptions.sourceCompatibility = JavaVersion.VERSION_11
              ext.compileOptions.targetCompatibility = JavaVersion.VERSION_11
            }
          }
      project.pluginManager.withPlugin("com.android.application", action)
      project.pluginManager.withPlugin("com.android.library", action)
      project.pluginManager.withPlugin("org.jetbrains.kotlin.android") {
        project.extensions.getByType(KotlinTopLevelExtension::class.java).jvmToolchain(11)
      }
      project.pluginManager.withPlugin("org.jetbrains.kotlin.jvm") {
        project.extensions.getByType(KotlinTopLevelExtension::class.java).jvmToolchain(11)
      }
    }
  }
}
