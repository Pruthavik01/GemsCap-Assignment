import { useQuery } from '@tanstack/react-query';
import { api, Stats } from '@/lib/api';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatsPanelProps {
  symbol: string;
  timeframe?: string;
}

function StatItem({ 
  label, 
  value, 
  format = 'number',
  highlight,
}: { 
  label: string; 
  value: number | undefined;
  format?: 'number' | 'currency' | 'percent' | 'volume';
  highlight?: 'positive' | 'negative' | 'neutral';
}) {
  const formatValue = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '—';
    switch (format) {
      case 'currency':
        if (val >= 1000) return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (val >= 1) return `$${val.toFixed(4)}`;
        return `$${val.toFixed(8)}`;
      case 'percent':
        return `${(val * 100).toFixed(2)}%`;
      case 'volume':
        if (val >= 1000000000) return `${(val / 1000000000).toFixed(2)}B`;
        if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `${(val / 1000).toFixed(2)}K`;
        return val.toFixed(2);
      default:
        return val.toLocaleString('en-US', { maximumFractionDigits: 6 });
    }
  };

  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <span className="stat-label">{label}</span>
      <div className={cn(
        "font-mono text-lg font-semibold mt-1",
        highlight === 'positive' && "text-success",
        highlight === 'negative' && "text-destructive",
        highlight === 'neutral' && "text-muted-foreground"
      )}>
        {formatValue(value)}
      </div>
    </div>
  );
}

export function StatsPanel({ symbol, timeframe = '1m' }: StatsPanelProps) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['stats', symbol, timeframe],
    queryFn: () => api.analytics.stats({ symbol, timeframe }),
    enabled: !!symbol,
    refetchInterval: 5000,
  });

  if (!symbol) {
    return (
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Statistics</span>
        </div>
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          Select a symbol to view statistics
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Statistics</span>
        </div>
        <span className="text-xs font-mono uppercase text-muted-foreground">
          {symbol} / {timeframe}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="h-48 flex items-center justify-center text-destructive text-sm">
          Failed to load statistics
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3">
          <StatItem label="Mean Price" value={stats.mean} format="currency" />
          <StatItem label="Median Price" value={stats.median} format="currency" />
          <StatItem label="Std Deviation" value={stats.std} format="currency" highlight="neutral" />
          <StatItem label="Sample Count" value={stats.count} />
          <StatItem label="Min Price" value={stats.min} format="currency" highlight="negative" />
          <StatItem label="Max Price" value={stats.max} format="currency" highlight="positive" />
          <div className="col-span-2">
            <StatItem label="Total Volume" value={stats.totalVolume} format="volume" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
