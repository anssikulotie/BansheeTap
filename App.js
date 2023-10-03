//import necessary modules
import React, { useState } from 'react';
import { FlatList, Text, View, StyleSheet, TouchableWithoutFeedback, Button, ScrollView } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { TouchableOpacity } from 'react-native';


export default function App() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [touches, setTouches] = useState([]);
// Define the path to the log file
  const logFilePath = FileSystem.documentDirectory + "ghost_touch_log.csv";
// Define the function that will handle the touch events
  const handleTouch = async (event) => {
    //make sure the application is not in maintenance mode
    if (maintenanceMode) return;  // Exit if in maintenance mode
    // record the touch event timestamp, x and y coordinates
    const touch = event.nativeEvent;
    const currentTime = new Date();
const timezoneOffsetInHours = currentTime.getTimezoneOffset() / -60; // getTimezoneOffset returns in minutes
const localISOTime = new Date(currentTime.getTime() + timezoneOffsetInHours * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
const touchInfo = {
  x: parseFloat(touch.locationX.toFixed(2)), 
  y: parseFloat(touch.locationY.toFixed(2)), 
      timestamp: localISOTime,
    };
  
    setTouches([...touches, touchInfo]);
  
   // Write the touch event data to the log file
    const csvContent = `${touchInfo.timestamp}, ${touchInfo.x}, ${touchInfo.y}\n`;
  
    const fileInfo = await FileSystem.getInfoAsync(logFilePath);
    if (!fileInfo.exists) {
      // If file does not exist, create it
      await FileSystem.writeAsStringAsync(logFilePath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
    } else {
      // If file exists, read its contents and add the new touch event data
      const existingContent = await FileSystem.readAsStringAsync(logFilePath, { encoding: FileSystem.EncodingType.UTF8 });
      const combinedContent = existingContent + csvContent;
      await FileSystem.writeAsStringAsync(logFilePath, combinedContent, { encoding: FileSystem.EncodingType.UTF8 });
    }
  };
// Define the function that will handle the maintenance mode toggle
return (
  <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => setMaintenanceMode(prev => !prev)}>
    <Text style={styles.buttonText}>Toggle Maintenance Mode</Text>
</TouchableOpacity>

<Text style={styles.maintenanceText}>
    Maintenance Mode: {maintenanceMode ? "ON" : "OFF"}
</Text>

          <FlatList
            data={touches.slice(-20)}  // This will take the last 20 items from the touches array.
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Text>{`${item.timestamp} - X: ${item.x} Y: ${item.y}`}</Text>
            )}
            inverted  // This ensures the newest items are at the top.
          />
      </View>
  </TouchableWithoutFeedback>
);
}
// Define the styles for the app
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === "android" ? 50 : 0,
  },
  
  touchArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maintenanceText: {
    color: 'red',
    marginBottom: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },
  logArea: {
    flex: 1,
    padding: 10,
  },
  logContent: {
    alignItems: 'flex-start',
  },
  button: {
    backgroundColor: "#335BFF",
    paddingVertical: 50,
    paddingHorizontal: 50,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
},
buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
}
});
