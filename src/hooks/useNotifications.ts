import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage } from '@/lib/firebase';
import { toast } from 'sonner';

const VAPID_KEY = 'BKagOny0KF_2pCJQ3m_RFmHkPBgcKmYNOWUaR5euV8HcBU1AdRSSfKRhbPEg4pcPM5wGUROZa4FX9V0tkcAXfJQ';

export function useNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notificationsEnabled') === 'true';
  });
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (!messaging) return;

    const setupNotifications = async () => {
      try {
        // Request permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted' && notificationsEnabled) {
          // Get FCM token
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY
          });
          
          if (token) {
            setFcmToken(token);
            console.log('FCM Token:', token);
            
            // Save token to Firebase or your backend
            // This token should be sent to your server to send notifications
          }
        } else if (permission === 'denied') {
          toast.error('Notifications blocked', {
            description: 'Please enable notifications in your browser settings'
          });
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    if (notificationsEnabled) {
      setupNotifications();
    }

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Show notification even when app is in foreground
      if (payload.notification) {
        const { title, body, icon } = payload.notification;
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(title || 'Beehive Alert', {
            body: body || 'Check your beehive monitor',
            icon: icon || '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'beehive-alert',
            requireInteraction: true
          });
        }
        
        // Also show toast
        toast.error(title || 'Beehive Alert', {
          description: body || 'Check your beehive monitor'
        });
        
        // Play alert sound
        const audio = new Audio('/alert.mp3');
        audio.play().catch(console.error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [notificationsEnabled]);

  const toggleNotifications = async () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem('notificationsEnabled', String(newState));
    
    if (newState) {
      // Request permission when enabling
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotificationsEnabled(false);
        localStorage.setItem('notificationsEnabled', 'false');
        toast.error('Permission denied', {
          description: 'Please enable notifications in your browser settings'
        });
      } else {
        toast.success('Notifications enabled');
      }
    } else {
      toast.info('Notifications disabled');
    }
  };

  return {
    notificationsEnabled,
    toggleNotifications,
    fcmToken
  };
}