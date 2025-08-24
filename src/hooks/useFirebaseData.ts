// useFirebaseData.ts
import { useEffect, useState, useRef } from 'react';
import { database, ref, onValue, get, child } from '@/lib/firebase';
import { toast } from 'sonner';

export interface SensorData {
  temperature: number;
  humidity: number;
  air_quality: number;
  last_time: string;
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
  const [isAbnormalDetected, setIsAbnormalDetected] = useState(false);

  const lastHistoricalUpdateRef = useRef(Date.now());
  
  // This useEffect now only handles the Firebase data subscription.
  useEffect(() => {
    const currentRef = ref(database, 'beehive');

    const unsubscribeCurrent = onValue(
      currentRef,
      async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setCurrentData(data);
          setIsOnline(true);
          setLastSeen(new Date());

          const now = Date.now();
          if (now - lastHistoricalUpdateRef.current >= 60000) {
            const timestamp = data.last_time || new Date().toISOString();
            setHistoricalData((prev) => ({
              ...prev,
              [timestamp]: data,
            }));
            lastHistoricalUpdateRef.current = now;
          }

          const isAbnormal =
            data.temperature < 18 ||
            data.temperature > 30 ||
            data.humidity < 60 ||
            data.air_quality < 60;
          
          setIsAbnormalDetected(isAbnormal);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firebase error:', error);
        setIsOnline(false);
        setLoading(false);
        toast.error('Connection Error', {
          description: 'Unable to connect to Firebase',
        });
      }
    );

    const fetchHistoricalData = async () => {
      try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, 'history'));
        if (snapshot.exists()) {
          setHistoricalData(snapshot.val());
        }
      } catch (error) {
        console.error('Error fetching history:', error);
        toast.error("Data Error", {
          description: "Could not load historical data"
        });
      }
    };
    fetchHistoricalData();

    const statusInterval = setInterval(() => {
      if (lastSeen && new Date().getTime() - lastSeen.getTime() > 60000) {
        setIsOnline(false);
      }
    }, 10000);

    return () => {
      unsubscribeCurrent();
      clearInterval(statusInterval);
    };
  }, []);

  // This new useEffect handles only the continuous toast alerts.
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    // Function to generate and show the improved toast
    const showAbnormalToast = () => {
      let title = 'Beehive Alert 🚨';
      let body = 'Abnormal sensor values detected';
      
      if (currentData) {
        const abnormalConditions = [];
        if (currentData.temperature < 18 || currentData.temperature > 30) {
          abnormalConditions.push(`Temperature: ${currentData.temperature}°C`);
        }
        if (currentData.humidity < 60) {
          abnormalConditions.push(`Humidity: ${currentData.humidity}%`);
        }
        if (currentData.air_quality < 60) {
          abnormalConditions.push(`Air Quality: ${currentData.air_quality}%`);
        }
        body = abnormalConditions.join(', ') || body;
      }
      
      toast(title, {
        description: body,
        icon: '🚨',
      });
    };

    if (isAbnormalDetected && currentData) {
      // Show the first toast immediately
      showAbnormalToast();
      // Then set up an interval to show subsequent toasts every 5 seconds
      intervalId = setInterval(showAbnormalToast, 5000);
    }

    // Clean up the interval when the condition is no longer met or the component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAbnormalDetected, currentData]);

  return {
    currentData,
    historicalData,
    isOnline,
    lastSeen,
    loading,
  };
}

// This function is no longer needed but is left here for reference.
export const isDeviceRegistered = async () => {
  return false;
};