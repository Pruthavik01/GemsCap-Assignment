// routes/analytic.route.js
const express = require('express');
const router = express.Router();
const state = require('../state'); // your state.js instance
// const { mean, median, stddev, sum, cov, variance } = require('../utils/stats'); // small helper functions below

// --- helpers (inline small implementations) ---
function toNumArr(arr) { return arr.map(Number).filter(v => Number.isFinite(v)); }

function computeStatsFromPrices(prices, volumes = []) {
    const cnt = prices.length;
    if (cnt === 0) return { count: 0 };
    const m = mean(prices);
    return {
        count: cnt,
        mean: m,
        median: median(prices),
        std: stddev(prices),
        min: Math.min(...prices),
        max: Math.max(...prices),
        totalVolume: sum(volumes || [])
    };
}

// --- /ohlc ---
router.get('/ohlc', (req, res) => {
    const { symbol, timeframe = '1s', since, until, limit = 500 } = req.query;
    if (!symbol) return res.status(400).json({ error: 'symbol required' });

    try {
        const data = state.sampleTicks({ symbol, timeframe, sinceISO: since, untilISO: until, limit: Number(limit) });
        return res.json({ symbol, timeframe, data });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'internal' });
    }
});

// --- /stats ---
router.get('/stats', (req, res) => {
    const { symbol, timeframe } = req.query;
    try {
        if (!symbol) return res.status(400).json({ error: 'symbol required' });

        let prices = [];
        let volumes = [];
        if (timeframe) {
            // sample closes
            const ohlc = state.sampleTicks({ symbol, timeframe, limit: 10000 });
            prices = ohlc.map(d => d.c);
            volumes = ohlc.map(d => d.v || 0);
        } else {
            const ticks = state.getTicks({ symbol, limit: 10000, reverse: false });
            prices = ticks.map(t => t.price);
            volumes = ticks.map(t => t.size || 0);
        }

        const stats = computeStatsFromPrices(prices, volumes);
        return res.json({ symbol, timeframe: timeframe || 'ticks', ...stats });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'internal' });
    }
});

