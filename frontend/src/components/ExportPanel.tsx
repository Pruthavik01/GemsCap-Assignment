import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface ExportPanelProps {
  symbol?: string;
}

export function ExportPanel({ symbol: defaultSymbol }: ExportPanelProps) {
  const [symbol, setSymbol] = useState(defaultSymbol || '');
  const [since, setSince] = useState('');
  const [until, setUntil] = useState('');

  const handleExport = () => {
    if (!symbol) {
      toast.error('Please enter a symbol');
      return;
    }

    const url = api.exports.ticks({ symbol, since: since || undefined, until: until || undefined });
    
    // Create a temporary link and click it to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${symbol}_ticks.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export started');
  };

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-4">
        <FileDown className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Export Data</span>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="stat-label">Symbol</Label>
          <Input
            placeholder="e.g., btcusdt"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="mt-1 font-mono uppercase text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="stat-label">Since (optional)</Label>
            <Input
              type="datetime-local"
              value={since}
              onChange={(e) => setSince(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="stat-label">Until (optional)</Label>
            <Input
              type="datetime-local"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              className="mt-1 text-sm"
            />
          </div>
        </div>

        <Button 
          onClick={handleExport} 
          className="w-full"
          disabled={!symbol}
        >
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </div>
    </div>
  );
}
