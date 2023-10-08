// import necessary packages
import React, { useState, useEffect,useNavigation  } from 'react';
import {Alert,  Button, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation, setMaintenanceMode }) {
  const [newDeviceId, setNewDeviceId] = useState('');
  const [deviceId, setDeviceId] = useState('');


  const handleSave = () => {
    if (deviceId) {
      Alert.alert(
        'Device ID exists',
        'You must clear the current Device ID before saving a new one.',
        [{ text: 'OK' }]
      );
      return;
    }
  
    if (newDeviceId) {
      Alert.alert(
        'Save ID & Start New Session?', 
        'This will start a new session with the new Device ID. Previous data will be overwritten. Continue?', 
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'OK', 
            onPress: async () => {
              try {
                await AsyncStorage.setItem('@device_id', newDeviceId);
                setDeviceId(newDeviceId);
                setMaintenanceMode(false); // Toggle off the maintenance mode
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
                        setDeviceId(''); // Reset the state
                        console.log("Device ID state reset");
                        // If you want to also delete the log file associated with the device ID, add the deletion logic here.
                    } catch (error) {
                        console.error("Error clearing device ID: ", error);
                    }
                }
            }
        ],
        {cancelable: true}
    );
};


  const logFilePath = `${FileSystem.documentDirectory}${deviceId}_touch_event_log.csv`;

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
    // Error sharing the log file
    alert("An error occurred while sharing the log file.");
    console.error(error);
  }
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
  
    } catch (error) {
      // Error deleting the log file
      alert("Error occurred:", error);
    }
  };
// Define the function that will save the device ID to AsyncStorage
const saveDeviceId = async () => {
  try {
      await AsyncStorage.setItem('@device_id', deviceId);
  } catch (error) {
      console.error("Error saving device ID: ", error);
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




  return (
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
        style={styles.button}
        onPress={shareLogFile}
      >
        <Text style={styles.buttonText}>Export Log File</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={deleteLogFile}
      >
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
