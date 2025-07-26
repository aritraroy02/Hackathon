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
  Animated,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';

export default function HomeScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState(null);
  const [locationString, setLocationString] = useState('Loading...');
  const [userName] = useState('Health Worker'); // This can be passed from login later
  const slideAnim = useState(new Animated.Value(-300))[0];
  const overlayOpacity = useState(new Animated.Value(0))[0];
  const [statusBarHeight, setStatusBarHeight] = useState(0);

  // Get status bar height
  useEffect(() => {
    if (Platform.OS === 'android') {
      setStatusBarHeight(StatusBar.currentHeight || 0);
    }
  }, []);

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

  // Toggle hamburger menu with optimized animation
  const toggleMenu = () => {
    if (menuVisible) {
      // Closing animation - slide out with overlay fade
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start(() => setMenuVisible(false));
    } else {
      // Opening animation - slide in with overlay fade
      setMenuVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  };

  // Navigation handlers
  const handleViewChildData = () => {
    toggleMenu();
    setTimeout(() => navigation.navigate('DataExport'), 250);
  };

  const handleExportChildData = () => {
    toggleMenu();
    setTimeout(() => navigation.navigate('DataExport'), 250);
  };

  const handleNearestHub = () => {
    toggleMenu();
    setTimeout(() => Alert.alert('Nearest Hub', 'Finding nearest health hub...'), 250);
  };

  const handleUploadPendingData = () => {
    toggleMenu();
    setTimeout(() => Alert.alert('Upload Data', 'Uploading pending child data...'), 250);
  };

  const handleContactUs = () => {
    toggleMenu();
    setTimeout(() => Alert.alert('Contact Us', 'Contact information: support@childhealth.com'), 250);
  };

  const handleLogout = () => {
    toggleMenu();
    setTimeout(() => navigation.navigate('Login'), 250);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#FFFFFF" 
        translucent={false} 
      />
      {/* Status Bar Spacer for Android */}
      {Platform.OS === 'android' && <View style={{ height: statusBarHeight, backgroundColor: '#FFFFFF' }} />}
      {/* Header with Hamburger Menu */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.hamburgerButton} 
          onPress={toggleMenu}
          accessibilityLabel="Open navigation menu"
          accessibilityRole="button"
        >
          <Ionicons name="menu" size={24} color="#4A7C59" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileButton} onPress={() => setModalVisible(true)}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Content - Empty for now */}
      <View style={styles.mainContent}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeSubtitle}>Use the menu to navigate through the app</Text>
        </View>
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('Home')}>
          <View style={styles.tabIconContainer}>
            <Ionicons name="home" size={18} color="#4A7C59" />
          </View>
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('DataExport')}>
          <View style={styles.tabIconContainer}>
            <Ionicons name="document-text" size={18} color="#4A7C59" />
          </View>
          <Text style={styles.tabLabel}>Records</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setModalVisible(true)}>
          <View style={styles.tabIconContainer}>
            <Ionicons name="settings" size={18} color="#4A7C59" />
          </View>
          <Text style={styles.tabLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Slide-out Menu */}
      {menuVisible && (
        <View style={styles.menuOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.blurOverlay}>
            <Animated.View 
              style={[
                styles.overlayTouchable,
                { opacity: overlayOpacity }
              ]}
            >
              <TouchableOpacity 
                style={styles.overlayTouchableArea}
                activeOpacity={1} 
                onPress={toggleMenu}
              />
            </Animated.View>
          </BlurView>
          <Animated.View 
            style={[
              styles.slideMenu,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={styles.slideMenuHeader}>
              <Text style={styles.slideMenuTitle}>Menu</Text>
              <TouchableOpacity 
                onPress={toggleMenu}
                accessibilityLabel="Close navigation menu"
                accessibilityRole="button"
                style={styles.closeMenuButton}
              >
                <Text style={styles.closeMenuText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.slideMenuContent} showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={styles.slideMenuItem} 
                onPress={handleViewChildData}
                activeOpacity={0.7}
              >
                <View style={styles.slideMenuItemContent}>
                  <Ionicons name="bar-chart" size={18} color="#4A7C59" />
                  <Text style={styles.slideMenuItemText}>VIEW CHILD DATA</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.slideMenuItem} 
                onPress={handleExportChildData}
                activeOpacity={0.7}
              >
                <View style={styles.slideMenuItemContent}>
                  <Ionicons name="document-text" size={18} color="#4A7C59" />
                  <Text style={styles.slideMenuItemText}>EXPORT CHILD DATA</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.slideMenuItem} 
                onPress={handleNearestHub}
                activeOpacity={0.7}
              >
                <View style={styles.slideMenuItemContent}>
                  <Ionicons name="location" size={18} color="#4A7C59" />
                  <Text style={styles.slideMenuItemText}>NEAREST HUB</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.slideMenuItem} 
                onPress={handleUploadPendingData}
                activeOpacity={0.7}
              >
                <View style={styles.slideMenuItemContent}>
                  <Ionicons name="cloud-upload" size={18} color="#4A7C59" />
                  <Text style={styles.slideMenuItemText}>UPLOAD PENDING CHILD DATA</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.slideMenuItem} 
                onPress={handleContactUs}
                activeOpacity={0.7}
              >
                <View style={styles.slideMenuItemContent}>
                  <Ionicons name="call" size={18} color="#4A7C59" />
                  <Text style={styles.slideMenuItemText}>CONTACT US</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.slideMenuItem} 
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={styles.slideMenuItemContent}>
                  <Ionicons name="log-out" size={18} color="#4A7C59" />
                  <Text style={styles.slideMenuItemText}>LOGOUT</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      )}


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
                <View style={styles.logoutButtonContent}>
                  <Ionicons name="log-out" size={16} color="#FFFFFF" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </View>
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
  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  hamburgerButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerText: {
    fontSize: 24,
    color: '#4A7C59',
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 5,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A7C59',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Main Content Styles
  mainContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A7C59',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Bottom Tab Bar Styles
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  tabIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 12,
    color: '#4A7C59',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Slide Menu Styles
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 300,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  overlayTouchableArea: {
    flex: 1,
  },
  closeMenuButton: {
    padding: 8,
    borderRadius: 20,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideMenu: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 300,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  slideMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4A7C59',
  },
  slideMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeMenuText: {
    fontSize: 30,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  slideMenuContent: {
    flex: 1,
  },
  slideMenuItem: {
    backgroundColor: '#E6F0E6',
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#4A7C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(74, 124, 89, 0.1)',
  },
  slideMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideMenuItemText: {
    fontSize: 16,
    color: '#4A7C59',
    fontWeight: '500',
    marginLeft: 12,
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
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
