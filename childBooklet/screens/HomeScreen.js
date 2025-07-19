import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';

export default function HomeScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState(null);
  const [locationString, setLocationString] = useState('Loading...');
  const [userName] = useState('Health Worker'); // This can be passed from login later

  // Check internet connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationString('Location permission denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        
        // Reverse geocoding to get address
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const locationStr = `${address.city || address.district || 'Unknown City'}, ${address.region || address.state || 'Unknown State'}`;
          setLocationString(locationStr);
        } else {
          setLocationString(`${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationString('Unable to get location');
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Block */}
      <TouchableOpacity style={styles.profileBlock} onPress={() => setModalVisible(true)}>
        <View style={styles.profileIcon}>
          <Text style={styles.profileIconText}>👤</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{userName}</Text>
          <View style={styles.onlineStatus}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Field Representative Health Workers</Text>
          <Text style={styles.subtitle}>Child Health Monitoring System</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.primaryButtonText}>📝 Register New Child</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('DataExport')}
          >
            <Text style={styles.secondaryButtonText}>📊 View Data & Reports</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Quick Actions</Text>
          <Text style={styles.infoText}>• Register new children for health monitoring</Text>
          <Text style={styles.infoText}>• Export and share health data</Text>
          <Text style={styles.infoText}>• Track offline registrations</Text>
          <Text style={styles.infoText}>• Monitor connectivity status</Text>
        </View>
      </ScrollView>

      {/* Profile Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Information</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileLabel}>Name:</Text>
                <Text style={styles.profileValue}>{userName}</Text>
              </View>
              
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileLabel}>Location:</Text>
                <Text style={styles.profileValue}>{locationString}</Text>
              </View>
              
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileLabel}>Online Status:</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]} />
                  <Text style={[styles.profileValue, { color: isOnline ? '#4CAF50' : '#F44336' }]}>
                    {isOnline ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>
              
              {location && (
                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileLabel}>Coordinates:</Text>
                  <Text style={styles.profileValue}>
                    {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
              
              {/* Logout Button */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('Login');
                }}
              >
                <Text style={styles.logoutButtonText}>🚪 Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A7C59',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsContainer: {
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#4A7C59',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#4A7C59',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#4A7C59',
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#4A7C59',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#E8F5E8',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C4E5C4',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#2D5016',
    marginBottom: 6,
    lineHeight: 20,
  },
  // Profile Block Styles
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A7C59',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileIconText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    minWidth: 300,
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  profileDetailRow: {
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A7C59',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    color: '#2D5016',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Logout Button Styles
  logoutButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
