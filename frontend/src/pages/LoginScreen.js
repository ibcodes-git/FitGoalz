import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Dimensions,
  ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (/\s/.test(password)) {
      return 'Password cannot contain spaces';
    }
    return '';
  };

  // Handle email input change with validation
  const handleEmailChange = (text) => {
    setEmail(text);
    if (text.trim() === '') {
      setEmailError('');
    } else if (!validateEmail(text)) {
      setEmailError('Please enter a valid email (e.g., abc@xyz.com)');
    } else {
      setEmailError('');
    }
  };

  // Handle password input change with validation
  const handlePasswordChange = (text) => {
    setPassword(text);
    const error = validatePassword(text);
    setPasswordError(error);
  };

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Validate inputs before making API call
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email (e.g., abc@xyz.com)');
      Alert.alert('Invalid Email', 'Please enter a valid email address in the format: abc@xyz.com');
      return;
    }

    // Validate password
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      Alert.alert('Invalid Password', passwordValidationError);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Attempting login with:', { email, password });

      const response = await authAPI.login({
        email: email.trim(), // Trim email
        password: password,   // Password already validated
      });

      console.log('✅ Login response:', response.data);
      Alert.alert('Success', 'Login successful!');
      navigation.navigate('Dashboard');
    } catch (error) {
      console.log('❌ Full login error object:', error);
      
      let errorMessage = 'Login failed - unknown error';
      
      // Handle different error cases
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Check for specific error types
      if (error.response?.status === 400) {
        errorMessage = 'Invalid email or password format';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.response?.status === 404) {
        errorMessage = 'Backend server not found. Make sure backend is running';
      } else if (error.message?.includes('Network Error')) {
        errorMessage = 'Network error - cannot connect to server. Check your connection.';
      }

      Alert.alert('Login Failed', errorMessage);
      
      // If it's a validation error from backend, show appropriate message
      if (error.response?.status === 422 || error.response?.status === 400) {
        // Check if backend sent specific validation errors
        const backendErrors = error.response?.data;
        if (backendErrors?.email) {
          setEmailError(Array.isArray(backendErrors.email) ? backendErrors.email[0] : backendErrors.email);
        }
        if (backendErrors?.password) {
          setPasswordError(Array.isArray(backendErrors.password) ? backendErrors.password[0] : backendErrors.password);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = () => {
    navigation.navigate('Register');
  };

  // Check if form is valid for enabling login button
  const isFormValid = () => {
    return email.trim() !== '' && 
           password !== '' && 
           validateEmail(email) && 
           validatePassword(password) === '';
  };

  return (
    <ImageBackground 
      source={require('../assets/images/auth-bg.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      {/* Glassmorphism overlay and shapes */}
      <View style={styles.overlay}>
        <View style={styles.background}>
          <LinearGradient
            colors={['#1845ad', '#23a2f6']}
            style={[styles.shape, styles.shapeFirst]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={['#ff512f', '#f09819']}
            style={[styles.shape, styles.shapeSecond]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.form}>
                <Text style={styles.title}>FitGoalz</Text>
                <Text style={styles.subtitle}>Login to your Account</Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={[
                    styles.inputWrapper,
                    emailError ? styles.inputError : null
                  ]}>
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      color={emailError ? '#ff6b6b' : '#e5e5e5'} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor={emailError ? '#ff6b6b' : '#e5e5e5'}
                      value={email}
                      onChangeText={handleEmailChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                  {emailError ? (
                    <Text style={styles.errorText}>
                      <Ionicons name="alert-circle-outline" size={14} color="#ff6b6b" /> {emailError}
                    </Text>
                  ) : (
                    <Text style={styles.hintText}>
                      Format: abc@xyz.com
                    </Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    passwordError ? styles.inputError : null
                  ]}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={passwordError ? '#ff6b6b' : '#e5e5e5'} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={passwordError ? '#ff6b6b' : '#e5e5e5'}
                      value={password}
                      onChangeText={handlePasswordChange}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color={passwordError ? '#ff6b6b' : '#e5e5e5'} 
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordError ? (
                    <Text style={styles.errorText}>
                      <Ionicons name="alert-circle-outline" size={14} color="#ff6b6b" /> {passwordError}
                    </Text>
                  ) : (
                    <Text style={styles.hintText}>
                      Minimum 6 characters, no spaces allowed
                    </Text>
                  )}
                </View>

                <TouchableOpacity 
                  style={[
                    styles.loginButton, 
                    (!isFormValid() || loading) && styles.buttonDisabled
                  ]} 
                  onPress={handleLogin}
                  disabled={!isFormValid() || loading}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRegister} style={styles.registerLink}>
                  <Text style={styles.registerText}>
                    Don't have an account? <Text style={styles.registerHighlight}>Register</Text>
                  </Text>
                </TouchableOpacity>

                {connectionStatus ? (
                  <View style={[
                    styles.connectionContainer,
                    connectionStatus.includes('✅') ? styles.connectionSuccess : styles.connectionError
                  ]}>
                    <Text style={styles.connectionText}>
                      {connectionStatus}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 7, 16, 0.8)',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  shape: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.6,
  },
  shapeFirst: {
    width: width * 0.6,
    height: width * 0.6,
    left: -width * 0.2,
    top: -width * 0.2,
  },
  shapeSecond: {
    width: width * 0.5,
    height: width * 0.5,
    right: -width * 0.1,
    bottom: -width * 0.2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    alignItems: 'center',
  },
  form: {
    width: Math.min(width * 0.9, 400),
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: 15,
    padding: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  inputContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputError: {
    borderColor: '#ff6b6b',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '300',
    color: '#ffffff',
  },
  eyeIcon: {
    padding: 5,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
    fontWeight: '400',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
    fontStyle: 'italic',
  },
  loginButton: {
    marginTop: 40,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loginButtonText: {
    color: '#080710',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  registerLink: {
    marginTop: 20,
    padding: 10,
  },
  registerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
  },
  registerHighlight: {
    color: '#ffffff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  connectionContainer: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectionSuccess: {
    backgroundColor: 'rgba(72, 187, 120, 0.3)',
    borderColor: 'rgba(72, 187, 120, 0.5)',
  },
  connectionError: {
    backgroundColor: 'rgba(245, 101, 101, 0.3)',
    borderColor: 'rgba(245, 101, 101, 0.5)',
  },
  connectionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default LoginScreen;