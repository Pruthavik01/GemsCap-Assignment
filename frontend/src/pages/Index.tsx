import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { LiveTicker } from '@/components/LiveTicker';
import { SymbolSubscription } from '@/components/SymbolSubscription';
import { StatsPanel } from '@/components/StatsPanel';
import { PriceChart } from '@/components/PriceChart';
import { ZScoreChart } from '@/components/ZScoreChart';
import { SpreadChart } from '@/components/SpreadChart';
import { TickHistory } from '@/components/TickHistory';
import { ExportPanel } from '@/components/ExportPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Activity, TrendingUp, Settings2 } from 'lucide-react';

export default function Index() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [baseSymbol, setBaseSymbol] = useState<string>('');
  const [quoteSymbol, setQuoteSymbol] = useState<string>('');

  const { data: activeSymbols = [] } = useQuery({
    queryKey: ['symbols'],
    queryFn: api.symbols.list,
    refetchInterval: 5000,
  });

  // Auto-select first symbol if none selected
  if (!selectedSymbol && activeSymbols.length > 0) {
    setSelectedSymbol(activeSymbols[0]);
  }

  // Auto-select pair for analytics
  if (!baseSymbol && activeSymbols.length > 0) {
    setBaseSymbol(activeSymbols[0]);
  }
  if (!quoteSymbol && activeSymbols.length > 1) {
    setQuoteSymbol(activeSymbols[1]);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-end gap-4 mb-6 p-4 glass-panel">
          <div className="flex-1 min-w-[200px]">
            <Label className="stat-label mb-2 block">Primary Symbol</Label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-full font-mono uppercase">
                <SelectValue placeholder="Select symbol" />
              </SelectTrigger>
              <SelectContent>
                {activeSymbols.map((symbol) => (
                  <SelectItem key={symbol} value={symbol} className="font-mono uppercase">
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <Label className="stat-label mb-2 block">Base (Pair Analysis)</Label>
            <Select value={baseSymbol} onValueChange={setBaseSymbol}>
              <SelectTrigger className="w-full font-mono uppercase">
                <SelectValue placeholder="Base symbol" />
              </SelectTrigger>
              <SelectContent>
                {activeSymbols.map((symbol) => (
                  <SelectItem key={symbol} value={symbol} className="font-mono uppercase">
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <Label className="stat-label mb-2 block">Quote (Pair Analysis)</Label>
            <Select value={quoteSymbol} onValueChange={setQuoteSymbol}>
              <SelectTrigger className="w-full font-mono uppercase">
                <SelectValue placeholder="Quote symbol" />
              </SelectTrigger>
              <SelectContent>
                {activeSymbols.map((symbol) => (
                  <SelectItem key={symbol} value={symbol} className="font-mono uppercase">
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="pairs" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Pairs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Live Data */}
              <div className="space-y-6">
                <LiveTicker symbol={selectedSymbol} />
                <SymbolSubscription />
                <TickHistory symbol={selectedSymbol} />
              </div>

              {/* Center & Right - Charts */}
              <div className="lg:col-span-2 space-y-6">
                <PriceChart symbol={selectedSymbol} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatsPanel symbol={selectedSymbol} timeframe="1m" />
                  <ExportPanel symbol={selectedSymbol} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PriceChart symbol={selectedSymbol} />
              <StatsPanel symbol={selectedSymbol} timeframe="1m" />
            </div>
          </TabsContent>

          <TabsContent value="pairs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ZScoreChart base={baseSymbol} quote={quoteSymbol} />
              <SpreadChart base={baseSymbol} quote={quoteSymbol} />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Pair analysis requires two different symbols streaming. Subscribe to at least 2 symbols to enable.</p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SymbolSubscription />
              <ExportPanel symbol={selectedSymbol} />
              <div className="glass-panel p-4">
                <h3 className="text-sm font-medium mb-3">API Configuration</h3>
                <p className="text-xs text-muted-foreground">
                  Backend URL: <code className="bg-muted px-2 py-0.5 rounded font-mono">
                    {import.meta.env.VITE_API_URL || 'http://localhost:3000'}
                  </code>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Set <code className="bg-muted px-1 rounded font-mono">VITE_API_URL</code> environment variable to change.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
