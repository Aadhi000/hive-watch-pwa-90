import { Circle, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  isOnline: boolean;
  lastSeen: Date | null;
}

export function StatusIndicator({ isOnline, lastSeen }: StatusIndicatorProps) {
  const formatLastSeen = () => {
    if (!lastSeen) return 'Never';
    
    const diff = Date.now() - lastSeen.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return lastSeen.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl shadow-neumorphic bg-card">
      <div className="relative">
        <Circle 
          className={cn(
            "w-3 h-3 fill-current",
            isOnline ? "text-success" : "text-danger"
          )}
        />
        {isOnline && (
          <Circle 
            className="absolute top-0 left-0 w-3 h-3 text-success animate-ping"
          />
        )}
      </div>
      
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        <span className="text-xs text-muted-foreground">
          Last seen: {formatLastSeen()}
        </span>
      </div>
    </div>
  );
}