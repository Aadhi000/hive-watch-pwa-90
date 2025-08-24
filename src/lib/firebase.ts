import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, child } from 'firebase/database';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyD4M_ZOMqR9MtSkbgH2SQQvj2QSAFKLOhU",
  authDomain: "beehive-d31e3.firebaseapp.com",
  databaseURL: "https://beehive-d31e3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "beehive-d31e3",
  storageBucket: "beehive-d31e3.firebasestorage.app",
  messagingSenderId: "412298384436",
  appId: "1:412298384436:web:469569b024f27482456661",
  measurementId: "G-P6FF4EJC3K"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const messaging = typeof window !== 'undefined' && 'Notification' in window ? getMessaging(app) : null;

export { ref, onValue, set, get, child, getToken, onMessage };