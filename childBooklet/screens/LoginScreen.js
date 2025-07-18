// screens/LoginScreen.js
import React from 'react';
import { View, Text, Button } from 'react-native';

export default function LoginScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Login Screen</Text>
      <Button title="Go to Signup" onPress={() => navigation.navigate('Signup')} />
      <Button title="Go to Home" onPress={() => navigation.navigate('Home')} />
    </View>
  );
}
