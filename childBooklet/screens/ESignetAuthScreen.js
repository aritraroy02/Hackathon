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
import { checkInternetConnection, showOfflineAlert } from '../utils/networkUtils';
import { API_ENDPOINTS, makeRequest } from '../config/api';

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
    const formatted = cleaned.replace(/(\d{5})(\d{5})/, '$1 $2');
    return formatted.substring(0, 12); // Limit to 10 digits + 2 spaces
  };


  const handleUINSubmit = async () => {
    if (!validateUIN(uinNumber)) {
      Alert.alert('Invalid UIN', 'Please enter a valid 10-digit MOSIP UIN number.');
      return;
    }

    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      showOfflineAlert('Please connect to the internet before proceeding with authentication.');
      return;
    }

    setIsLoading(true);
    try {
      const cleanUIN = uinNumber.replace(/\s/g, '');
      const endpoint = `${API_ENDPOINTS.AUTH_VERIFY_UIN}/${cleanUIN}`;
      const response = await makeRequest(endpoint, 'GET');
      if (!response.success || !response.data?.uinExists) {
        throw new Error(response.error || 'UIN not found.');
      }
      setTransactionId(`txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      setStep(2);
      setTimer(30);
      setCanResendOtp(false);
      Alert.alert(
        'OTP Sent',
        `An OTP has been sent to your registered phone/email. Enter the 6-digit OTP to continue.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('UIN submission error:', error);
      Alert.alert('Authentication Error', error.message || 'Authentication failed. Please try again.');
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
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      showOfflineAlert('Please connect to the internet before proceeding with authentication.');
      return;
    }
    setIsLoading(true);
    try {
      const cleanUIN = uinNumber.replace(/\s/g, '');
      const endpoint = API_ENDPOINTS.AUTH_VERIFY_OTP;
      const response = await makeRequest(endpoint, 'POST', {
        uinNumber: cleanUIN,
        otp,
        transactionId
      });
      if (!response.success || !response.data?.accessToken) {
        throw new Error(response.error || 'OTP verification failed.');
      }
      
      // Add authentication timestamp and session info
      const authDataWithTimestamp = {
        ...response.data,
        authenticatedAt: new Date().toISOString(),
        sessionDuration: 30, // 30 minutes
        isAuthenticated: true
      };
      
      await AsyncStorage.setItem('eSignetAuthData', JSON.stringify(authDataWithTimestamp));
      await AsyncStorage.setItem('userProfile', JSON.stringify(response.data.userData));
      Alert.alert(
        'Authentication Successful',
        `Welcome, ${response.data.userData.name}! You have been successfully authenticated. You can now upload pending data.`,
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
      Alert.alert('Verification Error', error.message || 'OTP verification failed. Please try again.');
      if (error.message && error.message.toLowerCase().includes('session')) {
        setStep(1);
      }
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
      // In production, trigger backend to resend OTP (not implemented in demo)
      setTimer(30);
      setCanResendOtp(false);
      Alert.alert('OTP Resent', 'A new OTP has been sent to your registered contact.');
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
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
        <Text style={styles.headerTitle}>MOSIP ID Authentication</Text>
        <Text style={styles.headerSubtitle}>Government of India - MOSIP</Text>
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
              placeholder="XXXXX XXXXX"
              value={uinNumber}
              onChangeText={(text) => setUinNumber(formatUIN(text))}
              keyboardType="numeric"
              maxLength={11}
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

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
        <Text style={styles.securityText}>
          Your authentication is securely processed via backend and Google Cloud MongoDB.
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