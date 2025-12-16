const EventEmitter = require('events');

class TickState extends EventEmitter {
  constructor({ maxTicks = 100_000 } = {}) {
    super();
    this.maxTicks = maxTicks;
    this.buffer = []; // simple array as circular buffer (push/pop)
    this.index = 0;
    this.latest = null;
  }

  setLastTick(tick) {
    // tick: { symbol, price, size, ts }
    tick = {
      symbol: tick.symbol,
      price: Number(tick.price),
      size: Number(tick.size),
      ts: new Date(tick.ts).toISOString()
    };

    this.latest = tick;
    if (this.buffer.length < this.maxTicks) {
      this.buffer.push(tick);
    } else {
      // rotate: overwrite oldest
      this.buffer[this.index] = tick;
      this.index = (this.index + 1) % this.maxTicks;
    }

    // emit for live subscribers
    this.emit('tick', tick);
  }

  getLastTick() {
    return this.latest;
  }

  /**
   * getTicks - returns raw ticks filtered by symbol and time window
   * options: { symbol, sinceISO, untilISO, limit = 1000, reverse = true }
   */
  getTicks({ symbol, sinceISO, untilISO, limit = 1000, reverse = true } = {}) {
    let arr = this.buffer.slice(); // copy
    // If buffer rotated, re-order so chronological
    if (this.buffer.length === this.maxTicks && this.index > 0) {
      arr = this.buffer.slice(this.index).concat(this.buffer.slice(0, this.index));
    }

    // filter
    if (symbol) {
      arr = arr.filter(t => t.symbol && t.symbol.toLowerCase() === symbol.toLowerCase());
    }
    if (sinceISO) {
      const since = new Date(sinceISO).getTime();
      arr = arr.filter(t => new Date(t.ts).getTime() >= since);
    }
    if (untilISO) {
      const until = new Date(untilISO).getTime();
      arr = arr.filter(t => new Date(t.ts).getTime() <= until);
    }

    // sort
    arr.sort((a, b) => new Date(a.ts) - new Date(b.ts));
    if (reverse) arr = arr.slice().reverse();
    if (limit && arr.length > limit) arr = arr.slice(0, limit);
    return arr;
  }

  /**
   * sampleTicks - aggregates ticks into OHLCV per timeframe
   * timeframe: '1s' | '1m' | '5m'
   * returns: [{ t: ISO_start, o, h, l, c, v, count }]
   */
  sampleTicks({ symbol, timeframe = '1s', sinceISO, untilISO, limit = 500 } = {}) {
    const ticks = this.getTicks({ symbol, sinceISO, untilISO, limit: 100_000, reverse: false });
    if (!ticks || ticks.length === 0) return [];

    const tfMs = timeframeToMs(timeframe);
    if (!tfMs) throw new Error('unsupported timeframe');

    // group by bucket start = Math.floor(ts / tfMs) * tfMs
    const buckets = new Map();
    for (const t of ticks) {
      const ts = new Date(t.ts).getTime();
      const bucketStart = Math.floor(ts / tfMs) * tfMs;
      const key = bucketStart;
      let b = buckets.get(key);
      if (!b) {
        b = { t: new Date(bucketStart).toISOString(), o: t.price, h: t.price, l: t.price, c: t.price, v: 0, count: 0 };
        buckets.set(key, b);
      } else {
        b.h = Math.max(b.h, t.price);
        b.l = Math.min(b.l, t.price);
        b.c = t.price;
      }
      b.v += Number(t.size || 0);
      b.count += 1;
    }

    // Convert to array sorted ascending, then apply limit from most recent buckets
    const arr = Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([_, v]) => v);

    // keep last `limit` buckets
    return arr.slice(Math.max(0, arr.length - limit));
  }
}


function timeframeToMs(tf) {
  if (!tf) return null;

  tf = String(tf).trim().toLowerCase();

  if (tf === '1s') return 1000;
  if (tf === '1m') return 60 * 1000;
  if (tf === '5m') return 5 * 60 * 1000;

  return null;
}

module.exports = new TickState();
