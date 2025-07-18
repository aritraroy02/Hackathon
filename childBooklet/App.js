import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DataExportScreen from './screens/DataExportScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Signup">
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
  );
}
