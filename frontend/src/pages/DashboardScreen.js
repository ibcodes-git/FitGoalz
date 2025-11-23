import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { authAPI, workoutsAPI, feedbackAPI } from '../services/api'; // Added feedbackAPI import

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);

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
      const response = await workoutsAPI.generateWorkout();
      setWorkoutPlan(response.data);
      Alert.alert('Success', 'Personalized workout generated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate workout. Please complete your fitness profile first.');
      console.error('Workout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced workout logging function
  const logCurrentWorkout = async () => {
    if (!workoutPlan) {
      Alert.alert('Error', 'Please generate a workout first');
      return;
    }

    setLoggingWorkout(true);
    try {
      const workoutData = {
        workout_name: workoutPlan.workout?.plan_name || workoutPlan.plan_name || "Generated Workout",
        workout_type: "ml_generated",
        duration_minutes: workoutPlan.workout?.duration || workoutPlan.duration || 30,
        difficulty_rating: difficultyRating,
        energy_level: energyLevel,
        personal_notes: workoutNotes,
        workout_plan: workoutPlan.workout || workoutPlan,
        completion_data: {
          completed_exercises: workoutPlan.workout?.exercises?.length || workoutPlan.exercises?.length || 0,
          total_exercises: workoutPlan.workout?.exercises?.length || workoutPlan.exercises?.length || 0
        },
        exercises_logged: (workoutPlan.workout?.exercises || workoutPlan.exercises || []).map(exercise => ({
          name: exercise,
          sets_completed: 3,
          reps_completed: "8-12",
          weight_used: null,
          notes: ""
        }))
      };

      const response = await feedbackAPI.logWorkout(workoutData);
      
      // Show AI feedback to user
      Alert.alert(
        'Workout Logged Successfully!', 
        `AI Feedback: ${response.data.feedback.feedback_text}\n\nRating: ${response.data.feedback.rating}/5`
      );
      
      // Reset form
      setWorkoutNotes('');
      setDifficultyRating(3);
      setEnergyLevel(3);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to log workout');
      console.error('Log workout error:', error);
    } finally {
      setLoggingWorkout(false);
    }
  };

  // Quick log function (no user input needed)
  const quickLogWorkout = async () => {
    if (!workoutPlan) {
      Alert.alert('Error', 'Please generate a workout first');
      return;
    }

    setLoggingWorkout(true);
    try {
      const workoutData = {
        workout_name: workoutPlan.workout?.plan_name || workoutPlan.plan_name || "Quick Workout",
        workout_type: "ml_generated",
        duration_minutes: workoutPlan.workout?.duration || workoutPlan.duration || 30,
        difficulty_rating: 3,
        energy_level: 3,
        personal_notes: "Quick log - completed workout",
        workout_plan: workoutPlan.workout || workoutPlan,
        completion_data: {
          completed_exercises: workoutPlan.workout?.exercises?.length || workoutPlan.exercises?.length || 0,
          total_exercises: workoutPlan.workout?.exercises?.length || workoutPlan.exercises?.length || 0
        }
      };

      const response = await feedbackAPI.logWorkout(workoutData);
      Alert.alert('Success', 'Workout logged quickly!');
      
    } catch (error) {
      Alert.alert('Error', 'Failed to log workout');
      console.error('Quick log error:', error);
    } finally {
      setLoggingWorkout(false);
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

  const RatingSelector = ({ title, value, onValueChange }) => (
    <View style={styles.ratingSection}>
      <Text style={styles.ratingTitle}>{title}</Text>
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.ratingButton,
              value === rating && styles.ratingButtonSelected
            ]}
            onPress={() => onValueChange(rating)}
          >
            <Text style={[
              styles.ratingText,
              value === rating && styles.ratingTextSelected
            ]}>
              {rating}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

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

          {/* Workout Logging Section - Only show when workout is generated */}
          <View style={styles.loggingSection}>
            <Text style={styles.loggingTitle}>Log This Workout</Text>
            
            <RatingSelector 
              title="How difficult was this workout?"
              value={difficultyRating}
              onValueChange={setDifficultyRating}
            />
            
            <RatingSelector 
              title="How was your energy level?"
              value={energyLevel}
              onValueChange={setEnergyLevel}
            />
            
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Workout Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={workoutNotes}
                onChangeText={setWorkoutNotes}
                placeholder="How did you feel? Any observations?"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.loggingButtons}>
              <TouchableOpacity 
                style={[styles.quickLogButton, loggingWorkout && styles.buttonDisabled]}
                onPress={quickLogWorkout}
                disabled={loggingWorkout}
              >
                <Text style={styles.quickLogButtonText}>
                  {loggingWorkout ? 'Logging...' : 'Quick Log'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.detailedLogButton, loggingWorkout && styles.buttonDisabled]}
                onPress={logCurrentWorkout}
                disabled={loggingWorkout}
              >
                <Text style={styles.detailedLogButtonText}>
                  {loggingWorkout ? 'Logging...' : 'Log with Details'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
          <Text style={styles.secondaryButtonText}>View Workout History</Text>
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
  // New styles for workout logging
  loggingSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  loggingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  ratingSection: {
    marginBottom: 15,
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ratingButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#0056CC',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  ratingTextSelected: {
    color: 'white',
  },
  notesSection: {
    marginBottom: 15,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  loggingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickLogButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  quickLogButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailedLogButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  detailedLogButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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