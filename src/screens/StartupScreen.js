import React, { useEffect, useState } from 'react';
import { View, Button, Alert, StyleSheet, Text, ImageBackground, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
const backgroundImage = require("../../assets/splash.png");
const { width, height } = Dimensions.get('window');
const isLandscapeInit = width > height;

export default function StartupScreen({ onDeviceIdSubmit }) {
    const navigation = useNavigation();
    const [isLandscape, setIsLandscape] = useState(isLandscapeInit);

    useEffect(() => {
        const handleOrientationChange = ({ window }) => {
            setIsLandscape(window.width > window.height);
        };
        const subscription = Dimensions.addEventListener('change', handleOrientationChange);

        return () => {
            subscription.remove();
        };
    }, []);
    // Function to start recording
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

    if (isLandscape) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>BansheeTap</Text>
                <Button title="Start Touch Event Recording" onPress={startRecording} />
            </View>
        );
    } else {
        return (
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
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
        position: 'absolute',
        top: 10,
        alignSelf: 'center'
    },
    backgroundContainer: {
        flex: 1,
        width: '101%',
        height: '100%',
        justifyContent: 'center',
    },
});