import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production API URL from Google Cloud Run
const PRODUCTION_API_URL = 'https://child-health-backend-747316458447.us-central1.run.app/api';

// Development settings
const API_PORT = 5001;
const LAPTOP_IP = '10.71.101.119'; // Your laptop's IP address

// Determine if we're in production or development
// For now, we'll always use the production URL since it's deployed
const isProduction = true; // Force production mode to use Cloud Run

// Determine the correct API URL based on the environment and platform
const getApiBaseUrl = () => {
  // Use production URL if in production environment or forced
  if (isProduction) {
    return PRODUCTION_API_URL;
  }
  
  // Development environment - check platform
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (isExpoGo) {
    // Running on a real device via Expo Go - use laptop IP
    return `http://${LAPTOP_IP}:${API_PORT}/api`;
  } else if (Platform.OS === 'android') {
    // Android emulator
    return `http://10.0.2.2:${API_PORT}/api`;
  } else {
    // iOS simulator or web
    return `http://localhost:${API_PORT}/api`;
  }
};

const API_BASE_URL = getApiBaseUrl();
console.log('API Base URL:', API_BASE_URL);
console.log('Production mode:', isProduction);
console.log('Running on Expo Go:', Constants.appOwnership === 'expo');

export const API_ENDPOINTS = {
  CHILDREN: `${API_BASE_URL}/children`,
  BULK_UPLOAD: `${API_BASE_URL}/children/bulk`,
  AUTH_VERIFY_UIN: `${API_BASE_URL}/auth/verify-uin`,
  AUTH_VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
  AUTH_PROFILE_UPLOAD: `${API_BASE_URL}/auth/profile-upload`,
};

export const makeRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add JWT token to headers if available
    try {
      const authData = await AsyncStorage.getItem('eSignetAuthData');
      if (authData) {
        const auth = JSON.parse(authData);
        if (auth.accessToken) {
          options.headers['Authorization'] = `Bearer ${auth.accessToken}`;
        }
      }
    } catch (error) {
      console.log('No auth token found or error reading token:', error.message);
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'API request failed');
    }

    return result;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};
