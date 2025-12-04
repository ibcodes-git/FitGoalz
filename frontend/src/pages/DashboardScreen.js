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
import { authAPI, workoutsAPI, feedbackAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [difficultyRating, setDifficultyRating] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [activeTab, setActiveTab] = useState('home');

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
      setActiveTab('workout');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate workout. Please complete your fitness profile first.');
      console.error('Workout error:', error);
    } finally {
      setLoading(false);
    }
  };

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
        }
      };

      const response = await feedbackAPI.logWorkout(workoutData);
      
      Alert.alert(
        '🏆 Workout Logged!', 
        `AI Feedback: ${response.data.feedback.feedback_text}\n\nRating: ${response.data.feedback.rating}/5`
      );
      
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

      await feedbackAPI.logWorkout(workoutData);
      Alert.alert('✅ Success', 'Workout logged quickly!');
      
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

  // Rating Component
  const RatingSelector = ({ title, value, onValueChange, icon }) => (
    <View style={styles.ratingSection}>
      <View style={styles.ratingHeader}>
        {icon}
        <Text style={styles.ratingTitle}>{title}</Text>
      </View>
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
              <View style={styles.welcomeCard}>
                <LinearGradient
                  colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                  style={styles.welcomeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
                  <Text style={styles.welcomeName}>{user?.username || 'Fitness Enthusiast'}</Text>
                  <Text style={styles.welcomeSubtitle}>Ready for today's workout?</Text>
                </LinearGradient>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <LinearGradient
                    colors={['rgba(79, 172, 254, 0.9)', 'rgba(0, 242, 254, 0.9)']}
                    style={styles.statGradient}
                  >
                    <MaterialIcons name="fitness-center" size={20} color="white" />
                    <Text style={styles.statNumber}>7</Text>
                    <Text style={styles.statLabel}>Workouts This Week</Text>
                  </LinearGradient>
                </View>

                <View style={styles.statCard}>
                  <LinearGradient
                    colors={['rgba(67, 233, 123, 0.9)', 'rgba(56, 249, 215, 0.9)']}
                    style={styles.statGradient}
                  >
                    <Ionicons name="flame" size={20} color="white" />
                    <Text style={styles.statNumber}>3,450</Text>
                    <Text style={styles.statLabel}>Calories Burned</Text>
                  </LinearGradient>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.generateHomeButton}
                onPress={generateWorkout}
                disabled={loading}
              >
                <LinearGradient
                  colors={['rgba(250, 112, 154, 0.9)', 'rgba(254, 225, 64, 0.9)']}
                  style={styles.generateHomeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.generateHomeContent}>
                    <Ionicons name="flash" size={26} color="white" />
                    <View style={styles.generateHomeText}>
                      <Text style={styles.generateHomeTitle}>Generate Workout</Text>
                      <Text style={styles.generateHomeSubtitle}>AI-powered personalization</Text>
                    </View>
                    {loading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="white" />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionGrid}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('FitnessProfile')}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(102, 126, 234, 0.9)' }]}>
                      <Ionicons name="person" size={20} color="white" />
                    </View>
                    <Text style={styles.actionText}>Fitness Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => setActiveTab('history')}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(240, 147, 251, 0.9)' }]}>
                      <MaterialIcons name="history" size={20} color="white" />
                    </View>
                    <Text style={styles.actionText}>History</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => setActiveTab('workout')}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(79, 172, 254, 0.9)' }]}>
                      <FontAwesome5 name="dumbbell" size={18} color="white" />
                    </View>
                    <Text style={styles.actionText}>Workouts</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => setActiveTab('profile')}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(67, 233, 123, 0.9)' }]}>
                      <Ionicons name="settings" size={20} color="white" />
                    </View>
                    <Text style={styles.actionText}>Settings</Text>
                  </TouchableOpacity>
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
                      {(workoutPlan.workout?.exercises || workoutPlan.exercises || []).slice(0, 4).map((exercise, index) => (
                        <View key={index} style={styles.exerciseItem}>
                          <View style={styles.exerciseBullet}>
                            <Text style={styles.exerciseNumber}>{index + 1}</Text>
                          </View>
                          <Text style={styles.exerciseText}>{exercise}</Text>
                        </View>
                      ))}
                      {(workoutPlan.workout?.exercises || workoutPlan.exercises || []).length > 4 && (
                        <Text style={styles.moreExercisesText}>
                          +{(workoutPlan.workout?.exercises || workoutPlan.exercises || []).length - 4} more exercises
                        </Text>
                      )}
                    </View>

                    {/* Workout Logging Section - Simplified */}
                    <View style={styles.loggingSection}>
                      <Text style={styles.loggingTitle}>Log This Workout</Text>
                      
                      <View style={styles.quickLogButtons}>
                        <TouchableOpacity 
                          style={[styles.quickLogButton, loggingWorkout && styles.buttonDisabled]}
                          onPress={quickLogWorkout}
                          disabled={loggingWorkout}
                        >
                          <Ionicons name="checkmark-circle" size={18} color="white" />
                          <Text style={styles.quickLogButtonText}>
                            {loggingWorkout ? 'Logging...' : 'Quick Log'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.detailedLogButton, loggingWorkout && styles.buttonDisabled]}
                          onPress={logCurrentWorkout}
                          disabled={loggingWorkout}
                        >
                          <Ionicons name="clipboard" size={18} color="white" />
                          <Text style={styles.detailedLogButtonText}>
                            {loggingWorkout ? 'Logging...' : 'Detailed Log'}
                          </Text>
                        </TouchableOpacity>
                      </View>
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
                          <Text style={styles.generateButtonText}>Generate</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
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
            </ScrollView>
          </ImageBackground>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <View style={styles.mainContent}>
        {renderTabContent()}
      </View>

      {/* Bottom Navigation - Always visible at bottom */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons 
            name={activeTab === 'home' ? "home" : "home-outline"} 
            size={22} 
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
            size={22} 
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
            name={activeTab === 'history' ? "history" : "history"} 
            size={22} 
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
            size={22} 
            color={activeTab === 'profile' ? '#667eea' : '#666'} 
          />
          <Text style={[
            styles.navText,
            activeTab === 'profile' && styles.navTextActive
          ]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    paddingBottom: 20, // Extra padding for bottom nav
  },
  // Home Tab Styles
  welcomeCard: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 4,
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
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
  statGradient: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  generateHomeButton: {
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  generateHomeGradient: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  generateHomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  generateHomeText: {
    flex: 1,
    marginLeft: 12,
  },
  generateHomeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  generateHomeSubtitle: {
    fontSize: 11,
    color: 'white',
    opacity: 0.9,
    marginTop: 2,
  },
  quickActions: {
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
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
  moreExercisesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 36,
    marginTop: 4,
  },
  // Logging Section Styles - Simplified
  loggingSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  loggingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickLogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickLogButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  quickLogButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  detailedLogButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  detailedLogButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  // No Workout State
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
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 200,
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
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
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
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 28,
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
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navText: {
    fontSize: 10,
    color: '#666',
    marginTop: 3,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#667eea',
    fontWeight: 'bold',
  },
});