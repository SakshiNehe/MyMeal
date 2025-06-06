import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALQBBJsLovyIsqBTuhnYqPInqfihiVgMM",
  authDomain: "nutrinest-d74dd.firebaseapp.com",
  projectId: "nutrinest-d74dd",
  storageBucket: "nutrinest-d74dd.appspot.com",
  messagingSenderId: "19881105211",
  appId: "1:19881105211:web:c7627cf1fce50462a9c91e",
  measurementId: "G-FZHHVSN7ZW"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with persistence
const auth = Platform.OS === 'web' 
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics if supported (web only)
if (Platform.OS === 'web') {
  isSupported().then(supported => {
    if (supported) {
      getAnalytics(app);
    }
  });
}

// Export initialized instances
export { auth, db };
export default app; 