import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { authAPI, workoutsAPI } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generationMethod, setGenerationMethod] = useState('ml'); // 'ml' or 'ai'

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Profile error:', error);
    }
  };

  const generateWorkout = async (method = 'ml') => {
    setLoading(true);
    setGenerationMethod(method);
    
    try {
      let response;
      
      if (method === 'ml') {
        response = await workoutsAPI.generateMLWorkout();
      } else if (method === 'ai') {
        response = await workoutsAPI.generateAIWorkout();
      }
      
      setWorkoutPlan(response.data);
      Alert.alert('Success', `${method.toUpperCase()} workout generated!`);
    } catch (error) {
      Alert.alert('Error', `Failed to generate ${method.toUpperCase()} workout`);
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

      {/* Workout Generation Options */}
      <View style={styles.generationSection}>
        <Text style={styles.sectionTitle}>Generate Workout Plan</Text>
        <Text style={styles.sectionSubtitle}>Choose your generation method:</Text>
        
        <View style={styles.methodButtons}>
          <TouchableOpacity 
            style={[
              styles.methodButton, 
              generationMethod === 'ml' && styles.methodButtonActive,
              loading && styles.buttonDisabled
            ]}
            onPress={() => generateWorkout('ml')}
            disabled={loading}
          >
            <Text style={styles.methodIcon}>⚡</Text>
            <Text style={styles.methodButtonText}>Machine Learning</Text>
            <Text style={styles.methodDescription}>Fast & Consistent</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.methodButton, 
              generationMethod === 'ai' && styles.methodButtonActive,
              loading && styles.buttonDisabled
            ]}
            onPress={() => generateWorkout('ai')}
            disabled={loading}
          >
            <Text style={styles.methodIcon}>🤖</Text>
            <Text style={styles.methodButtonText}>AI Powered</Text>
            <Text style={styles.methodDescription}>Creative & Detailed</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.generationInfo}>
          {generationMethod === 'ml' 
            ? 'ML: Instant workout based on fitness rules' 
            : 'AI: Personalized plan with creative exercises'
          }
        </Text>
      </View>

      {/* Workout Plan Display */}
      {workoutPlan && (
        <View style={styles.workoutPlan}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle}>
              {workoutPlan.workout?.plan_name || workoutPlan.plan_name}
            </Text>
            <View style={[
              styles.generationBadge,
              generationMethod === 'ai' ? styles.aiBadge : styles.mlBadge
            ]}>
              <Text style={styles.badgeText}>
                {generationMethod.toUpperCase()} GENERATED
              </Text>
            </View>
          </View>

          <Text style={styles.workoutDetail}>Level: {workoutPlan.workout?.fitness_level || workoutPlan.fitness_level}</Text>
          <Text style={styles.workoutDetail}>Goal: {workoutPlan.workout?.goal || workoutPlan.goal}</Text>
          <Text style={styles.workoutDetail}>Duration: {workoutPlan.workout?.duration || workoutPlan.duration} minutes</Text>
          <Text style={styles.workoutDetail}>Days per week: {workoutPlan.workout?.days_per_week || workoutPlan.days_per_week}</Text>
          
          {workoutPlan.bmi_analysis && (
            <Text style={styles.workoutDetail}>BMI Analysis: {workoutPlan.bmi_analysis}</Text>
          )}

          <Text style={styles.exercisesTitle}>Exercises:</Text>
          {(workoutPlan.workout?.exercises || workoutPlan.exercises || []).map((exercise, index) => (
            <Text key={index} style={styles.exercise}>• {exercise}</Text>
          ))}

          {/* AI-specific content */}
          {workoutPlan.progression_tips && workoutPlan.progression_tips.length > 0 && (
            <>
              <Text style={styles.exercisesTitle}>Progression Tips:</Text>
              {workoutPlan.progression_tips.map((tip, index) => (
                <Text key={index} style={styles.exercise}>• {tip}</Text>
              ))}
            </>
          )}

          {workoutPlan.recommendations && workoutPlan.recommendations.length > 0 && (
            <>
              <Text style={styles.exercisesTitle}>Recommendations:</Text>
              {workoutPlan.recommendations.map((rec, index) => (
                <Text key={index} style={styles.exercise}>• {rec}</Text>
              ))}
            </>
          )}
        </View>
      )}

      {/* Additional Actions */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('FitnessProfile')}
        >
          <Text style={styles.secondaryButtonText}>Edit Fitness Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('WorkoutHistory')}
        >
          <Text style={styles.secondaryButtonText}>Workout History</Text>
        </TouchableOpacity>
      </View>

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
  generationSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  methodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  methodButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  methodButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f2ff',
  },
  methodIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  methodDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  generationInfo: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  workoutPlan: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  generationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  mlBadge: {
    backgroundColor: '#28a745',
  },
  aiBadge: {
    backgroundColor: '#17a2b8',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
  actionSection: {
    marginBottom: 20,
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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