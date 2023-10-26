//import necessary modules
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AutoUploadProvider } from './screens/AutoUploadContext';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import EventAnalyzer from './screens/EventAnalyzer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['new NativeEventEmitter()']);
const Stack = createStackNavigator();

// Main AppNavigator component 
export default function AppNavigator() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldSkipHome, setShouldSkipHome] = useState(false);

// Check if the device ID is already stored in AsyncStorage and if the log file exists 
  useEffect(() => {
    const checkInitialState = async () => {
      const storedId = await AsyncStorage.getItem('@device_id');
      const logFileExists = true; 

// If the device ID is stored and the log file exists, skip the Home screen and go directly to the RecordingScreen
      if (storedId && logFileExists) {
        setShouldSkipHome(true);
      }
      setIsLoading(false);
    };

    checkInitialState();
  }, []);
// If the app is still loading, return null
  if (isLoading) {
    return null; 
  }

  //JSX code for the AppNavigator component
  return (
    <AutoUploadProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName={shouldSkipHome ? "HomeScreen" : "Home"}>
        <Stack.Screen 
          name="Home" 
          children={(props) => {
            const flushBuffer = async () => {
            };

        // If the Home screen is blurred, flush the buffer
            useEffect(() => {
              const unsubscribe = props.navigation.addListener('blur', () => {
                console.log("Home screen was blurred");  
                flushBuffer();
              });
              return unsubscribe; 
            }, [props.navigation]);

        // If the Home screen is focused, check if the log file exists
            return <HomeScreen {...props} maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode} />;
          }}
          // Header options for the Home screen
          options={({ navigation }) => ({
            headerShown: maintenanceMode,
            headerTitle: () => maintenanceMode ? (
              <TouchableOpacity onPress={() => navigation.setParams({ clearTouches: true })}>
                <FontAwesome5 name="eraser" size={24} color="blue" />
              </TouchableOpacity>
            ) : null,
            headerRight: () => (
              maintenanceMode ? 
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <FontAwesome5 name="cog" size={24} color="black" style={{ marginRight: 10 }} />
              </TouchableOpacity>
              : null
            )
          })}
          
        />
        <Stack.Screen 
    name="Settings" 
    children={(props) => <SettingsScreen {...props} setMaintenanceMode={setMaintenanceMode} />}
    options={({ route, navigation }) => {
        const { deviceId } = route.params || {};  // Assuming you pass deviceId as a parameter

        return {
            headerLeft: () => {
                if (!deviceId) {
                    return (
                        <TouchableOpacity onPress={() => {
                            Alert.alert("ACHTUNG!", "You can't go back without saving a new Device ID.", [
                                { text: "OK" }
                            ]);
                        }}>
                            <FontAwesome5 name="arrow-left" size={24} color="black" />
                        </TouchableOpacity>
                    );
                } else {
                    // Default behavior
                    return (
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <FontAwesome5 name="arrow-left" size={24} color="black" />
                        </TouchableOpacity>
                    );
                }
            }
        };
    }}
/>
        <Stack.Screen 
         name="EventAnalyzer" 
        component={EventAnalyzer}
        options={{ headerShown: false }}
                    
                />
      </Stack.Navigator>
    </NavigationContainer>
    </AutoUploadProvider>
  );
}
