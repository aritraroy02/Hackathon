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
  Switch,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [offlineModeEnabled, setOfflineModeEnabled] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState(null);
  const [locationString, setLocationString] = useState('Loading...');
  const [userName] = useState('Health Worker');
  const slideAnim = useState(new Animated.Value(-300))[0];
  const overlayOpacity = useState(new Animated.Value(0))[0];

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

  // Create themed styles
  const themedStyles = createThemedStyles(theme, insets);

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
    <View style={themedStyles.container}>
      <StatusBar 
        barStyle={theme.statusBarStyle} 
        backgroundColor={theme.primary} 
        translucent={false} 
      />
      
      {/* Header with Hamburger Menu */}
      <View style={themedStyles.headerContainer}>
        <TouchableOpacity 
          style={themedStyles.hamburgerButton} 
          onPress={toggleMenu}
          accessibilityLabel="Open navigation menu"
          accessibilityRole="button"
        >
          <Ionicons name="menu" size={24} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={themedStyles.profileButton} onPress={() => setModalVisible(true)}>
          <View style={themedStyles.profileCircle}>
            <Ionicons name="person" size={20} color={theme.whiteText} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={themedStyles.mainContent}>
        <View style={themedStyles.welcomeContainer}>
          <Text style={themedStyles.welcomeSubtitle}>Use the menu to navigate through the app</Text>
        </View>
      </View>

      {/* Bottom Tab Bar */}
      <View style={themedStyles.bottomTabBar}>
        <TouchableOpacity style={themedStyles.tabItem} onPress={() => navigation.navigate('Signup')}>
          <View style={themedStyles.tabIconContainer}>
            <Ionicons name="person-add" size={18} color={theme.primary} />
          </View>
          <Text style={themedStyles.tabLabel}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity style={themedStyles.tabItem} onPress={() => navigation.navigate('DataExport')}>
          <View style={themedStyles.tabIconContainer}>
            <Ionicons name="eye" size={18} color={theme.primary} />
          </View>
          <Text style={themedStyles.tabLabel}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity style={themedStyles.tabItem} onPress={() => setSettingsModalVisible(true)}>
          <View style={themedStyles.tabIconContainer}>
            <Ionicons name="settings" size={18} color={theme.primary} />
          </View>
          <Text style={themedStyles.tabLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Slide-out Menu */}
      {menuVisible && (
        <View style={themedStyles.menuOverlay}>
          <BlurView intensity={80} tint={isDarkMode ? "dark" : "light"} style={themedStyles.blurOverlay}>
            <Animated.View 
              style={[
                themedStyles.overlayTouchable,
                { opacity: overlayOpacity }
              ]}
            >
              <TouchableOpacity 
                style={themedStyles.overlayTouchableArea}
                activeOpacity={1} 
                onPress={toggleMenu}
              />
            </Animated.View>
          </BlurView>
          <Animated.View 
            style={[
              themedStyles.slideMenu,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <View style={themedStyles.slideMenuHeader}>
              <Text style={themedStyles.slideMenuTitle}>Menu</Text>
              <TouchableOpacity 
                onPress={toggleMenu}
                accessibilityLabel="Close navigation menu"
                accessibilityRole="button"
                style={themedStyles.closeMenuButton}
              >
                <Text style={themedStyles.closeMenuText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={themedStyles.slideMenuContent} showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={themedStyles.slideMenuItem} 
                onPress={handleViewChildData}
                activeOpacity={0.7}
              >
                <View style={themedStyles.slideMenuItemContent}>
                  <Ionicons name="bar-chart" size={18} color={theme.primary} />
                  <Text style={themedStyles.slideMenuItemText}>VIEW CHILD DATA</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={themedStyles.slideMenuItem} 
                onPress={handleExportChildData}
                activeOpacity={0.7}
              >
                <View style={themedStyles.slideMenuItemContent}>
                  <Ionicons name="document-text" size={18} color={theme.primary} />
                  <Text style={themedStyles.slideMenuItemText}>EXPORT CHILD DATA</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={themedStyles.slideMenuItem} 
                onPress={handleNearestHub}
                activeOpacity={0.7}
              >
                <View style={themedStyles.slideMenuItemContent}>
                  <Ionicons name="location" size={18} color={theme.primary} />
                  <Text style={themedStyles.slideMenuItemText}>NEAREST HUB</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={themedStyles.slideMenuItem} 
                onPress={handleUploadPendingData}
                activeOpacity={0.7}
              >
                <View style={themedStyles.slideMenuItemContent}>
                  <Ionicons name="cloud-upload" size={18} color={theme.primary} />
                  <Text style={themedStyles.slideMenuItemText}>UPLOAD PENDING CHILD DATA</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={themedStyles.slideMenuItem} 
                onPress={handleContactUs}
                activeOpacity={0.7}
              >
                <View style={themedStyles.slideMenuItemContent}>
                  <Ionicons name="call" size={18} color={theme.primary} />
                  <Text style={themedStyles.slideMenuItemText}>CONTACT US</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={themedStyles.slideMenuItem} 
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={themedStyles.slideMenuItemContent}>
                  <Ionicons name="log-out" size={18} color={theme.primary} />
                  <Text style={themedStyles.slideMenuItemText}>LOGOUT</Text>
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
        <View style={themedStyles.modalOverlay}>
          <View style={themedStyles.modalContent}>
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.modalTitle}>Profile Information</Text>
              <TouchableOpacity
                style={themedStyles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={themedStyles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={themedStyles.modalBody}>
              <View style={themedStyles.profileDetailRow}>
                <Text style={themedStyles.profileLabel}>Name:</Text>
                <Text style={themedStyles.profileValue}>{userName}</Text>
              </View>
              
              <View style={themedStyles.profileDetailRow}>
                <Text style={themedStyles.profileLabel}>Location:</Text>
                <Text style={themedStyles.profileValue}>{locationString}</Text>
              </View>
              
              <View style={themedStyles.profileDetailRow}>
                <Text style={themedStyles.profileLabel}>Online Status:</Text>
                <View style={themedStyles.statusRow}>
                  <View style={[themedStyles.statusDot, { backgroundColor: isOnline ? theme.success : theme.error }]} />
                  <Text style={[themedStyles.profileValue, { color: isOnline ? theme.success : theme.error }]}>
                    {isOnline ? 'Connected' : 'Disconnected'}
                  </Text>
                </View>
              </View>
              
              {location && (
                <View style={themedStyles.profileDetailRow}>
                  <Text style={themedStyles.profileLabel}>Coordinates:</Text>
                  <Text style={themedStyles.profileValue}>
                    {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
              
              {/* Logout Button */}
              <TouchableOpacity
                style={themedStyles.logoutButton}
                onPress={() => {
                  setModalVisible(false);
                  navigation.navigate('Login');
                }}
              >
                <View style={themedStyles.logoutButtonContent}>
                  <Ionicons name="log-out" size={16} color={theme.whiteText} />
                  <Text style={themedStyles.logoutButtonText}>Logout</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={themedStyles.modalOverlay}>
          <View style={[themedStyles.modalContent, { maxWidth: 380, minHeight: 500 }]}>
            <View style={themedStyles.modalHeader}>
              <Text style={themedStyles.modalTitle}>App Settings</Text>
              <TouchableOpacity
                style={themedStyles.closeButton}
                onPress={() => setSettingsModalVisible(false)}
              >
                <Text style={themedStyles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={themedStyles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Notifications Section */}
              <View style={themedStyles.settingsSection}>
                <Text style={themedStyles.sectionTitle}>Notifications</Text>
                
                <View style={themedStyles.settingRow}>
                  <View style={themedStyles.settingInfo}>
                    <Ionicons name="notifications-outline" size={20} color={theme.primary} />
                    <View style={themedStyles.settingTextContainer}>
                      <Text style={themedStyles.settingLabel}>Push Notifications</Text>
                      <Text style={themedStyles.settingDescription}>Receive alerts and reminders</Text>
                    </View>
                  </View>
                  <Switch
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={notificationsEnabled ? theme.whiteText : '#F4F3F4'}
                    onValueChange={setNotificationsEnabled}
                    value={notificationsEnabled}
                  />
                </View>
              </View>

              {/* Appearance Section */}
              <View style={themedStyles.settingsSection}>
                <Text style={themedStyles.sectionTitle}>Appearance</Text>
                
                <View style={themedStyles.settingRow}>
                  <View style={themedStyles.settingInfo}>
                    <Ionicons name={isDarkMode ? "moon" : "moon-outline"} size={20} color={theme.primary} />
                    <View style={themedStyles.settingTextContainer}>
                      <Text style={themedStyles.settingLabel}>Dark Mode</Text>
                      <Text style={themedStyles.settingDescription}>Use dark theme</Text>
                    </View>
                  </View>
                  <Switch
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={isDarkMode ? theme.whiteText : '#F4F3F4'}
                    onValueChange={toggleTheme}
                    value={isDarkMode}
                  />
                </View>
              </View>

              {/* Data & Sync Section */}
              <View style={themedStyles.settingsSection}>
                <Text style={themedStyles.sectionTitle}>Data & Sync</Text>
                
                <View style={themedStyles.settingRow}>
                  <View style={themedStyles.settingInfo}>
                    <Ionicons name="sync-outline" size={20} color={theme.primary} />
                    <View style={themedStyles.settingTextContainer}>
                      <Text style={themedStyles.settingLabel}>Auto Sync</Text>
                      <Text style={themedStyles.settingDescription}>Automatically sync data when online</Text>
                    </View>
                  </View>
                  <Switch
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={autoSyncEnabled ? theme.whiteText : '#F4F3F4'}
                    onValueChange={setAutoSyncEnabled}
                    value={autoSyncEnabled}
                  />
                </View>
                
                <View style={themedStyles.settingRow}>
                  <View style={themedStyles.settingInfo}>
                    <Ionicons name="cloud-offline-outline" size={20} color={theme.primary} />
                    <View style={themedStyles.settingTextContainer}>
                      <Text style={themedStyles.settingLabel}>Offline Mode</Text>
                      <Text style={themedStyles.settingDescription}>Enable offline data collection</Text>
                    </View>
                  </View>
                  <Switch
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={offlineModeEnabled ? theme.whiteText : '#F4F3F4'}
                    onValueChange={setOfflineModeEnabled}
                    value={offlineModeEnabled}
                  />
                </View>
              </View>

              {/* Storage & Privacy Section */}
              <View style={themedStyles.settingsSection}>
                <Text style={themedStyles.sectionTitle}>Storage & Privacy</Text>
                
                <TouchableOpacity style={themedStyles.settingButton} onPress={() => Alert.alert('Clear Cache', 'Cache cleared successfully!')}>
                  <View style={themedStyles.settingInfo}>
                    <Ionicons name="trash-outline" size={20} color={theme.primary} />
                    <Text style={themedStyles.settingLabel}>Clear Cache</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.lightText} />
                </TouchableOpacity>
                
                <TouchableOpacity style={themedStyles.settingButton} onPress={() => Alert.alert('Export Data', 'Data export initiated...')}>
                  <View style={themedStyles.settingInfo}>
                    <Ionicons name="download-outline" size={20} color={theme.primary} />
                    <Text style={themedStyles.settingLabel}>Export Data</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.lightText} />
                </TouchableOpacity>
                
                <TouchableOpacity style={themedStyles.settingButton} onPress={() => Alert.alert('Privacy Policy', 'Opening privacy policy...')}>
                  <View style={themedStyles.settingInfo}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
                    <Text style={themedStyles.settingLabel}>Privacy Policy</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.lightText} />
                </TouchableOpacity>
              </View>

              {/* About Section */}
              <View style={themedStyles.settingsSection}>
                <Text style={themedStyles.sectionTitle}>About</Text>
                
                <TouchableOpacity style={themedStyles.settingButton} onPress={() => Alert.alert('Help & Support', 'Opening help center...')}>
                  <View style={themedStyles.settingInfo}>
                    <Ionicons name="help-circle-outline" size={20} color={theme.primary} />
                    <Text style={themedStyles.settingLabel}>Help & Support</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.lightText} />
                </TouchableOpacity>
                
                <TouchableOpacity style={themedStyles.settingButton} onPress={() => Alert.alert('App Version', 'Child Health Tracker v1.0.0')}>
                  <View style={themedStyles.settingInfo}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                    <Text style={themedStyles.settingLabel}>App Version</Text>
                  </View>
                  <Text style={themedStyles.versionText}>v1.0.0</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Function to create themed styles
const createThemedStyles = (theme, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
    paddingTop: insets.top, // This ensures content starts below status bar
  },
  // Header Styles
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  hamburgerButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    padding: 5,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Main Content Styles
  mainContent: {
    flex: 1,
    backgroundColor: theme.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Bottom Tab Bar Styles
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
    paddingBottom: Math.max(insets.bottom, 10), // Respect safe area at bottom
    shadowColor: theme.shadow,
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
    backgroundColor: theme.tabBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Slide Menu Styles
  menuOverlay: {
    position: 'absolute',
    top: insets.top, // Start below the status bar/notch
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
    backgroundColor: theme.cardBackground,
    shadowColor: theme.shadow,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  slideMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20, // Remove the extra insets.top since menuOverlay already handles it
    backgroundColor: theme.primary,
    minHeight: 60, // Fixed minimum height
  },
  slideMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.whiteText,
  },
  closeMenuText: {
    fontSize: 30,
    color: theme.whiteText,
    fontWeight: 'bold',
  },
  slideMenuContent: {
    flex: 1,
  },
  slideMenuItem: {
    backgroundColor: theme.primaryLight,
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.border,
  },
  slideMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideMenuItemText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '500',
    marginLeft: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.modalBackground,
    borderRadius: 16,
    margin: 20,
    minWidth: 300,
    maxWidth: 350,
    shadowColor: theme.shadow,
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
    borderBottomColor: theme.separator,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primaryText,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.secondaryText,
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
    color: theme.primary,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    color: theme.primaryText,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  // Logout Button Styles
  logoutButton: {
    backgroundColor: theme.error,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: theme.error,
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
    color: theme.whiteText,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Settings Modal Styles
  settingsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.separator,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primaryText,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: theme.secondaryText,
    lineHeight: 18,
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 4,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: theme.tabBackground,
  },
  versionText: {
    fontSize: 14,
    color: theme.lightText,
    fontWeight: '500',
  },
});
