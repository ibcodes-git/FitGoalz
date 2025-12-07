import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, SafeAreaView
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { feedbackAPI } from '../services/api';

export default function WorkoutDetailsScreen({ navigation, route }) {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkoutDetails();
  }, []);

  const fetchWorkoutDetails = async () => {
    try {
      const response = await feedbackAPI.getWorkoutDetails(workoutId);
      setWorkout(response.data);
    } catch (error) {
      console.error('Error fetching workout details:', error);
      setError('Failed to load workout details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading workout details...</Text>
      </View>
    );
  }

  if (error || !workout) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={60} color="#ff6b6b" />
        <Text style={styles.errorText}>{error || 'Workout not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Workout Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Workout Card */}
        <View style={styles.workoutCard}>
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
            style={styles.workoutGradient}
          >
            <Text style={styles.workoutName}>
              {workout.workout_details?.workout_name || 'Workout Session'}
            </Text>
            <Text style={styles.workoutDate}>
              {formatDate(workout.workout_details?.created_at)}
            </Text>
            
            <View style={styles.workoutStats}>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color="white" />
                <Text style={styles.statText}>
                  {workout.workout_details?.duration_minutes || 30} min
                </Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="dumbbell" size={16} color="white" />
                <Text style={styles.statText}>
                  {workout.workout_details?.workout_type || 'ml_generated'}
                </Text>
              </View>
              <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(workout.ai_feedback?.rating || 3) }]}>
                <Text style={styles.ratingText}>{workout.ai_feedback?.rating || 3}/5</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* AI Feedback */}
        {workout.ai_feedback?.feedback_text && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={20} color="#667eea" />
              <Text style={styles.sectionTitle}>AI Feedback</Text>
            </View>
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackText}>{workout.ai_feedback.feedback_text}</Text>
              <View style={styles.feedbackRating}>
                <Text style={styles.ratingLabel}>Rating: </Text>
                <View style={[styles.ratingStars, { backgroundColor: getRatingColor(workout.ai_feedback.rating) }]}>
                  <Text style={styles.ratingValue}>{workout.ai_feedback.rating}/5</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Personal Notes */}
        {workout.workout_details?.personal_notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#ff6b6b" />
              <Text style={styles.sectionTitle}>Your Notes</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{workout.workout_details.personal_notes}</Text>
            </View>
          </View>
        )}

        {/* Workout Plan */}
        {workout.workout_plan && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="barbell" size={20} color="#4CAF50" />
              <Text style={styles.sectionTitle}>Workout Plan</Text>
            </View>
            <View style={styles.planCard}>
              {workout.workout_plan.exercises && workout.workout_plan.exercises.length > 0 && (
                <>
                  <Text style={styles.exercisesTitle}>Exercises ({workout.workout_plan.exercises.length})</Text>
                  {workout.workout_plan.exercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseItem}>
                      <View style={styles.exerciseBullet}>
                        <Text style={styles.exerciseNumber}>{index + 1}</Text>
                      </View>
                      <Text style={styles.exerciseText}>{exercise}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          </View>
        )}

        {/* Completion Data */}
        {workout.completion_data && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="done-all" size={20} color="#FF9800" />
              <Text style={styles.sectionTitle}>Completion</Text>
            </View>
            <View style={styles.completionCard}>
              <View style={styles.completionRow}>
                <Text style={styles.completionLabel}>Exercises Completed:</Text>
                <Text style={styles.completionValue}>
                  {workout.completion_data.completed_exercises || 0} / {workout.completion_data.total_exercises || 0}
                </Text>
              </View>
              {workout.completion_data.completion_rate && (
                <View style={styles.completionRow}>
                  <Text style={styles.completionLabel}>Completion Rate:</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(100, workout.completion_data.completion_rate)}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.completionRate}>
                    {workout.completion_data.completion_rate}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  workoutCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  workoutGradient: {
    padding: 20,
  },
  workoutName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  workoutDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  statText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
  },
  ratingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  feedbackCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  feedbackRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  ratingStars: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  ratingValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  exerciseText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  completionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  completionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  completionRate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 40,
    textAlign: 'right',
  },
});