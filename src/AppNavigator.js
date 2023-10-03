import React, { useState } from 'react';
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
  
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen 
            name="Home" 
            children={(props) => <HomeScreen {...props} maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode} />}
            options={({ navigation }) => ({
                headerShown: maintenanceMode,
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