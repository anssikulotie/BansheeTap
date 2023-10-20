//import necessary modules
import React, { useEffect, useState } from 'react';
import { View, Button, Alert, StyleSheet, Text, ImageBackground, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['new NativeEventEmitter()']);
const backgroundImage = require("../../assets/splash.png");
const { width, height } = Dimensions.get('window');
const isLandscapeInit = width > height;

// Define the StartupScreen component
export default function StartupScreen({ onDeviceIdSubmit }) {
    const navigation = useNavigation();
    const [isLandscape, setIsLandscape] = useState(isLandscapeInit);

    //Handle orientation change
    useEffect(() => {
        const handleOrientationChange = ({ window }) => {
            setIsLandscape(window.width > window.height);
        };
        const subscription = Dimensions.addEventListener('change', handleOrientationChange);

        return () => {
            subscription.remove();
        };
    }, []);
    // Function to start recording touch events
    const startRecording = async () => {
        try {
            const storedId = await AsyncStorage.getItem('@device_id');
            if (storedId) {
                onDeviceIdSubmit(storedId);
            } else {
                Alert.alert(
                    'Device ID not set',
                    'Please enter a Device ID in the Settings screen before starting the recording.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('Settings') 
                        }
                    ],
                    {cancelable: true}
                );
            }
        } catch (error) {
            console.error("Error fetching device ID: ", error);
        }
    };
//Check orientation and return the appropriate JSX
    if (isLandscape) {
        return (
            <>
                <StatusBar hidden />
            <View style={styles.container}>
                <Text style={styles.title}>BansheeTap</Text>
                <Button title="Start Touch Event Recording" onPress={startRecording} />
            </View>
            </>
        );
    } else {
        return (
            <>
                <StatusBar hidden />
            <ImageBackground 
                source={backgroundImage} 
                style={styles.backgroundContainer}
                resizeMode="cover" 
            >
                <View style={styles.container}>
                    <Text style={styles.title}>BansheeTap</Text>
                    <Button title="Start Touch Event Recording" onPress={startRecording} />
                </View>
            </ImageBackground>
            </>
        );
    }
}
//Define styles for the StartupScreen component
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 70,
        position: 'relative',
    },
    title: {
        fontSize: 32,
        fontWeight: 'normal',
        letterSpacing: 1.5,
        textShadowColor: '#90ee90',
        textShadowOffset: { width: -2, height: 3 },
        textShadowRadius: 5,
        textDecorationLine: 'underline',
        position: 'absolute',
        top: 5,
        alignSelf: 'center'
    },
    backgroundContainer: {
        flex: 1,
        width: '101%',
        height: '100%',
        justifyContent: 'center',
    },
});