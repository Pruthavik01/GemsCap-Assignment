import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Radio, X } from 'lucide-react';
import { toast } from 'sonner';

const POPULAR_SYMBOLS = ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'xrpusdt'];

export function SymbolSubscription() {
  const [newSymbol, setNewSymbol] = useState('');
  const queryClient = useQueryClient();

  const { data: activeSymbols = [], isLoading } = useQuery({
    queryKey: ['symbols'],
    queryFn: api.symbols.list,
    refetchInterval: 5000,
  });

  const subscribeMutation = useMutation({
    mutationFn: api.symbols.subscribe,
    onSuccess: (data) => {
      toast.success(`Subscribed to ${data.symbol.toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ['symbols'] });
      setNewSymbol('');
    },
    onError: () => {
      toast.error('Failed to subscribe');
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: api.symbols.unsubscribe,
    onSuccess: (data) => {
      toast.success(`Unsubscribed from ${data.symbol.toUpperCase()}`);
      queryClient.invalidateQueries({ queryKey: ['symbols'] });
    },
    onError: () => {
      toast.error('Failed to unsubscribe');
    },
  });

  const handleToggle = (symbol: string) => {
    const normalized = symbol.toLowerCase().trim();
    if (!normalized) return;
    if (activeSymbols.includes(normalized)) {
      unsubscribeMutation.mutate(normalized);
    } else {
      subscribeMutation.mutate(normalized);
    }
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Symbol Streams</span>
      </div>

      {/* Active Symbols */}
      <div className="mb-4">
        <span className="stat-label">Active Streams</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {isLoading ? (
            <span className="text-xs text-muted-foreground">Loading...</span>
          ) : activeSymbols.length > 0 ? (
            activeSymbols.map((symbol) => (
              <Badge
                key={symbol}
                variant="secondary"
                className="font-mono uppercase bg-primary/20 text-primary border-primary/30 cursor-pointer"
                onClick={() => handleToggle(symbol)}
                title="Click to unsubscribe"
              >
                <span className="pulse-dot mr-2" />
                {symbol}
                <X className="ml-1 h-3 w-3 opacity-60" />
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No active streams</span>
          )}
        </div>
      </div>

      {/* Quick Add */}
      <div className="mb-4">
        <span className="stat-label">Quick Add</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {POPULAR_SYMBOLS.map((symbol) => {
            const isActive = activeSymbols.includes(symbol);
            return (
              <Button
                key={symbol}
                variant={isActive ? "secondary" : "outline"}
                size="sm"
                className={`font-mono uppercase text-xs h-7 ${isActive ? "bg-primary/20 text-primary border-primary/30" : ""}`}
                disabled={subscribeMutation.isPending || unsubscribeMutation.isPending}
                onClick={() => handleToggle(symbol)}
              >
                {isActive ? (
                  <>
                    {symbol} <X className="ml-1 h-3 w-3" />
                  </>
                ) : (
                  <>
                    {symbol} <Plus className="ml-1 h-3 w-3" />
                  </>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Custom Symbol */}
      <div>
        <span className="stat-label">Custom Symbol</span>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="e.g., dogeusdt"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            className="font-mono uppercase text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleToggle(newSymbol);
            }}
          />
          <Button
            size="icon"
            onClick={() => handleToggle(newSymbol)}
            disabled={!newSymbol.trim() || subscribeMutation.isPending || unsubscribeMutation.isPending}
          >
            {activeSymbols.includes(newSymbol.toLowerCase().trim()) ? (
              <X className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
