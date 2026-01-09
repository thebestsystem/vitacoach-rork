import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyAagwNPIu2RYyFZwKDwbdpNHEnDuzwnEh0",
  authDomain: "vitacoach-85a22.firebaseapp.com",
  projectId: "vitacoach-85a22",
  storageBucket: "vitacoach-85a22.firebasestorage.app",
  messagingSenderId: "744834489008",
  appId: "1:744834489008:web:21e1f2cef266ddd79db975",
  measurementId: "G-HJDKCT4VX9"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let initError: Error | null = null;

try {
  
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  console.log('Firebase app initialized successfully');

  if (Platform.OS === 'web') {
    auth = getAuth(app);
    console.log('Firebase auth initialized for web');
  } else {
    try {
      const { getReactNativePersistence } = require('firebase/auth');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      try {
        auth = getAuth(app);
        console.log('Firebase auth retrieved');
      } catch {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
        console.log('Firebase auth initialized with persistence');
      }
    } catch (persistenceError) {
      console.error('Firebase persistence initialization error:', persistenceError);
      auth = getAuth(app);
      console.log('Firebase auth initialized without persistence');
    }
  }

  db = getFirestore(app);
  console.log('Firestore initialized successfully');
} catch (error) {
  console.error('Critical Firebase initialization error:', error);
  initError = error instanceof Error ? error : new Error('Unknown Firebase initialization error');
  
  throw initError;
}

export { app, auth, db, initError };
