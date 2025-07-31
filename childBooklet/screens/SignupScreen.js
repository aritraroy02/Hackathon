import React, { useState, useEffect } from 'react';
import { makeRequest, API_ENDPOINTS } from '../config/api';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Switch,
  Share,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Location from 'expo-location';

export default function SignupScreen({ navigation, route }) {
  // Network connectivity state
  const [isConnected, setIsConnected] = useState(true);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Form state
  const [step, setStep] = useState(1);
  const [showPicker, setShowPicker] = useState(false);
  const [dobDate, setDobDate] = useState(new Date());
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [errors, setErrors] = useState({});
  const [phoneError, setPhoneError] = useState('');
  const [customRelation, setCustomRelation] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  
  // Get username from route parameters (health worker who is registering)
  const healthWorkerUsername = route?.params?.username || 'Field Representative';
  
  // Debug logging
  console.log('SignupScreen - Route params:', route?.params);
  console.log('SignupScreen - Health worker username:', healthWorkerUsername);

  const [formData, setFormData] = useState({
    childName: '',
    facePhoto: null,
    age: '',
    localId: '',
    idType: '',
    weight: '',
    height: '',
    guardianName: '',
    malnutritionSigns: '',
    recentIllnesses: '',
    parentsConsent: false,
    skipMalnutrition: false,
    skipIllnesses: false,
    dateCollected: new Date().toISOString(),
    healthId: '',
    isOffline: false,
  });

  // Network connectivity monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isConnected;
      setIsConnected(state.isConnected);
      
      // If we just came back online, check for pending records
      if (wasOffline && state.isConnected) {
        checkPendingRecords();
      }
    });

    // Initial check
    checkPendingRecords();

    return () => unsubscribe();
  }, [isConnected]);

  const checkPendingRecords = async () => {
    try {
      const stored = await AsyncStorage.getItem('pendingChildRecords');
      if (stored) {
        const records = JSON.parse(stored);
        setPendingRecords(records);
        if (records.length > 0 && isConnected) {
          setShowUploadPrompt(true);
        }
      }
    } catch (error) {
      console.error('Error checking pending records:', error);
    }
  };

  const generateHealthId = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `CHB${timestamp.slice(-6)}${random.toUpperCase()}`;
  };

  const generateLocalId = () => {
    const timestamp = Date.now().toString();
    return `LOC${timestamp.slice(-6)}`;
  };

  // Function to get current location
  const getCurrentLocation = async () => {
    try {
      setLocationError('');
      
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return null;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
      });
      
      // Reverse geocoding to get address
      let address = '';
      let city = '';
      let state = '';
      
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const addressData = reverseGeocode[0];
          city = addressData.city || addressData.district || 'Unknown City';
          state = addressData.region || addressData.state || 'Unknown State';
          address = `${addressData.street || ''} ${addressData.streetNumber || ''}, ${city}, ${state}`.trim();
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
        address = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
      }
      
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address,
        city: city,
        state: state,
        accuracy: location.coords.accuracy,
        timestamp: new Date()
      };
      
      setCurrentLocation(locationData);
      return locationData;
      
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Unable to get location');
      return null;
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera/photo library access to capture child photos.');
      return;
    }

    Alert.alert(
      'Select Photo',
      'Choose how you would like to add the child\'s photo',
      [
        { text: 'Camera', onPress: openCamera },
        { text: 'Photo Library', onPress: openImageLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const openCamera = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      Alert.alert('Permission Required', 'Please grant camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      handleChange('facePhoto', result.assets[0].uri);
    }
  };

  const openImageLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      handleChange('facePhoto', result.assets[0].uri);
    }
  };

  const convertWeight = (value, toUnit) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    if (toUnit === 'kg') return (num / 2.20462).toFixed(2);
    if (toUnit === 'lb') return (num * 2.20462).toFixed(2);
    return value;
  };

  const handleUnitChange = (unit) => {
    if (formData.weight) {
      const converted = convertWeight(formData.weight, unit);
      handleChange('weight', converted);
    }
    setWeightUnit(unit);
  };

  const handleHeightUnitChange = (unit) => {
    if (formData.height) {
      let cm = parseFloat(formData.height);
      if (unit === 'ft/in') {
        const ft = Math.floor(cm / 30.48);
        const inch = Math.round((cm % 30.48) / 2.54);
        setFeet(ft.toString());
        setInches(inch.toString());
      } else {
        const totalInches = parseInt(feet || 0) * 12 + parseInt(inches || 0);
        const cmValue = (totalInches * 2.54).toFixed(2);
        handleChange('height', cmValue);
      }
    }
    setHeightUnit(unit);
  };

  const handleNext = () => {
    if (step === 2 && formData.relation === 'Other' && customRelation) {
      handleChange('relation', customRelation);
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.childName.trim()) {
      newErrors.childName = 'Child name is required';
    }

    if (!formData.guardianName.trim()) {
      newErrors.guardianName = 'Guardian name is required';
    }

    if (!formData.parentsConsent) {
      newErrors.parentsConsent = 'Parental consent is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveRecordOffline = async (record) => {
    try {
      const stored = await AsyncStorage.getItem('pendingChildRecords');
      const existingRecords = stored ? JSON.parse(stored) : [];
      
      const updatedRecords = [...existingRecords, record];
      await AsyncStorage.setItem('pendingChildRecords', JSON.stringify(updatedRecords));
      
      setPendingRecords(updatedRecords);
      return true;
    } catch (error) {
      console.error('Error saving offline record:', error);
      return false;
    }
  };

  const shareHealthId = async (healthId) => {
    try {
      await Share.share({
        title: 'Child Health ID',
        message: `Child Health ID: ${healthId}\n\nPlease keep this ID safe for future healthcare visits and reference.`,
      });
    } catch (error) {
      console.error('Error sharing Health ID:', error);
    }
  };

const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form before submitting.');
      return;
    }

    // Prevent multiple submissions
    if (isSaving || hasSubmitted) {
      return;
    }

    setIsSaving(true);
    setHasSubmitted(true);

    try {
      // Get current location before submitting
      let locationData = await getCurrentLocation();
      console.log('Location data captured:', locationData);
      
      // If location capture failed, create a fallback location object
      if (!locationData) {
        locationData = {
          latitude: null,
          longitude: null,
          address: 'Location not available',
          city: 'Unknown',
          state: 'Unknown',
          accuracy: null,
          timestamp: new Date(),
          error: 'Location capture failed'
        };
        console.log('Using fallback location data:', locationData);
      }
      
      const healthId = generateHealthId();
      const localId = formData.localId || generateLocalId();
      
      const record = {
        ...formData,
        healthId,
        localId,
        dateCollected: new Date().toISOString(),
        isOffline: true, // Always mark as offline/pending
        location: locationData, // Add location data to the record
        healthWorkerUsername: healthWorkerUsername, // Add health worker username
        registeredBy: healthWorkerUsername, // Alternative field name for clarity
        isPending: true, // Mark as pending for upload
      };
      
      console.log('Complete record being saved locally:', JSON.stringify(record, null, 2));

      // Update formData with the generated healthId and localId
      setFormData(prevData => ({
        ...prevData,
        healthId,
        localId,
        dateCollected: new Date().toISOString(),
        isOffline: true,
        isPending: true,
      }));

      // Always save locally first (never upload to MongoDB on submit)
      const saved = await saveRecordOffline(record);
      if (saved) {
        Alert.alert(
          'Registration Saved',
          `Child record saved locally and pending upload!\n\nHealth ID: ${healthId}\n\nThe record will be uploaded to the database when you choose to upload pending data from the home screen.\n\nPlease share this Health ID with the child's family for future reference.`,
          [
            {
              text: 'Share Health ID',
              onPress: () => {
                shareHealthId(healthId);
                setStep(4);
              },
            },
            {
              text: 'Continue',
              onPress: () => setStep(4),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save record. Please try again.');
      }
    } catch (error) {
      console.error('Error saving record:', error);
      Alert.alert('Error', 'An error occurred while saving the record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const uploadPendingRecords = async () => {
    try {
      // Check network connectivity before attempting upload
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('Uploading pending records:', pendingRecords);
      
      // Use bulk upload endpoint to upload all pending records at once
      const response = await makeRequest(API_ENDPOINTS.BULK_UPLOAD, 'POST', pendingRecords);
      
      console.log('Bulk upload response:', response);
      
      // Clear pending records after successful upload
      await AsyncStorage.removeItem('pendingChildRecords');
      setPendingRecords([]);
      setShowUploadPrompt(false);
      
      // Show detailed results if available
      let successMessage = `${pendingRecords.length} record(s) uploaded successfully!`;
      if (response.summary) {
        successMessage = `Upload Summary:\n• Created: ${response.summary.successful}\n• Updated: ${response.summary.updated}\n• Failed: ${response.summary.failed}\n• Total: ${response.summary.total}`;
      }
      
      Alert.alert('Success', successMessage);
    } catch (error) {
      console.error('Error uploading records:', error);
      
      let errorMessage = 'Failed to upload some records. Please try again.';
      
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again with a better connection.';
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      
      Alert.alert(
        'Upload Error',
        errorMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => uploadPendingRecords() }
        ]
      );
    }
  };

  const resetForm = () => {
    setFormData({
      childName: '',
      facePhoto: null,
      age: '',
      localId: '',
      idType: '',
      weight: '',
      height: '',
      guardianName: '',
      malnutritionSigns: '',
      recentIllnesses: '',
      parentsConsent: false,
      skipMalnutrition: false,
      skipIllnesses: false,
      dateCollected: new Date().toISOString(),
      healthId: '',
      isOffline: false,
    });
    setErrors({});
    setStep(1);
    setFeet('');
    setInches('');
    setCustomRelation('');
    setPhoneError('');
    setHasSubmitted(false);
    setIsSaving(false);
  };

  const reviewEntries = Object.entries(formData).filter(([k]) => !['childImage'].includes(k));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {step === 1 && (
        <>
          <Text style={styles.heading}>Step 1: Child Info</Text>
          <Text style={styles.healthWorkerInfo}>Registered by: {healthWorkerUsername}</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Child's Full Name</Text>
            <TextInput
              placeholder="Enter child's full name"
              style={[styles.input, errors.childName && styles.inputError]}
              value={formData.childName}
              onChangeText={(text) => handleChange('childName', text)}
            />
            {errors.childName && <Text style={styles.errorText}>{errors.childName}</Text>}
          </View>

          <RNPickerSelect
            onValueChange={(value) => handleChange('gender', value)}
            value={formData.gender}
            items={[
              { label: 'Male', value: 'Male' },
              { label: 'Female', value: 'Female' },
            ]}
            placeholder={{ label: 'Select Gender', value: '' }}
            style={{
              inputIOS: styles.input,
              inputAndroid: styles.input,
            }}
            useNativeAndroidPickerStyle={false}
          />

          <View style={styles.imageUploadBox}>
            {formData.facePhoto && (
              <Image source={{ uri: formData.facePhoto }} style={styles.childImagePreview} />
            )}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleImagePicker}
            >
              <Text style={styles.uploadButtonText}>
                {formData.facePhoto ? 'Change Photo' : 'Upload Child Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Age (in years)"
            style={styles.input}
            keyboardType="numeric"
            value={formData.age}
            onChangeText={(text) => handleChange('age', text)}
          />
          
          <RNPickerSelect
            onValueChange={(value) => handleChange('idType', value)}
            value={formData.idType}
            items={[
              { label: 'Local ID', value: 'local' },
              { label: 'Aadhar Card', value: 'aadhar' },
            ]}
            placeholder={{ label: 'Select ID Type (optional)', value: '' }}
            style={{
              inputIOS: styles.input,
              inputAndroid: styles.input,
            }}
            useNativeAndroidPickerStyle={false}
          />
          
          {formData.idType === 'local' && (
            <TextInput
              placeholder="Enter Local ID"
              style={styles.input}
              value={formData.localId}
              onChangeText={(text) => handleChange('localId', text)}
            />
          )}
          
          {formData.idType === 'aadhar' && (
            <TextInput
              placeholder="Aadhar Card No. (XXXX XXXX XXXX)"
              style={styles.input}
              keyboardType="numeric"
              maxLength={14}
              value={formData.localId}
              onChangeText={(text) => {
                const cleaned = text.replace(/\D/g, '');
                let formatted = cleaned.match(/.{1,4}/g)?.join(' ') || '';
                if (formatted.length <= 14) {
                  handleChange('localId', formatted);
                }
              }}
            />
          )}


          <View style={styles.weightRow}>
            <TextInput
              placeholder="Weight"
              style={[styles.input, styles.weightInput]}
              keyboardType="numeric"
              value={formData.weight}
              onChangeText={(text) => handleChange('weight', text)}
            />
            <RNPickerSelect
              onValueChange={handleUnitChange}
              value={weightUnit}
              items={[
                { label: 'kg', value: 'kg' },
                { label: 'lb', value: 'lb' },
              ]}
              style={{
                inputIOS: styles.unitPicker,
                inputAndroid: styles.unitPicker,
              }}
              useNativeAndroidPickerStyle={false}
              placeholder={{}}
            />
          </View>

          <View style={styles.weightRow}>
            {heightUnit === 'cm' ? (
              <TextInput
                placeholder="Height (cm)"
                style={[styles.input, styles.weightInput]}
                keyboardType="numeric"
                value={formData.height}
                onChangeText={(text) => handleChange('height', text)}
              />
            ) : (
              <>
                <TextInput
                  placeholder="ft"
                  style={[styles.input, { flex: 1, marginRight: 5 }]}
                  keyboardType="numeric"
                  value={feet}
                  onChangeText={(text) => {
                    setFeet(text);
                    const totalInches = parseInt(text || 0) * 12 + parseInt(inches || 0);
                    handleChange('height', (totalInches * 2.54).toFixed(2));
                  }}
                />
                <TextInput
                  placeholder="in"
                  style={[styles.input, { flex: 1, marginLeft: 5 }]}
                  keyboardType="numeric"
                  value={inches}
                  onChangeText={(text) => {
                    setInches(text);
                    const totalInches = parseInt(feet || 0) * 12 + parseInt(text || 0);
                    handleChange('height', (totalInches * 2.54).toFixed(2));
                  }}
                />
              </>
            )}
            <RNPickerSelect
              onValueChange={handleHeightUnitChange}
              value={heightUnit}
              items={[
                { label: 'cm', value: 'cm' },
                { label: 'ft/in', value: 'ft/in' },
              ]}
              style={{
                inputIOS: styles.unitPicker,
                inputAndroid: styles.unitPicker,
              }}
              useNativeAndroidPickerStyle={false}
              placeholder={{}}
            />
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next →</Text>
          </TouchableOpacity>
        </>
      )}


      {step === 2 && (
        <>
          <Text style={styles.heading}>Step 2: Parent Info</Text>
          <TextInput placeholder="Parent/Guardian Name" style={styles.input} onChangeText={(text) => handleChange('guardianName', text)} />

          {/* Relation Dropdown */}
          <RNPickerSelect
            onValueChange={(value) => handleChange('relation', value)}
            value={formData.relation}
            items={[
              { label: 'Father', value: 'Father' },
              { label: 'Mother', value: 'Mother' },
              { label: 'Brother', value: 'Brother' },
              { label: 'Sister', value: 'Sister' },
              { label: 'Uncle', value: 'Uncle' },
              { label: 'Aunt', value: 'Aunt' },
              { label: 'Other', value: 'Other' },
            ]}
            style={{
              inputIOS: styles.input,
              inputAndroid: styles.input,
            }}
            useNativeAndroidPickerStyle={false}
            placeholder={{ label: 'Select Relation', value: null }}
          />

          {/* Additional Input if 'Other' selected */}
          {formData.relation === 'Other' && (
            <TextInput
              placeholder="Please specify relation"
              style={styles.input}
              value={customRelation}
              onChangeText={setCustomRelation}
            />
          )}

          {/* Phone Number with Country Code */}
          <View style={styles.phoneRow}>
            <RNPickerSelect
              onValueChange={(value) => handleChange('countryCode', value)}
              value={formData.countryCode}
              items={[
                { label: '+91 (India)', value: '+91' },
              ]}
              style={{
                inputIOS: styles.countryPicker,
                inputAndroid: styles.countryPicker,
              }}
              useNativeAndroidPickerStyle={false}
              placeholder={{}}
            />

            <TextInput
              placeholder="Phone Number"
              style={[styles.input, { flex: 1 }]}
              keyboardType="numeric"
              maxLength={10}
              value={formData.phone}
              onChangeText={(text) => {
                handleChange('phone', text);
                if (/^\d{10}$/.test(text)) {
                  setPhoneError('');
                } else {
                  setPhoneError('Phone number must be 10 digits');
                }
              }}
            />
          </View>

          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : null}


          
          {/* Malnutrition Signs */}
          <View style={styles.inputContainer}>
            <View style={styles.skipContainerRight}>
              <Text style={styles.skipText}>Skip Malnutrition Signs</Text>
              <Switch
                value={formData.skipMalnutrition}
                onValueChange={(value) => {
                  handleChange('skipMalnutrition', value);
                  if (value) handleChange('malnutritionSigns', 'N/A');
                }}
              />
            </View>
            {!formData.skipMalnutrition && (
              <TextInput
                placeholder="Describe any visible signs of malnutrition"
                style={[styles.input, styles.textArea]}
                value={formData.malnutritionSigns}
                onChangeText={(text) => handleChange('malnutritionSigns', text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
            {formData.skipMalnutrition && (
              <View style={styles.skippedField}>
                <Text style={styles.skippedText}>N/A</Text>
              </View>
            )}
          </View>
          
          {/* Recent Illnesses */}
          <View style={styles.inputContainer}>
            <View style={styles.skipContainerRight}>
              <Text style={styles.skipText}>Skip Recent Illnesses</Text>
              <Switch
                value={formData.skipIllnesses}
                onValueChange={(value) => {
                  handleChange('skipIllnesses', value);
                  if (value) handleChange('recentIllnesses', 'N/A');
                }}
              />
            </View>
            {!formData.skipIllnesses && (
              <TextInput
                placeholder="Describe any recent illnesses or health issues"
                style={[styles.input, styles.textArea]}
                value={formData.recentIllnesses}
                onChangeText={(text) => handleChange('recentIllnesses', text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            )}
            {formData.skipIllnesses && (
              <View style={styles.skippedField}>
                <Text style={styles.skippedText}>N/A</Text>
              </View>
            )}
          </View>
          
          {/* Consent Checkbox */}
          <TouchableOpacity
            style={styles.consentContainer}
            onPress={() => handleChange('parentsConsent', !formData.parentsConsent)}
          >
            <View style={[styles.checkbox, formData.parentsConsent && styles.checkboxChecked]}>
              {formData.parentsConsent && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.consentText}>
              I give my consent for my child's information to be registered and used for health monitoring purposes.
            </Text>
          </TouchableOpacity>
          
          <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>Review →</Text>
                </TouchableOpacity>
              </View>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.heading}>Overview</Text>
          {reviewEntries.map(([key, value]) => (
            <Text key={key} style={styles.overviewText}>{key}: {String(value)}</Text>
          ))}
          {formData.childImage && <Image source={{ uri: formData.childImage }} style={styles.childImagePreviewLarge} />}
          <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!formData.parentsConsent || isSaving || hasSubmitted) && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={!formData.parentsConsent || isSaving || hasSubmitted}
                >
                  <Text style={styles.submitButtonText}>
                    {hasSubmitted ? 'Already Submitted' : (isSaving ? 'Submitting...' : 'Submit Registration')}
                  </Text>
                </TouchableOpacity>
              </View>
        </>
      )}

      {step === 4 && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✅ SUCCESS</Text>
          <Text style={styles.overviewText}>Registration completed successfully!</Text>
          
          {/* Health ID Display */}
          <View style={styles.healthIdContainer}>
            <Text style={styles.healthIdLabel}>Health ID:</Text>
            <Text style={styles.healthIdText}>{formData.healthId}</Text>
            <Text style={styles.healthIdNote}>Please save this ID for future reference</Text>
          </View>
          
          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.shareHealthIdButton}
              onPress={() => shareHealthId(formData.healthId)}
            >
              <Text style={styles.shareHealthIdButtonText}>📤 Share Health ID</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.dataExportButton}
              onPress={() => navigation.navigate('DataExport', { userData: formData })}
            >
              <Text style={styles.dataExportButtonText}>📊 Export/Share Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => {
                resetForm();
                setStep(1);
              }}
            >
              <Text style={styles.continueButtonText}>Register Another Child</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: '#666', marginTop: 8 }]}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.continueButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    color: 'orange',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  healthWorkerInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderColor: '#888',
    borderWidth: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  weightInput: {
    flex: 1,
    marginRight: 10,
  },
  unitPicker: {
    bottom: 8.75,
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderColor: '#888',
    borderWidth: 1,
  },
  imageUploadBox: {
    color: 'green',
    marginBottom: 20,
    alignItems: 'center',

  },
  childImagePreview: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 50,
  },
  childImagePreviewLarge: {
    width: 150,
    height: 150,
    marginVertical: 16,
    borderRadius: 8,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  overviewText: {
    color: '#222',
    marginBottom: 8,
    fontSize: 14,
  },
  successBox: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#76f776ff',
    borderRadius: 10,
  },
  successText: {
    fontSize: 20,
    color: 'lime',
    marginBottom: 12,
  },
  phoneRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 12,
  },

  countryPicker: {
    marginRight: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderColor: '#888',
    borderWidth: 1,
  },

  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 5,
  },
    nextButton: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: '#4A7C59',
      shadowColor: '#4A7C59',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
  },
    
  checkboxChecked: {
    backgroundColor: '#4A7C59',
    borderColor: '#4A7C59',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    color: '#2D5016',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A7C59',
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    color: '#4A7C59',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#4A7C59',
    shadowColor: '#4A7C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#C4E5C4',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: '#C4E5C4',
      borderRadius: 4,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
  },
  uploadButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#4A7C59',
    shadowColor: '#4A7C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 8,
  },
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 20,
  },
  successActions: {
    marginTop: 20,
    width: '100%',
  },
  dataExportButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FF9500',
    marginBottom: 12,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dataExportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  continueButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#4A7C59',
    shadowColor: '#4A7C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
  },
  skipText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2D5016',
    fontWeight: '500',
  },
  skipContainerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  skippedField: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  skippedText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  healthIdContainer: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#4A7C59',
    alignItems: 'center',
  },
  healthIdLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 8,
  },
  healthIdText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A7C59',
    marginBottom: 8,
    letterSpacing: 1,
    textAlign: 'center',
  },
  healthIdNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  shareHealthIdButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    marginBottom: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  shareHealthIdButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
