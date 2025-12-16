import { ConnectionStatus } from './ConnectionStatus';
import { Gem, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Gem className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">GemsCap</h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Quant Analytics Platform by Pruthavik</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ConnectionStatus />
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href="https://github.com/Pruthavik01/Gemscap-backend" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
