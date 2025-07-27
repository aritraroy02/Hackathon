import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DataExportScreen from './screens/DataExportScreen';
import HomeScreen from './screens/HomeScreen';
import { ThemeProvider } from './contexts/ThemeContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen 
            name="Signup" 
            component={SignupScreen} 
            options={{ title: 'Register User' }}
          />
          <Stack.Screen 
            name="DataExport" 
            component={DataExportScreen} 
            options={{ title: 'Data Export & Sharing' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
