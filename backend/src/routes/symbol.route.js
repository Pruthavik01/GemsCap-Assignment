const express = require('express');
const router = express.Router();
const { startBinanceWS, getActiveSymbols,stopBinanceWS } = require('../binanceWS');

// Start streaming a symbol
router.post('/subscribe', (req, res) => {
  const { symbol } = req.body;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'valid symbol required' });
  }

  startBinanceWS(symbol);
  res.json({ status: 'subscribed', symbol });
});

// ✅ Unsubscribe a symbol
router.post('/unsubscribe', (req, res) => {
  const { symbol } = req.body;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'valid symbol required' });
  }

  stopBinanceWS(symbol);

  res.json({
    status: 'unsubscribed',
    symbol: symbol.toUpperCase()
  });
});


// List active symbols
router.get('/', (req, res) => {
  res.json(getActiveSymbols());
});

module.exports = router;
