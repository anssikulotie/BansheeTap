import React, { createContext, useState, useContext, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import Firebase from './Firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AutoUploadContext = createContext();

export const useAutoUpload = () => {
  return useContext(AutoUploadContext);
}

export const AutoUploadProvider = ({ children }) => {
  const [isAutoUploadEnabled, setIsAutoUploadEnabledState] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    // Fetch the auto-upload state from AsyncStorage when the context is initialized
    const fetchAutoUploadState = async () => {
      const value = await AsyncStorage.getItem('auto_upload_state');
      setIsAutoUploadEnabledState(value === 'true');
    };

    fetchAutoUploadState();
  }, []);

  const setIsAutoUploadEnabled = async (value) => {
    // Save the state to AsyncStorage whenever it changes
    await AsyncStorage.setItem('auto_upload_state', value.toString());
    setIsAutoUploadEnabledState(value);
  };

  const uploadLogFileHandler = async () => {
    const logFilePath = `${FileSystem.documentDirectory}${deviceId}_touch_event_log.csv`;
    try {
      await Firebase.uploadLogFile(logFilePath);
      console.log("Log file uploaded successfully!");
    } catch (error) {
      console.error("Error uploading log file:", error);
    }
  };

  useEffect(() => {
    let uploadInterval;
  
    if (isAutoUploadEnabled && logFileExists) {  // Note: You'll need to define or pass `logFileExists`
      uploadInterval = setInterval(() => {
        uploadLogFileHandler();
      }, 1 * 60 * 1000); // 10 minutes * 60 seconds * 1000 milliseconds
    }
  
    return () => {
      clearInterval(uploadInterval); 
    };
  }, [isAutoUploadEnabled, deviceId]);

  return (
    <AutoUploadContext.Provider value={{ isAutoUploadEnabled, setIsAutoUploadEnabled, setDeviceId }}>
      {children}
    </AutoUploadContext.Provider>
  );
}
