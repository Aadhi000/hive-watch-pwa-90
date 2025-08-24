import { Moon, Sun, Bell, BellOff } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Custom BEE Logo Component
function BeeLogo({ className }: { className?: string }) {
  return (
    <img src="/favicon.png" alt="Bee Logo" className={cn("w-12 h-12 rounded-xl", className)} />
  );
}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Honeycomb Pattern Background */}
      <defs>
        <pattern id="honeycomb" x="0" y="0" width="20" height="17.32" patternUnits="userSpaceOnUse">
          <polygon points="10,0 20,5 20,12.32 10,17.32 0,12.32 0,5" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#honeycomb)" />
      
      {/* Bee Body - Hexagon */}
      <polygon 
        points="50,20 70,35 70,55 50,70 30,55 30,35" 
        fill="hsl(var(--primary))"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
      />
      
      {/* Bee Wings */}
      <ellipse cx="25" cy="40" rx="15" ry="25" fill="hsl(var(--accent))" fillOpacity="0.8" transform="rotate(-20 25 40)"/>
      <ellipse cx="75" cy="40" rx="15" ry="25" fill="hsl(var(--accent))" fillOpacity="0.8" transform="rotate(20 75 40)"/>
      
      {/* Bee Stripes */}
      <rect x="30" y="38" width="40" height="4" fill="hsl(var(--honey))"/>
      <rect x="30" y="48" width="40" height="4" fill="hsl(var(--honey))"/>
      
      {/* Bee Eyes */}
      <circle cx="42" cy="32" r="3" fill="white"/>
      <circle cx="58" cy="32" r="3" fill="white"/>
      <circle cx="42" cy="32" r="2" fill="black"/>
      <circle cx="58" cy="32" r="2" fill="black"/>
      
      {/* Antennae */}
      <line x1="45" y1="25" x2="40" y2="15" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
      <line x1="55" y1="25" x2="60" y2="15" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="40" cy="15" r="2" fill="hsl(var(--primary))"/>
      <circle cx="60" cy="15" r="2" fill="hsl(var(--primary))"/>
    </svg>
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