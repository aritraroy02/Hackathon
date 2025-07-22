import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 5001;
const LAPTOP_IP = '10.71.101.119'; // Your laptop's IP address

// Determine the correct API URL based on the platform and environment
const getApiBaseUrl = () => {
  // Check if running in Expo Go (on a real device)
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
console.log('Running on Expo Go:', Constants.appOwnership === 'expo');

export const API_ENDPOINTS = {
  CHILDREN: `${API_BASE_URL}/children`,
  BULK_UPLOAD: `${API_BASE_URL}/children/bulk`,
};

export const makeRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

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
