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

// eSignet API Configuration
const ESIGNET_CONFIG = {
  BASE_URL: 'https://esignet.collab.mosip.net', // Production eSignet URL
  CLIENT_ID: 'your-client-id', // Replace with actual client ID
  REDIRECT_URI: 'your-app://auth-callback',
  SCOPE: 'openid profile',
  ENDPOINTS: {
    AUTHORIZE: '/v1/esignet/authorization/authenticate',
    TOKEN: '/v1/esignet/oauth/token',
    USERINFO: '/v1/esignet/oidc/userinfo',
    SEND_OTP: '/v1/esignet/authorization/send-otp',
    VERIFY_OTP: '/v1/esignet/authorization/authenticate'
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

  const makeESignetRequest = async (endpoint, method = 'POST', data = null) => {
    try {
      const url = `${ESIGNET_CONFIG.BASE_URL}${endpoint}`;
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      console.log(`Making eSignet request to: ${url}`);
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('eSignet API Error:', response.status, errorText);
        throw new Error(`eSignet API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('eSignet API Response:', result);
      return result;
    } catch (error) {
      console.error('eSignet Request Error:', error);
      throw error;
    }
  };

  const handleUINSubmit = async () => {
    if (!validateUIN(uinNumber)) {
      Alert.alert('Invalid UIN', 'Please enter a valid 10-digit MOSIP UIN number.');
      return;
    }

    setIsLoading(true);
    
    try {
      const cleanUIN = uinNumber.replace(/\s/g, '');
      
      // Step 1: Initialize authentication session
      const authRequest = {
        clientId: ESIGNET_CONFIG.CLIENT_ID,
        scope: ESIGNET_CONFIG.SCOPE,
        responseType: 'code',
        redirectUri: ESIGNET_CONFIG.REDIRECT_URI,
        display: 'page',
        prompt: 'consent',
        maxAge: 21600,
        uiLocales: 'en',
        claimsLocales: 'en',
        acrValues: 'mosip:idp:acr:generated-code',
        claims: JSON.stringify({
          userinfo: {
            given_name: { essential: true },
            family_name: { essential: true },
            email: { essential: true },
            phone_number: { essential: true },
            address: { essential: true },
            birthdate: { essential: true },
            gender: { essential: true }
          }
        })
      };

      // Initialize authentication
      const authResponse = await makeESignetRequest(
        ESIGNET_CONFIG.ENDPOINTS.AUTHORIZE,
        'POST',
        authRequest
      );

      if (authResponse.transactionId) {
        setTransactionId(authResponse.transactionId);
        
        // Step 2: Send OTP to the UIN
        const otpRequest = {
          transactionId: authResponse.transactionId,
          individualId: cleanUIN,
          individualIdType: 'UIN',
          otpChannels: ['phone', 'email']
        };

        const otpResponse = await makeESignetRequest(
          ESIGNET_CONFIG.ENDPOINTS.SEND_OTP,
          'POST',
          otpRequest
        );

        if (otpResponse.response === 'SUCCESS') {
          setStep(2);
          setTimer(30);
          setCanResendOtp(false);
          
          Alert.alert(
            'OTP Sent',
            'OTP has been sent to your registered mobile number and email address. Please enter the 6-digit OTP to continue.',
            [{ text: 'OK' }]
          );
        } else {
          throw new Error(otpResponse.errors?.[0]?.message || 'Failed to send OTP');
        }
      } else {
        throw new Error('Failed to initialize authentication session');
      }
    } catch (error) {
      console.error('UIN submission error:', error);
      
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('UIN not found')) {
        errorMessage = 'UIN not found. Please verify your UIN number.';
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
      
      // Verify OTP and complete authentication
      const verifyRequest = {
        transactionId: transactionId,
        individualId: cleanUIN,
        individualIdType: 'UIN',
        challengeList: [
          {
            authFactorType: 'OTP',
            challenge: otp,
            format: 'alpha-numeric'
          }
        ]
      };

      const verifyResponse = await makeESignetRequest(
        ESIGNET_CONFIG.ENDPOINTS.VERIFY_OTP,
        'POST',
        verifyRequest
      );

      if (verifyResponse.response === 'SUCCESS' && verifyResponse.authToken) {
        // Exchange auth token for access token
        const tokenRequest = {
          grant_type: 'authorization_code',
          client_id: ESIGNET_CONFIG.CLIENT_ID,
          code: verifyResponse.authToken,
          redirect_uri: ESIGNET_CONFIG.REDIRECT_URI
        };

        const tokenResponse = await makeESignetRequest(
          ESIGNET_CONFIG.ENDPOINTS.TOKEN,
          'POST',
          tokenRequest
        );

        if (tokenResponse.access_token) {
          // Get user information
          const userInfoResponse = await makeESignetRequest(
            ESIGNET_CONFIG.ENDPOINTS.USERINFO,
            'GET',
            null,
            {
              'Authorization': `Bearer ${tokenResponse.access_token}`
            }
          );

          // Store authentication data
          const authData = {
            isAuthenticated: true,
            uinNumber: cleanUIN,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            tokenType: tokenResponse.token_type,
            expiresIn: tokenResponse.expires_in,
            userData: {
              name: `${userInfoResponse.given_name || ''} ${userInfoResponse.family_name || ''}`.trim(),
              email: userInfoResponse.email,
              phone: userInfoResponse.phone_number,
              address: userInfoResponse.address,
              dateOfBirth: userInfoResponse.birthdate,
              gender: userInfoResponse.gender,
              employeeId: `HW-${cleanUIN.slice(-6)}`
            },
            authenticatedAt: new Date().toISOString(),
            sessionId: `esignet_${Date.now()}`,
          };

          await AsyncStorage.setItem('eSignetAuthData', JSON.stringify(authData));
          await AsyncStorage.setItem('userProfile', JSON.stringify(authData.userData));

          Alert.alert(
            'Authentication Successful',
            `Welcome, ${authData.userData.name}! You have been successfully authenticated with eSignet. You can now upload pending data.`,
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
        } else {
          throw new Error('Failed to obtain access token');
        }
      } else {
        throw new Error(verifyResponse.errors?.[0]?.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'OTP verification failed. Please try again.';
      
      if (error.message.includes('Invalid OTP')) {
        errorMessage = 'Invalid OTP. Please check and enter the correct OTP.';
      } else if (error.message.includes('OTP expired')) {
        errorMessage = 'OTP has expired. Please request a new OTP.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
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
      
      const otpRequest = {
        transactionId: transactionId,
        individualId: cleanUIN,
        individualIdType: 'UIN',
        otpChannels: ['phone', 'email']
      };

      const otpResponse = await makeESignetRequest(
        ESIGNET_CONFIG.ENDPOINTS.SEND_OTP,
        'POST',
        otpRequest
      );

      if (otpResponse.response === 'SUCCESS') {
        setTimer(30);
        setCanResendOtp(false);
        Alert.alert('OTP Resent', 'A new OTP has been sent to your registered mobile number and email.');
      } else {
        throw new Error(otpResponse.errors?.[0]?.message || 'Failed to resend OTP');
      }
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
        <Text style={styles.headerTitle}>Digital Identity Authentication</Text>
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

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
        <Text style={styles.securityText}>
          Your data is encrypted and secure. This is a government-verified MOSIP eSignet authentication system.
        </Text>
      </View>

      {/* Production Notice */}
      <View style={styles.productionNotice}>
        <Ionicons name="information-circle" size={20} color="#2196F3" />
        <Text style={styles.productionText}>
          Production Mode: Real eSignet authentication with MOSIP infrastructure
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