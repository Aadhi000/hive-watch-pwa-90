// SensorCard.tsx
import { useState } from 'react';
import { Thermometer, Droplets, Wind, TrendingUp, TrendingDown, Minus, Bug } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '@/hooks/useTheme';
import { getChartOptions, getChartData } from '@/lib/chartConfig';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SensorCardProps {
  type: 'temperature' | 'humidity' | 'airpurity' | 'movement';
  value: number | string; // Updated to accept a string
  unit: string;
  historicalData: { timestamp: string; value: number }[];
}

const sensorConfig = {
  temperature: {
    icon: Thermometer,
    color: 'temp',
    chartColor: '#fbbf24',
    label: 'Temperature',
    normalRange: { min: 18, max: 30 }
  },
  humidity: {
    icon: Droplets,
    color: 'humidity',
    chartColor: '#06b6d4',
    label: 'Humidity',
    normalRange: { min: 60, max: 100 }
  },
  airpurity: {
    icon: Wind,
    color: 'air',
    chartColor: '#10b981',
    label: 'Air Quality',
    normalRange: { min: 60, max: 100 }
  },
  movement: {
    icon: Bug,
    color: 'success', 
    chartColor: '#22c55e',
    label: 'Bee Movement',
    normalRange: { min: 0, max: 1 }
  }
};

type TimeRange = 'live' | '1h' | '24h' | '7d' | '15d' | '30d';

export function SensorCard({ type, value, unit, historicalData }: SensorCardProps) {
  const [showChart, setShowChart] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const config = sensorConfig[type];
  const Icon = config.icon;
  
  const isMovement = type === 'movement';
  
  // Updated logic to handle the new string value for movement
  const displayValue = isMovement 
    ? (value === "Movement Detected" ? 'Detected' : 'Not Detected') 
    : (value != null ? (value as number).toFixed(1) : '---');

  // isAbnormal check is unchanged as it correctly excludes movement
  const isAbnormal = !isMovement && (value != null && ((value as number) < config.normalRange.min ||  
    (config.normalRange.max < 100 && (value as number) > config.normalRange.max)));
  
  const trend = !isMovement && value != null && historicalData.length > 1 && historicalData[historicalData.length - 2]?.value != null 
    ? (value as number) - historicalData[historicalData.length - 2].value  
    : 0;

  const filterDataByRange = () => {
    const now = new Date();
    let filteredData = [...historicalData];
    
    switch (timeRange) {
      case 'live':
        filteredData = historicalData.slice(-20);
        break;
      case '1h':
        filteredData = historicalData.filter(d => {
          const date = new Date(d.timestamp);
          return now.getTime() - date.getTime() <= 60 * 60 * 1000;
        });
        break;
      case '24h':
        filteredData = historicalData.filter(d => {
          const date = new Date(d.timestamp);
          return now.getTime() - date.getTime() <= 24 * 60 * 60 * 1000;
        });
        break;
      case '7d':
        filteredData = historicalData.filter(d => {
          const date = new Date(d.timestamp);
          return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
        });
        break;
      case '15d':
        filteredData = historicalData.filter(d => {
          const date = new Date(d.timestamp);
          return now.getTime() - date.getTime() <= 15 * 24 * 60 * 60 * 1000;
        });
        break;
      case '30d':
        filteredData = historicalData.filter(d => {
          const date = new Date(d.timestamp);
          return now.getTime() - date.getTime() <= 30 * 24 * 60 * 60 * 1000;
        });
        break;
    }
    
    return filteredData;
  };

  const chartData = filterDataByRange();
  
  // These are the raw timestamps used for the tooltip
  const timestamps = chartData.map(d => d.timestamp);
  // These are the formatted labels for the chart's x-axis
  const labels = timestamps.map((d, index) => formatTimestamp(d, timeRange, index, chartData.length));
  const values = chartData.map(d => d.value);

  return (
    <div className="space-y-4 animate-fade-in">
      <div
        onClick={() => !isMovement && setShowChart(!showChart)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative p-6 rounded-2xl cursor-pointer",
          "transform transition-all duration-500 ease-out",
          "shadow-smooth hover:shadow-hover",
          "bg-card border-2",
          isAbnormal ? "border-danger animate-pulse-danger" : "border-border/50 hover:border-primary/30",
          "group",
          isHovered && "scale-[1.02] -translate-y-1"
        )}
      >
        {isAbnormal && (
          <div className="absolute -top-3 -right-3 bg-gradient-danger text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold animate-bounce-slow shadow-glow">
            ALERT
          </div>
        )}
        
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl transition-all duration-500",
            type === 'temperature' && "bg-gradient-to-br from-orange-400/20 to-red-400/20",
            type === 'humidity' && "bg-gradient-to-br from-blue-400/20 to-cyan-400/20",
            type === 'airpurity' && "bg-gradient-to-br from-green-400/20 to-emerald-400/20",
            // Updated color logic for movement
            type === 'movement' && (value === "Movement Detected" ? "bg-gradient-to-br from-green-400/20 to-lime-400/20" : "bg-gradient-to-br from-red-400/20 to-rose-400/20"),
            "group-hover:scale-110 group-hover:rotate-3"
          )}>
            <Icon className={cn(
              "w-6 h-6 transition-colors duration-300",
              type === 'temperature' && "text-temp",
              type === 'humidity' && "text-humidity",
              type === 'airpurity' && "text-air",
              // Updated color logic for movement
              type === 'movement' && (value === "Movement Detected" ? "text-success" : "text-danger")
            )} />
          </div>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground transition-all duration-300 hover:scale-105">
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4 text-success animate-fade-in" />
            ) : trend < 0 ? (
              <TrendingDown className="w-4 h-4 text-danger animate-fade-in" />
            ) : (
              <Minus className="w-4 h-4 animate-fade-in" />
            )}
            <span className="font-medium">{Math.abs(trend || 0).toFixed(1)}</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">
              {displayValue}
            </span>
            <span className="text-lg text-muted-foreground">{unit}</span>
          </div>
          
          {!isMovement && (
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  isAbnormal ? "bg-gradient-danger" : `bg-${config.color}`
                )}
                style={{ width: `${Math.min(100, Math.max(0, (value as number) || 0))}%` }}
              />
            </div>
          )}
        </div>
      </div>
      
      {showChart && !isMovement && (
        <div className="p-6 rounded-2xl shadow-neumorphic bg-card animate-fade-in">
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['live', '1h', '24h', '7d', '15d', '30d'] as TimeRange[]).map(range => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="uppercase"
              >
                {range}
              </Button>
            ))}
          </div>
          
          <div className="h-64">
            <Line 
              data={getChartData(labels, values as number[], config.chartColor, isDark, unit)}
              options={getChartOptions(`${config.label} History`, isDark, timestamps, unit)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const formatTimestamp = (timestamp: string, range: TimeRange, index: number, totalLength: number) => {
  const date = new Date(timestamp);
  
  switch (range) {
    case 'live':
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    case '1h':
      if (index % Math.max(1, Math.floor(totalLength / 6)) === 0) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      }
      return '';
    case '24h':
      if (index % Math.max(1, Math.floor(totalLength / 8)) === 0) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      }
      return '';
    case '7d':
      if (index % Math.max(1, Math.floor(totalLength / 7)) === 0) {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      }
      return '';
    case '15d':
      if (index % Math.max(1, Math.floor(totalLength / 5)) === 0) {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
      return '';
    case '30d':
      if (index % Math.max(1, Math.floor(totalLength / 4)) === 0) {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
      return '';
    default:
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
  }
};
