# react-native-transcribe

library to send raw microphone data (array) for AWS Transcribe

You can use this library to send to any speech to text service, this one includes a sample AWS Lambda function for AWS Transcribe.

## Installation

```sh
npm install react-native-transcribe
```

## Usage

```js
import Transcribe from 'react-native-transcribe';

// ...
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

Get started with the project:

\$ yarn bootstrap

Run the example app on iOS:

\$ yarn example ios

Run the example app on Android:

\$ yarn example android

iOS
This app has crashed because it attempted to access privacy-sensitive data without a usage description. The app's Info.plist must contain an NSSpeechRecognitionUsageDescription key with a string value explaining to the user how the app uses this data.

Android
AndroidManifest.xml

```
  <uses-permission android:name="android.permission.RECORD_AUDIO" />
```

TODO Special settings for mic on android (adb emu avd hostmicon)
emulator -avd Pixel_3a_API_30_x86 -qemu -allow-host-audio
https://developer.android.com/studio/run/emulator-commandline
https://gist.github.com/wswebcreation/80f5536ab1592aff0c25a9dbd9cc1451

# Running the example
**Setup**

In the root directory `/react-native-transcribe`, run 
```sh
npm install
```
Next, change to example directory and install packages
```sh
cd /react-native-transcribe/example/
npm install
```

**Running ios**

Move to the `example/ios` folder and instal cocoa pods
```sh
cd /react-native-transcribe/example/ios
pod install
```
Change directory and execute
```sh
cd /react-native-transcribe/example
npm run start
```
Open the `TranscribeExample.xcworkspace` file from `../example/ios` in XCode and build

**Running Android**

* [ ] ensure your `emulator` command works properly 
* [ ] open emulator with this: 
```sh
emulator -avd [EMULATOR_NAME] -qemu -allow-host-audio
```
* example: `emulator -avd Pixel_3a_API_30_x86 -qemu -allow-host-audio`
* [ ] toggle `adb emu avd hostmicon` once an AVD is open in Terminal
* Possibly use the simulator's extended menu (`...`) to allow headset microphones

1. Open Android simulator using the steps listed above
1. In Android Studio, open project and naviagate to `/react-native-transcribe/example/android` 
1. Select that folder and build

