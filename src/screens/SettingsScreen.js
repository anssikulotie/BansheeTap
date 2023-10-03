import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function SettingsScreen() {
  
  const logFilePath = FileSystem.documentDirectory + "ghost_touch_log.csv";

  const shareLogFile = async () => {
    const fileInfo = await FileSystem.getInfoAsync(logFilePath);
  
    if (!fileInfo.exists) {
      alert("No log file found!");
      return;
    }
  
    if (!(await Sharing.isAvailableAsync())) {
      alert(`Uh oh, sharing isn't available on your platform`);
      return;
    }
  
    try {
      await Sharing.shareAsync(logFilePath);
    } catch (error) {
      alert("An error occurred while sharing the log file.");
      console.error(error);
    }
  };

  const deleteLogFile = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(logFilePath);
      
      if (!fileInfo.exists) {
        alert("No log file found!");
        return;
      }
  
      await FileSystem.deleteAsync(logFilePath);
      alert("Log file deleted successfully!");
  
    } catch (error) {
      alert("Error occurred:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Settings</Text>
      <TouchableOpacity style={styles.button} onPress={shareLogFile}>
        <Text style={styles.buttonText}>Export Log File</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={deleteLogFile}>
        <Text style={styles.buttonText}>Delete Log File</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: "#335BFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
