import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ZScoreChartProps {
  base: string;
  quote: string;
}

export function ZScoreChart({ base, quote }: ZScoreChartProps) {
  const [timeframe, setTimeframe] = useState<'1s' | '1m' | '5m'>('1s');
  const [window, setWindow] = useState(60);

  const { data, isLoading, error } = useQuery({
    queryKey: ['zscore', base, quote, timeframe, window],
    queryFn: () => api.analytics.zscore({ base, quote, timeframe, window, limit: 200 }),
    enabled: !!base && !!quote,
    refetchInterval: 2000,
  });

  const chartData = data?.data?.map((d) => ({
    time: new Date(d.t).toLocaleTimeString(),
    z: d.z,
  })) || [];

  const zLatest = data?.zLatest;
  const isExtreme = zLatest && Math.abs(zLatest) > 2;
  const isWarning = zLatest && Math.abs(zLatest) > 1.5;

  if (!base || !quote) {
    return (
      <div className="glass-panel p-4 h-[300px]">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Z-Score Analysis</span>
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
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Z-Score</span>
          <span className="font-mono uppercase text-xs text-muted-foreground ml-2">
            {base}/{quote}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {zLatest !== undefined && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-mono font-semibold",
              isExtreme && "bg-destructive/20 text-destructive",
              isWarning && !isExtreme && "bg-warning/20 text-warning",
              !isWarning && "bg-muted text-muted-foreground"
            )}>
              {isExtreme && <AlertTriangle className="h-3 w-3" />}
              Z: {zLatest.toFixed(3)}
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
          Insufficient data. Keep streaming to see z-score analysis.
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="zGradientPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(142 72% 45%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(142 72% 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="zGradientNeg" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="hsl(0 72% 51%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(0 72% 51%)" stopOpacity={0} />
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
              domain={[-3, 3]}
              ticks={[-2, -1, 0, 1, 2]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(222 47% 10%)',
                border: '1px solid hsl(222 47% 18%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [value.toFixed(4), 'Z-Score']}
            />
            <ReferenceLine y={2} stroke="hsl(0 72% 51%)" strokeDasharray="5 5" strokeOpacity={0.5} />
            <ReferenceLine y={-2} stroke="hsl(0 72% 51%)" strokeDasharray="5 5" strokeOpacity={0.5} />
            <ReferenceLine y={0} stroke="hsl(215 20% 55%)" strokeOpacity={0.3} />
            <Area
              type="monotone"
              dataKey="z"
              stroke="hsl(174 72% 50%)"
              strokeWidth={2}
              fill="url(#zGradientPos)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-destructive opacity-50" style={{ borderTop: '1px dashed' }} />
          <span>±2 Threshold</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-success">↑</span>
          <span>Overbought</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-destructive">↓</span>
          <span>Oversold</span>
        </div>
      </div>
    </div>
  );
}
