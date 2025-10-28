import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authAPI } from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

//   const handleRegister = async () => {
//   if (!email || !username || !password) {
//     Alert.alert('Error', 'Please fill in all fields');
//     return;
//   }

//   setLoading(true);
//   try {
//     console.log('Attempting registration with:', { email, username, password });
    
//     const response = await authAPI.register({
//       email: email,
//       username: username,
//       password: password
//     });
    
//     console.log('Registration successful:', response.data);
//     Alert.alert('Success', 'Registration successful! Please login.');
//     navigation.navigate('Login');
//   } catch (error) {
//     console.log('Full registration error:', error);
//     console.log('Error response:', error.response?.data);
//     Alert.alert('Error', `Registration failed: ${error.response?.data?.detail || error.message}`);
//   } finally {
//     setLoading(false);
//   }
// };

const handleRegister = async () => {
  setLoading(true);
  try {
    const response = await fetch('http://192.168.0.14:8000/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        username: username,
        password: password
      }),
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      Alert.alert('Success', 'Registration successful!');
      navigation.navigate('Login');
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
      Alert.alert('Error', `HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.log('Network error:', error);
    Alert.alert('Error', `Network error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join FitGoalz Today</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password (min. 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating Account...' : 'Register'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 40,
    color: '#666',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
  },
});