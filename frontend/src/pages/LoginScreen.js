import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authAPI } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

const testBackendConnection = async () => {
  try {
    const response = await fetch('http://192.168.0.17:8000'); // ✅ Your actual IP
    const text = await response.text();
    setConnectionStatus('✅ Backend connected!');
    console.log('🌐 Backend connection test:', response.status, text);
  } catch (error) {
    setConnectionStatus('❌ Backend connection failed: ' + error.message);
    console.log('❌ Backend connection failed:', error);
  }
};

  useEffect(() => {
    testBackendConnection();
  }, []);


 const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }

   setLoading(true);
    try {
      console.log('🔄 Attempting login with:', { email, password });

      const response = await authAPI.login({
        email: email,
        password: password,
      });

      console.log('✅ Login response:', response.data);
      Alert.alert('Success', 'Login successful!');
      // Navigate to Dashboard - will create this screen later
      navigation.navigate('Dashboard');
    } catch (error) {
      console.log('❌ Full login error object:', error);
      console.log('📡 Error response data:', error.response?.data);
      console.log('🔴 Error status:', error.response?.status);
      console.log('📋 Error message:', error.message);

      // Better error message
      let errorMessage = 'Login failed - unknown error';
    
      if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
      } else if (error.message) {
      errorMessage = error.message;
      } else if (error.response?.status === 404) {
      errorMessage = 'Backend server not found. Make sure backend is running on localhost:8000';
      } else if (error.response?.status === 401) {
      errorMessage = 'Invalid email or password';
      }

      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = () => {
    navigation.navigate('Register');
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>FitGoalz</Text>
      <Text style={styles.subtitle}>Login to your Account</Text>
      
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
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleRegister}>
        <Text style={styles.link}>Don't have an account? Register</Text>
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
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
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
    backgroundColor: '#007AFF',
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

export default LoginScreen;