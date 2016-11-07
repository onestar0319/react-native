# Movies app

The Movies app is a demonstration of basic concepts, such as fetching data, rendering a list of data including images, and navigating between different screens.

## Running this app

Before running the app, make sure you ran:

    git clone https://github.com/facebook/react-native.git
    cd react-native
    npm install

### Running on iOS

Mac OS and Xcode are required.

- Open `Examples/Movies/Movies.xcodeproj` in Xcode
- Hit the Run button

See [Running on device](https://facebook.github.io/react-native/docs/running-on-device.html) if you want to use a physical device.

### Running on Android

You'll need to have all the [prerequisites](https://github.com/facebook/react-native/tree/master/ReactAndroid#prerequisites) (SDK, NDK) for Building React Native installed.

Start an Android emulator ([Genymotion](https://www.genymotion.com) is recommended).

    cd react-native
    ./gradlew :Examples:Movies:android:app:installDebug
    ./packager/packager.sh

_Note: Building for the first time can take a while._

Open the Movies app in your emulator.

See [Running on Device](https://facebook.github.io/react-native/docs/running-on-device.html) in case you want to use a physical device.

### Running with Buck

Follow the same setup as running with gradle.

Install Buck from [here](https://buckbuild.com/setup/install.html).

Run the following commands from the react-native folder:

    ./gradlew :ReactAndroid:packageReactNdkLibsForBuck
    buck fetch movies
    buck install -r movies
    ./packager/packager.sh

_Note: The native libs are still built using gradle. Full build with buck is coming soon(tm)._

## Built from source

Building the app on both iOS and Android means building the React Native framework from source. This way you're running the latest native and JS code the way you see it in your clone of the github repo.

This is different from apps created using `react-native init` which have a dependency on a specific version of React Native JS and native code, declared in a `package.json` file (and `build.gradle` for Android apps).
