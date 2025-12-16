// routes/tick.route.js
const express = require('express');
const router = express.Router();
const state = require('../state');

// basic validation helper
function parseIntOrDefault(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

/**
 * GET /tick/latest
 * returns latest tick JSON or 204
 */
router.get('/latest', (req, res) => {
  try {
    const tick = state.getLastTick();
    if (!tick) return res.status(204).end();
    return res.json(tick);
  } catch (err) {
    console.error('Error /tick/latest', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * GET /tick/history
 * params:
 *  - symbol (optional)
 *  - since (ISO string) (optional)
 *  - until (ISO string) (optional)
 *  - limit (optional, default 1000)
 *  - reverse (true/false) (default true)
 */
router.get('/history', (req, res) => {
  try {
    const { symbol, since, until, reverse } = req.query;
    const limit = parseIntOrDefault(req.query.limit, 1000);
    const rev = typeof reverse === 'undefined' ? true : (String(reverse).toLowerCase() !== 'false');

    const ticks = state.getTicks({ symbol, sinceISO: since, untilISO: until, limit, reverse: rev });
    return res.json({ meta: { count: ticks.length }, data: ticks });
  } catch (err) {
    console.error('Error /tick/history', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

/**
 * GET /tick/sample
 * params:
 *  - timeframe: 1s | 1m | 5m (default 1s)
 *  - symbol (optional)
 *  - since (ISO) (optional)
 *  - until (ISO) (optional)
 *  - limit (buckets, default 500)
 */
router.get('/sample', (req, res) => {
  try {
    const tf = req.query.timeframe || '1s';
    const symbol = req.query.symbol;
    const since = req.query.since;
    const until = req.query.until;
    const limit = parseIntOrDefault(req.query.limit, 500);

    // basic validation
    if (!['1s', '1m', '5m', '1S', '1M', '5M'].includes(tf)) {
      return res.status(400).json({ error: 'invalid_timeframe', message: 'allowed: 1s, 1m, 5m' });
    }

    const buckets = state.sampleTicks({ symbol, timeframe: tf, sinceISO: since, untilISO: until, limit });

    return res.json({ meta: { timeframe: tf, symbol: symbol || null, buckets: buckets.length }, data: buckets });
  } catch (err) {
    console.error('Error /tick/sample', err);
    return res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

/**
 * GET /tick/stream
 * Server-Sent Events streaming for live ticks. Query param `symbol` optional.
 * Example: /tick/stream?symbol=btcusdt
 */
router.get('/stream', (req, res) => {
  const symbolFilter = req.query.symbol ? String(req.query.symbol).toLowerCase() : null;

  // set headers for SSE
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders();

  // send a comment ping
  res.write(`: connected\n\n`);

  const onTick = (tick) => {
    if (symbolFilter && tick.symbol.toLowerCase() !== symbolFilter) return;
    res.write(`event: tick\n`);
    res.write(`data: ${JSON.stringify(tick)}\n\n`);
  };

  // attach listener
  state.on('tick', onTick);

  // cleanup on client disconnect
  req.on('close', () => {
    state.off('tick', onTick);
    try { res.end(); } catch (e) {}
  });
});

// Export router
module.exports = router;
