import React, { useEffect, useRef, useState } from 'react';
import { useTickStream } from '@/hooks/useTickStream';
import { cn } from '@/lib/utils';
import { History, TrendingUp, TrendingDown } from 'lucide-react';

interface TickHistoryProps {
  symbol?: string;
  /** ms between forced UI refreshes when price hasn't changed */
  refreshIntervalMs?: number;
  maxHistory?: number;
}

export function TickHistory({
  symbol,
  refreshIntervalMs = 1000,
  maxHistory = 20,
}: TickHistoryProps) {
  const { history } = useTickStream({ symbol, maxHistory });

  // What we actually render — updated at most once per `refreshIntervalMs`
  const [displayHistory, setDisplayHistory] = useState(() => history.slice(0, maxHistory));
  const lastUpdateRef = useRef<number>(0);
  // keep previous displayed history for change-detection / highlight decisions
  const prevDisplayedRef = useRef<typeof displayHistory | null>(null);

  useEffect(() => {
    const latestTick = history[0];
    if (!latestTick) return;
    const prevDisplayedLatest = prevDisplayedRef.current?.[0];
    const now = Date.now();

    // price changed compared to what is currently displayed?
    const priceChanged =
      !prevDisplayedLatest || prevDisplayedLatest.price !== latestTick.price;

    // update immediately on price change, otherwise throttle to refreshIntervalMs
    const shouldUpdate = priceChanged || now - lastUpdateRef.current >= refreshIntervalMs;

    if (shouldUpdate) {
      setDisplayHistory(history.slice(0, maxHistory));
      lastUpdateRef.current = now;
    }
    // Note: we don't update prevDisplayedRef here (we do that after render below)
    // so that we can compare pre- and post- states to decide highlights.
  }, [history, maxHistory, refreshIntervalMs]);

  // After each render where displayHistory changed, update prevDisplayedRef
  useEffect(() => {
    prevDisplayedRef.current = displayHistory;
  }, [displayHistory]);

  const formatPrice = (price: number) => {
    if (price >= 1000)
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(8);
  };

  const formatSize = (size: number) => {
    if (size >= 1000) return `${(size / 1000).toFixed(2)}K`;
    return size.toFixed(4);
  };

  // helper to determine whether top row was recently changed (for highlight)
  const topRecentlyChanged = (() => {
    const prevTop = prevDisplayedRef.current?.[0];
    const curTop = displayHistory[0];
    if (!prevTop || !curTop) return false;
    // highlight for a short window after the last update
    const sinceUpdate = Date.now() - lastUpdateRef.current;
    return prevTop.price !== curTop.price && sinceUpdate < Math.max(800, refreshIntervalMs + 200);
  })();

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Recent Trades</span>
      </div>

      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {displayHistory.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
            Waiting for trades...
          </div>
        ) : (
          displayHistory.map((tick, index) => {
            const prevTick = displayHistory[index + 1];
            const isUp = prevTick ? tick.price > prevTick.price : true;

            // apply a short highlight only for the top item when price moved
            const isTop = index === 0;
            const highlightClass =
              isTop && topRecentlyChanged
                ? isUp
                  ? 'ring-2 ring-success/30 bg-success/10'
                  : 'ring-2 ring-destructive/30 bg-destructive/10'
                : '';

            return (
              <div
                key={`${tick.ts}-${index}`}
                className={cn(
                  'flex items-center justify-between py-2 px-3 rounded text-sm font-mono transition-colors',
                  // soft base background (not animating on every update)
                  isUp ? 'bg-success/5' : 'bg-destructive/5',
                  highlightClass
                )}
              >
                <div className="flex items-center gap-2">
                  {isUp ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                  <span
                    className={cn(isUp ? 'text-success' : 'text-destructive')}
                    title={`${tick.price}`}
                  >
                    ${formatPrice(tick.price)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                  <span>{formatSize(tick.size)}</span>
                  <span>{new Date(tick.ts).toLocaleTimeString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
