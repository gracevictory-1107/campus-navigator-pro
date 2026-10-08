import { bus, EVENTS } from '../utils/events.js';

/**
 * GET /api/events/stream — Server-Sent Events.
 * Pushes new security alerts and CCTV detections to connected dashboards so
 * they update without a page refresh.
 */
export function stream(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 3000\n\n');
  res.write(`event: hello\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  const onAlert = (alert) => {
    res.write(`event: alert\ndata: ${JSON.stringify(alert)}\n\n`);
  };
  const onDetection = (detection) => {
    res.write(`event: detection\ndata: ${JSON.stringify(detection)}\n\n`);
  };
  const heartbeat = setInterval(() => res.write(`: ping\n\n`), 25000);

  bus.on(EVENTS.ALERT, onAlert);
  bus.on(EVENTS.DETECTION, onDetection);

  req.on('close', () => {
    clearInterval(heartbeat);
    bus.off(EVENTS.ALERT, onAlert);
    bus.off(EVENTS.DETECTION, onDetection);
  });
}
