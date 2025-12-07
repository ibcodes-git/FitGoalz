import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, ActivityIndicator, ImageBackground 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { userAPI } from '../services/api';

const FitnessProfileScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    fitness_level: 'beginner',
    goals: 'weight_loss',
    workout_days: '3',
    workout_duration: '30',
    injuries: '',
    equipment: 'home',
    activity_level: 'moderate' // Added new field
  });

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
  try {
    setLoading(true);
    const response = await userAPI.getProfile();
    
    // Handle both response formats
    if (response.data && response.data.profile) {
      // Profile exists
      const profile = response.data.profile;
      setFormData(prev => ({
        ...prev,
        age: profile.age?.toString() || '',
        weight: profile.weight?.toString() || '',
        height: profile.height?.toString() || '',
        gender: profile.gender || 'male',
        fitness_level: profile.fitness_level || 'beginner',
        goals: profile.goals || 'weight_loss',
        workout_days: profile.workout_days?.toString() || '3',
        workout_duration: profile.workout_duration?.toString() || '30',
        injuries: profile.injuries || '',
        equipment: profile.equipment || 'home',
        activity_level: profile.activity_level || 'moderate'
      }));
    } else if (response.data && response.data.message === 'No profile found') {
      // No profile yet - keep default values
      console.log('No existing profile found - this is normal for new users');
    } else {
      // Direct profile data (old format)
      setFormData(prev => ({
        ...prev,
        age: response.data.age?.toString() || '',
        weight: response.data.weight?.toString() || '',
        height: response.data.height?.toString() || '',
        gender: response.data.gender || 'male',
        fitness_level: response.data.fitness_level || 'beginner',
        goals: response.data.goals || 'weight_loss',
        workout_days: response.data.workout_days?.toString() || '3',
        workout_duration: response.data.workout_duration?.toString() || '30',
        injuries: response.data.injuries || '',
        equipment: response.data.equipment || 'home',
        activity_level: response.data.activity_level || 'moderate'
      }));
    }
  } catch (error) {
    console.log('Error loading profile:', error.message);
    // Don't show error for 404 - just means no profile yet
  } finally {
    setLoading(false);
  }
};
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Make sure this function is properly defined as async
  const handleSaveProfile = async () => {
    // Enhanced validation
    if (!formData.age || !formData.weight || !formData.height) {
      Alert.alert('Error', 'Please fill in age, weight, and height');
      return;
    }

    if (parseInt(formData.age) < 13 || parseInt(formData.age) > 100) {
      Alert.alert('Error', 'Please enter a valid age (13-100)');
      return;
    }

    if (parseFloat(formData.weight) < 30 || parseFloat(formData.weight) > 300) {
      Alert.alert('Error', 'Please enter a valid weight (30-300 kg)');
      return;
    }

    if (parseFloat(formData.height) < 100 || parseFloat(formData.height) > 250) {
      Alert.alert('Error', 'Please enter a valid height (100-250 cm)');
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        gender: formData.gender,
        fitness_level: formData.fitness_level,
        goals: formData.goals,
        workout_days: parseInt(formData.workout_days),
        workout_duration: parseInt(formData.workout_duration),
        injuries: formData.injuries,
        equipment: formData.equipment,
        activity_level: formData.activity_level
      };

      console.log('Sending profile data:', profileData);
      
      // This is the line with await - make sure it's inside async function
      const response = await userAPI.updateProfile(profileData);
      
      Alert.alert(
        'Success ✅', 
        'Fitness profile saved successfully!\nYou can now get personalized workouts.',
        [
          {
            text: 'Go to Dashboard',
            onPress: () => navigation.navigate('Dashboard')
          }
        ]
      );
    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.detail || 'Failed to save profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const calculateBMI = () => {
    if (formData.weight && formData.height) {
      const heightInMeters = parseFloat(formData.height) / 100;
      const bmi = parseFloat(formData.weight) / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return '--';
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../assets/images/profile-bg.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Fitness Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subtitle}>
          Personalize your workout experience
        </Text>

        {/* BMI Calculator */}
        <View style={styles.bmiCard}>
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
            style={styles.bmiGradient}
          >
            <Text style={styles.bmiTitle}>Your BMI</Text>
            <View style={styles.bmiValueContainer}>
              <Text style={styles.bmiValue}>{calculateBMI()}</Text>
              <Text style={styles.bmiLabel}>kg/m²</Text>
            </View>
            <Text style={styles.bmiCategory}>
              {formData.weight && formData.height 
                ? getBMICategory(calculateBMI())
                : 'Enter weight & height'}
            </Text>
          </LinearGradient>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color="#667eea" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 25"
                value={formData.age}
                onChangeText={(value) => updateFormData('age', value)}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 70"
                value={formData.weight}
                onChangeText={(value) => updateFormData('weight', value)}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 175"
                value={formData.height}
                onChangeText={(value) => updateFormData('height', value)}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>

          <View style={styles.pickerRow}>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={(value) => updateFormData('gender', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Activity Level</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.activity_level}
                  onValueChange={(value) => updateFormData('activity_level', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Sedentary" value="sedentary" />
                  <Picker.Item label="Light" value="light" />
                  <Picker.Item label="Moderate" value="moderate" />
                  <Picker.Item label="Active" value="active" />
                  <Picker.Item label="Very Active" value="very_active" />
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Fitness Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag" size={20} color="#667eea" />
            <Text style={styles.sectionTitle}>Fitness Goals</Text>
          </View>
          
          <View style={styles.pickerRow}>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Fitness Level</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.fitness_level}
                  onValueChange={(value) => updateFormData('fitness_level', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Beginner" value="beginner" />
                  <Picker.Item label="Intermediate" value="intermediate" />
                  <Picker.Item label="Advanced" value="advanced" />
                </Picker>
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Primary Goal</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.goals}
                  onValueChange={(value) => updateFormData('goals', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Weight Loss" value="weight_loss" />
                  <Picker.Item label="Muscle Gain" value="muscle_gain" />
                  <Picker.Item label="Endurance" value="endurance" />
                  <Picker.Item label="General Fitness" value="general_fitness" />
                </Picker>
              </View>
            </View>
          </View>
        </View>

        {/* Workout Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="dumbbell" size={20} color="#667eea" />
            <Text style={styles.sectionTitle}>Workout Preferences</Text>
          </View>
          
          <View style={styles.pickerRow}>
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Days per Week</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.workout_days}
                  onValueChange={(value) => updateFormData('workout_days', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="2 days" value="2" />
                  <Picker.Item label="3 days" value="3" />
                  <Picker.Item label="4 days" value="4" />
                  <Picker.Item label="5 days" value="5" />
                  <Picker.Item label="6 days" value="6" />
                </Picker>
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Duration (mins)</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.workout_duration}
                  onValueChange={(value) => updateFormData('workout_duration', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="20 min" value="20" />
                  <Picker.Item label="30 min" value="30" />
                  <Picker.Item label="45 min" value="45" />
                  <Picker.Item label="60 min" value="60" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Available Equipment</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.equipment}
                onValueChange={(value) => updateFormData('equipment', value)}
                style={styles.picker}
              >
                <Picker.Item label="Home (No equipment)" value="home" />
                <Picker.Item label="Basic Equipment" value="basic" />
                <Picker.Item label="Full Gym" value="gym" />
                <Picker.Item label="Mixed" value="mixed" />
              </Picker>
            </View>
          </View>
        </View>

        {/* Health Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medkit" size={20} color="#667eea" />
            <Text style={styles.sectionTitle}>Health Information</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Any injuries, health concerns, or limitations?"
            value={formData.injuries}
            onChangeText={(value) => updateFormData('injuries', value)}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>
            {formData.injuries.length}/500 characters
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.buttonDisabled]} 
          onPress={handleSaveProfile}
          disabled={saving}
        >
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
            style={styles.saveGradient}
          >
            {saving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.saveButtonText}>
                  Save Fitness Profile
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  container: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  bmiCard: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bmiGradient: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    opacity: 0.9,
  },
  bmiValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  bmiValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  bmiLabel: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    marginLeft: 4,
  },
  bmiCategory: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    opacity: 0.9,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 14,
    color: '#333',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerContainer: {
    flex: 1,
    marginRight: 8,
  },
  pickerWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  picker: {
    height: 44,
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  saveButton: {
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 30,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default FitnessProfileScreen;