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

  const [formData, setFormData] = useState({
    childName: '',
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
    parentConsent: false,
    childImage: null,
  });

  const [customRelation, setCustomRelation] = useState('');

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    // Use customRelation if 'Other' was selected
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

  const reviewEntries = Object.entries(formData).filter(([k]) => k !== 'childImage');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {step === 1 && (
        <>
          <Text style={styles.heading}>Step 1: Child Info</Text>

          <TextInput
            placeholder="Child Name"
            style={styles.input}
            onChangeText={(text) => handleChange('childName', text)}
          />

           <TextInput
            placeholder="Gender"
            style={styles.input}
            onChangeText={(text) => handleChange('Gender', text)}
            value={formData.gender}
          />

          <View style={styles.imageUploadBox}>
            {formData.childImage && (
              <Image source={{ uri: formData.childImage }} style={styles.childImagePreview} />
            )}
            <Button
              title={formData.childImage ? 'Change Photo' : 'Upload Child Photo'}
              onPress={handlePickImage}
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

          <Button title="Next" onPress={handleNext} />
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

          <TextInput placeholder="Aadhar Card No." style={styles.input} keyboardType="numeric" onChangeText={(text) => handleChange('aadhar', text)} />
          <TextInput placeholder="Signs of Malnutrition" style={styles.input} onChangeText={(text) => handleChange('malnutritionSign', text)} />
          <TextInput placeholder="Recent Illnesses" style={styles.input} onChangeText={(text) => handleChange('illnesses', text)} />
          <View style={styles.nav}>
            <Button title="Back" onPress={handleBack} />
            <Button title="Next" onPress={handleNext} />
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.heading}>Step 3: Create Account</Text>
          <TextInput placeholder="Create User ID" style={styles.input} onChangeText={(text) => handleChange('userId', text)} />
          <TextInput placeholder="Create Password" style={styles.input} secureTextEntry onChangeText={(text) => handleChange('password', text)} />
          <TouchableOpacity onPress={() => handleChange('parentConsent', !formData.parentConsent)} style={styles.checkbox}>
            <Text style={{ color: '#fff' }}>{formData.parentConsent ? '✅' : '⬜'} Parent Consent</Text>
          </TouchableOpacity>
          <View style={styles.nav}>
            <Button title="Back" onPress={handleBack} />
            <Button title="Review & Submit" onPress={handleNext} />
          </View>
        </>
      )}

      {step === 4 && (
        <>
          <Text style={styles.heading}>Overview</Text>
          {reviewEntries.map(([key, value]) => (
            <Text key={key} style={styles.overviewText}>{key}: {String(value)}</Text>
          ))}
          {formData.childImage && <Image source={{ uri: formData.childImage }} style={styles.childImagePreviewLarge} />}
          <View style={styles.nav}>
            <Button title="Back" onPress={handleBack} />
            <Button title="Submit" onPress={handleSubmit} />
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
    backgroundColor: 'light green',
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
  checkbox: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
});
