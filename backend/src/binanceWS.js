// binanceWS.js
const WebSocket = require('ws');
const state = require('./state');

const activeSockets = new Map(); // symbol(lowercase) → ws

function startBinanceWS(symbol) {
  if (!symbol || typeof symbol !== 'string') {
    console.warn('⚠️ Invalid symbol ignored:', symbol);
    return;
  }
  const sym = String(symbol).trim().toLowerCase();

  // prevent duplicate connections
  if (activeSockets.has(sym)) return;

  const WS_URL = `wss://fstream.binance.com/ws/${sym}@trade`;
  console.log(`🔌 Connecting Binance WS: ${sym}`);

  const ws = new WebSocket(WS_URL);
  ws._manualClose = false; // <-- add a flag to track manual close
  activeSockets.set(sym, ws);

  ws.on('open', () => {
    console.log(`✅ WS connected: ${sym}`);
  });

  ws.on('message', (data) => {
    const j = JSON.parse(data);

    const tick = {
      symbol: (j.s || '').toLowerCase(), // normalize stored symbol
      price: +j.p,
      size: +j.q,
      ts: new Date(j.T).toISOString()
    };

    state.setLastTick(tick);
  });

  ws.on('close', () => {
    console.log(`❌ WS closed: ${sym}`);
    activeSockets.delete(sym);
    // Only reconnect if not manually closed
    if (!ws._manualClose) {
      setTimeout(() => startBinanceWS(sym), 3000);
    }
  });

  ws.on('error', (err) => {
    console.error(`WS error (${sym}):`, err.message);
  });
}

function getActiveSymbols() {
  return Array.from(activeSockets.keys());
}

function stopBinanceWS(symbol) {
  const sym = String(symbol).trim().toLowerCase();
  const ws = activeSockets.get(sym);
  if (ws) {
    ws._manualClose = true; // <-- set the flag before terminating
    try { ws.terminate(); } catch (e) {}
    activeSockets.delete(sym);
    console.log(`🛑 Stopped WS: ${sym}`);
  }
}

module.exports = { startBinanceWS, getActiveSymbols, stopBinanceWS };
