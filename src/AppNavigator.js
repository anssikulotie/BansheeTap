import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity, Text } from 'react-native';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldSkipHome, setShouldSkipHome] = useState(false);

  useEffect(() => {
    const checkInitialState = async () => {
      const storedId = await AsyncStorage.getItem('@device_id');
      // For now, using a placeholder for the log file check. Implement your check here.
      const logFileExists = true; // Replace with your logic

      if (storedId && logFileExists) {
        setShouldSkipHome(true);
      }
      setIsLoading(false);
    };

    checkInitialState();
  }, []);

  if (isLoading) {
    return null; // or render a loading indicator
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={shouldSkipHome ? "YourRecordingScreen" : "Home"}>
        <Stack.Screen 
          name="Home" 
          children={(props) => <HomeScreen {...props} maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode} />}
          options={({ navigation }) => ({
            headerShown: maintenanceMode,
            headerTitle: () => maintenanceMode ? (
              <TouchableOpacity onPress={() => navigation.setParams({ clearTouches: true })}>
                <Text style={{ color: 'blue' }}>Clear</Text>
              </TouchableOpacity>
            ) : null,
            headerRight: () => (
              maintenanceMode ? 
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Text style={{ marginRight: 10 }}>Settings</Text>
              </TouchableOpacity>
              : null
            )
          })}
        />
        <Stack.Screen 
          name="Settings" 
          children={(props) => <SettingsScreen {...props} setMaintenanceMode={setMaintenanceMode} />}
        />
        {/* If you have a separate recording screen, define it here. */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
