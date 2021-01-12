import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

import {
  TranscribeModule,
  TranscribeEvent,
  TranscribeEvents,
  ResultsEvent,
  ErrorEvent,
  BooleanEvent,
} from './TranscribeModuleTypes';

export class RCTTranscribe {
  _listeners: any[] | null | undefined;
  _events: Required<TranscribeEvents>;
  _transcribe: TranscribeModule;
  _transcribeEmitter: any;

  constructor() {
    this._transcribe = NativeModules.Transcribe;
    this._transcribeEmitter =
      Platform.OS !== 'web' ? new NativeEventEmitter(this._transcribe) : null;
    this._events = {
      onError: () => null,
      isRecording: () => null,
      onResults: () => null,
    };
  }

  init() {
    if (!this._listeners && this._transcribeEmitter !== null) {
      this._listeners = (Object.keys(
        this._events
      ) as TranscribeEvent[]).map((key: TranscribeEvent) =>
        this._transcribeEmitter.addListener(key, this._events[key])
      );
    }
  }

  removeAllListeners() {
    if (this._listeners) {
      this._listeners.map((listener) => listener.remove());
      this._listeners = null;
    }
  }

  start(): Promise<boolean> {
    return this._transcribe.start();
  }

  stop(): Promise<boolean> {
    return this._transcribe.stop();
  }

  set onError(fn: (e: ErrorEvent) => void) {
    this._events.onError = fn;
  }

  set isRecording(fn: (e: BooleanEvent) => void) {
    this._events.isRecording = fn;
  }

  set onResults(fn: (arrayBuffer: ArrayBuffer) => void) {
    // Convert Float32 Array to Int16 ArrayBuffer
    const pcmEncode = (input: Float32Array) => {
      let offset = 0;
      const buffer = new ArrayBuffer(input.length * 2); // 2 bytes for each char
      const view = new DataView(buffer);
      for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
      return buffer;
    };

    this._events.onResults = (event: ResultsEvent) => {
      if (Platform.OS === 'ios') {
        const buf = new Float32Array(event.value);
        const pcm = pcmEncode(buf);
        fn(pcm);
      } else {
        // TODO VERIFY JAVA
        fn(event.buffer);
      }
    };
  }
}

export { ResultsEvent, BooleanEvent, ErrorEvent };
