import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState(null);
  const [authData, setAuthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const themedStyles = createThemedStyles(theme, insets);

  useEffect(() => {
    loadUserProfile();
    // Set up focus listener to reload profile when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // Load eSignet authentication data
      const authDataStr = await AsyncStorage.getItem('eSignetAuthData');
      if (!authDataStr) {
        // User not authenticated, redirect to auth screen
        Alert.alert(
          'Authentication Required',
          'Please authenticate with eSignet to view your profile.',
          [
            {
              text: 'Authenticate',
              onPress: () => navigation.navigate('ESignetAuth'),
            },
            {
              text: 'Cancel',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        return;
      }

      const authData = JSON.parse(authDataStr);
      setAuthData(authData);

      // Load user profile data
      const profileDataStr = await AsyncStorage.getItem('userProfile');
      if (profileDataStr) {
        const profileData = JSON.parse(profileDataStr);
        setUserProfile(profileData);
      } else {
        // If no profile data, use auth data as fallback
        setUserProfile({
          name: authData.userData.name,
          uinNumber: authData.uinNumber,
          phone: authData.userData.phone,
          email: authData.userData.email,
          address: authData.userData.address,
          dateOfBirth: authData.userData.dateOfBirth,
          gender: authData.userData.gender,
          employeeId: authData.userData.employeeId,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to authenticate again to upload data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('eSignetAuthData');
              await AsyncStorage.removeItem('userProfile');
              Alert.alert('Success', 'Logged out successfully.');
              navigation.navigate('Home');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Profile editing is not available in this demo version. In a real implementation, this would allow users to update their profile information.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <View style={[themedStyles.container, themedStyles.loadingContainer]}>
        <Text style={themedStyles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userProfile || !authData) {
    return (
      <View style={[themedStyles.container, themedStyles.errorContainer]}>
        <Ionicons name="person-circle-outline" size={64} color={theme.lightText} />
        <Text style={themedStyles.errorText}>Profile not available</Text>
        <TouchableOpacity
          style={themedStyles.authButton}
          onPress={() => navigation.navigate('ESignetAuth')}
        >
          <Text style={themedStyles.authButtonText}>Authenticate with eSignet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={themedStyles.container}>
      {/* Header */}
      <View style={themedStyles.header}>
        <TouchableOpacity 
          style={themedStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={themedStyles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={themedStyles.editButton}
          onPress={handleEditProfile}
        >
          <Ionicons name="create-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={themedStyles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture and Basic Info */}
        <View style={themedStyles.profileHeader}>
          <View style={themedStyles.avatarContainer}>
            <Ionicons name="person-circle" size={100} color={theme.primary} />
          </View>
          <Text style={themedStyles.profileName}>{userProfile.name}</Text>
          <View style={themedStyles.verificationBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
            <Text style={themedStyles.verificationText}>Mock MOSIP Verified</Text>
          </View>
        </View>

        {/* Authentication Status */}
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Authentication Status</Text>
          <View style={themedStyles.statusCard}>
            <View style={themedStyles.statusRow}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={themedStyles.statusText}>Authenticated via Mock MOSIP</Text>
            </View>
            <Text style={themedStyles.statusSubtext}>
              Authenticated on: {new Date(authData.authenticatedAt).toLocaleDateString()} at {new Date(authData.authenticatedAt).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Personal Information</Text>
          <View style={themedStyles.infoCard}>
            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>Full Name</Text>
              <Text style={themedStyles.infoValue}>{userProfile.name}</Text>
            </View>
            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>MOSIP UIN</Text>
              <Text style={themedStyles.infoValue}>
                XXXX-XXXX-{(userProfile.uinNumber || authData.uinNumber).slice(-2)}
              </Text>
            </View>
            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>Date of Birth</Text>
              <Text style={themedStyles.infoValue}>{userProfile.dateOfBirth}</Text>
            </View>
            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>Gender</Text>
              <Text style={themedStyles.infoValue}>{userProfile.gender}</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Contact Information</Text>
          <View style={themedStyles.infoCard}>
            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>Phone Number</Text>
              <Text style={themedStyles.infoValue}>{userProfile.phone}</Text>
            </View>
            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>Email Address</Text>
              <Text style={themedStyles.infoValue}>{userProfile.email}</Text>
            </View>
          </View>
        </View>

        {/* Address Information */}
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Address</Text>
          <View style={themedStyles.infoCard}>
            <Text style={themedStyles.addressText}>
              {typeof userProfile.address === 'string' 
                ? userProfile.address 
                : userProfile.address 
                  ? `${userProfile.address.locality || ''} ${userProfile.address.region || ''} ${userProfile.address.postal_code || ''} ${userProfile.address.country || ''}`.trim()
                  : 'Address not available'
              }
            </Text>
          </View>
        </View>

        {/* Work Information */}
        <View style={themedStyles.section}>
          <Text style={themedStyles.sectionTitle}>Work Information</Text>
          <View style={themedStyles.infoCard}>
            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>Role</Text>
              <Text style={themedStyles.infoValue}>Health Worker</Text>
            </View>
            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>Organization</Text>
              <Text style={themedStyles.infoValue}>Ministry of Health & Family Welfare</Text>
            </View>
            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoLabel}>Employee ID</Text>
              <Text style={themedStyles.infoValue}>{userProfile.employeeId || `HW-${(userProfile.uinNumber || authData.uinNumber).slice(-6)}`}</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={themedStyles.section}>
          <TouchableOpacity style={themedStyles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={themedStyles.logoutButtonText}>Logout from eSignet</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={themedStyles.footer}>
          <Text style={themedStyles.footerText}>
            This profile is secured by eSignet authentication
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createThemedStyles = (theme, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
    paddingTop: insets.top,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.secondaryText,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: theme.secondaryText,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  authButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: theme.whiteText,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: theme.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primaryText,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: theme.cardBackground,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primaryText,
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verificationText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primaryText,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
  statusSubtext: {
    fontSize: 12,
    color: theme.secondaryText,
  },
  infoCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.secondaryText,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: theme.primaryText,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    color: theme.primaryText,
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF2F2',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: theme.lightText,
    textAlign: 'center',
  },
});