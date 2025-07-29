import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignupScreen from './screens/SignupScreen';
import DataExportScreen from './screens/DataExportScreen';
import HomeScreen from './screens/HomeScreen';
import ESignetAuthScreen from './screens/ESignetAuthScreen';
import ViewRecordsScreen from './screens/ViewRecordsScreen';
import ProfileScreen from './screens/ProfileScreen';
import { ThemeProvider } from './contexts/ThemeContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
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
          <Stack.Screen
            name="ESignetAuth"
            component={ESignetAuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ViewRecords"
            component={ViewRecordsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
