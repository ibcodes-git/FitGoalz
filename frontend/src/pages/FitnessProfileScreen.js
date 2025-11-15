import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { userAPI } from '../services/api';

const FitnessProfileScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
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
    equipment: 'home'
  });

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          ...response.data,
          age: response.data.age?.toString() || '',
          weight: response.data.weight?.toString() || '',
          height: response.data.height?.toString() || '',
          workout_days: response.data.workout_days?.toString() || '3',
          workout_duration: response.data.workout_duration?.toString() || '30'
        }));
      }
    } catch (error) {
      console.log('No existing profile found');
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    // Validation
    if (!formData.age || !formData.weight || !formData.height) {
      Alert.alert('Error', 'Please fill in age, weight, and height');
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        ...formData,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        workout_days: parseInt(formData.workout_days),
        workout_duration: parseInt(formData.workout_duration)
      };

      await userAPI.updateProfile(profileData);
      Alert.alert('Success', 'Fitness profile saved!');
      navigation.navigate('Dashboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
      console.error('Profile save error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Fitness Profile</Text>
      <Text style={styles.subtitle}>Help us create personalized workouts</Text>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={formData.age}
          onChangeText={(value) => updateFormData('age', value)}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          value={formData.weight}
          onChangeText={(value) => updateFormData('weight', value)}
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Height (cm)"
          value={formData.height}
          onChangeText={(value) => updateFormData('height', value)}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.pickerContainer}>
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

      {/* Fitness Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fitness Goals</Text>
        
        <Text style={styles.label}>Fitness Level</Text>
        <View style={styles.pickerContainer}>
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

        <Text style={styles.label}>Primary Goal</Text>
        <View style={styles.pickerContainer}>
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

      {/* Workout Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Preferences</Text>
        
        <Text style={styles.label}>Days per Week</Text>
        <View style={styles.pickerContainer}>
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

        <Text style={styles.label}>Duration per Session (minutes)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.workout_duration}
            onValueChange={(value) => updateFormData('workout_duration', value)}
            style={styles.picker}
          >
            <Picker.Item label="20 minutes" value="20" />
            <Picker.Item label="30 minutes" value="30" />
            <Picker.Item label="45 minutes" value="45" />
            <Picker.Item label="60 minutes" value="60" />
          </Picker>
        </View>

        <Text style={styles.label}>Available Equipment</Text>
        <View style={styles.pickerContainer}>
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

      {/* Injuries/Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Information</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any injuries or health concerns?"
          value={formData.injuries}
          onChangeText={(value) => updateFormData('injuries', value)}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSaveProfile}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Save Fitness Profile'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FitnessProfileScreen;