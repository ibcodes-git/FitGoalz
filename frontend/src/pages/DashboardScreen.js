import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  TextInput,
  SafeAreaView,
  Dimensions,
  ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { authAPI, workoutsAPI, feedbackAPI, userAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [fitnessProfile, setFitnessProfile] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    fetchUserProfile();
    fetchFitnessProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchWorkoutHistory();
    }
  }, [activeTab]);

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
      Alert.alert(
        '✅ Workout Logged!', 
        `AI Feedback: ${response.data.feedback.feedback_text}\n\nRating: ${response.data.feedback.rating}/5`
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to log workout');
      console.error('Quick log error:', error);
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

  // Tab Content Renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ImageBackground 
            source={require('../assets/images/dashboard-bg.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <ScrollView 
              style={styles.tabScrollView}
              contentContainerStyle={styles.tabScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* User Profile Header */}
              <View style={styles.profileCard}>
                <LinearGradient
                  colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                  style={styles.profileGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.profileAvatarContainer}>
                    <View style={styles.profileAvatar}>
                      <Text style={styles.profileAvatarText}>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.profileName}>{user?.username || 'User'}</Text>
                  <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
                </LinearGradient>
              </View>

              {/* Fitness Profile Summary */}
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

                {fitnessProfile ? (
                  <View style={styles.fitnessDetailsCard}>
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{fitnessProfile.age || 'N/A'}</Text>
                        <Text style={styles.statLabel}>Age</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{fitnessProfile.weight || 'N/A'}</Text>
                        <Text style={styles.statLabel}>Weight (kg)</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{fitnessProfile.height || 'N/A'}</Text>
                        <Text style={styles.statLabel}>Height (cm)</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{calculateBMI()}</Text>
                        <Text style={styles.statLabel}>BMI</Text>
                      </View>
                    </View>

                    <View style={styles.detailsGrid}>
                      <View style={styles.detailRow}>
                        <Ionicons name="body" size={16} color="#667eea" />
                        <Text style={styles.detailLabel}>Gender:</Text>
                        <Text style={styles.detailValue}>{fitnessProfile.gender || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="fitness" size={16} color="#667eea" />
                        <Text style={styles.detailLabel}>Level:</Text>
                        <Text style={styles.detailValue}>{fitnessProfile.fitness_level || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="flag" size={16} color="#667eea" />
                        <Text style={styles.detailLabel}>Goal:</Text>
                        <Text style={styles.detailValue}>{fitnessProfile.goals?.replace('_', ' ') || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={16} color="#667eea" />
                        <Text style={styles.detailLabel}>Days/Week:</Text>
                        <Text style={styles.detailValue}>{fitnessProfile.workout_days || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time" size={16} color="#667eea" />
                        <Text style={styles.detailLabel}>Duration:</Text>
                        <Text style={styles.detailValue}>{fitnessProfile.workout_duration || 'N/A'} min</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="dumbbell" size={16} color="#667eea" />
                        <Text style={styles.detailLabel}>Equipment:</Text>
                        <Text style={styles.detailValue}>{fitnessProfile.equipment || 'N/A'}</Text>
                      </View>
                    </View>

                    {fitnessProfile.injuries && (
                      <View style={styles.injuriesSection}>
                        <Text style={styles.injuriesLabel}>Health Notes:</Text>
                        <Text style={styles.injuriesText}>{fitnessProfile.injuries}</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.noProfileCard}>
                    <Ionicons name="information-circle-outline" size={40} color="#667eea" />
                    <Text style={styles.noProfileTitle}>Complete Your Profile</Text>
                    <Text style={styles.noProfileText}>
                      Set up your fitness profile to get personalized workouts
                    </Text>
                    <TouchableOpacity 
                      style={styles.setupButton}
                      onPress={() => navigation.navigate('FitnessProfile')}
                    >
                      <LinearGradient
                        colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                        style={styles.setupGradient}
                      >
                        <Text style={styles.setupButtonText}>Setup Profile</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Quick Stats */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Activity Summary</Text>
                <View style={styles.quickStatsGrid}>
                  <View style={styles.quickStatCard}>
                    <LinearGradient
                      colors={['rgba(79, 172, 254, 0.9)', 'rgba(0, 242, 254, 0.9)']}
                      style={styles.quickStatGradient}
                    >
                      <MaterialIcons name="fitness-center" size={20} color="white" />
                      <Text style={styles.quickStatNumber}>
                        {workoutHistory.length}
                      </Text>
                      <Text style={styles.quickStatLabel}>Total Workouts</Text>
                    </LinearGradient>
                  </View>

                  <View style={styles.quickStatCard}>
                    <LinearGradient
                      colors={['rgba(67, 233, 123, 0.9)', 'rgba(56, 249, 215, 0.9)']}
                      style={styles.quickStatGradient}
                    >
                      <Ionicons name="flame" size={20} color="white" />
                      <Text style={styles.quickStatNumber}>
                        {workoutHistory.length > 0 ? 
                          (workoutHistory.reduce((sum, w) => sum + (w.rating || 0), 0) / workoutHistory.length).toFixed(1) 
                          : '0'}
                      </Text>
                      <Text style={styles.quickStatLabel}>Avg Rating</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            </ScrollView>
          </ImageBackground>
        );

      case 'workout':
        return (
          <ImageBackground 
            source={require('../assets/images/workout-bg.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <ScrollView 
              style={styles.tabScrollView}
              contentContainerStyle={styles.tabScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutTabTitle}>Workout Plans</Text>
                <Text style={styles.workoutTabSubtitle}>Your AI-generated workouts</Text>
              </View>

              {workoutPlan ? (
                <View style={styles.workoutPlanCard}>
                  <LinearGradient
                    colors={['rgba(168, 237, 234, 0.9)', 'rgba(254, 214, 227, 0.9)']}
                    style={styles.workoutPlanGradient}
                  >
                    <View style={styles.workoutPlanHeader}>
                      <View>
                        <Text style={styles.workoutPlanTitle}>
                          {workoutPlan.workout?.plan_name || workoutPlan.plan_name}
                        </Text>
                        <View style={styles.workoutPlanBadge}>
                          <Ionicons name="sparkles" size={10} color="#ff6b6b" />
                          <Text style={styles.workoutPlanBadgeText}>AI GENERATED</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.refreshButton}
                        onPress={generateWorkout}
                        disabled={loading}
                      >
                        <Ionicons name="refresh" size={18} color="#667eea" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.workoutPlanDetails}>
                      <View style={styles.detailItem}>
                        <Ionicons name="speedometer" size={14} color="#666" />
                        <Text style={styles.detailText}>
                          {workoutPlan.workout?.fitness_level || workoutPlan.fitness_level}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="flag" size={14} color="#666" />
                        <Text style={styles.detailText}>
                          {workoutPlan.workout?.goal || workoutPlan.goal}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="time" size={14} color="#666" />
                        <Text style={styles.detailText}>
                          {workoutPlan.workout?.duration || workoutPlan.duration} mins
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar" size={14} color="#666" />
                        <Text style={styles.detailText}>
                          {workoutPlan.workout?.days_per_week || workoutPlan.days_per_week} days/week
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.exercisesTitle}>Exercises</Text>
                    <View style={styles.exercisesList}>
                      {(workoutPlan.workout?.exercises || workoutPlan.exercises || []).map((exercise, index) => (
                        <View key={index} style={styles.exerciseItem}>
                          <View style={styles.exerciseBullet}>
                            <Text style={styles.exerciseNumber}>{index + 1}</Text>
                          </View>
                          <Text style={styles.exerciseText}>{exercise}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Workout Logging Section */}
                    <View style={styles.loggingSection}>
                      <Text style={styles.loggingTitle}>Complete This Workout?</Text>
                      
                      <TouchableOpacity 
                        style={[styles.logWorkoutButton, loggingWorkout && styles.buttonDisabled]}
                        onPress={quickLogWorkout}
                        disabled={loggingWorkout}
                      >
                        <LinearGradient
                          colors={['rgba(67, 233, 123, 0.9)', 'rgba(56, 249, 215, 0.9)']}
                          style={styles.logWorkoutGradient}
                        >
                          {loggingWorkout ? (
                            <ActivityIndicator color="white" size="small" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-circle" size={20} color="white" />
                              <Text style={styles.logWorkoutButtonText}>Log Workout</Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.noWorkoutContainer}>
                  <View style={styles.noWorkoutIcon}>
                    <FontAwesome5 name="dumbbell" size={50} color="rgba(255, 255, 255, 0.7)" />
                  </View>
                  <Text style={styles.noWorkoutTitle}>No Workout Generated</Text>
                  <Text style={styles.noWorkoutText}>
                    Get started with your first AI-powered workout
                  </Text>
                  <TouchableOpacity 
                    style={styles.generateButton}
                    onPress={generateWorkout}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['rgba(250, 112, 154, 0.9)', 'rgba(254, 225, 64, 0.9)']}
                      style={styles.generateGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={20} color="white" />
                          <Text style={styles.generateButtonText}>Generate Workout</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </ImageBackground>
        );

      case 'history':
        return (
          <ImageBackground 
            source={require('../assets/images/logo.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <ScrollView 
              style={styles.tabScrollView}
              contentContainerStyle={styles.tabScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Workout History</Text>
                <Text style={styles.historySubtitle}>Track your fitness journey</Text>
              </View>
              
              {historyLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#667eea" />
                  <Text style={styles.loadingText}>Loading history...</Text>
                </View>
              ) : workoutHistory.length === 0 ? (
                <View style={styles.historyPlaceholder}>
                  <View style={styles.historyIcon}>
                    <MaterialCommunityIcons name="history" size={60} color="rgba(255, 255, 255, 0.7)" />
                  </View>
                  <Text style={styles.historyPlaceholderTitle}>No History Yet</Text>
                  <Text style={styles.historyPlaceholderText}>
                    Complete your first workout to see history
                  </Text>
                  <TouchableOpacity 
                    style={styles.startWorkoutButton}
                    onPress={() => setActiveTab('workout')}
                  >
                    <LinearGradient
                      colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                      style={styles.startWorkoutGradient}
                    >
                      <Text style={styles.startWorkoutButtonText}>Go to Workouts</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.historyList}>
                  <Text style={styles.historySectionTitle}>
                    Completed Workouts: {workoutHistory.length}
                  </Text>
                  
                  {workoutHistory.map((workout) => (
                    <TouchableOpacity 
                      key={workout.id}
                      style={styles.historyWorkoutCard}
                      onPress={() => setSelectedWorkout(selectedWorkout?.id === workout.id ? null : workout)}
                    >
                      <View style={styles.historyWorkoutHeader}>
                        <View style={styles.historyWorkoutInfo}>
                          <Text style={styles.historyWorkoutDate}>
                            {formatDate(workout.created_at)}
                          </Text>
                          <Text style={styles.historyWorkoutPlan}>
                            {workout.workout_plan?.plan_name || 'Workout Session'}
                          </Text>
                        </View>
                        <View style={[styles.historyRatingBadge, { backgroundColor: getRatingColor(workout.rating) }]}>
                          <Text style={styles.historyRatingText}>{workout.rating}/5</Text>
                        </View>
                      </View>

                      {selectedWorkout?.id === workout.id && (
                        <View style={styles.historyWorkoutDetails}>
                          <Text style={styles.historyFeedbackTitle}>AI Feedback:</Text>
                          <Text style={styles.historyFeedbackText}>{workout.feedback_text}</Text>
                          
                          {workout.workout_plan?.exercises && (
                            <>
                              <Text style={styles.historyExercisesTitle}>Exercises:</Text>
                              {workout.workout_plan.exercises.slice(0, 5).map((exercise, idx) => (
                                <Text key={idx} style={styles.historyExercise}>• {exercise}</Text>
                              ))}
                              {workout.workout_plan.exercises.length > 5 && (
                                <Text style={styles.historyMoreExercises}>
                                  +{workout.workout_plan.exercises.length - 5} more exercises
                                </Text>
                              )}
                            </>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </ImageBackground>
        );

      case 'profile':
        return (
          <ImageBackground 
            source={require('../assets/images/profile-bg.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <ScrollView 
              style={styles.tabScrollView}
              contentContainerStyle={styles.tabScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.profileHeader}>
                <LinearGradient
                  colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                  style={styles.profileHeaderGradient}
                >
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <Text style={styles.profileName}>{user?.username || 'User'}</Text>
                  <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
                </LinearGradient>
              </View>

              <View style={styles.profileContent}>
                <Text style={styles.profileSectionTitle}>Account Settings</Text>
                
                <TouchableOpacity style={styles.profileMenuItem}>
                  <View style={styles.menuItemIcon}>
                    <Ionicons name="person" size={20} color="#667eea" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>Edit Profile</Text>
                    <Text style={styles.menuItemSubtitle}>Update personal information</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.profileMenuItem}
                  onPress={() => navigation.navigate('FitnessProfile')}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons name="fitness" size={20} color="#43e97b" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>Fitness Profile</Text>
                    <Text style={styles.menuItemSubtitle}>Update goals & preferences</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.profileMenuItem}>
                  <View style={styles.menuItemIcon}>
                    <Ionicons name="notifications" size={20} color="#ff6b6b" />
                  </View>
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>Notifications</Text>
                    <Text style={styles.menuItemSubtitle}>Manage reminders</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>

                <View style={styles.logoutContainer}>
                  <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={handleLogout}
                  >
                    <Ionicons name="log-out" size={20} color="#ff3b30" />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </ImageBackground>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {renderTabContent()}
        </View>

        {/* Bottom Navigation - Fixed at bottom */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
          >
            <Ionicons 
              name={activeTab === 'home' ? "home" : "home-outline"} 
              size={24} 
              color={activeTab === 'home' ? '#667eea' : '#666'} 
            />
            <Text style={[
              styles.navText,
              activeTab === 'home' && styles.navTextActive
            ]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => setActiveTab('workout')}
          >
            <Ionicons 
              name={activeTab === 'workout' ? "barbell" : "barbell-outline"} 
              size={24} 
              color={activeTab === 'workout' ? '#667eea' : '#666'} 
            />
            <Text style={[
              styles.navText,
              activeTab === 'workout' && styles.navTextActive
            ]}>Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => setActiveTab('history')}
          >
            <MaterialIcons 
              name="history" 
              size={24} 
              color={activeTab === 'history' ? '#667eea' : '#666'} 
            />
            <Text style={[
              styles.navText,
              activeTab === 'history' && styles.navTextActive
            ]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
          >
            <Ionicons 
              name={activeTab === 'profile' ? "person" : "person-outline"} 
              size={24} 
              color={activeTab === 'profile' ? '#667eea' : '#666'} 
            />
            <Text style={[
              styles.navText,
              activeTab === 'profile' && styles.navTextActive
            ]}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  tabScrollView: {
    flex: 1,
  },
  tabScrollContent: {
    padding: 12,
    paddingBottom: 80, // Increased padding to accommodate bottom nav
  },
  // Home Tab - Profile Styles
  profileCard: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  profileGradient: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarContainer: {
    marginBottom: 8,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#667eea',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 4,
  },
  fitnessDetailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  detailsGrid: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    width: 90,
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    textTransform: 'capitalize',
    flex: 1,
  },
  injuriesSection: {
    backgroundColor: '#fff5f5',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  injuriesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 4,
  },
  injuriesText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  noProfileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noProfileTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
  },
  noProfileText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  setupButton: {
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    width: 160,
  },
  setupGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickStatCard: {
    width: '48%',
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  quickStatGradient: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 4,
  },
  quickStatLabel: {
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  // Workout Tab Styles
  workoutHeader: {
    marginBottom: 16,
  },
  workoutTabTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  workoutTabSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  workoutPlanCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  workoutPlanGradient: {
    padding: 16,
  },
  workoutPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workoutPlanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  workoutPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  workoutPlanBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginLeft: 3,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutPlanDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 5,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  exercisesList: {
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseBullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#667eea',
  },
  exerciseText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  loggingSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  loggingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  logWorkoutButton: {
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  logWorkoutGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logWorkoutButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  noWorkoutContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    minHeight: 300,
  },
  noWorkoutIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noWorkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  noWorkoutText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  generateButton: {
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 220,
  },
  generateGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // History Tab Styles
  historyHeader: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  historySubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  historyPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    minHeight: 300,
  },
  historyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  historyPlaceholderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  historyPlaceholderText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  startWorkoutButton: {
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 180,
  },
  startWorkoutGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWorkoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyList: {
    marginBottom: 20,
  },
  historySectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  historyWorkoutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyWorkoutInfo: {
    flex: 1,
  },
  historyWorkoutDate: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  historyWorkoutPlan: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  historyRatingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 45,
    alignItems: 'center',
  },
  historyRatingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyWorkoutDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  historyFeedbackTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  historyFeedbackText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  historyExercisesTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  historyExercise: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    marginBottom: 3,
  },
  historyMoreExercises: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 8,
    marginTop: 2,
  },
  // Profile Tab Styles
  profileHeader: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  profileHeaderGradient: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContent: {
    flex: 1,
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  logoutContainer: {
    marginTop: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff3b30',
    marginLeft: 8,
  },
  // Bottom Navigation - Updated Styles
  bottomNav: {
    flexDirection: 'row',
    height: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 8,
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
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
    paddingVertical: 4,
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
});