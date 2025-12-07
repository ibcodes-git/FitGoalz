import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { feedbackAPI } from '../services/api';

export default function WorkoutHistoryScreen({ navigation }) {
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [progressAnalytics, setProgressAnalytics] = useState(null);

  useEffect(() => {
    fetchWorkoutHistory();
    fetchProgressAnalytics();
  }, []);

  const fetchWorkoutHistory = async () => {
    try {
      setError(null);
      const response = await feedbackAPI.getMyWorkouts();
      
      console.log('Workout history response:', response.data);
      
      if (response.data && response.data.workouts) {
        setWorkoutHistory(response.data.workouts);
      } else {
        setWorkoutHistory(response.data || []);
      }
      
    } catch (error) {
      console.error('Error fetching workout history:', error);
      setError('Failed to load workout history');
      setWorkoutHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressAnalytics = async () => {
    try {
      const response = await feedbackAPI.getProgressAnalytics();
      console.log('Progress analytics response:', response.data);
      setProgressAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchWorkoutHistory(),
      fetchProgressAnalytics()
    ]);
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingColor = (rating) => {
    if (!rating) return '#999';
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 3.5) return '#8BC34A';
    if (rating >= 2.5) return '#FF9800';
    if (rating >= 1.5) return '#FF5722';
    return '#F44336';
  };

  const getCompletionColor = (rate) => {
    if (!rate) return '#999';
    if (rate >= 90) return '#4CAF50';
    if (rate >= 70) return '#8BC34A';
    if (rate >= 50) return '#FF9800';
    if (rate >= 30) return '#FF5722';
    return '#F44336';
  };

  const handleViewWorkoutDetails = async (workoutId) => {
    console.log('Viewing workout details for ID:', workoutId);
    try {
      const response = await feedbackAPI.getWorkoutDetails(workoutId);
      console.log('Workout details response:', response.data);
      navigation.navigate('WorkoutDetails', { workoutId: workoutId });
    } catch (error) {
      console.error('Error fetching workout details:', error);
      // Show details in a modal instead
      Alert.alert(
        'Workout Details',
        'Could not load full details. Here is a summary of this workout.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderProgressMetrics = () => {
    if (!progressAnalytics) return null;

    return (
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Progress Analytics</Text>
        <View style={styles.progressGrid}>
          <View style={styles.progressCard}>
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
              style={styles.progressGradient}
            >
              <Ionicons name="flame" size={16} color="white" />
              <Text style={styles.progressNumber}>{progressAnalytics.current_streak || 0}</Text>
              <Text style={styles.progressLabel}>Day Streak</Text>
            </LinearGradient>
          </View>

          <View style={styles.progressCard}>
            <LinearGradient
              colors={['rgba(67, 233, 123, 0.9)', 'rgba(56, 249, 215, 0.9)']}
              style={styles.progressGradient}
            >
              <MaterialIcons name="fitness-center" size={16} color="white" />
              <Text style={styles.progressNumber}>{progressAnalytics.total_workouts || 0}</Text>
              <Text style={styles.progressLabel}>Total</Text>
            </LinearGradient>
          </View>

          <View style={styles.progressCard}>
            <LinearGradient
              colors={['rgba(79, 172, 254, 0.9)', 'rgba(0, 242, 254, 0.9)']}
              style={styles.progressGradient}
            >
              <MaterialCommunityIcons name="calendar-week" size={16} color="white" />
              <Text style={styles.progressNumber}>{progressAnalytics.weekly_workouts || 0}</Text>
              <Text style={styles.progressLabel}>This Week</Text>
            </LinearGradient>
          </View>

          <View style={styles.progressCard}>
            <LinearGradient
              colors={['rgba(250, 112, 154, 0.9)', 'rgba(254, 225, 64, 0.9)']}
              style={styles.progressGradient}
            >
              <Ionicons name="stats-chart" size={16} color="white" />
              <Text style={styles.progressNumber}>{progressAnalytics.consistency_score ? `${Math.round(progressAnalytics.consistency_score)}%` : '0%'}</Text>
              <Text style={styles.progressLabel}>Consistency</Text>
            </LinearGradient>
          </View>
        </View>
      </View>
    );
  };

  const renderWorkoutCard = (workout) => {
    const completionRate = workout.completion_rate || 
      Math.round((workout.completion_data?.completed_exercises || 0) / 
                (workout.completion_data?.total_exercises || 1) * 100);

    return (
      <TouchableOpacity 
        key={workout.id}
        style={styles.workoutCard}
        onPress={() => handleViewWorkoutDetails(workout.id)}
      >
        <View style={styles.workoutHeader}>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutDate}>
              {formatDateTime(workout.created_at)}
            </Text>
            <Text style={styles.workoutName}>
              {workout.workout_name || workout.workout_plan?.plan_name || 'Workout Session'}
            </Text>
            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={10} color="#666" />
                <Text style={styles.metaText}>{workout.duration_minutes || 30} min</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="weight-lifter" size={10} color="#666" />
                <Text style={styles.metaText}>{workout.workout_type || 'ml_generated'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="barbell" size={10} color="#666" />
                <Text style={styles.metaText}>
                  {workout.exercises_logged?.length || workout.workout_plan?.exercises?.length || 0} exercises
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.ratingsContainer}>
            <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(workout.rating || 3) }]}>
              <Text style={styles.ratingText}>{workout.rating || 3}/5</Text>
            </View>
            <View style={[styles.completionBadge, { backgroundColor: getCompletionColor(completionRate) }]}>
              <Text style={styles.completionText}>{completionRate}%</Text>
            </View>
          </View>
        </View>
        
        {/* Show feedback preview */}
        {workout.feedback_text && (
          <View style={styles.feedbackPreview}>
            <Text style={styles.feedbackPreviewText} numberOfLines={2}>
              {workout.feedback_text}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading workout history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#667eea" />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Workout History</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons name="refresh" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Track your fitness journey and progress
        </Text>

        {/* Progress Analytics */}
        {renderProgressMetrics()}

        {/* Workout History */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recent Workouts ({workoutHistory.length})
            </Text>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <LinearGradient
                colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                style={styles.generateGradient}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text style={styles.generateButtonText}>New Workout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={40} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchWorkoutHistory}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : workoutHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons name="history" size={60} color="rgba(102, 126, 234, 0.7)" />
              </View>
              <Text style={styles.emptyStateTitle}>No Workouts Yet</Text>
              <Text style={styles.emptyStateText}>
                Complete your first workout to see your history and track progress
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Dashboard')}
              >
                <LinearGradient
                  colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                  style={styles.emptyGradient}
                >
                  <Ionicons name="barbell" size={16} color="white" />
                  <Text style={styles.emptyButtonText}>Generate Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.historyList}>
              {workoutHistory.map(renderWorkoutCard)}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressCard: {
    width: '48%',
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  progressGradient: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  historySection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  generateButton: {
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  generateGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 12,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyButton: {
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 200,
  },
  emptyGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  historyList: {
    marginBottom: 16,
  },
  workoutCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutInfo: {
    flex: 1,
    marginRight: 12,
  },
  workoutDate: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  ratingsContainer: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 6,
    minWidth: 45,
    alignItems: 'center',
  },
  ratingText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  completionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  completionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  feedbackPreview: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  feedbackPreviewText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});