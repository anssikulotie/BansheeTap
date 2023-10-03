import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableWithoutFeedback } from 'react-native';

export default function App() {
  const [touches, setTouches] = useState([]);

  const handleTouch = (event) => {
    const touch = event.nativeEvent;
    const currentTime = new Date();
    const touchInfo = {
      x: touch.locationX,
      y: touch.locationY,
      timestamp: currentTime.toISOString(),
    };
    setTouches([...touches, touchInfo]);
  };

  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={styles.container}>
        <Text>Touch anywhere on the screen!</Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
