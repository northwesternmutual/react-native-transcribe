# react-native-transcribe

library to send raw microphone data (array) for AWS Transcribe

You can use this library to send to any speech to text service, this one includes a sample AWS Lambda function for AWS Transcribe.

## Usage

```js
import Transcribe from 'react-native-transcribe';

// ...
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

## Get started with the project:

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

Note: Special settings for mic on android (adb emu avd hostmicon)
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

1) Install cocoa pods
```
cd /react-native-transcribe/example/ios
pod install
```

2) Start react-native example project
```
cd /react-native-transcribe/example
npm run start
```

3) Start ios Project.  
Open the `TranscribeExample.xcworkspace` file from `../example/ios` in XCode Click Build and Run

**Running Android**
1) Start react-native example project
```
cd /react-native-transcribe/example
npm run start
```
2) Ensure your `emulator` command works properly. https://developer.android.com/studio/run/emulator-commandline
3) Open Android emulator from the Terminal with the emulator command: 
```sh
user@host ~ $ emulator -list-avds
Pixel_4_API_30

#emulator -avd [EMULATOR_NAME] -qemu -allow-host-audio

user@host ~ $  emulator -avd Pixel_4_API_30 -qemu -allow-host-audio
```

4) Toggle (in a different terminal) the microphone ON 
```
#adb emu avd hostmicon
user@host ~ $ adb emu avd hostmicon 
OK
```
** You can also use the simulator's extended menu (`...`) to allow headset microphones **

5) In Android Studio, open project and naviagate to `/react-native-transcribe/example/android` 
6) Build

### Troubleshooting Android:

If you try to start your emulator and you receive this in the terminal: 

```
audio: Failed to create voice `dac'
coreaudio: Could not initialize record
coreaudio: Could not set samplerate 44100
coreaudio: Reason: kAudioDeviceUnsupportedFormatError
coreaudio: Could not initialize record
coreaudio: Could not set samplerate 44100
coreaudio: Reason: kAudioDeviceUnsupportedFormatError
```

Mac: Make sure your audio is set to your system default (`MacBook Pro Speakers` and `MacBook Pro Microphone`)
