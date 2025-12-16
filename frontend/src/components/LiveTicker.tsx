import { useTickStream } from '@/hooks/useTickStream';
import { cn } from '@/lib/utils';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LiveTickerProps {
  symbol?: string;
}

export function LiveTicker({ symbol }: LiveTickerProps) {
  const { tick, connected, history } = useTickStream({ symbol, maxHistory: 2 });
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (history.length >= 2) {
      const current = history[0].price;
      const previous = history[1].price;
      setPriceChange(current > previous ? 'up' : current < previous ? 'down' : null);
      
      // Reset animation after 300ms
      const timeout = setTimeout(() => setPriceChange(null), 300);
      return () => clearTimeout(timeout);
    }
  }, [history]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(8);
  };

  const formatSize = (size: number) => {
    if (size >= 1000000) return `${(size / 1000000).toFixed(2)}M`;
    if (size >= 1000) return `${(size / 1000).toFixed(2)}K`;
    return size.toFixed(4);
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Live Ticker</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("pulse-dot", !connected && "opacity-50")} />
          <span className="text-xs text-muted-foreground">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {tick ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {tick.symbol.toUpperCase()}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {new Date(tick.ts).toLocaleTimeString()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={cn(
                "stat-value transition-colors duration-200",
                priceChange === 'up' && "ticker-positive",
                priceChange === 'down' && "ticker-negative"
              )}
            >
              ${formatPrice(tick.price)}
            </span>
            {priceChange === 'up' && (
              <TrendingUp className="h-5 w-5 text-success animate-fade-in" />
            )}
            {priceChange === 'down' && (
              <TrendingDown className="h-5 w-5 text-destructive animate-fade-in" />
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Volume</span>
            <span className="font-mono">{formatSize(tick.size)}</span>
          </div>
        </div>
      ) : (
        <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
          {connected ? 'Waiting for data...' : 'No connection'}
        </div>
      )}
    </div>
  );
}
