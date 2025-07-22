import { Platform } from 'react-native';

const API_PORT = 5001;
const isAndroid = Platform.OS === 'android';
const API_BASE_URL = isAndroid
  ? `http://10.0.2.2:${API_PORT}/api`  // Android emulator
  : `http://localhost:${API_PORT}/api`; // iOS simulator/localhost

console.log('API Base URL:', API_BASE_URL);

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
