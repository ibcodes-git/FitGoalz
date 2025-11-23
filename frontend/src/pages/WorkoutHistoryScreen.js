import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { feedbackAPI } from '../services/api';

export default function WorkoutHistoryScreen({ navigation }) {
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  useEffect(() => {
    fetchWorkoutHistory();
  }, []);


const fetchWorkoutHistory = async () => {
  try {
    const response = await feedbackAPI.getMyWorkouts();
    
    // Handle both response structures
    const workouts = response.data.workouts || [];
    const message = response.data.message;
    
    setWorkoutHistory(workouts);
    
    if (workouts.length === 0) {
      console.log('No workouts found:', message);
    }
    
  } catch (error) {
    console.error('Error fetching workout history:', error);
    
    if (error.response?.status === 500) {
      setWorkoutHistory([]); // Set empty array instead of error
    } else {
      setError('Failed to load workout history');
    }
  } finally {
    setLoading(false);
  }
};

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#4CAF50';
    if (rating >= 3) return '#FF9800';
    return '#F44336';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading workout history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Workout History</Text>
      
      {workoutHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Workouts Yet</Text>
          <Text style={styles.emptyStateText}>
            Complete your first workout to see your history here!
          </Text>
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.generateButtonText}>Generate Workout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.historyList}>
          <Text style={styles.sectionTitle}>
            Completed Workouts: {workoutHistory.length}
          </Text>
          
          {workoutHistory.map((workout, index) => (
            <TouchableOpacity 
              key={workout.id}
              style={styles.workoutCard}
              onPress={() => setSelectedWorkout(selectedWorkout?.id === workout.id ? null : workout)}
            >
              <View style={styles.workoutHeader}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutDate}>
                    {formatDate(workout.created_at)}
                  </Text>
                  <Text style={styles.workoutPlan}>
                    {workout.workout_plan?.plan_name || 'Workout Session'}
                  </Text>
                </View>
                <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(workout.rating) }]}>
                  <Text style={styles.ratingText}>{workout.rating}/5</Text>
                </View>
              </View>

              {selectedWorkout?.id === workout.id && (
                <View style={styles.workoutDetails}>
                  <Text style={styles.feedbackTitle}>AI Feedback:</Text>
                  <Text style={styles.feedbackText}>{workout.feedback_text}</Text>
                  
                  {workout.workout_plan?.exercises && (
                    <>
                      <Text style={styles.exercisesTitle}>Exercises:</Text>
                      {workout.workout_plan.exercises.map((exercise, idx) => (
                        <Text key={idx} style={styles.exercise}>• {exercise}</Text>
                      ))}
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  historyList: {
    marginBottom: 20,
  },
  workoutCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  workoutPlan: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  ratingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  workoutDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  exercisesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  exercise: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginBottom: 2,
  },
});