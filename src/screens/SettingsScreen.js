// import necessary modules
import React, { useState, useEffect} from 'react';
import {Alert, ScrollView, Button, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5 } from '@expo/vector-icons';


// Define the SettingsScreen component 
export default function SettingsScreen({ navigation, setMaintenanceMode }) {
  const [newDeviceId, setNewDeviceId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [logFileExists, setLogFileExists] = useState(false);
  const checkLogFileExists = async () => {
    const logFilePath = `${FileSystem.documentDirectory}${deviceId}_touch_event_log.csv`;
    const fileInfo = await FileSystem.getInfoAsync(logFilePath);

    // Update the logFileExists state
    setLogFileExists(fileInfo.exists);
};
// Check if the log file exists when the device ID changes
useEffect(() => {
  checkLogFileExists();
}, [deviceId]);

// Define the function that will save a new device ID to AsyncStorage and navigate back to the Home screen
  const handleSave = () => {
    // Check if there is already a device ID stored in AsyncStorage and if so, alert the user
    if (deviceId) {
      Alert.alert(
        'Device ID exists',
        'You must clear the current Device ID before saving a new one.',
        [{ text: 'OK' }]
      );
      return;
    }
  // Inform the user that the device ID will be saved and a new session will be started
    if (newDeviceId) {
      Alert.alert(
        'Save ID & Start New Session?', 
        'This will start a new session with the new Device ID. Previous data will be overwritten. Continue?', 
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'OK', 
            //Save the new device ID to AsyncStorage and navigate back to the Home screen
            onPress: async () => {
              try {
                await AsyncStorage.setItem('@device_id', newDeviceId);
                setDeviceId(newDeviceId);
                // Toggle off the maintenance mode before new session
                setMaintenanceMode(false); 
                navigation.navigate('Home', { newDeviceId });
              } catch (error) {
                console.error("Error saving Device ID to AsyncStorage:", error);
              }
            }
          }
        ]
      );
    }
  };
  
  // Define the function that will clear the device ID from AsyncStorage
  const clearDeviceId = async () => {
    Alert.alert(
        'Delete Device ID & Log Files?', 
        'Clearing the Device ID will also delete related log files. Are you sure you want to proceed? New recording requires a new Device ID to be entered.', 
        [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'OK', 
                onPress: async () => {
                    try {
                        await AsyncStorage.removeItem('@device_id');
                        console.log("Device ID cleared from AsyncStorage");
                        // Clear the device ID state
                        setDeviceId(''); 
                        console.log("Device ID state reset");
                    } catch (error) {
                        console.error("Error clearing device ID: ", error);
                    }
                }
            }
        ],
        {cancelable: true}
    );
};
// Define the function to share the log file
  const shareLogFile = async () => {
  const logFilePath = `${FileSystem.documentDirectory}${deviceId}_touch_event_log.csv`;
  
  // Get file info
  console.log("Looking for log file at:", logFilePath);

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
    //In case of error, alert the user
    alert("An error occurred while sharing the log file.");
    console.error(error);
  }
  checkLogFileExists();
};

// Define the function that will delete the log file
const deleteLogFile = async () => {
  const logFilePath = `${FileSystem.documentDirectory}${deviceId}_touch_event_log.csv`;

  try {
      console.log("Looking for log file at:", logFilePath);

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

      // Update the logFileExists state
      checkLogFileExists();

  } catch (error) {
      // Error occurred during the file operation
      alert("An error occurred during the file operation.");
      console.error(error);
  }
};


// Define the function that will fetch the device ID from AsyncStorage
  useEffect(() => {
    const fetchDeviceId = async () => {
        try {
            const storedId = await AsyncStorage.getItem('@device_id');
            if (storedId) setDeviceId(storedId);
        } catch (error) {
            console.error("Error fetching device ID: ", error);
        }
    };
    fetchDeviceId();
}, []);



// JSX code for the SettingsScreen component
return (
  <>
    <StatusBar hidden />
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newDeviceId}
          onChangeText={setNewDeviceId}
          placeholder="Enter New Device ID"
        />
        <Button
          title="Save"
          onPress={handleSave}
        />
      </View>
      {deviceId ? 
        <View style={styles.infoContainer}>
          <Text style={styles.idText}>Current Device ID: {deviceId}</Text>
        </View>
        : null
      }
        <TouchableOpacity
        style={{ ...styles.button, backgroundColor: "#FF0000" }}
        onPress={clearDeviceId}
      >
        <Text style={styles.buttonText}>Clear Device ID</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
    style={{...styles.button, opacity: logFileExists ? 1 : 0.5 }}
    onPress={shareLogFile}
    disabled={!logFileExists}
>
    <Text style={styles.buttonText}>Export Log File</Text>
</TouchableOpacity>

<TouchableOpacity
    style={{...styles.button, opacity: logFileExists ? 1 : 0.5 }}
    onPress={deleteLogFile}
    disabled={!logFileExists}
>
    <Text style={styles.buttonText}>Delete Log File</Text>
</TouchableOpacity>

<TouchableOpacity
  style={{...styles.button, opacity: logFileExists ? 1 : 0.5 }}
  onPress={() => navigation.navigate('EventAnalyzer')}
  disabled={!logFileExists}
>
  <FontAwesome5 name="map" size={24} color="white" style={{ marginRight: 10 }} />
  <Text style={styles.buttonText}>View Heatmap</Text>
</TouchableOpacity>


    </View>
    </ScrollView>
    </>

  );
}
// Define the styles for the SettingsScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
    paddingHorizontal: 5,
  },
  textInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    maxWidth: '70%',
    marginLeft: 5,
    marginRight: 5,
  },
  button: {
    flexDirection: 'row',  // <-- This makes child elements (icon and text) lay out horizontally
    alignItems: 'center',  // This vertically aligns the icon and text to the center
    justifyContent: 'center',  // This horizontally centers the content
    backgroundColor: "#335BFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
},
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  idText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
