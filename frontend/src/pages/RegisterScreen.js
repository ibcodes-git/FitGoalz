import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Dimensions,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    username: false,
    password: false,
    confirmPassword: false,
  });

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Enter valid email (abc@xyz.com)';
    return '';
  };

  // Username validation function
  const validateUsername = (username) => {
    if (!username) return 'Username is required';
    if (username.length < 4) return 'Min 4 characters';
    if (/\s/.test(username)) return 'No spaces allowed';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Only letters, numbers, underscores';
    return '';
  };

  // Password validation function
  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Min 6 characters';
    if (/\s/.test(password)) return 'No spaces allowed';
    return '';
  };

  // Confirm password validation function
  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Confirm password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  // Validate all fields
  const validateForm = () => {
    const errors = {
      email: validateEmail(formData.email),
      username: validateUsername(formData.username),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword, formData.password),
    };
    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  // Handle field change with validation
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate the changed field
    let error = '';
    switch (field) {
      case 'email':
        error = validateEmail(value);
        break;
      case 'username':
        error = validateUsername(value);
        break;
      case 'password':
        error = validatePassword(value);
        // Also validate confirm password if it's been entered
        if (formData.confirmPassword) {
          setFormErrors(prev => ({
            ...prev,
            confirmPassword: validateConfirmPassword(formData.confirmPassword, value)
          }));
        }
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(value, formData.password);
        break;
    }
    
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle field blur
  const handleFieldBlur = (field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleRegister = async () => {
    // Mark all fields as touched
    setTouchedFields({
      email: true,
      username: true,
      password: true,
      confirmPassword: true,
    });

    // Validate form
    if (!validateForm()) {
      // Find the first error to show in alert
      const firstErrorField = Object.keys(formErrors).find(field => formErrors[field]);
      if (firstErrorField) {
        Alert.alert('Validation Error', formErrors[firstErrorField]);
      }
      return;
    }

    const { email, username, password } = formData;
    
    setLoading(true);
    try {
      console.log('🔄 Attempting registration with:', { email, username });
      const response = await authAPI.register({ 
        email: email.trim(), 
        username: username.trim(), 
        password 
      });
      console.log('✅ Registration response:', response.data);

      Alert.alert(
        'Success', 
        'Registration successful! Please login.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.log('❌ Full registration error object:', error);
      console.log('📡 Error response data:', error.response?.data);
      console.log('🔴 Error status:', error.response?.status);
      console.log('📋 Error message:', error.message);

      let errorMessage = 'Registration failed';
      
      // Parse backend validation errors
      if (error.response?.status === 422 || error.response?.status === 400) {
        const backendErrors = error.response?.data;
        if (backendErrors?.detail) {
          errorMessage = Array.isArray(backendErrors.detail) 
            ? backendErrors.detail.map(err => `${err.loc?.[1] || 'Field'}: ${err.msg}`).join('\n')
            : backendErrors.detail;
        } else if (backendErrors?.email) {
          errorMessage = `Email: ${backendErrors.email}`;
          setFormErrors(prev => ({ ...prev, email: backendErrors.email }));
        } else if (backendErrors?.username) {
          errorMessage = `Username: ${backendErrors.username}`;
          setFormErrors(prev => ({ ...prev, username: backendErrors.username }));
        } else if (backendErrors?.password) {
          errorMessage = `Password: ${backendErrors.password}`;
          setFormErrors(prev => ({ ...prev, password: backendErrors.password }));
        }
      } else if (error.response?.status === 409) {
        errorMessage = 'User already exists';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error';
      } else if (error.message?.includes('Network Error')) {
        errorMessage = 'Cannot connect to server';
      }

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid for button enabling
  const isFormValid = () => {
    return formData.email && 
           formData.username && 
           formData.password && 
           formData.confirmPassword && 
           !formErrors.email && 
           !formErrors.username && 
           !formErrors.password && 
           !formErrors.confirmPassword;
  };

  return (
    <ImageBackground 
      source={require('../assets/images/auth-bg.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <View style={styles.form}>
                <Text style={styles.title}>FitGoalz</Text>
                <Text style={styles.subtitle}>Create Account</Text>

                {/* Email Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={[
                    styles.inputWrapper,
                    formErrors.email && touchedFields.email && styles.inputError
                  ]}>
                    <Ionicons 
                      name="mail-outline" 
                      size={18} 
                      color={formErrors.email && touchedFields.email ? '#ff6b6b' : '#e5e5e5'} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor={formErrors.email && touchedFields.email ? '#ff6b6b' : '#e5e5e5'}
                      value={formData.email}
                      onChangeText={(value) => updateFormData('email', value)}
                      onBlur={() => handleFieldBlur('email')}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                  {formErrors.email && touchedFields.email ? (
                    <Text style={styles.errorText}>
                      <Ionicons name="alert-circle-outline" size={12} color="#ff6b6b" /> {formErrors.email}
                    </Text>
                  ) : (
                    <Text style={styles.hintText}>
                      Format: abc@xyz.com
                    </Text>
                  )}
                </View>

                {/* Username Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Username</Text>
                  <View style={[
                    styles.inputWrapper,
                    formErrors.username && touchedFields.username && styles.inputError
                  ]}>
                    <Ionicons 
                      name="person-outline" 
                      size={18} 
                      color={formErrors.username && touchedFields.username ? '#ff6b6b' : '#e5e5e5'} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor={formErrors.username && touchedFields.username ? '#ff6b6b' : '#e5e5e5'}
                      value={formData.username}
                      onChangeText={(value) => updateFormData('username', value)}
                      onBlur={() => handleFieldBlur('username')}
                      autoCapitalize="none"
                      autoComplete="username"
                    />
                  </View>
                  {formErrors.username && touchedFields.username ? (
                    <Text style={styles.errorText}>
                      <Ionicons name="alert-circle-outline" size={12} color="#ff6b6b" /> {formErrors.username}
                    </Text>
                  ) : (
                    <Text style={styles.hintText}>
                      Min 4 chars, no spaces
                    </Text>
                  )}
                </View>

                {/* Password Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    formErrors.password && touchedFields.password && styles.inputError
                  ]}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={18} 
                      color={formErrors.password && touchedFields.password ? '#ff6b6b' : '#e5e5e5'} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter password"
                      placeholderTextColor={formErrors.password && touchedFields.password ? '#ff6b6b' : '#e5e5e5'}
                      value={formData.password}
                      onChangeText={(value) => updateFormData('password', value)}
                      onBlur={() => handleFieldBlur('password')}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={18} 
                        color={formErrors.password && touchedFields.password ? '#ff6b6b' : '#e5e5e5'} 
                      />
                    </TouchableOpacity>
                  </View>
                  {formErrors.password && touchedFields.password ? (
                    <Text style={styles.errorText}>
                      <Ionicons name="alert-circle-outline" size={12} color="#ff6b6b" /> {formErrors.password}
                    </Text>
                  ) : (
                    <Text style={styles.hintText}>
                      Min 6 chars, no spaces
                    </Text>
                  )}
                </View>

                {/* Confirm Password Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={[
                    styles.inputWrapper,
                    formErrors.confirmPassword && touchedFields.confirmPassword && styles.inputError
                  ]}>
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={18} 
                      color={formErrors.confirmPassword && touchedFields.confirmPassword ? '#ff6b6b' : '#e5e5e5'} 
                      style={styles.inputIcon} 
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter password"
                      placeholderTextColor={formErrors.confirmPassword && touchedFields.confirmPassword ? '#ff6b6b' : '#e5e5e5'}
                      value={formData.confirmPassword}
                      onChangeText={(value) => updateFormData('confirmPassword', value)}
                      onBlur={() => handleFieldBlur('confirmPassword')}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                        size={18} 
                        color={formErrors.confirmPassword && touchedFields.confirmPassword ? '#ff6b6b' : '#e5e5e5'} 
                      />
                    </TouchableOpacity>
                  </View>
                  {formErrors.confirmPassword && touchedFields.confirmPassword ? (
                    <Text style={styles.errorText}>
                      <Ionicons name="alert-circle-outline" size={12} color="#ff6b6b" /> {formErrors.confirmPassword}
                    </Text>
                  ) : (
                    <Text style={styles.hintText}>
                      Re-enter your password
                    </Text>
                  )}
                </View>

                {/* Register Button */}
                <TouchableOpacity 
                  style={[
                    styles.registerButton, 
                    (!isFormValid() || loading) && styles.buttonDisabled
                  ]} 
                  onPress={handleRegister}
                  disabled={!isFormValid() || loading}
                >
                  <Text style={styles.registerButtonText}>
                    {loading ? 'Creating Account...' : 'Register'}
                  </Text>
                </TouchableOpacity>

                {/* Login Link */}
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Login')} 
                  style={styles.loginLink}
                >
                  <Text style={styles.loginText}>
                    Already have an account? <Text style={styles.loginHighlight}>Login</Text>
                  </Text>
                </TouchableOpacity>
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
    width: width * 0.5,
    height: width * 0.5,
    left: -width * 0.15,
    top: -width * 0.15,
  },
  shapeSecond: {
    width: width * 0.4,
    height: width * 0.4,
    right: -width * 0.08,
    bottom: -width * 0.15,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  formContainer: {
    alignItems: 'center',
    width: '100%',
  },
  form: {
    width: '95%',
    maxWidth: 380,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 15,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
    marginBottom: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  inputContainer: {
    marginTop: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 6,
    marginLeft: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputError: {
    borderColor: '#ff6b6b',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '400',
    color: '#ffffff',
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 4,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 3,
    fontWeight: '400',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 3,
    fontStyle: 'italic',
  },
  registerButton: {
    marginTop: 25,
    backgroundColor: '#34C759',
    borderRadius: 8,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(52, 199, 89, 0.5)',
  },
  loginLink: {
    marginTop: 18,
    padding: 8,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
  },
  loginHighlight: {
    color: '#ffffff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;