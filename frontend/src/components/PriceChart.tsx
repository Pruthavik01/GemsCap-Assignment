import { useQuery } from '@tanstack/react-query';
import { api, OHLCData } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart, Bar } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { CandlestickChart, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface PriceChartProps {
  symbol: string;
}

export function PriceChart({ symbol }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<'1s' | '1m' | '5m'>('1s');
  const [limit, setLimit] = useState(100);

  const { data, isLoading, error } = useQuery({
    queryKey: ['ohlc', symbol, timeframe, limit],
    queryFn: () => api.tick.sample({ symbol, timeframe, limit }),
    enabled: !!symbol,
    refetchInterval: timeframe === '1s' ? 1000 : timeframe === '1m' ? 5000 : 15000,
  });

  const chartData = data?.data?.map((d) => ({
    time: new Date(d.t).toLocaleTimeString(),
    timestamp: new Date(d.t).getTime(),
    open: d.o,
    high: d.h,
    low: d.l,
    close: d.c,
    volume: d.v,
    change: ((d.c - d.o) / d.o) * 100,
  })) || [];

  const lastPrice = chartData[chartData.length - 1]?.close;
  const firstPrice = chartData[0]?.close;
  const priceChange = lastPrice && firstPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  if (!symbol) {
    return (
      <div className="glass-panel p-4 h-[400px]">
        <div className="flex items-center gap-2 mb-4">
          <CandlestickChart className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Price Chart</span>
        </div>
        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
          Select a symbol to view chart
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CandlestickChart className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Price Chart</span>
          <span className="font-mono uppercase text-xs text-muted-foreground ml-2">
            {symbol}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastPrice && (
            <div className="flex items-center gap-2">
              <span className={`font-mono text-lg font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                ${lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-mono ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          )}
          <Select value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1s">1s</SelectItem>
              <SelectItem value="1m">1m</SelectItem>
              <SelectItem value="5m">5m</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[320px] w-full" />
      ) : error ? (
        <div className="h-[320px] flex items-center justify-center text-destructive text-sm">
          Failed to load chart data
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[320px] flex items-center justify-center text-muted-foreground text-sm">
          No data available. Start streaming to see the chart.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? "hsl(142 72% 45%)" : "hsl(0 72% 51%)"} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? "hsl(142 72% 45%)" : "hsl(0 72% 51%)"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="hsl(215 20% 55%)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215 20% 55%)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222 47% 10%)',
                border: '1px solid hsl(222 47% 18%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(215 20% 55%)' }}
              formatter={(value: number, name: string) => {
                if (name === 'volume') return [value.toLocaleString(), 'Volume'];
                return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, name.charAt(0).toUpperCase() + name.slice(1)];
              }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={isPositive ? "hsl(142 72% 45%)" : "hsl(0 72% 51%)"}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
            <Bar 
              dataKey="volume" 
              fill="hsl(174 72% 50%)" 
              opacity={0.2}
              yAxisId="volume"
            />
            <YAxis 
              yAxisId="volume" 
              orientation="right" 
              stroke="hsl(215 20% 55%)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toFixed(0);
              }}
              width={50}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
