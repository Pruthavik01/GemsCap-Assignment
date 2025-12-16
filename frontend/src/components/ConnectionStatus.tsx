import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Server } from 'lucide-react';

export function ConnectionStatus() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 10000,
    retry: 1,
  });

  const isConnected = data === 'OK';

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
      isConnected 
        ? "bg-success/20 text-success" 
        : error 
          ? "bg-destructive/20 text-destructive"
          : "bg-muted text-muted-foreground"
    )}>
      {isLoading ? (
        <>
          <Server className="h-3 w-3 animate-pulse" />
          <span>Connecting...</span>
        </>
      ) : isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Backend Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Backend Offline</span>
        </>
      )}
    </div>
  );
}
