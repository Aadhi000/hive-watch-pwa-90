import { Moon, Sun, Bell, BellOff } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Custom BEE Logo Component
function BeeLogo({ className }: { className?: string }) {
  return (
    <img src="/lovable-uploads/83ddb07f-5078-4b20-a46e-605de4f57d65.png" alt="BEE Logo" className={cn("w-12 h-12", className)} />
  );
}

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { notificationsEnabled, toggleNotifications } = useNotifications();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/95 border-b border-border transition-all duration-500">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-honey rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative p-2 rounded-2xl bg-gradient-honey shadow-hover transform transition-all duration-500 hover:scale-110 hover:rotate-3">
                <BeeLogo className="text-primary-foreground" />
              </div>
            </div>
            <div className="transform transition-all duration-300 hover:translate-x-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BEE Monitor
              </h1>
              <p className="text-sm text-muted-foreground animate-fade-in">
                Real-time Beehive Monitoring System
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNotifications}
              className={cn(
                "relative transform transition-all duration-300 hover:scale-110",
                notificationsEnabled && "text-honey"
              )}
            >
              {notificationsEnabled ? (
                <Bell className="w-5 h-5 transition-transform duration-300" />
              ) : (
                <BellOff className="w-5 h-5 transition-transform duration-300" />
              )}
              {notificationsEnabled && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative transform transition-all duration-300 hover:scale-110 hover:rotate-180"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}