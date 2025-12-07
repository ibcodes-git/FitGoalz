import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/pages/LoginScreen';
import RegisterScreen from './src/pages/RegisterScreen';
import DashboardScreen from './src/pages/DashboardScreen';
import FitnessProfileScreen from './src/pages/FitnessProfileScreen';
import { StackScreen } from 'react-native-screens';
import WorkoutHistoryScreen from './src/pages/WorkoutHistoryScreen';
import WorkoutDetailsScreen from './src/pages/WorkoutDetailsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
        <Stack.Screen 
          name="FitnessProfile" 
          component={FitnessProfileScreen}
          options={{ title: 'Fitness Profile' }}
        />
        <Stack.Screen 
        name="WorkoutDetails" 
        component={WorkoutDetailsScreen} 
         options={{ title: 'Workout Details' }}
       />
      </Stack.Navigator>
    </NavigationContainer>
  );
}