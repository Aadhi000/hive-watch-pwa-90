import { useFirebaseData } from '@/hooks/useFirebaseData';
import { SensorCard } from '@/components/SensorCard';
import { StatusIndicator } from '@/components/StatusIndicator';
import { Loader2 } from 'lucide-react';

export function Dashboard() {
  const { currentData, historicalData, isOnline, lastSeen, loading } = useFirebaseData();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-honey rounded-full blur-2xl opacity-30 animate-glow"></div>
          <Loader2 className="relative w-12 h-12 animate-spin text-honey" />
        </div>
      </div>
    );
  }

  if (!currentData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
        <div className="text-center space-y-4 p-8 bg-card/50 rounded-2xl backdrop-blur-sm">
          <p className="text-xl text-muted-foreground">No data available</p>
          <p className="text-sm text-muted-foreground animate-pulse">Waiting for sensor data...</p>
        </div>
      </div>
    );
  }

  // Transform historical data for charts
  const getHistoricalArray = (key: 'temperature' | 'humidity' | 'air_quality') => {
    return Object.entries(historicalData)
      .filter(([_, data]) => data && data[key] != null)
      .map(([timestamp, data]) => ({
        timestamp,
        value: data[key]
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Status Bar */}
      <div className="flex justify-end animate-slide-up">
        <StatusIndicator isOnline={isOnline} lastSeen={lastSeen} />
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <SensorCard
            type="temperature"
            value={currentData.temperature ?? 0}
            unit="°C"
            historicalData={getHistoricalArray('temperature')}
          />
        </div>
        
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <SensorCard
            type="humidity"
            value={currentData.humidity ?? 0}
            unit="%"
            historicalData={getHistoricalArray('humidity')}
          />
        </div>
        
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <SensorCard
            type="airpurity"
            value={currentData.air_quality ?? 0}
            unit="%"
            historicalData={getHistoricalArray('air_quality')}
          />
        </div>
      </div>

      {/* Last Update */}
      <div className="text-center text-sm text-muted-foreground animate-fade-in mt-8 p-4 bg-card/50 rounded-xl backdrop-blur-sm">
        <span className="font-medium">Last updated:</span>
        <span className="ml-2 text-foreground">
          {currentData.last_time ? new Date(currentData.last_time).toLocaleString() : 'N/A'}
        </span>
      </div>
    </div>
  );
}