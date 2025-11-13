import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { authAPI, workoutsAPI } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('🔄 Fetching user profile...');
      const response = await authAPI.getProfile();
      setUser(response.data);
      console.log('✅ User profile loaded:', response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load user profile');
      console.error('Profile error:', error);
    }
  };

  const generateWorkout = async () => {
    setLoading(true);
    try {
      console.log('🔄 Generating workout plan...');
      const userData = {
        fitness_level: 'beginner',
        goals: 'weight_loss'
      };
      const response = await workoutsAPI.generate(userData);
      setWorkoutPlan(response.data);
      Alert.alert('Success', 'Workout plan generated!');
      console.log('✅ Workout plan:', response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate workout plan');
      console.error('Workout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      Alert.alert('Success', 'Logged out successfully');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>FitGoalz Dashboard</Text>
      
      {user ? (
        <View style={styles.userInfo}>
          <Text style={styles.welcome}>Welcome, {user.username}!</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      ) : (
        <Text style={styles.loadingText}>Loading user info...</Text>
      )}

      <TouchableOpacity 
        style={[styles.workoutButton, loading && styles.buttonDisabled]}
        onPress={generateWorkout}
        disabled={loading}
      >
        <Text style={styles.workoutButtonText}>
          {loading ? 'Generating Workout...' : 'Generate Workout Plan'}
        </Text>
      </TouchableOpacity>

      {workoutPlan && (
        <View style={styles.workoutPlan}>
          <Text style={styles.workoutTitle}>Your Workout Plan</Text>
          <Text style={styles.workoutDetail}>Level: {workoutPlan.fitness_level}</Text>
          <Text style={styles.workoutDetail}>Goal: {workoutPlan.goals}</Text>
          <Text style={styles.workoutDetail}>Duration: {workoutPlan.duration} minutes</Text>
          <Text style={styles.workoutDetail}>Days per week: {workoutPlan.days_per_week}</Text>
          
          <Text style={styles.exercisesTitle}>Exercises:</Text>
          {workoutPlan.exercises && workoutPlan.exercises.map((exercise, index) => (
            <Text key={index} style={styles.exercise}>• {exercise}</Text>
          ))}
        </View>
      )}

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  userInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  welcome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  workoutButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  workoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  workoutPlan: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  workoutDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  exercise: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginBottom: 3,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});