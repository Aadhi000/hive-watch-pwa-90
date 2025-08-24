import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage } from '@/lib/firebase';
import { toast } from 'sonner';

// ✅ Your Firebase Web Push Certificate Key (Public VAPID Key)
const VAPID_KEY = 'HvNg-KsFy9jorhmTVYw-3vOZZdneUH-e-z8NhwYlPFg';

export function useNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') === 'true';
  });
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!messaging) return;

    const setupNotifications = async () => {
      try {
        // Ask for browser notification permission
        const permission = await Notification.requestPermission();

        if (permission === 'granted' && notificationsEnabled) {
          // Get FCM token using your VAPID key
          const token = await getToken(messaging, { vapidKey: VAPID_KEY });
          setFcmToken(token);

          // Foreground message handler
          onMessage(messaging, (payload) => {
            console.log('Message received: ', payload);

            // In-app toast (existing)
            if (payload.notification?.title) {
              toast(`${payload.notification.title}: ${payload.notification.body}`);
            }

            // 👉 New: Real system notification
            if (Notification.permission === "granted") {
              new Notification(payload.notification?.title || "Hive Watch", {
                body: payload.notification?.body || "",
                icon: "/icons/alert.png" // make sure you have this icon in /public/icons/
              });
            }
          });
        }
      } catch (err) {
        console.error("Notification setup failed:", err);
      }
    };

    setupNotifications();
  }, [notificationsEnabled]);

  return { notificationsEnabled, setNotificationsEnabled, fcmToken };
}
