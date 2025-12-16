import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface SpreadChartProps {
  base: string;
  quote: string;
}

export function SpreadChart({ base, quote }: SpreadChartProps) {
  const [timeframe, setTimeframe] = useState<'1s' | '1m' | '5m'>('1s');

  const { data, isLoading, error } = useQuery({
    queryKey: ['spread', base, quote, timeframe],
    queryFn: () => api.analytics.spread({ base, quote, timeframe, limit: 200 }),
    enabled: !!base && !!quote,
    refetchInterval: 2000,
  });

  const chartData = data?.data?.map((d) => ({
    time: new Date(d.t).toLocaleTimeString(),
    spread: d.spread,
  })) || [];

  const hedgeRatio = data?.hedgeRatio;

  if (!base || !quote) {
    return (
      <div className="glass-panel p-4 h-[300px]">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Spread Analysis</span>
        </div>
        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
          Select base and quote symbols
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Spread</span>
          <span className="font-mono uppercase text-xs text-muted-foreground ml-2">
            {base}/{quote}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {hedgeRatio !== undefined && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm font-mono">
              β: {hedgeRatio.toFixed(4)}
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
        <Skeleton className="h-[220px] w-full" />
      ) : error ? (
        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
          Insufficient data for spread analysis. Keep streaming both symbols.
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="spreadGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
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
              tickFormatter={(value) => value.toFixed(4)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222 47% 10%)',
                border: '1px solid hsl(222 47% 18%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [value.toFixed(6), 'Spread (log)']}
            />
            <ReferenceLine y={0} stroke="hsl(215 20% 55%)" strokeOpacity={0.3} />
            <Area
              type="monotone"
              dataKey="spread"
              stroke="hsl(38 92% 50%)"
              strokeWidth={2}
              fill="url(#spreadGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
