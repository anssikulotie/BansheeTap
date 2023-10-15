import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { FontAwesome5 } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { AppState } from 'react-native';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['new NativeEventEmitter()']);


function EventAnalyzer({ navigation }) {
    const [touchData, setTouchData] = useState([]);
    const [heatmapVisible, setHeatmapVisible] = useState(true);
    const [deviceId, setDeviceId] = useState('');
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));
    const [recordedOrientation, setRecordedOrientation] = useState(null);
    const [displayOrientation, setDisplayOrientation] = useState('all'); // 'all', 'portrait', or 'landscape'
    const isCurrentPortrait = dimensions.width < dimensions.height;
    const middleX = dimensions.width / 2;
    const middleY = dimensions.height / 2;
    
    useEffect(() => {
        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    
        return () => {
          appStateSubscription.remove();
        };
    }, []);
    
    const handleAppStateChange = async (nextAppState) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
        }
    };
    
    useEffect(() => {
        async function lockOrientation() {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
    
        lockOrientation();


   
            
    }, []);
    const toggleOrientation = async () => {
        const currentOrientation = await ScreenOrientation.getOrientationAsync();
        
        if (currentOrientation === ScreenOrientation.Orientation.PORTRAIT_UP) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
        } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
    };
    
    let previousOrientation = "portrait"; // default
    let isRotatedRightwards = false;

    if (previousOrientation === "portrait" && isCurrentPortrait === false) {
        if (dimensions.width > dimensions.height) {
            // Transitioned to landscape mode
            isRotatedRightwards = true;
        }
    }
    
    // Update the previousOrientation at the end of the orientation change
    previousOrientation = isCurrentPortrait ? "portrait" : "landscape";
    
    useEffect(() => {
        const onChange = ({ window }) => {
            setDimensions(window);
        };
        const subscription = Dimensions.addEventListener("change", onChange);
        return () => {
            subscription.remove();
        };
    }, []);
    
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
                    console.log(parsedData); // Add this line

                } catch (error) {
                    console.error("Error reading the log file:", error);
                }
            }
            fetchTouchData();
        }
    }, [deviceId]);

     
    function parseCSV(csvString) {
        const lines = csvString.trim().split('\n').slice(1); // Skip the legend line
        return lines.map(line => {
            const [timestamp, x, y, orientation] = line.split(','); 
            return { 
                timestamp, 
                x: parseFloat(x), 
                y: parseFloat(y), 
                orientation: orientation ? orientation.trim() : undefined
            };
        });
    }
    
    

    function renderHeatmap() {
        return touchData.map((touch, index) => {
            let adjustedX, adjustedY;
    
            if (touch.orientation === 'landscape' && isCurrentPortrait) {
                adjustedX = touch.y + middleX;
                adjustedY = middleY - touch.x;
            } else if (touch.orientation === 'landscape') {
                adjustedX = touch.x + middleX;
                adjustedY = middleY + touch.y;
            } else if (isCurrentPortrait) {
                adjustedX = middleX + touch.x;
                adjustedY = middleY + touch.y;
            } else {
                adjustedX = middleX - touch.y;
                adjustedY = middleY + touch.x;
            }
    
    
            // Validate adjusted values before rendering
            if (isNaN(adjustedX) || isNaN(adjustedY)) {
                console.warn(`Invalid touch point at index ${index}:`, touch);
                return null;
            }
    
            if ((!isNaN(touch.x) && !isNaN(touch.y)) && (displayOrientation === 'all' || touch.orientation === displayOrientation)) {
                return (
                    <View 
                        key={index}
                        style={{
                            position: 'absolute',
                            top: adjustedY - 5,
                            left: adjustedX - 5,
                            width: 10,
                            height: 10,
                            backgroundColor: 'red',
                            borderRadius: 5,
                            opacity: 0.5,
                            zIndex: 1000
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
            <TouchableOpacity 
    style={styles.rotateButton}
    onPress={toggleOrientation}
>
    <FontAwesome5 name="redo" size={15} color="black" />
</TouchableOpacity>
            {/* Heatmap Toggle Button */}
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
rotateButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    backgroundColor: '#ddd',
    borderRadius: 5,
}

});


export default EventAnalyzer;