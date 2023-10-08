import React from 'react';
import { View, Button, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function StartupScreen({ onDeviceIdSubmit }) {
    const navigation = useNavigation();
  

    // Function to start recording
    const startRecording = async () => {
        try {
            const storedId = await AsyncStorage.getItem('@device_id');
            if (storedId) {
                onDeviceIdSubmit(storedId);
            } else {
                Alert.alert(
                    'Device ID Missing',
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

    return (
        <View style={styles.container}>
            <Button title="Start Touch Event Recording" onPress={startRecording} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
