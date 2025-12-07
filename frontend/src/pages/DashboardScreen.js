import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, 
  ActivityIndicator, Dimensions, Modal, TextInput, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons, FontAwesome, AntDesign } from '@expo/vector-icons';
import { authAPI, workoutsAPI, feedbackAPI, userAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [fitnessProfile, setFitnessProfile] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    caloriesBurned: 0,
    streakDays: 0,
    avgRating: 0
  });
  
  // Workout Logging States
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [workoutLogData, setWorkoutLogData] = useState({
    difficulty_rating: 3,
    energy_level: 3,
    personal_notes: '',
    completion_rate: 100,
    exercises_completed: []
  });

  useEffect(() => {
    fetchUserProfile();
    fetchFitnessProfile();
    calculateStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchWorkoutHistory();
    }
    if (activeTab === 'workout' && workoutPlan) {
      initializeWorkoutLogData();
    }
  }, [activeTab, workoutPlan]);

  useEffect(() => {
    if (workoutHistory.length > 0) {
      calculateStats();
    }
  }, [workoutHistory]);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Profile error:', error);
    }
  };

  const fetchFitnessProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data) {
        setFitnessProfile(response.data);
      }
    } catch (error) {
      console.log('No fitness profile found');
    }
  };

  const fetchWorkoutHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await feedbackAPI.getMyWorkouts();
      const workouts = response.data.workouts || [];
      setWorkoutHistory(workouts);
    } catch (error) {
      console.error('Error fetching workout history:', error);
      setWorkoutHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const calculateStats = () => {
    const totalWorkouts = workoutHistory.length;
    const caloriesBurned = workoutHistory.reduce((sum, workout) => sum + (workout.calories_burned || 0), 0);
    const avgRating = workoutHistory.length > 0 
      ? (workoutHistory.reduce((sum, workout) => sum + (workout.rating || 0), 0) / workoutHistory.length).toFixed(1)
      : 0;
    
    // Calculate streak (simplified)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const streakDays = workoutHistory.filter(w => {
      const workoutDate = new Date(w.created_at);
      return workoutDate.toDateString() === today.toDateString() || 
             workoutDate.toDateString() === yesterday.toDateString();
    }).length;

    setStats({
      totalWorkouts,
      caloriesBurned,
      streakDays,
      avgRating: parseFloat(avgRating)
    });
  };

  const initializeWorkoutLogData = () => {
    if (workoutPlan) {
      const exercises = workoutPlan.workout?.exercises || workoutPlan.exercises || [];
      setWorkoutLogData({
        difficulty_rating: 3,
        energy_level: 3,
        personal_notes: '',
        completion_rate: 100,
        exercises_completed: exercises.map(exercise => ({
          name: exercise,
          completed: true,
          notes: ''
        }))
      });
    }
  };

  const generateWorkout = async () => {
    setLoading(true);
    try {
      const response = await workoutsAPI.generateWorkout();
      setWorkoutPlan(response.data);
      Alert.alert('Success', 'Personalized workout generated!');
      initializeWorkoutLogData();
    } catch (error) {
      Alert.alert('Error', 'Failed to generate workout. Please complete your fitness profile first.');
      console.error('Workout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExerciseCompletion = (index) => {
    const updatedExercises = [...workoutLogData.exercises_completed];
    updatedExercises[index] = {
      ...updatedExercises[index],
      completed: !updatedExercises[index].completed
    };
    
    const completedCount = updatedExercises.filter(ex => ex.completed).length;
    const completionRate = Math.round((completedCount / updatedExercises.length) * 100);
    
    setWorkoutLogData(prev => ({
      ...prev,
      exercises_completed: updatedExercises,
      completion_rate: completionRate
    }));
  };

  const enhancedLogWorkout = async () => {
    if (!workoutPlan) {
      Alert.alert('Error', 'Please generate a workout first');
      return;
    }

    setLoggingWorkout(true);
    try {
      const exercises = workoutPlan.workout?.exercises || workoutPlan.exercises || [];
      const completedExercises = workoutLogData.exercises_completed.filter(ex => ex.completed).length;
      
      const workoutData = {
        workout_name: workoutPlan.workout?.plan_name || workoutPlan.plan_name || "ML Generated Workout",
        workout_type: "ml_generated",
        duration_minutes: workoutPlan.workout?.duration || workoutPlan.duration || 30,
        difficulty_rating: workoutLogData.difficulty_rating,
        energy_level: workoutLogData.energy_level,
        personal_notes: workoutLogData.personal_notes,
        workout_plan: workoutPlan.workout || workoutPlan,
        exercises_logged: exercises,
        completion_data: {
          completed_exercises: completedExercises,
          total_exercises: exercises.length,
          completion_rate: workoutLogData.completion_rate
        }
      };

      const response = await feedbackAPI.logWorkout(workoutData);
      
      Alert.alert(
        '✅ Workout Logged Successfully!', 
        `AI Feedback: ${response.data.feedback.feedback_text}\n\nRating: ${response.data.feedback.rating}/5\nCompletion: ${workoutLogData.completion_rate}%`,
        [
          {
            text: 'View History',
            onPress: () => {
              setActiveTab('history');
              fetchWorkoutHistory();
            }
          },
          {
            text: 'Close',
            style: 'cancel'
          }
        ]
      );
      
      // Reset form
      setShowLogModal(false);
      setWorkoutLogData({
        difficulty_rating: 3,
        energy_level: 3,
        personal_notes: '',
        completion_rate: 100,
        exercises_completed: []
      });
      
    } catch (error) {
      console.error('Workout logging error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.detail || 'Failed to log workout. Please try again.'
      );
    } finally {
      setLoggingWorkout(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await authAPI.logout();
              navigation.navigate('Login');
            } catch (error) {
              Alert.alert('Error', 'Logout failed');
            }
          }
        }
      ]
    );
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

  const calculateBMI = () => {
    if (fitnessProfile?.weight && fitnessProfile?.height) {
      const heightInMeters = fitnessProfile.height / 100;
      const bmi = fitnessProfile.weight / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return 'N/A';
  };

  const getBMIStatus = (bmi) => {
    if (bmi === 'N/A') return { color: '#666', label: 'N/A' };
    const numBMI = parseFloat(bmi);
    if (numBMI < 18.5) return { color: '#2196F3', label: 'Underweight' };
    if (numBMI < 25) return { color: '#4CAF50', label: 'Normal' };
    if (numBMI < 30) return { color: '#FF9800', label: 'Overweight' };
    return { color: '#F44336', label: 'Obese' };
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  // Tab-specific background renderer
  const renderTabBackground = (tab) => {
    switch(tab) {
      case 'home':
        return (
          <ImageBackground
            source={require('../assets/images/dashboard-bg.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.97)', 'rgba(248, 249, 250, 0.97)']}
              style={styles.overlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </ImageBackground>
        );
      case 'workout':
        return (
          <ImageBackground
            source={require('../assets/images/workout-bg.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.92)', 'rgba(240, 248, 255, 0.92)']}
              style={styles.overlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </ImageBackground>
        );
      case 'history':
        return (
          <ImageBackground
            source={require('../assets/images/logo.jpg')}
            style={styles.logoBackground}
            resizeMode="contain"
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(245, 247, 250, 0.95)']}
              style={styles.overlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </ImageBackground>
        );
      case 'profile':
        return (
          <ImageBackground
            source={require('../assets/images/dashboard-bg.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.97)', 'rgba(250, 250, 252, 0.97)']}
              style={styles.overlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </ImageBackground>
        );
      default:
        return (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.97)', 'rgba(248, 249, 250, 0.97)']}
            style={styles.overlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        );
    }
  };

  // Tab Content Renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScrollView 
            style={styles.tabScrollView}
            contentContainerStyle={styles.tabScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome Header */}
            <View style={styles.welcomeCard}>
              <LinearGradient
                colors={['rgba(102, 126, 234, 0.95)', 'rgba(118, 75, 162, 0.95)']}
                style={styles.welcomeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.welcomeHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.welcomeTextContainer}>
                      <Text style={styles.greetingText}>Good {getTimeOfDay()},</Text>
                      <Text style={styles.userName}>{user?.username || 'User'}</Text>
                    </View>
                  </View>
                  <View style={styles.statsBadge}>
                    <Ionicons name="flame" size={16} color="#FF6B6B" />
                    <Text style={styles.statsBadgeText}>{stats.streakDays} day streak</Text>
                  </View>
                </View>
                
                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <MaterialCommunityIcons name="dumbbell" size={18} color="#667eea" />
                    </View>
                    <View>
                      <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
                      <Text style={styles.statLabel}>Workouts</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <Ionicons name="flame" size={18} color="#FF6B6B" />
                    </View>
                    <View>
                      <Text style={styles.statValue}>{stats.caloriesBurned}</Text>
                      <Text style={styles.statLabel}>Calories</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                      <FontAwesome name="star" size={16} color="#FFD700" />
                    </View>
                    <View>
                      <Text style={styles.statValue}>{stats.avgRating}</Text>
                      <Text style={styles.statLabel}>Avg Rating</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <Ionicons name="flash" size={20} color="#667eea" />
              </View>
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => setActiveTab('workout')}
                >
                  <LinearGradient
                    colors={['rgba(250, 112, 154, 0.9)', 'rgba(254, 225, 64, 0.9)']}
                    style={styles.quickActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.quickActionIcon}>
                      <FontAwesome5 name="dumbbell" size={22} color="white" />
                    </View>
                    <Text style={styles.quickActionText}>New Workout</Text>
                    <Text style={styles.quickActionSubtext}>Generate AI workout</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => navigation.navigate('FitnessProfile')}
                >
                  <LinearGradient
                    colors={['rgba(67, 233, 123, 0.9)', 'rgba(56, 249, 215, 0.9)']}
                    style={styles.quickActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="fitness" size={24} color="white" />
                    </View>
                    <Text style={styles.quickActionText}>Edit Profile</Text>
                    <Text style={styles.quickActionSubtext}>Update preferences</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => setActiveTab('history')}
                >
                  <LinearGradient
                    colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                    style={styles.quickActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.quickActionIcon}>
                      <MaterialIcons name="history" size={22} color="white" />
                    </View>
                    <Text style={styles.quickActionText}>History</Text>
                    <Text style={styles.quickActionSubtext}>View progress</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickActionCard}
                  onPress={() => setActiveTab('profile')}
                >
                  <LinearGradient
                    colors={['rgba(255, 107, 107, 0.9)', 'rgba(255, 159, 67, 0.9)']}
                    style={styles.quickActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="person" size={22} color="white" />
                    </View>
                    <Text style={styles.quickActionText}>Profile</Text>
                    <Text style={styles.quickActionSubtext}>Account settings</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fitness Profile Summary */}
            {fitnessProfile && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Fitness Profile</Text>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => navigation.navigate('FitnessProfile')}
                  >
                    <Ionicons name="create-outline" size={18} color="#667eea" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.fitnessDetailsCard}>
                  <View style={styles.statsGrid}>
                    <View style={styles.statContainer}>
                      <View style={styles.statCircle}>
                        <Text style={styles.statCircleValue}>{fitnessProfile.age || 'N/A'}</Text>
                      </View>
                      <Text style={styles.statLabelSmall}>Age</Text>
                    </View>
                    
                    <View style={styles.statContainer}>
                      <View style={styles.statCircle}>
                        <Text style={styles.statCircleValue}>{fitnessProfile.weight || 'N/A'}</Text>
                        <Text style={styles.statUnit}>kg</Text>
                      </View>
                      <Text style={styles.statLabelSmall}>Weight</Text>
                    </View>
                    
                    <View style={styles.statContainer}>
                      <View style={styles.statCircle}>
                        <Text style={styles.statCircleValue}>{fitnessProfile.height || 'N/A'}</Text>
                        <Text style={styles.statUnit}>cm</Text>
                      </View>
                      <Text style={styles.statLabelSmall}>Height</Text>
                    </View>
                    
                    <View style={styles.statContainer}>
                      <View style={[styles.statCircle, { backgroundColor: getBMIStatus(calculateBMI()).color + '20' }]}>
                        <Text style={[styles.statCircleValue, { color: getBMIStatus(calculateBMI()).color }]}>
                          {calculateBMI()}
                        </Text>
                      </View>
                      <Text style={styles.statLabelSmall}>BMI</Text>
                    </View>
                  </View>
                  
                  {calculateBMI() !== 'N/A' && (
                    <View style={styles.bmiStatus}>
                      <Text style={[styles.bmiStatusText, { color: getBMIStatus(calculateBMI()).color }]}>
                        {getBMIStatus(calculateBMI()).label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Recent Activity */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity onPress={() => setActiveTab('history')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {workoutHistory.slice(0, 3).map((workout, index) => (
                <TouchableOpacity key={workout.id} style={styles.recentWorkoutCard}>
                  <View style={styles.recentWorkoutIcon}>
                    <FontAwesome5 name="running" size={16} color="#667eea" />
                  </View>
                  <View style={styles.recentWorkoutInfo}>
                    <Text style={styles.recentWorkoutName} numberOfLines={1}>
                      {workout.workout_name || workout.workout_plan?.plan_name || 'Workout Session'}
                    </Text>
                    <Text style={styles.recentWorkoutDate}>
                      {formatDate(workout.created_at)} • {workout.duration_minutes || 30} min
                    </Text>
                  </View>
                  <View style={[styles.recentRatingBadge, { backgroundColor: getRatingColor(workout.rating) + '20' }]}>
                    <Text style={[styles.recentRatingText, { color: getRatingColor(workout.rating) }]}>
                      {workout.rating}/5
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {workoutHistory.length === 0 && (
                <View style={styles.noRecentActivity}>
                  <Ionicons name="calendar-outline" size={48} color="#667eea" style={styles.noRecentIcon} />
                  <Text style={styles.noRecentText}>No workouts yet</Text>
                  <Text style={styles.noRecentSubtext}>Start your fitness journey today!</Text>
                  <TouchableOpacity 
                    style={styles.startButton}
                    onPress={() => setActiveTab('workout')}
                  >
                    <Text style={styles.startButtonText}>Start First Workout</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Daily Tip */}
            <View style={styles.tipCard}>
              <LinearGradient
                colors={['rgba(255, 241, 242, 0.9)', 'rgba(233, 246, 255, 0.9)']}
                style={styles.tipGradient}
              >
                <View style={styles.tipIcon}>
                  <Ionicons name="bulb-outline" size={24} color="#667eea" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Daily Tip</Text>
                  <Text style={styles.tipText}>
                    Stay hydrated! Drink at least 8 glasses of water throughout your workout for better performance.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        );

      case 'workout':
        return (
          <ScrollView 
            style={styles.tabScrollView}
            contentContainerStyle={[styles.tabScrollContent, styles.workoutTabContent]}
            showsVerticalScrollIndicator={false}
          >
            {/* Workout Header */}
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.85)', 'rgba(118, 75, 162, 0.85)']}
              style={styles.workoutHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.workoutHeaderContent}>
                <Text style={styles.workoutTabTitle}>Workouts</Text>
                <Text style={styles.workoutTabSubtitle}>AI-powered personalized fitness</Text>
              </View>
            </LinearGradient>

            {/* Generate Workout Section */}
            <View style={styles.generateSection}>
              <View style={styles.generateHeader}>
                <View>
                  <Text style={styles.generateTitle}>Generate New Workout</Text>
                  <Text style={styles.generateSubtitle}>Based on your fitness profile & goals</Text>
                </View>
                {workoutPlan && (
                  <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={generateWorkout}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                      style={styles.refreshGradient}
                    >
                      <Ionicons name="refresh" size={20} color="white" />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              {!workoutPlan ? (
                <View style={styles.noWorkoutContainer}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.95)', 'rgba(245, 245, 245, 0.95)']}
                    style={styles.noWorkoutGradient}
                  >
                    <View style={styles.noWorkoutIcon}>
                      <FontAwesome5 name="dumbbell" size={50} color="rgba(102, 126, 234, 0.7)" />
                      <View style={styles.sparkleEffect}>
                        <Ionicons name="sparkles" size={24} color="#FFD700" />
                      </View>
                    </View>
                    <Text style={styles.noWorkoutTitle}>No Workout Generated</Text>
                    <Text style={styles.noWorkoutText}>
                      Generate a personalized workout based on your fitness profile and goals
                    </Text>
                    <TouchableOpacity 
                      style={styles.generateButton}
                      onPress={generateWorkout}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                        style={styles.generateGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {loading ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <Ionicons name="sparkles" size={20} color="white" />
                            <Text style={styles.generateButtonText}>Generate Workout</Text>
                            <Ionicons name="arrow-forward" size={16} color="white" style={styles.arrowIcon} />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.workoutPlanCard}>
                  <LinearGradient
                    colors={['rgba(168, 237, 234, 0.95)', 'rgba(254, 214, 227, 0.95)']}
                    style={styles.workoutPlanGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {/* Plan Header */}
                    <View style={styles.workoutPlanHeader}>
                      <View>
                        <Text style={styles.workoutPlanTitle}>
                          {workoutPlan.workout?.plan_name || workoutPlan.plan_name}
                        </Text>
                        <View style={styles.workoutPlanBadge}>
                          <Ionicons name="sparkles" size={10} color="#ff6b6b" />
                          <Text style={styles.workoutPlanBadgeText}>AI Generated</Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.saveButton}>
                        <Ionicons name="bookmark-outline" size={20} color="#667eea" />
                      </TouchableOpacity>
                    </View>

                    {/* Plan Details */}
                    <View style={styles.workoutPlanDetails}>
                      <View style={styles.detailCard}>
                        <Ionicons name="speedometer" size={16} color="#667eea" />
                        <View>
                          <Text style={styles.detailLabel}>Level</Text>
                          <Text style={styles.detailValue}>
                            {workoutPlan.workout?.fitness_level || workoutPlan.fitness_level}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.detailCard}>
                        <Ionicons name="flag" size={16} color="#FF6B6B" />
                        <View>
                          <Text style={styles.detailLabel}>Goal</Text>
                          <Text style={styles.detailValue}>
                            {workoutPlan.workout?.goal || workoutPlan.goal}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.detailCard}>
                        <Ionicons name="time" size={16} color="#4CAF50" />
                        <View>
                          <Text style={styles.detailLabel}>Duration</Text>
                          <Text style={styles.detailValue}>
                            {workoutPlan.workout?.duration || workoutPlan.duration} min
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Exercises Section */}
                    <View style={styles.exercisesSection}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.exercisesTitle}>Exercises</Text>
                        <Text style={styles.exerciseCount}>
                          {(workoutPlan.workout?.exercises || workoutPlan.exercises || []).length} exercises
                        </Text>
                      </View>
                      
                      <View style={styles.exercisesList}>
                        {(workoutPlan.workout?.exercises || workoutPlan.exercises || []).map((exercise, index) => (
                          <View key={index} style={styles.exerciseCard}>
                            <View style={styles.exerciseNumber}>
                              <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.exerciseText}>{exercise}</Text>
                            <View style={styles.exerciseCheck}>
                              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.logWorkoutButton}
                        onPress={() => setShowLogModal(true)}
                      >
                        <LinearGradient
                          colors={['rgba(67, 233, 123, 0.9)', 'rgba(56, 249, 215, 0.9)']}
                          style={styles.logWorkoutGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Ionicons name="checkmark-circle" size={20} color="white" />
                          <Text style={styles.logWorkoutButtonText}>Log This Workout</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.shareButton}
                        onPress={() => Alert.alert('Coming Soon', 'Share feature will be available soon!')}
                      >
                        <Ionicons name="share-social" size={20} color="#667eea" />
                        <Text style={styles.shareButtonText}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              )}
            </View>
          </ScrollView>
        );

      case 'history':
        return (
          <ScrollView 
            style={styles.tabScrollView}
            contentContainerStyle={[styles.tabScrollContent, styles.historyTabContent]}
            showsVerticalScrollIndicator={false}
          >
            {/* History Header */}
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.85)', 'rgba(118, 75, 162, 0.85)']}
              style={styles.historyHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.historyHeaderContent}>
                <Text style={styles.historyTitle}>Workout History</Text>
                <Text style={styles.historySubtitle}>Track your fitness journey</Text>
                
                {/* Stats Overview */}
                <View style={styles.historyStats}>
                  <View style={styles.historyStatItem}>
                    <Text style={styles.historyStatValue}>{stats.totalWorkouts}</Text>
                    <Text style={styles.historyStatLabel}>Total</Text>
                  </View>
                  <View style={styles.historyStatDivider} />
                  <View style={styles.historyStatItem}>
                    <Text style={styles.historyStatValue}>{stats.caloriesBurned}</Text>
                    <Text style={styles.historyStatLabel}>Calories</Text>
                  </View>
                  <View style={styles.historyStatDivider} />
                  <View style={styles.historyStatItem}>
                    <Text style={styles.historyStatValue}>{stats.avgRating}</Text>
                    <Text style={styles.historyStatLabel}>Avg Rating</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
            
            {historyLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.loadingText}>Loading history...</Text>
              </View>
            ) : workoutHistory.length === 0 ? (
              <View style={styles.historyPlaceholder}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.95)', 'rgba(245, 245, 245, 0.95)']}
                  style={styles.historyPlaceholderGradient}
                >
                  <View style={styles.historyIcon}>
                    <MaterialCommunityIcons name="history" size={60} color="rgba(102, 126, 234, 0.7)" />
                  </View>
                  <Text style={styles.historyPlaceholderTitle}>No History Yet</Text>
                  <Text style={styles.historyPlaceholderText}>
                    Complete your first workout to start tracking your progress
                  </Text>
                  <TouchableOpacity 
                    style={styles.startWorkoutButton}
                    onPress={() => setActiveTab('workout')}
                  >
                    <LinearGradient
                      colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                      style={styles.startWorkoutGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="add-circle" size={20} color="white" />
                      <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.historyList}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.historySectionTitle}>
                    Recent Workouts
                  </Text>
                  <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="filter" size={18} color="#667eea" />
                    <Text style={styles.filterText}>Filter</Text>
                  </TouchableOpacity>
                </View>
                
                {workoutHistory.map((workout) => (
                  <TouchableOpacity 
                    key={workout.id}
                    style={styles.historyWorkoutCard}
                    onPress={() => navigation.navigate('WorkoutDetails', { workoutId: workout.id })}
                  >
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.98)', 'rgba(248, 249, 250, 0.98)']}
                      style={styles.historyWorkoutGradient}
                    >
                      <View style={styles.historyWorkoutHeader}>
                        <View style={styles.historyWorkoutIcon}>
                          <FontAwesome5 name="running" size={16} color="#667eea" />
                        </View>
                        <View style={styles.historyWorkoutInfo}>
                          <Text style={styles.historyWorkoutPlan}>
                            {workout.workout_plan?.plan_name || 'Workout Session'}
                          </Text>
                          <Text style={styles.historyWorkoutDate}>
                            {formatDate(workout.created_at)} • {workout.duration_minutes || 30} min
                          </Text>
                        </View>
                        <View style={[styles.historyRatingBadge, { backgroundColor: getRatingColor(workout.rating) + '20' }]}>
                          <Text style={[styles.historyRatingText, { color: getRatingColor(workout.rating) }]}>
                            {workout.rating}/5
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.historyWorkoutFooter}>
                        <View style={styles.completionBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                          <Text style={styles.completionText}>
                            {workout.completion_rate || 100}% completed
                          </Text>
                        </View>
                        <View style={styles.difficultyBadge}>
                          <Ionicons name="speedometer" size={14} color="#FF9800" />
                          <Text style={styles.difficultyText}>
                            Difficulty: {workout.difficulty_rating || 3}/5
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        );

      case 'profile':
        return (
          <ScrollView 
            style={styles.tabScrollView}
            contentContainerStyle={[styles.tabScrollContent, styles.profileTabContent]}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Header */}
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.95)', 'rgba(118, 75, 162, 0.95)']}
              style={styles.profileHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.profileHeaderContent}>
                <View style={styles.profileAvatarContainer}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.cameraButton}>
                    <Ionicons name="camera" size={14} color="white" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.profileName}>{user?.username || 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
                <View style={styles.profileStats}>
                  <View style={styles.profileStatItem}>
                    <Text style={styles.profileStatValue}>{stats.streakDays}</Text>
                    <Text style={styles.profileStatLabel}>Day Streak</Text>
                  </View>
                  <View style={styles.profileStatDivider} />
                  <View style={styles.profileStatItem}>
                    <Text style={styles.profileStatValue}>{stats.totalWorkouts}</Text>
                    <Text style={styles.profileStatLabel}>Workouts</Text>
                  </View>
                  <View style={styles.profileStatDivider} />
                  <View style={styles.profileStatItem}>
                    <Text style={styles.profileStatValue}>{stats.avgRating}</Text>
                    <Text style={styles.profileStatLabel}>Avg Rating</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Account Settings */}
            <View style={styles.profileContent}>
              <Text style={styles.profileSectionTitle}>Account Settings</Text>
              
              <TouchableOpacity 
                style={styles.profileMenuItem}
                onPress={() => navigation.navigate('FitnessProfile')}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.9)', 'rgba(248, 249, 250, 0.9)']}
                  style={styles.menuItemGradient}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: '#667eea' }]}>
                    <Ionicons name="fitness" size={20} color="white" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>Fitness Profile</Text>
                    <Text style={styles.menuItemSubtitle}>Update goals & preferences</Text>
                  </View>
                  <AntDesign name="right" size={16} color="#999" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuItem}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.9)', 'rgba(248, 249, 250, 0.9)']}
                  style={styles.menuItemGradient}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: '#ff6b6b' }]}>
                    <Ionicons name="notifications" size={20} color="white" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>Notifications</Text>
                    <Text style={styles.menuItemSubtitle}>Manage reminders & alerts</Text>
                  </View>
                  <AntDesign name="right" size={16} color="#999" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuItem}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.9)', 'rgba(248, 249, 250, 0.9)']}
                  style={styles.menuItemGradient}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: '#43e97b' }]}>
                    <Ionicons name="settings" size={20} color="white" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>Settings</Text>
                    <Text style={styles.menuItemSubtitle}>App preferences & themes</Text>
                  </View>
                  <AntDesign name="right" size={16} color="#999" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuItem}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.9)', 'rgba(248, 249, 250, 0.9)']}
                  style={styles.menuItemGradient}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: '#FFD700' }]}>
                    <Ionicons name="help-circle" size={20} color="white" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>Help & Support</Text>
                    <Text style={styles.menuItemSubtitle}>FAQ & contact support</Text>
                  </View>
                  <AntDesign name="right" size={16} color="#999" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuItem}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.9)', 'rgba(248, 249, 250, 0.9)']}
                  style={styles.menuItemGradient}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: '#673ab7' }]}>
                    <Ionicons name="document-text" size={20} color="white" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>Privacy & Terms</Text>
                    <Text style={styles.menuItemSubtitle}>Privacy policy & terms</Text>
                  </View>
                  <AntDesign name="right" size={16} color="#999" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.profileMenuItem}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.9)', 'rgba(248, 249, 250, 0.9)']}
                  style={styles.menuItemGradient}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: '#2196F3' }]}>
                    <Ionicons name="star" size={20} color="white" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>Rate Us</Text>
                    <Text style={styles.menuItemSubtitle}>Share your feedback</Text>
                  </View>
                  <AntDesign name="right" size={16} color="#999" />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.logoutContainer}>
                <TouchableOpacity 
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <LinearGradient
                    colors={['rgba(255, 59, 48, 0.1)', 'rgba(255, 99, 71, 0.05)']}
                    style={styles.logoutGradient}
                  >
                    <View style={styles.logoutIcon}>
                      <Ionicons name="log-out" size={20} color="#ff3b30" />
                    </View>
                    <View style={styles.logoutContent}>
                      <Text style={styles.logoutButtonText}>Logout</Text>
                      <Text style={styles.logoutSubtext}>Sign out of your account</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* App Info */}
              <View style={styles.appInfo}>
                <Text style={styles.appVersion}>Version 1.0.0</Text>
                <Text style={styles.appCopyright}>© 2024 FitAI. All rights reserved.</Text>
              </View>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  // Workout Log Modal
  const renderWorkoutLogModal = () => (
    <Modal
      visible={showLogModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowLogModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 1)', 'rgba(245, 245, 245, 1)']}
            style={styles.modalGradient}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Your Workout</Text>
                <Text style={styles.modalSubtitle}>Track your performance & progress</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowLogModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Completion Rate */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Completion</Text>
                <View style={styles.completionContainer}>
                  <LinearGradient
                    colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                    style={styles.completionCircle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.completionRate}>{workoutLogData.completion_rate}%</Text>
                  </LinearGradient>
                  <Text style={styles.completionLabel}>Overall Completion</Text>
                </View>
                <Text style={styles.completionSubtext}>
                  {workoutLogData.exercises_completed.filter(ex => ex.completed).length} of {workoutLogData.exercises_completed.length} exercises completed
                </Text>
              </View>

              {/* Exercises Check List */}
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <Text style={styles.modalSectionTitle}>Exercises</Text>
                  <Text style={styles.exerciseCount}>
                    {workoutLogData.exercises_completed.filter(ex => ex.completed).length}/{workoutLogData.exercises_completed.length}
                  </Text>
                </View>
                <View style={styles.exercisesCheckList}>
                  {workoutLogData.exercises_completed.map((exercise, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.exerciseCheckItem}
                      onPress={() => toggleExerciseCompletion(index)}
                    >
                      <LinearGradient
                        colors={exercise.completed ? 
                          ['rgba(76, 175, 80, 0.9)', 'rgba(56, 142, 60, 0.9)'] : 
                          ['rgba(245, 245, 245, 0.9)', 'rgba(238, 238, 238, 0.9)']
                        }
                        style={[
                          styles.checkBox,
                          exercise.completed && styles.checkBoxChecked
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        {exercise.completed && (
                          <Ionicons name="checkmark" size={14} color="white" />
                        )}
                      </LinearGradient>
                      <Text style={[
                        styles.exerciseCheckText,
                        exercise.completed && styles.exerciseCheckTextCompleted
                      ]}>
                        {exercise.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Difficulty & Energy */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>How was it?</Text>
                <View style={styles.ratingRow}>
                  <View style={styles.ratingContainer}>
                    <View style={styles.ratingHeader}>
                      <Ionicons name="speedometer" size={16} color="#FF9800" />
                      <Text style={styles.ratingLabel}>Difficulty</Text>
                    </View>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => setWorkoutLogData(prev => ({ ...prev, difficulty_rating: star }))}
                        >
                          <Ionicons
                            name={star <= workoutLogData.difficulty_rating ? "star" : "star-outline"}
                            size={28}
                            color={star <= workoutLogData.difficulty_rating ? "#FF9800" : "#ccc"}
                            style={styles.starIcon}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.ratingValue}>{workoutLogData.difficulty_rating}/5</Text>
                  </View>

                  <View style={styles.ratingContainer}>
                    <View style={styles.ratingHeader}>
                      <Ionicons name="flash" size={16} color="#FFD700" />
                      <Text style={styles.ratingLabel}>Energy Level</Text>
                    </View>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => setWorkoutLogData(prev => ({ ...prev, energy_level: star }))}
                        >
                          <Ionicons
                            name={star <= workoutLogData.energy_level ? "flash" : "flash-outline"}
                            size={28}
                            color={star <= workoutLogData.energy_level ? "#FFD700" : "#ccc"}
                            style={styles.starIcon}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.ratingValue}>{workoutLogData.energy_level}/5</Text>
                  </View>
                </View>
              </View>

              {/* Personal Notes */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Personal Notes</Text>
                <View style={styles.notesInputContainer}>
                  <Ionicons name="document-text-outline" size={20} color="#667eea" style={styles.notesIcon} />
                  <TextInput
                    style={styles.notesInput}
                    placeholder="How did your workout go? Any notes or achievements?"
                    value={workoutLogData.personal_notes}
                    onChangeText={(text) => setWorkoutLogData(prev => ({ ...prev, personal_notes: text }))}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.charCountContainer}>
                  <Text style={styles.charCount}>
                    {workoutLogData.personal_notes.length}/500 characters
                  </Text>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                style={[styles.submitButton, loggingWorkout && styles.buttonDisabled]}
                onPress={enhancedLogWorkout}
                disabled={loggingWorkout}
              >
                <LinearGradient
                  colors={['rgba(67, 233, 123, 0.9)', 'rgba(56, 249, 215, 0.9)']}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loggingWorkout ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.submitButtonText}>Log Workout</Text>
                      <Ionicons name="arrow-forward" size={16} color="white" style={styles.arrowIcon} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Dynamic Background based on active tab */}
      {renderTabBackground(activeTab)}
      
      <View style={styles.container}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {renderTabContent()}
        </View>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {['home', 'workout', 'history', 'profile'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={styles.navItem}
              onPress={() => setActiveTab(tab)}
            >
              <LinearGradient
                colors={activeTab === tab ? 
                  ['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.1)'] : 
                  ['transparent', 'transparent']
                }
                style={styles.navItemBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons 
                  name={
                    tab === 'home' ? (activeTab === 'home' ? "home" : "home-outline") :
                    tab === 'workout' ? (activeTab === 'workout' ? "barbell" : "barbell-outline") :
                    tab === 'history' ? (activeTab === 'history' ? "time" : "time-outline") :
                    tab === 'profile' ? (activeTab === 'profile' ? "person" : "person-outline") :
                    ""
                  } 
                  size={24} 
                  color={activeTab === tab ? '#667eea' : '#666'} 
                />
                <Text style={[
                  styles.navText,
                  activeTab === tab && styles.navTextActive
                ]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Workout Log Modal */}
      {renderWorkoutLogModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  logoBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  tabScrollView: {
    flex: 1,
  },
  tabScrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  workoutTabContent: {
    paddingBottom: 100,
  },
  historyTabContent: {
    paddingBottom: 100,
  },
  profileTabContent: {
    paddingBottom: 100,
  },
  
  // Home Tab Styles
  welcomeCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#667eea',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statsBadgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 10,
    color: 'white',
    opacity: 0.9,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  
  // Section Styles
  section: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    height: 110,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 12,
  },
  quickActionGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quickActionSubtext: {
    color: 'white',
    fontSize: 10,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 2,
  },
  
  // Fitness Profile
  fitnessDetailsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statContainer: {
    alignItems: 'center',
    flex: 1,
  },
  statCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statCircleValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statUnit: {
    fontSize: 10,
    color: '#666',
    marginTop: -2,
  },
  statLabelSmall: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  bmiStatus: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  bmiStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Recent Activity
  recentWorkoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentWorkoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentWorkoutInfo: {
    flex: 1,
  },
  recentWorkoutName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  recentWorkoutDate: {
    fontSize: 11,
    color: '#666',
  },
  recentRatingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recentRatingText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  noRecentActivity: {
    alignItems: 'center',
    padding: 24,
  },
  noRecentIcon: {
    marginBottom: 12,
  },
  noRecentText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  noRecentSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Tip Card
  tipCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tipGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  
  // Workout Tab Styles
  workoutHeader: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  workoutHeaderContent: {
    alignItems: 'center',
  },
  workoutTabTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  workoutTabSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  
  generateSection: {
    marginBottom: 20,
  },
  generateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  generateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  generateSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  refreshGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  noWorkoutContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  noWorkoutGradient: {
    padding: 32,
    alignItems: 'center',
  },
  noWorkoutIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  sparkleEffect: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  noWorkoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noWorkoutText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  generateButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 240,
  },
  generateGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    marginRight: 4,
  },
  arrowIcon: {
    marginLeft: 4,
  },
  
  workoutPlanCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  workoutPlanGradient: {
    padding: 20,
  },
  workoutPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  workoutPlanTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  workoutPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  workoutPlanBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginLeft: 4,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  workoutPlanDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  
  exercisesSection: {
    marginBottom: 20,
  },
  exercisesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  exerciseCount: {
    fontSize: 12,
    color: '#666',
  },
  exercisesList: {
    marginTop: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  exerciseText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  exerciseCheck: {
    marginLeft: 8,
  },
  
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logWorkoutButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 12,
  },
  logWorkoutGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logWorkoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  shareButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  
  // History Tab Styles
  historyHeader: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  historyHeaderContent: {
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  historySubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 16,
  },
  historyStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    width: '100%',
  },
  historyStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  historyStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  historyStatLabel: {
    fontSize: 10,
    color: 'white',
    opacity: 0.9,
    marginTop: 2,
  },
  historyStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 8,
  },
  
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  
  historyPlaceholder: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  historyPlaceholderGradient: {
    padding: 40,
    alignItems: 'center',
  },
  historyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  historyPlaceholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  historyPlaceholderText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  startWorkoutButton: {
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 200,
  },
  startWorkoutGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWorkoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  historyList: {
    marginBottom: 20,
  },
  historySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  filterText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
    marginLeft: 4,
  },
  
  historyWorkoutCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyWorkoutGradient: {
    padding: 16,
  },
  historyWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyWorkoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyWorkoutInfo: {
    flex: 1,
  },
  historyWorkoutPlan: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  historyWorkoutDate: {
    fontSize: 11,
    color: '#666',
  },
  historyRatingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  historyRatingText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  historyWorkoutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5020',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  completionText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF980020',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  difficultyText: {
    fontSize: 10,
    color: '#FF9800',
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Profile Tab Styles - Enhanced
  profileHeader: {
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  profileHeaderContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  profileAvatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#667eea',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profileName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 20,
    textAlign: 'center',
  },
  profileStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    width: '90%',
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  profileStatLabel: {
    fontSize: 10,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  profileStatDivider: {
    width: 1,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 8,
  },
  
  profileContent: {
    flex: 1,
  },
  profileSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  profileMenuItem: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  
  logoutContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  logoutButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff3b3020',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logoutContent: {
    flex: 1,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
  logoutSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  
  appInfo: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  appVersion: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 10,
    color: '#999',
  },
  
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    height: 75,
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 8,
    paddingBottom: 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  navText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '85%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
    padding: 24,
  },
  modalSection: {
    marginBottom: 28,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  completionContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  completionCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completionRate: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  completionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  completionSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  exercisesCheckList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 16,
  },
  exerciseCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxChecked: {
    borderWidth: 0,
  },
  exerciseCheckText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  exerciseCheckTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  exerciseCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ratingContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 15,
    marginHorizontal: 4,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starIcon: {
    marginHorizontal: 2,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  
  notesInputContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 16,
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notesIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  notesInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  charCount: {
    fontSize: 11,
    color: '#999',
  },
  
  submitButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 30,
  },
  submitGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});