// --- /spread ---
router.get('/spread', (req, res) => {
  const { base, quote, timeframe = '1s', since, until, limit = 1000, hedgeRatio } = req.query;
  if (!base || !quote) return res.status(400).json({ error: 'base and quote required' });

  try {
    const left = state.sampleTicks({ symbol: base, timeframe, sinceISO: since, untilISO: until, limit: 100000 });
    const right = state.sampleTicks({ symbol: quote, timeframe, sinceISO: since, untilISO: until, limit: 100000 });

    const rightMap = new Map(right.map(r => [r.t, r]));
    let lastRight = null;
    const rows = [];

    for (const l of left) {
      const r = rightMap.get(l.t);
      if (r) lastRight = r;
      if (!lastRight) continue;

      rows.push({
        t: l.t,
        base: l.c,
        quote: lastRight.c
      });
    }

    if (rows.length < 30) {
      return res.status(400).json({ error: 'insufficient aligned data', available: rows.length });
    }

    let hr = hedgeRatio ? Number(hedgeRatio) : computeOLS(
      rows.map(r => Math.log(r.quote)),
      rows.map(r => Math.log(r.base))
    ).beta;

    const series = rows.map(r => ({
      t: r.t,
      spread: Math.log(r.base) - hr * Math.log(r.quote)
    }));

    const spreads = series.map(s => s.spread);
    const zLatest = (spreads.at(-1) - mean(spreads)) / (stddev(spreads) || 1);

    return res.json({
      base,
      quote,
      hedgeRatio: hr,
      data: series.slice(-Number(limit)),
      zLatest
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// --- /zscore ---
router.get('/zscore', (req, res) => {
  const { base, quote, timeframe = '1s', window = 60, since, until, limit = 1000 } = req.query;
  if (!base || !quote) return res.status(400).json({ error: 'base and quote required' });

  try {
    const left = state.sampleTicks({ symbol: base, timeframe, sinceISO: since, untilISO: until, limit: 100000 });
    const right = state.sampleTicks({ symbol: quote, timeframe, sinceISO: since, untilISO: until, limit: 100000 });

    const rightMap = new Map(right.map(r => [r.t, r]));
    let lastRight = null;
    const series = [];

    for (const l of left) {
      const r = rightMap.get(l.t);
      if (r) lastRight = r;
      if (!lastRight) continue;

      const spread = Math.log(l.c) - Math.log(lastRight.c);
      series.push({ t: l.t, spread });
    }

    if (series.length < window) {
      return res.status(400).json({ error: 'insufficient data', available: series.length });
    }

    const w = Number(window);
    const zseries = series.map((row, i) => {
      const slice = series.slice(Math.max(0, i - w + 1), i + 1).map(s => s.spread);
      const mu = mean(slice);
      const sd = stddev(slice) || 1;
      return { t: row.t, z: (row.spread - mu) / sd };
    });

    return res.json({
      base,
      quote,
      window: w,
      data: zseries.slice(-Number(limit)),
      zLatest: zseries.at(-1).z
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// --- /hedge-ratio ---
// --- /hedge-ratio ---
router.get('/hedge-ratio', (req, res) => {
  const { base, quote, timeframe = '1m', since, until } = req.query;
  if (!base || !quote) {
    return res.status(400).json({ error: 'base and quote required' });
  }

  try {
    const left = state.sampleTicks({ symbol: base, timeframe, sinceISO: since, untilISO: until, limit: 100000 });
    const right = state.sampleTicks({ symbol: quote, timeframe, sinceISO: since, untilISO: until, limit: 100000 });

    const rightMap = new Map(right.map(r => [r.t, r]));

    let lastRight = null;
    const xs = [];
    const ys = [];

    for (const l of left) {
      const r = rightMap.get(l.t);
      if (r) lastRight = r;
      if (!lastRight) continue;

      // ✅ LOG PRICES (CRITICAL)
      xs.push(Math.log(lastRight.c));
      ys.push(Math.log(l.c));
    }

    // ✅ PROFESSIONAL SAFETY CHECK
    if (xs.length < 30) {
      return res.status(400).json({
        error: 'insufficient data for hedge ratio',
        required: 30,
        available: xs.length
      });
    }

    const ols = computeOLS(xs, ys);

    return res.json({
      base,
      quote,
      method: 'ols-log',
      beta: ols.beta,
      alpha: ols.alpha,
      r2: ols.r2,
      n: xs.length
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal' });
  }
});

// --- /correlation ---
router.get('/correlation', (req, res) => {
    const { symbols, timeframe = '1m', window = 60, since, until } = req.query;
    if (!symbols) return res.status(400).json({ error: 'symbols required (CSV)' });
    const syms = symbols.split(',').map(s => s.trim()).filter(Boolean);
    if (syms.length !== 2) return res.status(400).json({ error: 'currently only supports 2 symbols' });

    try {
        const left = state.sampleTicks({ symbol: syms[0], timeframe, sinceISO: since, untilISO: until, limit: 100000 });
        const right = state.sampleTicks({ symbol: syms[1], timeframe, sinceISO: since, untilISO: until, limit: 100000 });
        const rightMap = new Map(right.map(r => [r.t, r]));
        const data = [];
        for (const l of left) {
            const r = rightMap.get(l.t);
            if (!r) continue;
            data.push({ t: l.t, a: l.c, b: r.c });
        }

        // rolling corr
        const w = Number(window);
        const series = data.map((d, idx) => {
            const start = Math.max(0, idx - w + 1);
            const slice = data.slice(start, idx + 1);
            const arrA = slice.map(x => x.a);
            const arrB = slice.map(x => x.b);
            const covAB = cov(arrA, arrB);
            const r = covAB / ((Math.sqrt(variance(arrA) * variance(arrB))) || 1);
            return { t: d.t, corr: r };
        });

        return res.json({ symbols: syms, window: Number(window), data: series });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'internal' });
    }
});

module.exports = router;

// --- small numeric helpers & OLS (could move to utils/stats.js) ---
function mean(arr) {
    const a = toNumArr(arr);
    if (a.length === 0) return 0;
    return a.reduce((s, v) => s + v, 0) / a.length;
}
function median(arr) {
    const a = toNumArr(arr).sort((x, y) => x - y);
    if (a.length === 0) return 0;
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
function variance(arr) {
    const a = toNumArr(arr);
    if (a.length === 0) return 0;
    const m = mean(a);
    return a.reduce((s, v) => s + (v - m) * (v - m), 0) / a.length;
}
function stddev(arr) { return Math.sqrt(variance(arr)); }
function sum(arr) { return toNumArr(arr).reduce((s, v) => s + v, 0); }
function cov(a, b) {
    const A = toNumArr(a), B = toNumArr(b);
    const n = Math.min(A.length, B.length);
    if (n === 0) return 0;
    const ma = mean(A), mb = mean(B);
    let s = 0;
    for (let i = 0; i < n; i++) s += (A[i] - ma) * (B[i] - mb);
    return s / n;
}
function computeOLS(x, y) {
    // regress y = alpha + beta*x  (x: independent, y: dependent)
    const X = toNumArr(x), Y = toNumArr(y);
    const n = Math.min(X.length, Y.length);
    if (n === 0) return { alpha: 0, beta: 0, r2: 0 };
    const xm = mean(X), ym = mean(Y);
    let num = 0, den = 0, ssy = 0, ssr = 0;
    for (let i = 0; i < n; i++) {
        num += (X[i] - xm) * (Y[i] - ym);
        den += (X[i] - xm) * (X[i] - xm);
    }
    const beta = den === 0 ? 0 : num / den;
    const alpha = ym - beta * xm;
    // r2
    for (let i = 0; i < n; i++) {
        const pred = alpha + beta * X[i];
        ssr += (pred - ym) * (pred - ym);
        ssy += (Y[i] - ym) * (Y[i] - ym);
    }
    const r2 = ssy === 0 ? 0 : ssr / ssy;
    return { alpha, beta, r2 };
}
