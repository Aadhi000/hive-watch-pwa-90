import { useState } from 'react';
import { Thermometer, Droplets, Wind, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '@/hooks/useTheme';
import { getChartOptions, getChartData } from '@/lib/chartConfig';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SensorCardProps {
  type: 'temperature' | 'humidity' | 'airpurity';
  value: number;
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
  
  const isAbnormal = value != null && (value < config.normalRange.min || 
    (config.normalRange.max < 100 && value > config.normalRange.max));
  
  const trend = value != null && historicalData.length > 1 && historicalData[historicalData.length - 2]?.value != null
    ? value - historicalData[historicalData.length - 2].value 
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
  
  // Format timestamps based on time range
  const formatTimestamp = (timestamp: string, range: TimeRange) => {
    const date = new Date(timestamp);
    
    switch (range) {
      case 'live':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      case '1h':
        // Show every 10 minutes
        const minutes = date.getMinutes();
        if (minutes % 10 === 0) {
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        }
        return '';
      case '24h':
        // Show every hour
        const hour = date.getHours();
        if (date.getMinutes() === 0) {
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
        }
        return '';
      case '7d':
        // Show every 6 hours
        if (date.getHours() % 6 === 0 && date.getMinutes() === 0) {
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit'
          });
        }
        return '';
      case '15d':
      case '30d':
        // Show daily
        if (date.getHours() === 0 && date.getMinutes() === 0) {
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
  
  const labels = chartData.map(d => formatTimestamp(d.timestamp, timeRange));
  const values = chartData.map(d => d.value);

  return (
    <div className="space-y-4 animate-fade-in">
      <div
        onClick={() => setShowChart(!showChart)}
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
            "group-hover:scale-110 group-hover:rotate-3"
          )}>
            <Icon className={cn(
              "w-6 h-6 transition-colors duration-300",
              type === 'temperature' && "text-temp",
              type === 'humidity' && "text-humidity",
              type === 'airpurity' && "text-air"
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
              {value != null ? value.toFixed(1) : '---'}
            </span>
            <span className="text-lg text-muted-foreground">{unit}</span>
          </div>
          
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                isAbnormal ? "bg-gradient-danger" : `bg-${config.color}`
              )}
              style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
            />
          </div>
        </div>
      </div>
      
      {showChart && (
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
              data={getChartData(labels, values, config.chartColor, isDark)}
              options={getChartOptions(`${config.label} History`, isDark)}
            />
          </div>
        </div>
      )}
    </div>
  );
}