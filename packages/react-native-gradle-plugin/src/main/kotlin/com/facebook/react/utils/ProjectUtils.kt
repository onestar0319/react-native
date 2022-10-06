/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.utils

import org.gradle.api.Project

internal object ProjectUtils {
  internal val Project.isNewArchEnabled: Boolean
    get() =
        project.hasProperty("newArchEnabled") &&
            project.property("newArchEnabled").toString().toBoolean()

  const val HERMES_FALLBACK = true

  internal val Project.isHermesEnabled: Boolean
    get() =
        if (project.hasProperty("enableHermes")) {
          project.property("enableHermes").toString().lowercase().toBooleanStrictOrNull() ?: true
        } else if (project.extensions.extraProperties.has("react")) {
          @Suppress("UNCHECKED_CAST")
          val reactMap = project.extensions.extraProperties.get("react") as? Map<String, Any?>
          when (val enableHermesKey = reactMap?.get("enableHermes")) {
            is Boolean -> enableHermesKey
            is String -> enableHermesKey.lowercase().toBooleanStrictOrNull() ?: true
            else -> HERMES_FALLBACK
          }
        } else {
          HERMES_FALLBACK
        }
}
