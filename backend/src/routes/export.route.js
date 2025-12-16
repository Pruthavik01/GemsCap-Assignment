const express = require('express');
const router = express.Router();
const state = require('../state');

router.get('/ticks', (req, res) => {
  const { symbol, since, until } = req.query;

  const ticks = state.getTicks({
    symbol,
    sinceISO: since,
    untilISO: until,
    limit: 100_000,
    reverse: false
  });

  if (!ticks.length) {
    return res.status(404).json({ error: 'No data found' });
  }

  const header = 'timestamp,symbol,price,size\n';
  const rows = ticks
    .map(t => `${t.ts},${t.symbol},${t.price},${t.size}`)
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${symbol || 'ticks'}.csv`
  );

  res.send(header + rows);
});

module.exports = router;
