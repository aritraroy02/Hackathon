import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock MOSIP ID data - simulating a local database of valid MOSIP IDs
const MOCK_MOSIP_DATA = {
  '1234567890': {
    name: 'ARITRADITYA ROY',
    email: 'aritraditya.roy@gmailcom',
    phone: '+91-9876543210',
    address: '123 Main Street, New Delhi, Delhi 110001',
    dateOfBirth: '1985-06-15',
    gender: 'Male',
    photo: null
  },
  '9876543210': {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+91-8765432109',
    address: '456 Park Avenue, Mumbai, Maharashtra 400001',
    dateOfBirth: '1990-03-20',
    gender: 'Female',
    photo: null
  },
  '5555555555': {
    name: 'Dr. Alice Johnson',
    email: 'alice.johnson@healthcare.gov.in',
    phone: '+91-7654321098',
    address: '789 Hospital Road, Bangalore, Karnataka 560001',
    dateOfBirth: '1982-11-10',
    gender: 'Female',
    photo: null
  },
  '1111111111': {
    name: 'Health Worker Demo',
    email: 'demo@health.gov.in',
    phone: '+91-9999999999',
    address: 'Demo Address, Demo City, Demo State 123456',
    dateOfBirth: '1988-01-01',
    gender: 'Male',
    photo: null
  }
};

