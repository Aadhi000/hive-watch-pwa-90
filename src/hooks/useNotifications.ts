import { useEffect, useState } from 'react';
import { database, ref, onValue, get, child } from '@/lib/firebase';
import { toast } from 'sonner';

export interface SensorData {
  temperature: number;
  humidity: number;
  air_quality: number;  // Changed from airpurity to air_quality
  last_time: string;    // Changed from timestamp to last_time
}

export interface HistoricalData {
  [key: string]: SensorData;
}

export function useFirebaseData() {
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData>({});
  const [isOnline, setIsOnline] = useState(true);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to current data
    const currentRef = ref(database, 'beehive');
    let lastHistoricalUpdate = Date.now();
    
    const unsubscribeCurrent = onValue(currentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentData(data);
        setIsOnline(true);
        setLastSeen(new Date());
        
        // Update historical data only every minute
        const now = Date.now();
        if (now - lastHistoricalUpdate >= 60000) { // 1 minute = 60000ms
          const timestamp = data.last_time || new Date().toISOString();
          setHistoricalData(prev => ({
            ...prev,
            [timestamp]: data
          }));
          lastHistoricalUpdate = now;
        }
        
        // Check for abnormal values
        const isAbnormal = 
          data.temperature < 18 || data.temperature > 30 ||
          data.humidity < 60 ||
          data.air_quality < 60;  // Changed from airpurity to air_quality
          
        if (isAbnormal) {
          // Play alert sound
          const playAlert = async () => {
            try {
              const audio = new Audio('/alert.mp3');
              audio.volume = 0.5;
              await audio.play();
            } catch (error) {
              console.warn('Could not play alert sound:', error);
            }
          };
          
          playAlert();
          
          // Send actual browser notifications
          if (Notification.permission === 'granted') {
            let title = 'Beehive Alert 🚨';
            let body = '';
            
            if (data.temperature < 18 || data.temperature > 30) {
              title = `Temperature Alert: ${data.temperature}°C`;
              body = 'Temperature is outside safe range (18-30°C)';
            } else if (data.humidity < 60) {
              title = `Humidity Alert: ${data.humidity}%`;
              body = 'Humidity is below safe threshold (60%)';
            } else if (data.air_quality < 60) {
              title = `Air Quality Alert: ${data.air_quality}%`;
              body = 'Air quality is below safe threshold (60%)';
            }
            
            new Notification(title, {
              body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: 'beehive-alert',
              requireInteraction: true,
              silent: false
            });
          } else {
            // Fallback to toast if notifications not granted
            if (data.temperature < 18 || data.temperature > 30) {
              toast.error(`Temperature Alert: ${data.temperature}°C`, {
                description: 'Temperature is outside safe range (18-30°C)'
              });
            }
            if (data.humidity < 60) {
              toast.error(`Humidity Alert: ${data.humidity}%`, {
                description: 'Humidity is below safe threshold (60%)'
              });
            }
            if (data.air_quality < 60) {
              toast.error(`Air Quality Alert: ${data.air_quality}%`, {
                description: 'Air quality is below safe threshold (60%)'
              });
            }
          }
        }
      }
      setLoading(false);
    }, (error) => {
      console.error('Firebase connection error:', error);
      setIsOnline(false);
      setLoading(false);
      toast.error('Connection Error', {
        description: 'Unable to connect to Firebase'
      });
    });

    // Fetch historical data
    const fetchHistoricalData = async () => {
      try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, 'history'));
        if (snapshot.exists()) {
          setHistoricalData(snapshot.val());
        }
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchHistoricalData();

    // Check online status periodically
    const statusInterval = setInterval(() => {
      if (lastSeen && new Date().getTime() - lastSeen.getTime() > 60000) {
        setIsOnline(false);
      }
    }, 10000);

    return () => {
      unsubscribeCurrent();
      clearInterval(statusInterval);
    };
  }, [lastSeen]);

  return {
    currentData,
    historicalData,
    isOnline,
    lastSeen,
    loading
  };
}
