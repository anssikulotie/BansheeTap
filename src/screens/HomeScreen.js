//import necessary modules
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FlatList, Text, View, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, Platform,Dimensions } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StartupScreen from './StartupScreen';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['new NativeEventEmitter()']);
// Define the HomeScreen component
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
  const [isStartupScreenVisible, setIsStartupScreenVisible] = useState(true);

 // State to hold the buffer
 const [touchBuffer, setTouchBuffer] = useState([]);


 // Define the log file path
   const getLogFilePath = () => {
     return `${FileSystem.documentDirectory}${deviceId}_touch_event_log.csv`;
   }
   const logFilePath = getLogFilePath();

 // Define the handleDeviceIdSubmit function
   const handleDeviceIdSubmit = async (id) => {
     setDeviceId(id);
     setIsStartupScreenVisible(false);
     try {
         await AsyncStorage.setItem('@device_id', id);
     } catch (error) {
         console.error("Error saving Device ID to AsyncStorage:", error);
     }
 };

// Define the handleDoubleTap function for toggling the maintenance mode
  const handleDoubleTap = () => {
    const now = Date.now();
    const timeInterval = now - (lastTap.current || 0);
// Toggle the maintenance mode if the user taps twice within 600 milliseconds
    if (timeInterval < 600 && showDoubleTapHint) {
      setMaintenanceMode(prev => !prev);
      setShowDoubleTapHint(false);
    } else {
      setShowDoubleTapHint(true);
    }

    lastTap.current = now;
  };
// Define the constants for the buffer size and flush interval
const BUFFER_SIZE = 50;  // 50 events
const FLUSH_INTERVAL = 20000;  // 20 seconds
// Define the handleTouch function for recording the touch events
const handleTouch = (event) => {
const isLandscapeNow = Dimensions.get('window').width > Dimensions.get('window').height;
const orientation = isLandscapeNow ? 'landscape' : 'portrait';

    if (maintenanceMode) return;
    setTouchFailureDetected(true);
    // Get the adjusted coordinates
    const touch = event.nativeEvent;
    const adjustedX = touch.locationX - layoutWidth / 2;
    const adjustedY = touch.locationY - layoutHeight / 2;
    // Get the current time in ISO format with local timezone offset applied 
    const currentTime = new Date();
    const timezoneOffsetInHours = currentTime.getTimezoneOffset() / -60;
    const localISOTime = new Date(currentTime.getTime() + timezoneOffsetInHours * 3600 * 1000)
      .toISOString().slice(0, 19).replace('T', ' ');
// Create a touch info object and add it to the touches array
const isPortrait = Dimensions.get('window').height > Dimensions.get('window').width;
const touchInfo = {
  // Adjust the coordinates to be relative to the center of the screen and round them to 2 decimal places
  x: parseFloat(adjustedX.toFixed(3)),
  y: parseFloat(adjustedY.toFixed(3)),
  timestamp: localISOTime,
  orientation: isPortrait ? 'portrait' : 'landscape'
};
// Add the touch info to the buffer
    setTouches(prevTouches => [...prevTouches, touchInfo]);
    setTouchBuffer(prevBuffer => [...prevBuffer, touchInfo]);
};
// Define the clearTouchesRef function for clearing the touches array
clearTouchesRef.current = () => {
  setTouches([]);
  // Reset the touch failure state
  setTouchFailureDetected(false);
};
// Define the useEffect hook for flushing the buffer
useEffect(() => {
    const saveBufferToFile = async () => {
      const csvContents = touchBuffer.map(touch => {
        if(!touch.timestamp) {
          console.error("Missing timestamp in touch:", touch);
          return ''; // or handle this case appropriately
        }
        return `${touch.timestamp}, ${touch.x}, ${touch.y}, ${touch.orientation}\n`;
      }).join('');

        const fileInfo = await FileSystem.getInfoAsync(logFilePath);
        if (!fileInfo.exists) {
          const legend = "timestamp, x-coordinate, y-coordinate, orientation\n";
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
    },
    // Flush the buffer every 20 seconds
    FLUSH_INTERVAL);

    return () => clearInterval(intervalId);  
}, [touchBuffer]);
const flushBuffer = useCallback(async () => {
  if (touchBuffer.length > 0) {
    const csvContents = touchBuffer.map(touch => `${touch.timestamp}, ${touch.x}, ${touch.y}, ${touch.orientation}\n`).join('');

      const fileInfo = await FileSystem.getInfoAsync(logFilePath);
      if (!fileInfo.exists) {
          const legend = "timestamp, x-coordinate, y-coordinate, orientation\n";
          await FileSystem.writeAsStringAsync(logFilePath, legend + csvContents, { encoding: FileSystem.EncodingType.UTF8 });
      } else {
          const existingContent = await FileSystem.readAsStringAsync(logFilePath, { encoding: FileSystem.EncodingType.UTF8 });
          const combinedContent = existingContent + csvContents;
          await FileSystem.writeAsStringAsync(logFilePath, combinedContent, { encoding: FileSystem.EncodingType.UTF8 });
      }
      setTouchBuffer([]);  
  }
}, [touchBuffer, logFilePath]);


useEffect(() => {
  const unsubscribe = navigation.addListener('blur', () => {
      // Flush the buffer when HomeScreen is blurred (navigated away from)
      flushBuffer();
  });

  return unsubscribe; 
}, [navigation, flushBuffer]);

useEffect(() => {
  return () => {
      //Flush the buffer when HomeScreen is unmounted 
      flushBuffer();
  };
}, []);
// Define the useEffect hook for fetching the device ID from AsyncStorage
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

// Define the useEffect hook for handling the newDeviceId parameter from SettingsScreen
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
    headerTitle: 'Maintenance mode',
    headerTitleAlign: 'center',
    headerRight: () => (
      maintenanceMode ? 
      <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
    <FontAwesome5 name="cog" size={32} color="black" style={{ marginRight: 10 }} />
      </TouchableOpacity>

      : null
    ),
    headerLeft: () => (
      maintenanceMode ?
      <TouchableOpacity onPress={clearTouchesRef.current}>
          <FontAwesome5 name="eraser" size={32} color="black"style={{ marginLeft: 10 }} />
      </TouchableOpacity>

      : null
    )
  });
}, [navigation, maintenanceMode]);


// JSX to render the StartupScreen component if the device ID is not set earlier
if (isStartupScreenVisible) { 
  return <StartupScreen onDeviceIdSubmit={handleDeviceIdSubmit} />;
}

// JSX to render the HomeScreen component
return ( 
  <>
    <StatusBar style="auto" hidden={true} />
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container} onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setLayoutWidth(width);
        setLayoutHeight(height);
      }}>
  
        <View style={styles.iconButtonContainer}> 
          <TouchableOpacity style={styles.iconButton} onPress={handleDoubleTap}> 
          <FontAwesome5 name={maintenanceMode ? "play" : "pause"} size={32} color="black" /> 
          </TouchableOpacity>
          {showDoubleTapHint && <Text style={styles.iconButtonHint}>Tap 2x{'\n'}to toggle</Text>}
        </View>
          
        <Text style={styles.maintenanceText}>
    {maintenanceMode ? "Recording paused" : "Recording Touch Events..."}
</Text> 

          
        {maintenanceMode && (
          <FlatList // Display the touches array in a FlatList when in maintenance mode
            data={touches.slice(-20)}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Text>{`${item.timestamp} - X: ${item.x.toFixed(3)} Y: ${item.y.toFixed(3)}`}</Text>
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

// Define the styles for the HomeScreen component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === "android" ? 50 : 0,
    position: 'relative',

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