export default function ESignetAuthScreen({ navigation, route }) {
  const [step, setStep] = useState(1); // 1: UIN input, 2: OTP verification
  const [uinNumber, setUinNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0 && !canResendOtp) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [step, timer, canResendOtp]);

  const validateUIN = (number) => {
    // MOSIP UIN validation (10 digits)
    const uinRegex = /^\d{10}$/;
    return uinRegex.test(number.replace(/\s/g, ''));
  };

  const formatUIN = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    // Add spaces every 4 digits for better readability
    const formatted = cleaned.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3');
    return formatted.substring(0, 12); // Limit to 10 digits + 2 spaces
  };


  const handleUINSubmit = async () => {
    if (!validateUIN(uinNumber)) {
      Alert.alert('Invalid UIN', 'Please enter a valid 10-digit MOSIP UIN number.');
      return;
    }

    setIsLoading(true);
    
    try {
      const cleanUIN = uinNumber.replace(/\s/g, '');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if MOSIP ID exists in our mock database
      const userData = MOCK_MOSIP_DATA[cleanUIN];
      
      if (!userData) {
        throw new Error('MOSIP ID not found. Please use one of the demo IDs: 1234567890, 9876543210, 5555555555, or 1111111111');
      }
      
      // Generate mock transaction ID and proceed to OTP step
      const mockTransactionId = `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setTransactionId(mockTransactionId);
      setStep(2);
      setTimer(30);
      setCanResendOtp(false);
      
      Alert.alert(
        'OTP Sent (Mock)',
        `A mock OTP has been sent to ${userData.phone} and ${userData.email}. For demo purposes, use any 6-digit number as OTP (e.g., 123456).`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('UIN submission error:', error);
      
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error.message.includes('MOSIP ID not found')) {
        errorMessage = error.message;
      } else if (error.message.includes('Invalid UIN')) {
        errorMessage = 'Invalid UIN format. Please enter a valid 10-digit UIN.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Authentication Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }

    if (!transactionId) {
      Alert.alert('Session Error', 'Authentication session expired. Please start again.');
      setStep(1);
      return;
    }

    setIsLoading(true);

    try {
      const cleanUIN = uinNumber.replace(/\s/g, '');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get user data from mock database
      const userData = MOCK_MOSIP_DATA[cleanUIN];
      
      if (!userData) {
        throw new Error('User data not found. Session may have expired.');
      }
      
      // For demo purposes, accept any 6-digit OTP
      // In real implementation, this would verify against sent OTP
      if (!/^\d{6}$/.test(otp)) {
        throw new Error('Invalid OTP format. Please enter 6 digits.');
      }
      
      // Create mock authentication data
      const authData = {
        isAuthenticated: true,
        uinNumber: cleanUIN,
        username: userData.name, // Store username for easy access
        accessToken: `mock_access_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        userData: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          dateOfBirth: userData.dateOfBirth,
          gender: userData.gender,
          employeeId: `HW-${cleanUIN.slice(-6)}`
        },
        authenticatedAt: new Date().toISOString(),
        sessionId: `mock_session_${Date.now()}`,
      };

      await AsyncStorage.setItem('eSignetAuthData', JSON.stringify(authData));
      await AsyncStorage.setItem('userProfile', JSON.stringify(authData.userData));

      Alert.alert(
        'Authentication Successful (Mock)',
        `Welcome, ${authData.userData.name}! You have been successfully authenticated with mock MOSIP ID. You can now upload pending data.`,
        [
          {
            text: 'Continue',
            onPress: () => {
              if (route.params?.returnTo) {
                navigation.navigate(route.params.returnTo);
              } else {
                navigation.navigate('Home');
              }
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'OTP verification failed. Please try again.';
      
      if (error.message.includes('Invalid OTP format')) {
        errorMessage = error.message;
      } else if (error.message.includes('User data not found')) {
        errorMessage = 'Session expired. Please start authentication again.';
        setStep(1);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Verification Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!transactionId) {
      Alert.alert('Session Error', 'Please start authentication again.');
      setStep(1);
      return;
    }

    setIsLoading(true);
    
    try {
      const cleanUIN = uinNumber.replace(/\s/g, '');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get user data to show contact info
      const userData = MOCK_MOSIP_DATA[cleanUIN];
      
      if (!userData) {
        throw new Error('User data not found. Session may have expired.');
      }
      
      // Reset timer for mock OTP resend
      setTimer(30);
      setCanResendOtp(false);
      
      Alert.alert(
        'OTP Resent (Mock)', 
        `A new mock OTP has been sent to ${userData.phone} and ${userData.email}. Use any 6-digit number as OTP.`
      );
      
    } catch (error) {
      console.error('Resend OTP error:', error);
      
      if (error.message.includes('User data not found')) {
        Alert.alert('Session Error', 'Session expired. Please start authentication again.');
        setStep(1);
      } else {
        Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* eSignet Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>eSignet</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Mock MOSIP ID Authentication</Text>
        <Text style={styles.headerSubtitle}>Demo Mode - Government of India - MOSIP</Text>
      </View>

      {step === 1 && (
        <View style={styles.formContainer}>
          <Text style={styles.stepTitle}>Step 1: Enter MOSIP UIN Number</Text>
          <Text style={styles.stepDescription}>
            Please enter your 10-digit MOSIP UIN number to proceed with authentication.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>MOSIP UIN Number</Text>
            <TextInput
              style={styles.input}
              placeholder="XXXX XXXX XX"
              value={uinNumber}
              onChangeText={(text) => setUinNumber(formatUIN(text))}
              keyboardType="numeric"
              maxLength={12}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, !validateUIN(uinNumber) && styles.submitButtonDisabled]}
            onPress={handleUINSubmit}
            disabled={!validateUIN(uinNumber) || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={styles.formContainer}>
          <Text style={styles.stepTitle}>Step 2: Enter OTP</Text>
          <Text style={styles.stepDescription}>
            Enter the 6-digit OTP sent to your registered mobile number and email address.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>OTP</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="XXXXXX"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
              autoFocus
            />
          </View>

          <View style={styles.timerContainer}>
            {!canResendOtp ? (
              <Text style={styles.timerText}>Resend OTP in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, otp.length !== 6 && styles.submitButtonDisabled]}
            onPress={handleOtpSubmit}
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Verify & Authenticate</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(1)}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>← Back to UIN</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Demo Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
        <Text style={styles.securityText}>
          Demo Mode: This is a mock MOSIP authentication system for testing purposes.
        </Text>
      </View>

      {/* Available Demo IDs Notice */}
      <View style={styles.productionNotice}>
        <Ionicons name="information-circle" size={20} color="#2196F3" />
        <Text style={styles.productionText}>
          Demo IDs: 1234567890, 9876543210, 5555555555, 1111111111 | Any 6-digit OTP works
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    backgroundColor: '#f9f9f9',
    letterSpacing: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    color: '#666',
  },
  resendText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  securityText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#4CAF50',
  },
  productionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  productionText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    color: '#2196F3',
  },
});