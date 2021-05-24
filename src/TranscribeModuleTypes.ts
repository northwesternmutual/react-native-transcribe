import type { EventSubscriptionVendor } from 'react-native';

export type TranscribeModule = {
  start: () => Promise<boolean>;
  stop: () => void;
} & TranscribeEvents &
  EventSubscriptionVendor;

export type TranscribeEvents = {
  onError?: (e: ErrorEvent) => void;
  isRecording?: (e: BooleanEvent) => void;
  onResults?: (e: ResultsEvent) => void;
};

export type TranscribeEvent = keyof TranscribeEvents;

export type StringEvent = {
  value: string;
};

export type BooleanEvent = {
  value?: boolean;
};

export type ErrorEvent = {
  error?: {
    code?: 'string';
    message?: string;
  };
};

export type ResultsEvent = {
  value: Array<number>;
  buffer: ArrayBuffer;
};
