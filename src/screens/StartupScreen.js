import React, { useState,useNavigation  } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

export default function StartupScreen({ onDeviceIdSubmit }) {
    const [inputId, setInputId] = useState('');

    return (
        <View style={styles.container}>
            <TextInput 
                style={styles.input}
                value={inputId}
                onChangeText={setInputId}
                placeholder="Enter Device ID"
            />
            <Button title="Start Touch Event Recording" onPress={() => onDeviceIdSubmit(inputId)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        width: '80%',
        padding: 10,
        borderWidth: 1,
        marginBottom: 20,
    },
});
