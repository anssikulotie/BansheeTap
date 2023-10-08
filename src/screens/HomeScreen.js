import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FlatList, Text, View, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StartupScreen from './StartupScreen';

export default function HomeScreen({ navigation, route, maintenanceMode, setMaintenanceMode }) {
  
  // State variables
  const [touches, setTouches] = useState([]);
  const [showDoubleTapHint, setShowDoubleTapHint] = useState(false);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [touchFailureDetected, setTouchFailureDetected] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const clearTouchesRef = useRef(() => {});
  const lastTap = useRef(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isStartupScreenVisible, setIsStartupScreenVisible] = useState(true);

  // State to hold the buffer
  const [touchBuffer, setTouchBuffer] = useState([]);

  const getLogFilePath = () => {
    return `${FileSystem.documentDirectory}${deviceId}_touch_event_log.csv`;
  }
  const logFilePath = getLogFilePath();

  const handleDeviceIdSubmit = async (id) => {
    setDeviceId(id);
    setIsStartupScreenVisible(false);
    try {
        await AsyncStorage.setItem('@device_id', id);
    } catch (error) {
        console.error("Error saving Device ID to AsyncStorage:", error);
    }
};


  const handleDoubleTap = () => {
    const now = Date.now();
    const timeInterval = now - (lastTap.current || 0);

    if (timeInterval < 600 && showDoubleTapHint) {
      setMaintenanceMode(prev => !prev);
      setShowDoubleTapHint(false);
    } else {
      setShowDoubleTapHint(true);
    }

    lastTap.current = now;
  };

  const BUFFER_SIZE = 50;  // 50 events
const FLUSH_INTERVAL = 20000;  // 20 seconds

const handleTouch = (event) => {
    if (maintenanceMode) return;
    setTouchFailureDetected(true);
    
    const touch = event.nativeEvent;
    const adjustedX = touch.locationX - layoutWidth / 2;
    const adjustedY = layoutHeight / 2 - touch.locationY;

    const currentTime = new Date();
    const timezoneOffsetInHours = currentTime.getTimezoneOffset() / -60;
    const localISOTime = new Date(currentTime.getTime() + timezoneOffsetInHours * 3600 * 1000)
      .toISOString().slice(0, 19).replace('T', ' ');

    const touchInfo = {
      x: parseFloat(adjustedX.toFixed(0)),
      y: parseFloat(adjustedY.toFixed(0)),
      timestamp: localISOTime,
    };

    setTouches(prevTouches => [...prevTouches, touchInfo]);
    setTouchBuffer(prevBuffer => [...prevBuffer, touchInfo]);
};

clearTouchesRef.current = () => {
  setTouches([]);
  setTouchFailureDetected(false);
};

useEffect(() => {
    const saveBufferToFile = async () => {
        const csvContents = touchBuffer.map(touch => `${touch.timestamp}, ${touch.x}, ${touch.y}\n`).join('');

        const fileInfo = await FileSystem.getInfoAsync(logFilePath);
        if (!fileInfo.exists) {
            const legend = "timestamp, x-coordinate, y-coordinate\n";
            await FileSystem.writeAsStringAsync(logFilePath, legend + csvContents, { encoding: FileSystem.EncodingType.UTF8 });
        } else {
            const existingContent = await FileSystem.readAsStringAsync(logFilePath, { encoding: FileSystem.EncodingType.UTF8 });
            const combinedContent = existingContent + csvContents;
            await FileSystem.writeAsStringAsync(logFilePath, combinedContent, { encoding: FileSystem.EncodingType.UTF8 });
        }
    };

    // Size-based flushing
    if (touchBuffer.length >= BUFFER_SIZE) {
        saveBufferToFile().then(() => {
            setTouchBuffer([]);  
        });
    }

    // Time-based flushing
    const intervalId = setInterval(() => {
        if (touchBuffer.length > 0) {
            saveBufferToFile().then(() => {
                setTouchBuffer([]);
            });
        }
    }, FLUSH_INTERVAL);

    return () => clearInterval(intervalId);  // Cleanup the interval when the component is unmounted or when effect dependencies change
}, [touchBuffer]);
const flushBuffer = useCallback(async () => {
  if (touchBuffer.length > 0) {
      const csvContents = touchBuffer.map(touch => `${touch.timestamp}, ${touch.x}, ${touch.y}\n`).join('');

      const fileInfo = await FileSystem.getInfoAsync(logFilePath);
      if (!fileInfo.exists) {
          const legend = "timestamp, x-coordinate, y-coordinate\n";
          await FileSystem.writeAsStringAsync(logFilePath, legend + csvContents, { encoding: FileSystem.EncodingType.UTF8 });
      } else {
          const existingContent = await FileSystem.readAsStringAsync(logFilePath, { encoding: FileSystem.EncodingType.UTF8 });
          const combinedContent = existingContent + csvContents;
          await FileSystem.writeAsStringAsync(logFilePath, combinedContent, { encoding: FileSystem.EncodingType.UTF8 });
      }
      setTouchBuffer([]);  // Clear the buffer
  }
}, [touchBuffer, logFilePath]);


useEffect(() => {
  const unsubscribe = navigation.addListener('blur', () => {
      // Flush the buffer when HomeScreen is blurred (navigated away from)
      flushBuffer();
  });

  return unsubscribe;  // Cleanup
}, [navigation, flushBuffer]);

useEffect(() => {
  return () => {
      // This code will run when the component is about to unmount.
      flushBuffer();
  };
}, []);

useEffect(() => {
  const fetchDeviceId = async () => {
    const storedId = await AsyncStorage.getItem('@device_id');
    if (storedId) {
      setDeviceId(storedId);
      setIsStartupScreenVisible(false); // directly go into recording mode if device ID is known
    } else {
      setIsStartupScreenVisible(true); // show startup screen if device ID is unknown
    }
  };

  fetchDeviceId();
}, []);

//newDeviceId
useEffect(() => {
  if (route.params?.newDeviceId) {
      setDeviceId(route.params.newDeviceId);
      setMaintenanceMode(false);  // Toggle off the maintenance mode
      clearTouchesRef.current();  // Clear the previous touch events
      // Reset the parameter to avoid continuous re-initialization
      navigation.setParams({ newDeviceId: undefined });
  }
}, [route.params?.newDeviceId]);

//Header bar
useEffect(() => {
  navigation.setOptions({
    headerShown: maintenanceMode,
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
        <Text style={{ marginLeft: 10 }}>Clear display</Text>
      </TouchableOpacity>
      : null
    )
  });
}, [navigation, maintenanceMode]);

