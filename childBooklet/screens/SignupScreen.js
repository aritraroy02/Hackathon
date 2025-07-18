import React, { useState } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';

export default function SignupScreen() {
  const [step, setStep] = useState(1);
  const [dobDate, setDobDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [aadharError, setAadharError] = useState('');

  const [formData, setFormData] = useState({
    childFirstName: '',
    childLastName: '',
    dob: '',
    weight: '',
    height: '',
    parentName: '',
    relation: '',
    aadhar: '',
    malnutritionSign: '',
    illnesses: '',
    userId: '',
    password: '',
    gender: '',
    parentConsent: false,
    childImage: null,
    countryCode: '+91',
    phone: '',
  });

  const [customRelation, setCustomRelation] = useState('');

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step === 2 && formData.relation === 'Other' && customRelation) {
      handleChange('relation', customRelation);
    }
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    Alert.alert('Success', `Your Unique ID: XYZ1234\nPassword: ${formData.password}`);
    setStep(5);
  };

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Enable photo access to upload image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      handleChange('childImage', uri);
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

  const reviewEntries = Object.entries({
    ...formData,
    childName: `${formData.childFirstName} ${formData.childLastName}`.trim(),
  }).filter(([k]) => !['childFirstName', 'childLastName', 'childImage'].includes(k));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {step === 1 && (
        <>
          <Text style={styles.heading}>Step 1: Child Info</Text>

          <View style={styles.nameRow}>
            <TextInput
              placeholder="First Name"
              style={[styles.input, styles.halfInput, { marginRight: 8 }]}
              value={formData.childFirstName}
              onChangeText={(text) => handleChange('childFirstName', text)}
            />
            <TextInput
              placeholder="Last Name"
              style={[styles.input, styles.halfInput]}
              value={formData.childLastName}
              onChangeText={(text) => handleChange('childLastName', text)}
            />
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
            {formData.childImage && (
              <Image source={{ uri: formData.childImage }} style={styles.childImagePreview} />
            )}
            <Button
              title={formData.childImage ? 'Change Photo' : 'Upload Child Photo'}
              onPress={handlePickImage}
              color="#05ff50ff"
            />
          </View>

          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={[styles.input, { justifyContent: 'center' }]}
          >
            <Text style={{ color: '#000' }}>{formData.dob || 'Select DOB'}</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={dobDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowPicker(Platform.OS === 'ios');
                if (selectedDate) {
                  const formatted = selectedDate.toISOString().split('T')[0];
                  setDobDate(selectedDate);
                  handleChange('dob', formatted);
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
          <TextInput placeholder="Parent Name" style={styles.input} onChangeText={(text) => handleChange('parentName', text)} />

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


          <TextInput
            placeholder="Aadhar Card No. (XXXX XXXX XXXX)"
            style={styles.input}
            keyboardType="numeric"
            maxLength={14}
            value={formData.aadhar}
            onChangeText={(text) => {
              const cleaned = text.replace(/\D/g, '');
              let formatted = cleaned.match(/.{1,4}/g)?.join(' ') || '';
              handleChange('aadhar', formatted);
              if (formatted.length === 14 && /^\d{4} \d{4} \d{4}$/.test(formatted)) {
                setAadharError('');
              } else {
                setAadharError('Aadhar must be 12 digits in XXXX XXXX XXXX format');
              }
            }}
          />
          {aadharError ? (
            <Text style={styles.errorText}>{aadharError}</Text>
          ) : null}         
          <TextInput placeholder="Signs of Malnutrition" style={styles.input} onChangeText={(text) => handleChange('malnutritionSign', text)} />
          <TextInput placeholder="Recent Illnesses" style={styles.input} onChangeText={(text) => handleChange('illnesses', text)} />
          <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>Next →</Text>
                </TouchableOpacity>
              </View>
        </>
      )}

      {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Create User ID *</Text>
                <TextInput
                  placeholder="Choose a unique user ID"
                  style={styles.input}
                  value={formData.userId}
                  onChangeText={(text) => handleChange('userId', text)}
                  placeholderTextColor="#8B9A8B"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Create Password *</Text>
                <TextInput
                  placeholder="Choose a strong password"
                  style={styles.input}
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(text) => handleChange('password', text)}
                  placeholderTextColor="#8B9A8B"
                />
              </View>

              <TouchableOpacity
                style={styles.consentContainer}
                onPress={() => handleChange('parentConsent', !formData.parentConsent)}
              >
                <View style={[styles.checkbox, formData.parentConsent && styles.checkboxChecked]}>
                  {formData.parentConsent && <Text style={styles.checkmark}>✓</Text>}
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
            </View>
          )}
      {step === 4 && (
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
                  style={[styles.submitButton, !formData.parentConsent && styles.submitButtonDisabled]} 
                  onPress={handleSubmit}
                  disabled={!formData.parentConsent}
                >
                  <Text style={styles.submitButtonText}>Submit Registration</Text>
                </TouchableOpacity>
              </View>
        </>
      )}

      {step === 5 && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✅ SUCCESS</Text>
          <Text style={styles.overviewText}>Your Unique ID: XYZ1234</Text>
          <Text style={styles.overviewText}>Your password: {formData.password}</Text>
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
    Color: '#4A7C59',
  },
  },);
