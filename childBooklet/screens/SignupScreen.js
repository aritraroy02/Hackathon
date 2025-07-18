import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignupScreen() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    childName: '',
    dob: '',
    gender: '',
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

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);
  const handleSubmit = () => setStep(5);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      handleChange('childImage', result.assets[0].uri);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const iso = selectedDate.toISOString().split('T')[0];
      handleChange('dob', iso);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      {step === 1 && (
        <>
          <Text style={styles.heading}>Step 1: Child Info</Text>
          <TextInput
            placeholder="Child Name"
            style={styles.input}
            onChangeText={(text) => handleChange('childName', text)}
            value={formData.childName}
          />
          <TextInput
            placeholder="Gender"
            style={styles.input}
            onChangeText={(text) => handleChange('Gender', text)}
            value={formData.gender}
          />

          {formData.childImage ? (
            <Image source={{ uri: formData.childImage }} style={styles.image} />
          ) : null}

          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Upload Child Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.input}
          >
            <Text style={{ color: formData.dob ? '#000' : '#aaa' }}>
              {formData.dob || 'Enter your Date of Birth'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date('2010-01-01')}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={onDateChange}
            />
          )}

          <TextInput
            placeholder="Weight (kg)"
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(text) => handleChange('weight', text)}
            value={formData.weight}
          />
          <TextInput
            placeholder="Height (cm)"
            style={styles.input}
            keyboardType="numeric"
            onChangeText={(text) => handleChange('height', text)}
            value={formData.height}
          />
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.heading}>Step 2: Parent Info</Text>
          <TextInput placeholder="Parent Name" style={styles.input} onChangeText={(text) => handleChange('parentName', text)} value={formData.parentName} />
          <TextInput placeholder="Relation" style={styles.input} onChangeText={(text) => handleChange('relation', text)} value={formData.relation} />
          <TextInput placeholder="Aadhar Card No." style={styles.input} keyboardType="numeric" onChangeText={(text) => handleChange('aadhar', text)} value={formData.aadhar} />
          <TextInput placeholder="Signs of Malnutrition" style={styles.input} onChangeText={(text) => handleChange('malnutritionSign', text)} value={formData.malnutritionSign} />
          <TextInput placeholder="Recent Illnesses" style={styles.input} onChangeText={(text) => handleChange('illnesses', text)} value={formData.illnesses} />
          <View style={styles.nav}>
            <TouchableOpacity style={styles.button} onPress={handleBack}><Text style={styles.buttonText}>Back</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleNext}><Text style={styles.buttonText}>Next</Text></TouchableOpacity>
          </View>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.heading}>Step 3: Create Account</Text>
          <TextInput placeholder="Create User ID" style={styles.input} onChangeText={(text) => handleChange('userId', text)} value={formData.userId} />
          <TextInput placeholder="Create Password" style={styles.input} secureTextEntry onChangeText={(text) => handleChange('password', text)} value={formData.password} />
          <TouchableOpacity onPress={() => handleChange('parentConsent', !formData.parentConsent)} style={styles.checkbox}>
            <Text>{formData.parentConsent ? '✅' : '⬜'} Parent Consent</Text>
          </TouchableOpacity>
          <View style={styles.nav}>
            <TouchableOpacity style={styles.button} onPress={handleBack}><Text style={styles.buttonText}>Back</Text></TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleNext}><Text style={styles.buttonText}>Review & Submit</Text></TouchableOpacity>
          </View>
        </>
      )}

      {step === 4 && (
        <>
          <Text style={styles.heading}>Overview</Text>

          {formData.childImage ? (
            <Image
              source={{ uri: formData.childImage }}
              style={{ width: 150, height: 150, alignSelf: 'center', marginBottom: 10, borderRadius: 10 }}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.overviewText}>No Image Uploaded</Text>
          )}

          {Object.entries(formData).map(([key, value]) => {
            if (key === 'childImage' || key === 'password') return null;
            return (
              <Text key={key} style={styles.overviewText}>
                {key}: {String(value)}
              </Text>
            );
          })}

          <Text style={styles.overviewText}>Password: {formData.password}</Text>

          <View style={styles.nav}>
            <Button title="Back" onPress={handleBack} color="#90ee90" />
            <Button title="Submit" onPress={handleSubmit} color="#90ee90" />
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
    padding: 20,
    paddingBottom: 100,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  button: {
    backgroundColor: 'lightgreen',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewText: {
    marginVertical: 4,
  },
  checkbox: {
    marginVertical: 10,
  },
  successBox: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#e6ffe6',
    borderRadius: 12,
  },
  successText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  image: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignSelf: 'center',
    marginVertical: 10,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
});
