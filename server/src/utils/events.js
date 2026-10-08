import { EventEmitter } from 'node:events';

// In-process pub/sub for realtime push (SSE). Swap for Redis pub/sub if the
// backend is ever scaled across multiple processes.
export const bus = new EventEmitter();
bus.setMaxListeners(100);

export const EVENTS = {
  ALERT: 'alert',
  DETECTION: 'detection',
};

export function publishAlert(alert) {
  bus.emit(EVENTS.ALERT, alert);
}

export function publishDetection(event) {
  bus.emit(EVENTS.DETECTION, event);
}
