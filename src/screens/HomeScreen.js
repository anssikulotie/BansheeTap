//import necessary modules
import React, { useState, useEffect, useRef } from 'react';
import {FlatList, Text, View, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, Platform} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5 } from '@expo/vector-icons';

// Define the HomeScreen component
export default function HomeScreen({ navigation, maintenanceMode, setMaintenanceMode }) {
  //State for touches
  const [touches, setTouches] = useState([]);
  //Ref for clearing touches
  const clearTouchesRef = useRef(() => {});
  //Ref for double tap detection
  const lastTap = useRef(null);
  //State for double tap hint
  const [showDoubleTapHint, setShowDoubleTapHint] = useState(false); 
  //State for layout width and height
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  //State for touch failure detection
  const [touchFailureDetected, setTouchFailureDetected] = useState(false);

// Define the function that will handle the double tap to toggle maintenance mode
  const handleDoubleTap = () => {
    const now = Date.now();
    const timeInterval = now - (lastTap.current || 0);

    if (timeInterval < 600 && showDoubleTapHint) { // If the second tap comes within 600ms of the first tap, toggle maintenance mode
      setMaintenanceMode(prev => !prev);
      setShowDoubleTapHint(false); // Hide hint after second tap
    } else {
      setShowDoubleTapHint(true); // Show hint on first tap
    }

    lastTap.current = now;
  };;
  // Define the path to the log file
  const logFilePath = FileSystem.documentDirectory + "touch_event_log.csv";

  // Define the function that will handle the touch events
  const handleTouch = async (event) => {
    if (maintenanceMode) return;
    setTouchFailureDetected(true);
    
// Get the touch location and adjust it to the center of the screen
    const touch = event.nativeEvent;
    const adjustedX = touch.locationX - layoutWidth / 2; 
    const adjustedY = layoutHeight / 2 - touch.locationY;
  // Get the current time and format it to ISO 8601 for the timestamp
    const currentTime = new Date();
    const timezoneOffsetInHours = currentTime.getTimezoneOffset() / -60;
    const localISOTime = new Date(currentTime.getTime() + timezoneOffsetInHours * 3600 * 1000)
      .toISOString().slice(0, 19).replace('T', ' ');
  // Create an object with the touch coordinates and timestamp
    const touchInfo = {
      x: parseFloat(adjustedX.toFixed(2)),
      y: parseFloat(adjustedY.toFixed(2)),
      timestamp: localISOTime,
    };
  // Add the touch object to the log file
    setTouches([...touches, touchInfo]);
    const csvContent = `${touchInfo.timestamp}, ${touchInfo.x}, ${touchInfo.y}\n`;
  // Write the touch event to the log file
    const fileInfo = await FileSystem.getInfoAsync(logFilePath);
if (!fileInfo.exists) { // If the file doesn't exist, create a new file with a legend
    const legend = "timestamp, x-coordinate, y-coordinate\n";
    await FileSystem.writeAsStringAsync(logFilePath, legend + csvContent, { encoding: FileSystem.EncodingType.UTF8 });
} else { // If the file already exists, append the touch event to the end of the file
    const existingContent = await FileSystem.readAsStringAsync(logFilePath, { encoding: FileSystem.EncodingType.UTF8 });
    const combinedContent = existingContent + csvContent;
    await FileSystem.writeAsStringAsync(logFilePath, combinedContent, { encoding: FileSystem.EncodingType.UTF8 });
}

  };
  
// Define the function that will clear the touches array
  clearTouchesRef.current = () => {
    setTouches([]);
    setTouchFailureDetected(false); // Reset the touch failure detection indicator
};


  useEffect(() => {
    // Set the navigation options for this screen
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