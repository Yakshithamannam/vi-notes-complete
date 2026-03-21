const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

let wss = null;
const clients = new Map(); // userId -> ws

const initWebSocket = (server) => {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const params = url.parse(req.url, true).query;
    const token = params.token;

    if (!token) {
      ws.close(1008, 'No token');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      clients.set(userId, ws);

      ws.send(JSON.stringify({ type: 'connected', message: 'Real-time monitoring active' }));

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          // Handle live keystroke events for instant analysis
          if (msg.type === 'paste_event' && msg.pasteLength > 100) {
            ws.send(JSON.stringify({
              type: 'flag',
              severity: msg.pasteLength > 300 ? 'high' : 'medium',
              message: `Large paste detected — ${msg.pasteLength} characters. This will be flagged in your report.`,
              timestamp: Date.now()
            }));
          }
          if (msg.type === 'speed_anomaly') {
            ws.send(JSON.stringify({
              type: 'flag',
              severity: 'low',
              message: 'Unusual typing speed detected. Writing naturally gives the best authenticity score.',
              timestamp: Date.now()
            }));
          }
        } catch (e) { /* ignore parse errors */ }
      });

      ws.on('close', () => clients.delete(userId));
      ws.on('error', () => clients.delete(userId));
    } catch (err) {
      ws.close(1008, 'Invalid token');
    }
  });

  console.log('✅ WebSocket server initialized at /ws');
};

// Send alert to a specific user
const sendAlert = (userId, payload) => {
  const ws = clients.get(userId.toString());
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(payload));
  }
};

module.exports = { initWebSocket, sendAlert };
