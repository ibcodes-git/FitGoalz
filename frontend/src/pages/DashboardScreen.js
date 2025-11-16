import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
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
      const response = await authAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Profile error:', error);
    }
  };

  const generateWorkout = async () => {
  setLoading(true);
  
  try {
    const response = await workoutsAPI.generateWorkout(); // This calls the ML endpoint
    setWorkoutPlan(response.data);
    Alert.alert('Success', 'Personalized workout generated!');
  } catch (error) {
    Alert.alert('Error', 'Failed to generate workout. Please complete your fitness profile first.');
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

      {/* Workout Generation Section */}
      <View style={styles.generationSection}>
        <Text style={styles.sectionTitle}>Generate Workout Plan</Text>
        <Text style={styles.sectionSubtitle}>
          Get a personalized workout based on your fitness profile
        </Text>
        
        <TouchableOpacity 
          style={[
            styles.generateButton,
            loading && styles.buttonDisabled
          ]}
          onPress={generateWorkout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.generateIcon}>⚡</Text>
              <Text style={styles.generateButtonText}>Generate ML Workout</Text>
              <Text style={styles.generateDescription}>Fast & Personalized</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.generationInfo}>
          Uses machine learning to create workouts based on your age, fitness level, goals, and equipment
        </Text>
      </View>

      {/* Workout Plan Display */}
      {workoutPlan && (
        <View style={styles.workoutPlan}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutTitle}>
              {workoutPlan.workout?.plan_name || workoutPlan.plan_name}
            </Text>
            <View style={styles.generationBadge}>
              <Text style={styles.badgeText}>ML GENERATED</Text>
            </View>
          </View>

          <Text style={styles.workoutDetail}>
            Level: {workoutPlan.workout?.fitness_level || workoutPlan.fitness_level}
          </Text>
          <Text style={styles.workoutDetail}>
            Goal: {workoutPlan.workout?.goal || workoutPlan.goal}
          </Text>
          <Text style={styles.workoutDetail}>
            Duration: {workoutPlan.workout?.duration || workoutPlan.duration} minutes
          </Text>
          <Text style={styles.workoutDetail}>
            Days per week: {workoutPlan.workout?.days_per_week || workoutPlan.days_per_week}
          </Text>
          
          {workoutPlan.bmi_analysis && (
            <Text style={styles.workoutDetail}>
              BMI Analysis: {workoutPlan.bmi_analysis}
            </Text>
          )}

          <Text style={styles.exercisesTitle}>Exercises:</Text>
          {(workoutPlan.workout?.exercises || workoutPlan.exercises || []).map((exercise, index) => (
            <Text key={index} style={styles.exercise}>• {exercise}</Text>
          ))}

          {/* Workout Structure */}
          {workoutPlan.workout_structure && workoutPlan.workout_structure.length > 0 && (
            <>
              <Text style={styles.exercisesTitle}>Workout Structure:</Text>
              {workoutPlan.workout_structure.map((item, index) => (
                <Text key={index} style={styles.exercise}>
                  • {item.exercise}: {item.sets} sets × {item.reps} (rest: {item.rest})
                </Text>
              ))}
            </>
          )}

          {/* Recommendations */}
          {workoutPlan.recommendations && workoutPlan.recommendations.length > 0 && (
            <>
              <Text style={styles.exercisesTitle}>Recommendations:</Text>
              {workoutPlan.recommendations.map((rec, index) => (
                <Text key={index} style={styles.exercise}>• {rec}</Text>
              ))}
            </>
          )}

          {/* Advantages */}
          {workoutPlan.advantages && (
            <View style={styles.advantagesSection}>
              <Text style={styles.advantagesTitle}>Benefits:</Text>
              {workoutPlan.advantages.map((advantage, index) => (
                <Text key={index} style={styles.advantage}>✓ {advantage}</Text>
              ))}
            </View>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  generateIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  generateDescription: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
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
    backgroundColor: '#28a745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
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
  advantagesSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  advantagesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 5,
  },
  advantage: {
    fontSize: 14,
    color: '#28a745',
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