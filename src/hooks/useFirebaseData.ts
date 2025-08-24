//useFirebaseData.ts
import { useEffect, useState } from 'react';
import { database, ref, onValue, get, child, set } from '@/lib/firebase';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
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

const showBrowserNotification = (data: SensorData) => {
  // Only show a system notification if permission is already granted.
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.warn("Notification permission not granted. Falling back to toast.");
    return;
  }

  // Create and display the notification.
  new Notification("Beehive Alert 🚨", {
    body: `Temp: ${data.temperature}°C | Hum: ${data.humidity}% | Air: ${data.air_quality}%`,
    icon: "/icon-192.png",
    tag: "beehive-alert",
    requireInteraction: true,
  });
};

export function useFirebaseData() {
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData>({});
  const [isOnline, setIsOnline] = useState(true);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // --- FCM setup ---
  async function registerFCM() {
    try {
      const messaging = getMessaging();

      // Request notification permission once.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error("Notifications blocked", {
          description: "Enable notifications in your browser settings to receive alerts"
        });
        return false;
      }

      const token = await getToken(messaging, {
        vapidKey: 'BBRchB8hfF-ulW2Lyu2PXfPuqOhMENLI5qLo-L5PvJwK5OEIzSOwB9RWDSJxfh7yWreHIhvxeqGkpydBPbKqT3w'
      });

      if (!token) {
        console.warn("⚠️ No FCM token retrieved. Check VAPID key / Firebase config.");
        return false;
      }

      // Save token in localStorage and DB.
      localStorage.setItem('fcmToken', token);
      await set(ref(database, `fcmTokens/${token.slice(0, 10)}`), token);
      console.log('✅ FCM Token saved:', token);

      return true;
    } catch (err) {
      console.error("❌ Error registering FCM:", err);
      toast.error("Notification Error", {
        description: "Could not register for push notifications"
      });
      return false;
    }
  }

  useEffect(() => {
    registerFCM(); // Request token once on mount.

    // Listen for messages while the app is in the foreground.
    const messaging = getMessaging();
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      const title = payload.notification?.title || 'Beehive Alert 🚨';
      const body = payload.notification?.body || payload.data?.message || 'Check your hive conditions';

      // Show a toast for in-app notifications.
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
    let lastHistoricalUpdate = Date.now();

    const unsubscribeCurrent = onValue(
      currentRef,
      async (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setCurrentData(data);
          setIsOnline(true);
          setLastSeen(new Date());

          const now = Date.now();
          if (now - lastHistoricalUpdate >= 60000) {
            const timestamp = data.last_time || new Date().toISOString();
            setHistoricalData((prev) => ({
              ...prev,
              [timestamp]: data,
            }));
            lastHistoricalUpdate = now;
          }

          const isAbnormal =
            data.temperature < 18 ||
            data.temperature > 30 ||
            data.humidity < 60 ||
            data.air_quality < 60;

          if (isAbnormal) {
            console.warn('⚠️ Abnormal condition detected');
            // Show toast for immediate feedback.
            toast.warning('Beehive Alert 🚨', {
              description: `Temp: ${data.temperature}°C | Hum: ${data.humidity}% | Air: ${data.air_quality}%`
            });
            
            // Show a system notification for in-site alerts.
            showBrowserNotification(data);
          }
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
  }, [lastSeen]);

  return {
    currentData,
    historicalData,
    isOnline,
    lastSeen,
    loading,
  };
}

export const isDeviceRegistered = async () => {
  try {
    if (!('Notification' in window)) {
      return false;
    }
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }
    const fcmToken = localStorage.getItem('fcmToken');
    if (!fcmToken) {
      return false;
    }
    if (Notification.permission !== 'granted') {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error checking device registration:', error);
    return false;
  }
}