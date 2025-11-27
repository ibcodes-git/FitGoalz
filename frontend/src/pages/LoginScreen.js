import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ImageBackground, KeyboardAvoidingView, Platform } from 'react-native';
import { authAPI } from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');

  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://192.168.0.17:8000'); 
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
      navigation.navigate('Dashboard');
    } catch (error) {
      console.log('❌ Full login error object:', error);
      
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
    <ImageBackground 
      source={require('../assets/images/auth-bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <Text style={styles.title}>FitGoalz</Text>
            <Text style={styles.subtitle}>Login to your Account</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
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

            {connectionStatus ? (
              <Text style={[
                styles.connectionStatus, 
                connectionStatus.includes('✅') ? styles.connectionSuccess : styles.connectionError
              ]}>
                {connectionStatus}
              </Text>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2D3748',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: '#4A5568',
  },
  input: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
    color: '#2D3748',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    backgroundColor: '#4299E1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4299E1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: '#4299E1',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  connectionStatus: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
    fontWeight: '500',
    padding: 8,
    borderRadius: 8,
  },
  connectionSuccess: {
    backgroundColor: 'rgba(72, 187, 120, 0.2)',
    color: '#22543D',
  },
  connectionError: {
    backgroundColor: 'rgba(245, 101, 101, 0.2)',
    color: '#742A2A',
  },
});

export default LoginScreen;