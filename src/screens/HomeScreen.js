import React, { useState, useEffect, useRef } from 'react';
import {
  FlatList, Text, View, StyleSheet,
  TouchableWithoutFeedback, TouchableOpacity, Platform
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen({ navigation, maintenanceMode, setMaintenanceMode }) {
  const [touches, setTouches] = useState([]);
  const clearTouchesRef = useRef(() => {});

  // Define the path to the log file
  const logFilePath = FileSystem.documentDirectory + "ghost_touch_log.csv";

  // Define the function that will handle the touch events
  const handleTouch = async (event) => {
    if (maintenanceMode) return;
    const touch = event.nativeEvent;
    const currentTime = new Date();
    const timezoneOffsetInHours = currentTime.getTimezoneOffset() / -60;
    const localISOTime = new Date(currentTime.getTime() + timezoneOffsetInHours * 3600 * 1000)
      .toISOString().slice(0, 19).replace('T', ' ');
    const touchInfo = {
      x: parseFloat(touch.locationX.toFixed(2)),
      y: parseFloat(touch.locationY.toFixed(2)),
      timestamp: localISOTime,
    };

    setTouches([...touches, touchInfo]);
    const csvContent = `${touchInfo.timestamp}, ${touchInfo.x}, ${touchInfo.y}\n`;

    const fileInfo = await FileSystem.getInfoAsync(logFilePath);
    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(logFilePath, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
    } else {
      const existingContent = await FileSystem.readAsStringAsync(logFilePath, { encoding: FileSystem.EncodingType.UTF8 });
      const combinedContent = existingContent + csvContent;
      await FileSystem.writeAsStringAsync(logFilePath, combinedContent, { encoding: FileSystem.EncodingType.UTF8 });
    }
  };

  clearTouchesRef.current = () => {
    setTouches([]);
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Maintenance screen',
      headerTitleAlign: 'center',
      headerRight: () => (
        maintenanceMode ? 
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={{ marginRight: 10 }}>Settings</Text>
        </TouchableOpacity>
        : null
      ),
      headerLeft: () => (
        maintenanceMode ?
        <TouchableOpacity onPress={clearTouchesRef.current}>
          <Text style={{ marginLeft: 10 }}>Clear recent logs</Text>
        </TouchableOpacity>
        : null
      )
    });
  }, [navigation, maintenanceMode]);

  return (
    <>
      <StatusBar style="auto" hidden={true} />
      <TouchableWithoutFeedback onPress={handleTouch}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.button} onPress={() => setMaintenanceMode(prev => !prev)}>
            <Text style={styles.buttonText}>Toggle Maintenance Mode</Text>
          </TouchableOpacity>
          <Text style={styles.maintenanceText}>
            Maintenance Mode: {maintenanceMode ? "ON" : "OFF"}
          </Text>
          <FlatList
            data={touches.slice(-20)}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Text>{`${item.timestamp} - X: ${item.x.toFixed(2)} Y: ${item.y.toFixed(2)}`}</Text>
            )}
            inverted
          />
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}

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