if (isStartupScreenVisible) {
  return <StartupScreen onDeviceIdSubmit={handleDeviceIdSubmit} />;
}


return ( // Return the JSX for the HomeScreen component
  <>
    <StatusBar style="auto" hidden={true} />
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container} onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setLayoutWidth(width);
        setLayoutHeight(height);
      }}>
        {maintenanceMode && (
          <>
            <View style={styles.gridVertical} />
            <View style={styles.gridHorizontal} />
            <AxisMarkers />
          </>
        )}
        <View style={styles.iconButtonContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={handleDoubleTap}>
            <FontAwesome5 name="wrench" size={32} color="black" />
          </TouchableOpacity>
          {showDoubleTapHint && <Text style={styles.iconButtonHint}>Tap 2x{'\n'}to toggle</Text>}
        </View>
          
        <Text style={styles.maintenanceText}>
    {maintenanceMode ? "Maintenance Mode" : "Recording Touch Events..."}
</Text> 

          
        {maintenanceMode && (
          <FlatList // Display the touches array in a FlatList when in maintenance mode
            data={touches.slice(-20)}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Text>{`${item.timestamp} - X: ${item.x.toFixed(2)} Y: ${item.y.toFixed(2)}`}</Text>
            )}
            inverted
          />
        )}
      </View>
      
    </TouchableWithoutFeedback> 
    {touchFailureDetected && !maintenanceMode && (
    <View style={styles.failureIndicator} pointerEvents="none"> 
        <Text style={styles.failureText}>Touch Event Detected!</Text> 
    </View> 
)}


  </>
);


}
// Define the AxisMarkers component
function AxisMarkers() {
  return (
    // Display the axis markers in a View
    <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
      {/* Zero marker in the center */}
      <Text style={[styles.markerText, { top: '50%', left: '50%', transform: [{ translateX: -7 }, { translateY: -27 }] }]}>0</Text>
      
      {/* X label on the far right end */}
      <Text style={[styles.markerText, { top: '50%', right: 5, transform: [{ translateY: -10 }] }]}>X</Text>

      {/* Y label on the top end */}
      <Text style={[styles.markerText, { top: 5, left: '50%', transform: [{ translateX: -10 }] }]}>Y</Text>
    </View>
  );
}
// Define the styles for the HomeScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === "android" ? 50 : 0,
    position: 'relative',
  },
  markerText: {
    position: 'absolute',
    fontSize: 10,
    color: 'gray'
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
    marginTop: 50,
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
  iconButtonContainer: {
    position: 'absolute',
    top: Platform.OS === "android" ? 10 : 30,
    right: 10,
    alignItems: 'center'
  },
  iconButton: {
    padding: 5,
  },
  iconButtonHint: {
    fontSize: 10,
    color: '#777',
  },
  gridVertical: {
    position: 'absolute',
    width: 1, 
    height: '107.5%', 
    backgroundColor: 'gray',
    left: '50%', 
  
  },
  
  gridHorizontal: {
    position: 'absolute',
    height: 1, 
    width: '99.9%', 
    backgroundColor: 'gray',
    top: '50%', 
    zIndex: -1,
  },
  failureIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 5,
    backgroundColor: 'red',
    borderRadius: 5,
    zIndex: 1,  
},
failureText: {
    color: 'white',
    fontSize: 14,
},
});