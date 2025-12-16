// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Types
export interface Tick {
  symbol: string;
  price: number;
  size: number;
  ts: string;
}

export interface OHLCData {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  count: number;
}

export interface Stats {
  symbol: string;
  timeframe: string;
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  totalVolume: number;
}

export interface SpreadData {
  base: string;
  quote: string;
  hedgeRatio: number;
  data: { t: string; spread: number }[];
  zLatest: number;
}

export interface ZScoreData {
  base: string;
  quote: string;
  window: number;
  data: { t: string; z: number }[];
  zLatest: number;
}

export interface Alert {
  id?: string;
  type: string;
  symbol?: string;
  base?: string;
  quote?: string;
  threshold: number;
  condition: 'above' | 'below';
  active?: boolean;
}

// API Functions
export const api = {
  // Health check
  health: async (): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/health`);
    return res.text();
  },

  // Symbols
  symbols: {
    list: async (): Promise<string[]> => {
      const res = await fetch(`${API_BASE_URL}/symbols`);
      return res.json();
    },
    subscribe: async (symbol: string): Promise<{ status: string; symbol: string }> => {
      const res = await fetch(`${API_BASE_URL}/symbols/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      return res.json();
    },
    unsubscribe: async (symbol: string): Promise<{ status: string; symbol: string }> => {
      const res = await fetch(`${API_BASE_URL}/symbols/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      return res.json();
    },
  },

  // Ticks
  tick: {
    latest: async (): Promise<Tick | null> => {
      const res = await fetch(`${API_BASE_URL}/tick/latest`);
      if (res.status === 204) return null;
      return res.json();
    },
    history: async (params: {
      symbol?: string;
      since?: string;
      until?: string;
      limit?: number;
      reverse?: boolean;
    }): Promise<{ meta: { count: number }; data: Tick[] }> => {
      const query = new URLSearchParams();
      if (params.symbol) query.append('symbol', params.symbol);
      if (params.since) query.append('since', params.since);
      if (params.until) query.append('until', params.until);
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.reverse !== undefined) query.append('reverse', params.reverse.toString());
      const res = await fetch(`${API_BASE_URL}/tick/history?${query}`);
      return res.json();
    },
    sample: async (params: {
      symbol?: string;
      timeframe?: '1s' | '1m' | '5m';
      since?: string;
      until?: string;
      limit?: number;
    }): Promise<{ meta: { timeframe: string; symbol: string | null; buckets: number }; data: OHLCData[] }> => {
      const query = new URLSearchParams();
      if (params.symbol) query.append('symbol', params.symbol);
      if (params.timeframe) query.append('timeframe', params.timeframe);
      if (params.since) query.append('since', params.since);
      if (params.until) query.append('until', params.until);
      if (params.limit) query.append('limit', params.limit.toString());
      const res = await fetch(`${API_BASE_URL}/tick/sample?${query}`);
      return res.json();
    },
    stream: (symbol?: string): EventSource => {
      const url = symbol 
        ? `${API_BASE_URL}/tick/stream?symbol=${symbol}`
        : `${API_BASE_URL}/tick/stream`;
      return new EventSource(url);
    },
  },

  // Analytics
  analytics: {
    ohlc: async (params: {
      symbol: string;
      timeframe?: string;
      since?: string;
      until?: string;
      limit?: number;
    }): Promise<{ symbol: string; timeframe: string; data: OHLCData[] }> => {
      const query = new URLSearchParams({ symbol: params.symbol });
      if (params.timeframe) query.append('timeframe', params.timeframe);
      if (params.since) query.append('since', params.since);
      if (params.until) query.append('until', params.until);
      if (params.limit) query.append('limit', params.limit.toString());
      const res = await fetch(`${API_BASE_URL}/analytics/ohlc?${query}`);
      return res.json();
    },
    stats: async (params: { symbol: string; timeframe?: string }): Promise<Stats> => {
      const query = new URLSearchParams({ symbol: params.symbol });
      if (params.timeframe) query.append('timeframe', params.timeframe);
      const res = await fetch(`${API_BASE_URL}/analytics/stats?${query}`);
      return res.json();
    },
    spread: async (params: {
      base: string;
      quote: string;
      timeframe?: string;
      since?: string;
      until?: string;
      limit?: number;
      hedgeRatio?: number;
    }): Promise<SpreadData> => {
      const query = new URLSearchParams({ base: params.base, quote: params.quote });
      if (params.timeframe) query.append('timeframe', params.timeframe);
      if (params.since) query.append('since', params.since);
      if (params.until) query.append('until', params.until);
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.hedgeRatio) query.append('hedgeRatio', params.hedgeRatio.toString());
      const res = await fetch(`${API_BASE_URL}/analytics/spread?${query}`);
      return res.json();
    },
    zscore: async (params: {
      base: string;
      quote: string;
      timeframe?: string;
      window?: number;
      since?: string;
      until?: string;
      limit?: number;
    }): Promise<ZScoreData> => {
      const query = new URLSearchParams({ base: params.base, quote: params.quote });
      if (params.timeframe) query.append('timeframe', params.timeframe);
      if (params.window) query.append('window', params.window.toString());
      if (params.since) query.append('since', params.since);
      if (params.until) query.append('until', params.until);
      if (params.limit) query.append('limit', params.limit.toString());
      const res = await fetch(`${API_BASE_URL}/analytics/zscore?${query}`);
      return res.json();
    },
    hedgeRatio: async (params: {
      base: string;
      quote: string;
      timeframe?: string;
      since?: string;
      until?: string;
    }): Promise<{ base: string; quote: string; beta: number; alpha: number; r2: number; n: number }> => {
      const query = new URLSearchParams({ base: params.base, quote: params.quote });
      if (params.timeframe) query.append('timeframe', params.timeframe);
      if (params.since) query.append('since', params.since);
      if (params.until) query.append('until', params.until);
      const res = await fetch(`${API_BASE_URL}/analytics/hedge-ratio?${query}`);
      return res.json();
    },
  },

  // Alerts
  alerts: {
    list: async (): Promise<Alert[]> => {
      const res = await fetch(`${API_BASE_URL}/alerts`);
      return res.json();
    },
    create: async (alert: Alert): Promise<Alert> => {
      const res = await fetch(`${API_BASE_URL}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
      return res.json();
    },
    triggered: async (): Promise<Alert[]> => {
      const res = await fetch(`${API_BASE_URL}/alerts/triggered`);
      return res.json();
    },
  },

  // Export
  exports: {
    ticks: (params: { symbol?: string; since?: string; until?: string }): string => {
      const query = new URLSearchParams();
      if (params.symbol) query.append('symbol', params.symbol);
      if (params.since) query.append('since', params.since);
      if (params.until) query.append('until', params.until);
      return `${API_BASE_URL}/exports/ticks?${query}`;
    },
  },
};
