import React from 'react';
import AppNavigator from './src/AppNavigator';
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import Constants from 'expo-constants';

const { apiKey: API_KEY, authDomain: AUTH_DOMAIN, projectId: PROJECT_ID, storageBucket: STORAGE_BUCKET, messagingSenderId: MESSAGING_SENDER_ID, appId: APP_ID, measurementId: MEASUREMENT_ID } = Constants.expoConfig.extra;

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID
};

console.log("API KEY:", API_KEY);
console.log("Project ID:", PROJECT_ID);

// Try initializing Firebase
try {
  initializeApp(firebaseConfig);
  getAnalytics();
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export default function App() {
  return <AppNavigator />;
}
