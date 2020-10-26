import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import {
  RCTTranscribe,
  // ResultsEvent,
  BooleanEvent,
  // @ts-ignore
} from 'react-native-transcribe';

// @ts-ignore
import TranscribeSocket from '../util/TranscribeSocket';
const transcribeSocket = new TranscribeSocket();

const Controls = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribeSocketOpen, setIsTranscribeSocketOpen] = useState<boolean>(
    false
  );
  const [viewFinal, setViewFinal] = useState<boolean>(false);
  const [partialTranscription, setPartialTranscription] = useState<string>('');
  const [transcription, setTranscription] = useState<string>('');
  const [transcriptionData, setTranscriptionData] = useState({
    hasResults: false,
    isPartial: true,
    transcript: '',
  });

  const TranscribeRef = useRef(new RCTTranscribe());
  const Transcribe = TranscribeRef.current;

  useEffect(() => {
    console.log('useEffect init()');
    Transcribe.onResults = onResultsHandler;
    Transcribe.isRecording = isRecordingHandler;

    Transcribe.init();

    //Clean up listeners when the component is unmounted
    return () => {
      console.log('Clean up');
      Transcribe.removeAllListeners();
    };
  }, [Transcribe]); // this only runs once when the component is mounted

  function onResultsHandler(arrayBuffer: ArrayBuffer) {
    if (transcribeSocket.isSocketOpen()) {
      transcribeSocket.sendRawPCMDataBufferToSocket(arrayBuffer);
    }
  }

  function isRecordingHandler(e: BooleanEvent) {
    console.log('isRecordingHandler: ', e);
    let bStart = false;
    if (!e || !e.value) {
      bStart = false;
    } else {
      bStart = e.value;
    }
    setIsRecording(bStart);
  }

  useEffect(() => {
    function onTranscription(data: any) {
      const { hasResults, transcript, isPartial } = data;
      setTranscriptionData({
        transcript,
        hasResults,
        isPartial,
      });

      if (hasResults) {
        setPartialTranscription(transcription + ' ' + transcript);
        if (!isPartial) {
          // update the textarea with the latest result
          setTranscription(transcription + ' ' + transcript);
        }
      }
    }

    transcribeSocket.setTranscriptionHandler(onTranscription);
    transcribeSocket.setOnOpenSocket(setIsTranscribeSocketOpen);
  }, [transcription]);

  async function _stopTranscribe() {
    try {
      await Transcribe.stop();
      transcribeSocket.closeSocket();
      console.log('stopped transcribe 🛑');
    } catch (e) {
      console.error('⁉️ Error stopping: ', e);
    }
  }

  async function _startTranscribe() {
    try {
      await Transcribe.start();
      console.log('started transcribe ✅');
      transcribeSocket.openSocket();
    } catch (e) {
      console.error('⁉️ Error starting: ', e);
    }
  }

  async function _clear() {
    setPartialTranscription('');
    setTranscription('');
    setTranscriptionData({
      hasResults: false,
      isPartial: true,
      transcript: '',
    });
  }

  function _toogleViewType() {
    setViewFinal(!viewFinal);
  }

  function transcriptionView() {
    if (viewFinal) {
      return (
        <TextInput
          onChangeText={setTranscription}
          placeholder={
            'Press the "Start Transcription" button and being speaking...'
          }
          value={transcription}
          multiline={true}
        />
      );
    } else {
      return (
        <TextInput
          onChangeText={setPartialTranscription}
          placeholder={
            'Press the "Start Transcription" button and being speaking...'
          }
          value={partialTranscription}
          multiline={true}
        />
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>react-native-transcribe</Text>

      <Text style={styles.flagText}>{`Recording: ${
        isRecording ? '🎤' : '🚫'
      }`}</Text>

      <Text style={styles.flagText}>{`Web Socket: ${
        isTranscribeSocketOpen ? '📬' : '📪'
      }`}</Text>

      <Text
        style={styles.flagText}
      >{`hasResults: ${transcriptionData.hasResults}`}</Text>
      <Text
        style={styles.flagText}
      >{`isPartial: ${transcriptionData.isPartial}`}</Text>

      {/* <View style={styles.button}>
        <Button onPress={_startTranscribe} title="Start Transcription ✅" />
      </View>
      <View style={styles.button}>
        <Button onPress={_stopTranscribe} title="Stop Transcription 🛑" />
      </View>
      <View style={styles.button}>
        <Button onPress={_clear} title="Clear 🗑" />
      </View> */}

      <TouchableOpacity style={styles.button} onPress={_startTranscribe}>
        <Text>Start Transcription ✅</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={_stopTranscribe}>
        <Text>Stop Transcription 🛑</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={_clear}>
        <Text>Clear 🗑</Text>
      </TouchableOpacity>

      {/* <View style={styles.flexButtons}>
        <View style={styles.button}>
          <Button onPress={setViewFinal(true)} title="Final Transcription" />
        </View>
        <View style={styles.button}>
          <Button title="Button 2" />
        </View>
      </View> */}
      <TouchableOpacity style={styles.labelButton} onPress={_toogleViewType}>
        <Text>
          {viewFinal ? `Final Transcription ✒️` : `Partial Transcription ✏️`}
          {/* {viewFinal
            ? `Switch to Partial Transcription ✏️`
            : `Switch to Final Transcription ✒️`} */}
        </Text>
      </TouchableOpacity>

      {/* <Text style={styles.title}>
        {viewFinal ? `Final Transcription ` : `Partial Transcription`}
      </Text> */}
      <ScrollView>{transcriptionView()}</ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 15,
    marginTop: 42,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  labelButton: {
    fontSize: 15,
    marginBottom: 5,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#CDCDCD',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 10,
    marginBottom: 10,
  },
  flagText: {
    margin: 10,
  },
});

export default Controls;
