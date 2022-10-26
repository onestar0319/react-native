/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.utils.projectPathToLibraryName
import javax.inject.Inject
import org.gradle.api.Project
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property

abstract class ReactExtension @Inject constructor(project: Project) {

  private val objects = project.objects

  /**
   * The path to the root of your project. This is the path to where the `package.json` lives. All
   * the CLI commands will be invoked from this folder as working directory.
   *
   * Default: ${rootProject.dir}/../
   */
  val root: DirectoryProperty =
      objects.directoryProperty().convention(project.rootProject.layout.projectDirectory.dir("../"))

  /**
   * The path to the react-native NPM package folder.
   *
   * Default: ${rootProject.dir}/../node_modules/react-native-codegen
   */
  val reactNativeDir: DirectoryProperty =
      objects.directoryProperty().convention(root.dir("node_modules/react-native"))

  /**
   * The path to the JS entry file. If not specified, the plugin will try to resolve it using a list
   * of known locations (e.g. `index.android.js`, `index.js`, etc.).
   */
  val entryFile: RegularFileProperty = objects.fileProperty()

  /**
   * The reference to the React Native CLI. If not specified, the plugin will try to resolve it
   * looking for `react-native` CLI inside `node_modules` in [root].
   */
  val cliFile: RegularFileProperty =
      objects.fileProperty().convention(reactNativeDir.file("cli.js"))

  /**
   * The path to the Node executable and extra args. By default it assumes that you have `node`
   * installed and configured in your $PATH. Default: ["node"]
   */
  val nodeExecutableAndArgs: ListProperty<String> =
      objects.listProperty(String::class.java).convention(listOf("node"))

  /** The command to use to invoke bundle. Default is `bundle` and will be invoked on [root]. */
  val bundleCommand: Property<String> = objects.property(String::class.java).convention("bundle")

  /**
   * Custom configuration file for the [bundleCommand]. If provided, it will be passed over with a
   * `--config` flag to the bundle command.
   */
  val bundleConfig: RegularFileProperty = objects.fileProperty()

  /**
   * The Bundle Asset name. This name will be used also for deriving other bundle outputs such as
   * the packager source map, the compiler source map and the output source map file.
   *
   * Default: index.android.bundle
   */
  val bundleAssetName: Property<String> =
      objects.property(String::class.java).convention("index.android.bundle")

  /**
   * Toggles the .so Cleanup step. If enabled, we will clean up all the unnecessary files before the
   * bundle task. If disabled, the developers will have to manually cleanup the files. Default: true
   */
  val enableSoCleanup: Property<Boolean> = objects.property(Boolean::class.java).convention(true)

  /** Extra args that will be passed to the [bundleCommand] Default: [] */
  val extraPackagerArgs: ListProperty<String> =
      objects.listProperty(String::class.java).convention(emptyList())

  /**
   * Allows to specify the debuggable variants (by default just 'debug'). Variants in this list
   * will:
   * - Not be bundled (the bundle file will not be created and won't be copied over).
   * - Have the Hermes Debug flags set. That's useful if you have another variant (say `canary`)
   * where you want dev mode to be enabled. Default: ['debug']
   */
  val debuggableVariants: ListProperty<String> =
      objects.listProperty(String::class.java).convention(listOf("debug"))

  /** Hermes Config */

  /**
   * The command to use to invoke hermesc (the hermes compiler). Default is "", the plugin will
   * autodetect it.
   */
  val hermesCommand: Property<String> = objects.property(String::class.java).convention("")

  /**
   * Whether to enable Hermes only on certain variants. If specified as a non-empty list, hermesc
   * and the .so cleanup for Hermes will be executed only for variants in this list. An empty list
   * assumes you're either using Hermes for all variants or not (see [enableHermes]).
   *
   * Default: []
   */
  val enableHermesOnlyInVariants: ListProperty<String> =
      objects.listProperty(String::class.java).convention(emptyList())

  /** Flags to pass to Hermesc. Default: ["-O", "-output-source-map"] */
  val hermesFlags: ListProperty<String> =
      objects.listProperty(String::class.java).convention(listOf("-O", "-output-source-map"))

  /** Codegen Config */

  /**
   * The path to the react-native-codegen NPM package folder.
   *
   * Default: ${rootProject.dir}/../node_modules/react-native-codegen
   */
  val codegenDir: DirectoryProperty =
      objects.directoryProperty().convention(root.dir("node_modules/react-native-codegen"))

  /**
   * The root directory for all JS files for the app.
   *
   * Default: [root] (i.e. ${rootProject.dir}/../)
   */
  val jsRootDir: DirectoryProperty = objects.directoryProperty().convention(root.get())

  /**
   * The library name that will be used for the codegen artifacts.
   *
   * Default: <UpperCamelVersionOfProjectPath>Spec (e.g. for :example:project it will be
   * ExampleProjectSpec).
   */
  val libraryName: Property<String> =
      objects.property(String::class.java).convention(projectPathToLibraryName(project.path))

  /**
   * Java package name to use for any codegen artifacts produced during build time. Default:
   * com.facebook.fbreact.specs
   */
  val codegenJavaPackageName: Property<String> =
      objects.property(String::class.java).convention("com.facebook.fbreact.specs")
}
