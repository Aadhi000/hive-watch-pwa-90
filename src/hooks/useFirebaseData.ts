// useFirebaseData.ts
import { useEffect, useState, useRef } from 'react';
import { database, ref, onValue, get, child, set } from '@/lib/firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { toast } from 'sonner';

export interface SensorData {
  temperature: number;
  humidity: number;
  air_quality: number;
  last_time: string;
  movement: boolean;
}

export interface HistoricalData {
  [key: string]: SensorData;
}

export function useFirebaseData() {
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData>({});
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isAbnormalDetected, setIsAbnormalDetected] = useState(false);

  const lastHistoricalUpdateRef = useRef(Date.now());

  // --- FCM setup ---
  const registerFCM = async () => {
    try {
      const messaging = getMessaging();

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error("Notifications blocked", {
          description: "Enable notifications in your browser settings to receive alerts"
        });
        return;
      }

      const token = await getToken(messaging, {
        vapidKey: 'BBRchB8hfF-ulW2Lyu2PXfPuqOhMENLI5qLo-L5PvJwK5OEIzSOwB9RWDSJxfh7yWreHIhvxeqGkpydBPbKqT3w'
      });

      if (!token) {
        console.warn("⚠️ No FCM token retrieved. Check VAPID key / Firebase config.");
        return;
      }

      const tokenKey = token.replace(/[.#$/[\]]/g, '_');
      await set(ref(database, `fcmTokens/${tokenKey}`), token);
      console.log('✅ FCM Token saved:', token);

    } catch (err) {
      console.error("❌ Error registering FCM:", err);
      toast.error("Notification Error", {
        description: "Could not register for push notifications"
      });
    }
  };

  useEffect(() => {
    registerFCM();

    const messaging = getMessaging();
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      const title = payload.notification?.title || 'Beehive Alert 🚨';
      const body = payload.notification?.body || payload.data?.body || 'Check your hive conditions';

      toast(title, {
        description: body,
        icon: '🚨'
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const currentRef = ref(database, 'beehive');

    const unsubscribeCurrent = onValue(
      currentRef,
      async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setCurrentData(data);
          
          const now = Date.now();
          const lastUpdateTime = new Date(data.last_time).getTime();
          
          // Check if last update was within the last 5 minutes (300,000 milliseconds)
          if (now - lastUpdateTime < 60000) {
            setIsOnline(true);
          } else {
            setIsOnline(false);
          }

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

    // The statusInterval and lastSeen states are now unnecessary.
    // The online/offline status is handled directly by comparing the
    // current time with the last_time from the data.

    return () => {
      unsubscribeCurrent();
    };
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    const sendNotificationAndToast = async () => {
      console.warn('⚠️ Abnormal condition detected');
      try {
        await fetch('http://localhost:3001/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sensorData: currentData })
        });
        console.log('✅ API call for notification sent.');
      } catch (apiError) {
        console.error('❌ Failed to call API route:', apiError);
      }
      
      const title = 'Beehive Alert 🚨';
      const body = 'Abnormal sensor values detected';
      toast(title, {
        description: body,
        icon: '🚨'
      });
    };
    
    if (isAbnormalDetected && currentData) {
      // Send immediately when condition is first met, then start interval
      sendNotificationAndToast();
      intervalId = setInterval(sendNotificationAndToast, 5000);
    }

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
    loading,
  };
}

export const isDeviceRegistered = async () => {
  try {
    if (!('Notification' in window)) return false;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const fcmToken = localStorage.getItem('fcmToken');
    if (!fcmToken) return false;
    if (Notification.permission !== 'granted') return false;
    return true;
  } catch (error) {
    console.error('Error checking device registration:', error);
    return false;
  }
};