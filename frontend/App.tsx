import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/pages/LoginScreen';
import RegisterScreen from './src/pages/RegisterScreen';
import DashboardScreen from './src/pages/DashboardScreen';
import FitnessProfileScreen from './src/pages/FitnessProfileScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen 
          name="FitnessProfile" 
          component={FitnessProfileScreen}
          options={{ title: 'Fitness Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}