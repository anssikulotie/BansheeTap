//import necessary packages
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
// Define the SettingsScreen component
export default function SettingsScreen() {
  // Define the path to the log file
  const logFilePath = FileSystem.documentDirectory + "touch_event_log.csv";
// Define the function that will share the log file
  const shareLogFile = async () => {
    const fileInfo = await FileSystem.getInfoAsync(logFilePath);
  // Check if the log file exists
    if (!fileInfo.exists) {
      alert("No log file found!");
      return;
    }
  // Check if sharing is available on the device
    if (!(await Sharing.isAvailableAsync())) {
      alert(`Sharing isn't available on your platform`);
      return;
    }
  
    try {
      await Sharing.shareAsync(logFilePath);
    } catch (error) {
      // Error sharing the log file
      alert("An error occurred while sharing the log file.");
      console.error(error);
    }
  };
// Define the function that will delete the log file
  const deleteLogFile = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(logFilePath);
      // Check if the log file exists
      if (!fileInfo.exists) {
        // Log file doesn't exist
        alert("No log file found!");
        return;
      }
  // Delete the log file
      await FileSystem.deleteAsync(logFilePath);
      alert("Log file deleted successfully!");
  
    } catch (error) {
      // Error deleting the log file
      alert("Error occurred:", error);
    }
  };
// Return the JSX for the SettingsScreen component
  return (
    <View style={styles.container}>
      <Text style={styles.logOptionsText}>Log options</Text>
      <TouchableOpacity style={styles.button} onPress={shareLogFile}>
        <Text style={styles.buttonText}>Export Log File</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={deleteLogFile}>
        <Text style={styles.buttonText}>Delete Log File</Text>
      </TouchableOpacity>
    </View>
);

}
// Define the styles for the SettingsScreen component
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
  },
  logOptionsText: {
    fontSize: 24,  
    fontWeight: 'bold',  
}
});
