package com.reactnativetranscribe;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import javax.annotation.Nullable;

public class TranscribeModule extends ReactContextBaseJavaModule {
  private final String TAG = "RCTTranscribe";

  private Thread recordingThread;

  private final ReactApplicationContext reactContext;

  private AudioRecord audioRecord;
  private boolean isRecording;

  private static final int PERMISSION_REQUEST_CODE = 1;

  int audioSource = MediaRecorder.AudioSource.MIC;
  int sampleRateInHz = 8000;
  int channelConfig = AudioFormat.CHANNEL_IN_MONO;
  int audioFormat = AudioFormat.ENCODING_PCM_16BIT;
  int bufferSize = AudioRecord.getMinBufferSize(sampleRateInHz, channelConfig, audioFormat);

  public TranscribeModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  // This is used in your .ts file when you import (like a BY NAME stripping off the RCT)
  @Override
  public String getName() {
    return TAG;
  }

  private void init(){
    Log.d(TAG,"init");

    if (ContextCompat.checkSelfPermission(this.getCurrentActivity(),Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_DENIED) {
      Log.d("permission", "permission denied to RECORD_AUDIO - requesting it");
      String[] permissions = {Manifest.permission.RECORD_AUDIO};

      ActivityCompat.requestPermissions(this.getCurrentActivity(), permissions, PERMISSION_REQUEST_CODE);

    } else {
      // RECORD_AUDIO has been granted

      isRecording = false;
      audioRecord = new AudioRecord(audioSource, sampleRateInHz, channelConfig, audioFormat, bufferSize * 10);

      if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
        Log.d(TAG, "Unable to initialize AudioRecord");
      }
    }
  }


  private void sendEvent(String eventName, @Nullable WritableMap params) {
    this.reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
  }

  @ReactMethod
  public void isRecording(Callback callback) {
    Log.d(TAG,"isRecording");

    callback.invoke(isRecording);
  }

  private boolean isPermissionGranted() {
    Log.d(TAG,"isPermissionsGranted");

    String permission = Manifest.permission.RECORD_AUDIO;
    int res = getReactApplicationContext().checkCallingOrSelfPermission(permission);
    return res == PackageManager.PERMISSION_GRANTED;
  }

  @ReactMethod
  public void stop() {
    Log.d(TAG, "stopRecording");
    stopRecording();

    recordingThread.interrupt();
  }

  @ReactMethod
  public void start(final Promise promise){
    String[] PERMISSIONS = {Manifest.permission.RECORD_AUDIO};

    if (!isPermissionGranted()) {
      Log.d(TAG,"isPermissionsGranted == false");
      if (this.getCurrentActivity() != null) {
        Log.d(TAG,"getCurrentActivity != null");

        ((PermissionAwareActivity) this.getCurrentActivity()).requestPermissions(PERMISSIONS, 1, new PermissionListener() {
          public boolean onRequestPermissionsResult(final int requestCode,
                                                    @NonNull final String[] permissions,
                                                    @NonNull final int[] grantResults) {
            boolean permissionsGranted = true;
            for (int i = 0; i < permissions.length; i++) {
              final boolean granted = grantResults[i] == PackageManager.PERMISSION_GRANTED;
              permissionsGranted = permissionsGranted && granted;
            }
            Log.d(TAG, "i think we requested permissions");
            startRecordingWithPermissions(promise);
            return permissionsGranted;
          }
        });
      }
      return;
    }
    Log.d(TAG, "starting immediately");
    startRecordingWithPermissions(promise);
  }

  private void startRecordingWithPermissions(final Promise promise) {
    try {
      Log.d(TAG, "startRecordingWithPermissions");
      if(audioRecord == null){
        init();
      }

      isRecording = true;
      WritableMap event = Arguments.createMap();
      event.putBoolean("value", isRecording);
      sendEvent("isRecording", event);
      Log.d("MSG", "isRecording: " + isRecording);

      record();
      promise.resolve(false);
    } catch (Exception e) {
      promise.reject("E_START_RECORDING", e.getMessage());
    }
  }

  private void stopRecording(){
    try {
      Log.d(TAG, "stopRecording");

      if (audioRecord != null) {
        audioRecord.stop();
        audioRecord.release();
        audioRecord = null;
      }
      isRecording = false;
      WritableMap event = Arguments.createMap();
      event.putBoolean("value", isRecording);
      sendEvent("isRecording", event);
      Log.d("MSG", "isRecording: " + isRecording);
    } catch(Exception e) {
      Log.e(TAG, "stop DIED");
      e.printStackTrace();
    }
  }

  private void record() {
    Log.d(TAG, "record");

    audioRecord.startRecording();

    recordingThread = new Thread(new Runnable() {
      public void run() {
        try {
          Log.d(TAG, "runningThread");

          byte[] buffer = new byte[bufferSize];

          Log.d(TAG, "isRecording" + isRecording);
          Log.d(TAG, "audioRecord");

          while (isRecording && audioRecord != null) {
            int length = audioRecord.read(buffer, 0, bufferSize);

            if (length == AudioRecord.ERROR_BAD_VALUE ||
              length == AudioRecord.ERROR_INVALID_OPERATION ||
              length != bufferSize) {
              Log.d(TAG,"LENGTH ISSUE: " + length);

              if (length != bufferSize) {
                Log.d(TAG, "LENGTH != bufferSize");
              }
            }
            WritableArray arr = Arguments.createArray();
            for (byte value : buffer) {
              arr.pushInt((int) value);
            }
            WritableMap event = Arguments.createMap();
            event.putArray("buffer", arr);
            sendEvent("onResults", event);
          }
        } catch (Exception e) {
          Log.e(TAG, e.getMessage());
          WritableMap error = Arguments.createMap();
          error.putString("message", e.getMessage());
          WritableMap event = Arguments.createMap();
          event.putMap("error", error);
          sendEvent("onError", event);
          e.printStackTrace();
        }
      }
    });

    recordingThread.start();
  }
}
