// MaintenanceScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MaintenanceScreen() {
  return (
    <View style={styles.container}>
      <Text>Maintenance Screen</Text>
      // Add any other components or information you want this screen to have here.
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
