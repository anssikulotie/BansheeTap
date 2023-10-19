import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import Constants from 'expo-constants';
import { getApps } from "firebase/app";
import * as FileSystem from 'expo-file-system';
global.Blob = global.Blob || require('node-fetch').Blob;

// Firebase Configuration (from app.json extra field)
const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.apiKey,
  authDomain: Constants.expoConfig.extra.authDomain,
  projectId: Constants.expoConfig.extra.projectId,
  storageBucket: Constants.expoConfig.extra.storageBucket,
  messagingSenderId: Constants.expoConfig.extra.messagingSenderId,
  appId: Constants.expoConfig.extra.appId,
  measurementId: Constants.expoConfig.extra.measurementId
};

// Initialize Firebase (if not already initialized)
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const storage = getStorage();

export const uploadLogFile = async (localFilePath) => {
    // Extract the filename from the local path
    const filename = localFilePath.split('/').pop();
    const storageRef = ref(storage, `logs/${filename}`);
    
    // Read the file from the local filesystem
    const fileData = await FileSystem.readAsStringAsync(localFilePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  
    try {
      const snapshot = await uploadBytes(storageRef, new Blob([fileData]));
      return snapshot;
    } catch (error) {
      console.error("Failed to upload log file:", error);
      throw error;
    }
  }
  
  export default {
    uploadLogFile
  };
