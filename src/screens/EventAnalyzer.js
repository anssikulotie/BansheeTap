import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

function EventAnalyzer({ navigation }) {
    const [touchData, setTouchData] = useState([]);
    const [heatmapVisible, setHeatmapVisible] = useState(true);
    const [deviceId, setDeviceId] = useState('');
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));
    const [recordedOrientation, setRecordedOrientation] = useState(null);

    const isLandscape = dimensions.width > dimensions.height;  // <--- Use dimensions state here
    useEffect(() => {
        if (recordedOrientation === 'portrait') {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
        } else {
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
      
        // When exiting the screen, unlock the orientation
        return () => {
          ScreenOrientation.unlockAsync();
        }
      }, [recordedOrientation]);

      
    useEffect(() => {
        const onChange = ({ window }) => {
            setDimensions(window);
        };
    
        // This will automatically handle cleanup
        const subscription = Dimensions.addEventListener("change", onChange);
    
        return () => {
            subscription.remove();
        };
    }, []);
    
    // Fetch device ID from AsyncStorage
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

    useEffect(() => {
        if (deviceId) {
            const logFilePath = `${FileSystem.documentDirectory}${deviceId}_touch_event_log.csv`;
    
            async function fetchTouchData() {
                try {
                    const csvContents = await FileSystem.readAsStringAsync(logFilePath);
                    const parsedData = parseCSV(csvContents);
                    setTouchData(parsedData);
                    
                    // Lock screen orientation based on the recordedOrientation of the first touch event
                    setRecordedOrientation(parsedData[0]?.orientation);
 
                    if (recordedOrientation) {
                        if (recordedOrientation === 'portrait') {
                            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
                        } else {
                            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
                        }
                    }
    
                } catch (error) {
                    console.error("Error reading the log file:", error);
                }
            }
    
            fetchTouchData();
        }
    
        // When the EventAnalyzer screen is unmounted, unlock the screen orientation
        return () => {
            ScreenOrientation.unlockAsync();
        };
    
    }, [deviceId]);
    

    function parseCSV(csvString) {
        const lines = csvString.trim().split('\n');
        return lines.map(line => {
            const [timestamp, x, y, orientation] = line.split(','); // assume orientation is stored as 'portrait' or 'landscape'
            return { timestamp, x: parseFloat(x), y: parseFloat(y), orientation };
        });
    }
    

    function renderHeatmap() {
        return touchData.map((touch, index) => {
            if (!isNaN(touch.x) && !isNaN(touch.y)) {
                let adjustedX, adjustedY;
                
                if (touch.orientation === 'landscape') {
                    adjustedX = touch.y;
                    adjustedY = -touch.x;
                } else {
                    adjustedX = touch.x;
                    adjustedY = -touch.y;
                }
    
                return (
                    <View 
                        key={index}
                        style={{
                            position: 'absolute',
                            top: (dimensions.height / 2) + adjustedY - 5,
                            left: (dimensions.width / 2) + adjustedX - 5,
                            width: 10,
                            height: 10,
                            backgroundColor: 'red',
                            borderRadius: 5,
                            opacity: 0.5
                        }}
                    />
                );
            }
            return null; // Return null for invalid data points
        });
    }
    
    
    
    
    
    

    return (
        <View style={{ flex: 1 }}>
            {/* Heatmap */}
            {heatmapVisible && renderHeatmap()}
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <FontAwesome5 name="arrow-left" size={15} color="black"/>
                
            </TouchableOpacity>
            {/* Grid & Axis */}
            <View style={styles.rootContainer}>
                <View style={styles.gridVertical} />
                <View style={styles.gridHorizontal} />
                <Text style={[styles.markerText, styles.zeroMarker]}>0</Text>
                <Text style={[styles.markerText, styles.xMarker]}>X</Text>
                <Text style={[styles.markerText, styles.yMarker]}>Y</Text>
            </View>

            {/* Toggle Button */}
            <TouchableOpacity 
                style={styles.toggleButton}
                onPress={() => setHeatmapVisible(!heatmapVisible)}
            >
                <FontAwesome5 name="map-pin" size={15} color="black" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    position: 'relative',
  },
  markerText: {
    position: 'absolute',
    color: 'gray',
    fontSize: 12,
  },
  zeroMarker: {
    top: '50%',
    left: '50%',
    transform: [{ translateX: -8 }, { translateY: -15 }], // adjusted for the size of the text
  },
  xMarker: {
    top: '50%',
    right: 5,
    transform: [{ translateY: -15 }],
  },
  yMarker: {
    left: '50%',
    top: 5,
    transform: [{ translateX: -10 }],
  },
  gridVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'gray',
    left: '50%',
  },
  gridHorizontal: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: 'gray',
    top: '50%',
  },
  toggleButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    padding: 5,
    backgroundColor: '#ddd',
    borderRadius: 5,
},
backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 5,
    backgroundColor: '#ddd',
    borderRadius: 1,
},
});


export default EventAnalyzer;