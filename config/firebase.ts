import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const getFirebaseConfig = () => {
  const isWeb = Platform.OS === 'web';
  
  if (isWeb) {
    return {
      apiKey: "AIzaSyCvUy3CIpwaUqtz2IDKCRUEmQG-RXPraIc",
      authDomain: "wellness-ai-coach-rork.firebaseapp.com",
      projectId: "wellness-ai-coach-rork",
      storageBucket: "wellness-ai-coach-rork.firebasestorage.app",
      messagingSenderId: "590551382301",
      appId: "1:590551382301:web:287ed2c79dedd9936989f4",
      measurementId: "G-2F8WCZB2G3"
    };
  }
  
  return {
    apiKey: Platform.select({
      ios: "AIzaSyA9wNo0bK1MOVfo9qt5AgLMYPGSkip_sZE",
      android: "AIzaSyA9t6h4dulvhYf5OmaFa3CHSz2x5R6ny_o",
      default: "AIzaSyCvUy3CIpwaUqtz2IDKCRUEmQG-RXPraIc",
    }),
    authDomain: "wellness-ai-coach-rork.firebaseapp.com",
    projectId: "wellness-ai-coach-rork",
    storageBucket: "wellness-ai-coach-rork.firebasestorage.app",
    messagingSenderId: "590551382301",
    appId: Platform.select({
      ios: "1:590551382301:ios:5eaa88c0200a37886989f4",
      android: "1:590551382301:android:682cc947ac0274666989f4",
      default: "AIzaSyCvUy3CIpwaUqtz2IDKCRUEmQG-RXPraIc",
    }),
  };
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let initError: Error | null = null;

try {
  const firebaseConfig = getFirebaseConfig();
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
      } catch (e) {
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
