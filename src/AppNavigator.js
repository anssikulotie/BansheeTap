import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import MaintenanceScreen from './screens/MaintenanceScreen';
import SettingsScreen from './screens/SettingsScreen';
import { TouchableOpacity } from 'react-native';
import { Text } from 'react-native';



const Stack = createStackNavigator();

export default function AppNavigator() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [touches, setTouches] = useState([]); // Move the touches state here

  const clearTouches = useCallback(() => {
    setTouches([]); // Clear the touches array
  }, []);

return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
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


          {maintenanceMode && <Stack.Screen name="Maintenance" component={MaintenanceScreen} />}
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
}