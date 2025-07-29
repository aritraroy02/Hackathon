import NetInfo from '@react-native-community/netinfo';

/**
 * Check if the device has an active internet connection
 * @returns {Promise<boolean>} - Returns true if connected, false if offline
 */
export const checkInternetConnection = async () => {
  try {
    const netInfoState = await NetInfo.fetch();
    return netInfoState.isConnected && netInfoState.isInternetReachable;
  } catch (error) {
    console.error('Error checking internet connection:', error);
    return false;
  }
};

/**
 * Subscribe to network state changes
 * @param {Function} callback - Callback function to handle network state changes
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToNetworkChanges = (callback) => {
  return NetInfo.addEventListener(state => {
    const isConnected = state.isConnected && state.isInternetReachable;
    callback(isConnected);
  });
};

/**
 * Show a standard offline alert
 * @param {string} customMessage - Optional custom message
 */
export const showOfflineAlert = (customMessage) => {
  const { Alert } = require('react-native');
  
  Alert.alert(
    'No Internet Connection',
    customMessage || 'Please connect to the internet before proceeding further.',
    [{ text: 'OK', style: 'cancel' }]
  );
};
