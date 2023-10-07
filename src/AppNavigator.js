//import necessary libraries
import React, { useState, useCallback, useNavigation  } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import { TouchableOpacity } from 'react-native';
import { Text } from 'react-native';

// Define the AppNavigator component
const Stack = createStackNavigator();

export default function AppNavigator() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [] = useState([]); // Add the state for touches
  // Define the function that will handle the touch events

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          // Pass the maintenanceMode and setMaintenanceMode functions as props to the HomeScreen component
          children={(props) => <HomeScreen {...props} maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode} />}
          options={({ navigation }) => ({
            // Add the headerRight and headerTitle options
            headerShown: maintenanceMode,
            headerTitle: () => maintenanceMode ? (
              // Add the clear button to the header
              <TouchableOpacity onPress={() => navigation.setParams({ clearTouches: true })}>
                <Text style={{ color: 'blue' }}>Clear</Text>
              </TouchableOpacity>
            ) : null,
            headerRight: () => (
              maintenanceMode ? 
              // Add the Settings button to the header
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Text style={{ marginRight: 10 }}>Settings</Text>
              </TouchableOpacity>
              : null
            )
          })}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
