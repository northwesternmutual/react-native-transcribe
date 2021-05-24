import { API_KEY, API_GW } from '@env';
const axios = require('axios');
const marshaller = require('@aws-sdk/eventstream-marshaller'); // for converting binary event stream messages to and from JSON
const util_utf8_node = require('@aws-sdk/util-utf8-node'); // utilities for encoding and decoding UTF8
const Buffer = require('buffer/').Buffer;

class TranscribeSocket {
  constructor() {
    this.socket = '';
    this.transcribeException = false;
    this.onTranscription = () => {};
    this.onOpenSocket = () => {};
  }

  closeSocket() {
    if (this.isSocketOpen()) {
      this.socket.send(getEmptyBuffer());
    }
  }

  async openSocket() {
    try {
      if (!this.socket || !this.isSocketOpen()) {
        const url = await getTranscribeWebsocketUrl();
        this.socket = new WebSocket(url);
        this.socket.binaryType = 'arraybuffer';
        this.socket.socketError = false;
        this.transcribeException = false;

        this.socket.onopen = () => {
          this.onOpenSocket(true);
          console.log('Websocket to AWS Transcribe is open');
        };

        this.wireSocketEvents();
      }
    } catch (error) {
      throw new Error(error);
    }
  }

  async sendRawPCMDataBufferToSocket(data) {
    // add the right JSON headers and structure to the message
    let audioEventMessage = wrapAudioEventBuffer(Buffer.from(data));

    //convert the JSON object + headers into a binary event stream message
    let binary = eventStreamMarshaller.marshall(audioEventMessage);

    if (!this.isSocketOpen()) {
      console.log('THE SOCKET IS NOT OPEN');
      await this.openSocket();
    }
    this.socket.send(binary);
  }

  setTranscriptionHandler(handler) {
    this.onTranscription = handler;
  }

  setOnOpenSocket(handler) {
    this.onOpenSocket = handler;
  }

  wireSocketEvents() {
    this.socket.onmessage = (message) => {
      try {
        let data = handleAwsTranscribeMessage(message);
        this.onTranscription(data);
      } catch (error) {
        console.log('onmessage error: ', error);
        this.transcribeException = true;
      }
    };

    this.socket.onerror = (e) => {
      this.socket.socketError = true;
      console.log('onerror', e);
    };

    this.socket.onclose = (closeEvent) => {
      // the close event immediately follows the error event; only handle one.
      if (!this.socket.socketError && !this.transcribeException) {
        if (closeEvent.code !== 1000) {
          console.log('onclose:', closeEvent.reason);
        }
      }
      this.onOpenSocket(false);
    };
  }

  isSocketOpen() {
    try {
      return this.socket.readyState === 1;
    } catch (err) {
      // Something is wrong with the socket or it was never initialized
      return false;
    }
  }
}
// our converter between binary event streams messages and JSON
const eventStreamMarshaller = new marshaller.EventStreamMarshaller(
  util_utf8_node.toUtf8,
  util_utf8_node.fromUtf8
);

const handleAwsTranscribeMessage = (message) => {
  try {
    //convert the binary event stream message from AWS Transcribe to JSON
    let messageWrapper = eventStreamMarshaller.unmarshall(Buffer(message.data));
    const messageBody = JSON.parse(
      String.fromCharCode.apply(String, messageWrapper.body)
    );
    // console.log(messageBody);

    if (messageWrapper.headers[':message-type'].value === 'event') {
      return handleEventStreamMessage(messageBody);
    }
  } catch (error) {
    throw new Error('Transcribe exception: ', error);
  }
};

const handleEventStreamMessage = (messageJson) => {
  let results = messageJson.Transcript.Results;

  let transcript = '';
  let isPartial = true;
  let hasResults = false;

  if (results.length > 0) {
    if (results[0].Alternatives.length > 0) {
      transcript = results[0].Alternatives[0].Transcript;

      // fix encoding for accented characters
      hasResults = true;
      transcript = decodeURIComponent(escape(transcript));
      isPartial = results[0].IsPartial;
    }
  }

  // console.log('hasResults: ', hasResults);
  // console.log('transcript: ', transcript);
  // console.log('isPartial: ', isPartial);
  return {
    hasResults,
    transcript,
    isPartial,
  };
};

const wrapAudioEventBuffer = (
  buffer,
  messageType = 'event',
  eventType = 'AudioEvent'
) => {
  // wrap the audio data in a JSON envelope
  return {
    headers: {
      ':message-type': {
        type: 'string',
        value: messageType,
      },
      ':event-type': {
        type: 'string',
        value: eventType,
      },
    },
    body: buffer,
  };
};

const getEmptyBuffer = () => {
  // Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
  let emptyMessage = wrapAudioEventBuffer(Buffer.from(new Buffer([])));
  let emptyBuffer = eventStreamMarshaller.marshall(emptyMessage);
  return emptyBuffer;
};

const getTranscribeWebsocketUrl = async () => {
  console.log('getTranscribeWebsocketUrl');
  try {
    const response = await axios({
      url: API_GW,
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
      },
    });
    return response.data.url;
  } catch (ex) {
    throw new Error('Error in getTranscribeWebsocketUrl: ', ex);
  }
};

export default TranscribeSocket;
