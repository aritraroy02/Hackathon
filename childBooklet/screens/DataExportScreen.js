import React, { useState, useEffect } from 'react';
import { makeRequest, API_ENDPOINTS } from '../config/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

export default function DataExportScreen({ route, navigation }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');
  const [pendingRecords, setPendingRecords] = useState([]);
  const [expandedRecordIndex, setExpandedRecordIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Get user data passed from previous screen or use mock data
  const userData = route?.params?.userData || {
    childName: 'John Doe',
    age: '5',
    gender: 'Male',
    facePhoto: null,
    idType: 'local',
    localId: 'LOC123456',
    aadharNumber: '',
    weight: '15.5',
    height: '95.2',
    guardianName: 'Jane Doe',
    relation: 'Mother',
    phone: '9876543210',
    countryCode: '+91',
    malnutritionSigns: 'None',
    recentIllnesses: 'None',
    parentsConsent: true,
    skipMalnutrition: true,
    skipIllnesses: true,
    healthId: 'CHB123456ABC',
    dateCollected: new Date().toISOString(),
    isOffline: false,
  };

  // Load pending records from AsyncStorage on component mount
  useEffect(() => {
    loadPendingRecords();
  }, []);

  const loadPendingRecords = async () => {
    try {
      const stored = await AsyncStorage.getItem('pendingChildRecords');
      if (stored) {
        const records = JSON.parse(stored);
        setPendingRecords(records);
      }
    } catch (error) {
      console.error('Error loading pending records:', error);
    }
  };

  const uploadPendingRecords = async () => {
    if (pendingRecords.length === 0) {
      Alert.alert('No Records', 'There are no pending records to upload.');
      return;
    }

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

    setIsUploading(true);
    try {
      // Use bulk upload endpoint to upload all pending records at once
      const response = await makeRequest(API_ENDPOINTS.BULK_UPLOAD, 'POST', pendingRecords);
      
      console.log('Bulk upload response:', response);
      
      // Clear pending records from AsyncStorage if successful
      await AsyncStorage.removeItem('pendingChildRecords');
      setPendingRecords([]);
      
      // Show detailed results if available
      let successMessage = `Successfully uploaded ${pendingRecords.length} child record(s) to the server.`;
      if (response.summary) {
        successMessage = `Upload Summary:\n• Created: ${response.summary.successful}\n• Updated: ${response.summary.updated}\n• Failed: ${response.summary.failed}\n• Total: ${response.summary.total}`;
      }

      Alert.alert(
        'Upload Complete',
        successMessage,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload records. Please try again.';
      
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
    } finally {
      setIsUploading(false);
    }
  };

  const formatDataForExport = (format) => {
    const exportData = {
      ...userData,
      exportDate: new Date().toISOString(),
      exportFormat: format,
    };

    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      case 'csv':
        const headers = Object.keys(exportData).join(',');
        const values = Object.values(exportData).map(v => `"${v}"`).join(',');
        return `${headers}\n${values}`;
      case 'txt':
        return Object.entries(exportData)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      default:
        return JSON.stringify(exportData, null, 2);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const formattedData = formatDataForExport(exportFormat);
      const fileName = `child_data_${userData.healthId}_${Date.now()}.${exportFormat}`;
      
      // Use React Native's Share API to share the formatted data
      const shareData = {
        title: `Child Health Data - ${fileName}`,
        message: `Child Health Data Export (${exportFormat.toUpperCase()}):\n\n${formattedData}`,
      };

      await Share.share(shareData);
      Alert.alert('Export Complete', `Data has been formatted and ready to share as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export data: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

const generatePDF = async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Child Health Assessment Form</title>
          <style>
            @page {
              size: A4;
              margin: 8mm;
            }
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              font-size: 9px;
              line-height: 1.2;
              color: #1a365d;
              background: linear-gradient(135deg, #ffffff 0%, #e6f3ff 25%, #cce7ff 50%, #b3dbff 75%, #87ceeb 100%);
              height: 100vh;
              overflow: hidden;
            }
            .form-container {
              width: 100%;
              max-width: 100%;
              background: linear-gradient(135deg, #ffffff 0%, #f8fbff 50%, #e8f4fd 100%);
              border: 2px solid #4a90e2;
              border-radius: 8px;
              padding: 10px;
              box-shadow: 0 5px 20px rgba(74, 144, 226, 0.15);
              position: relative;
              overflow: hidden;
              height: calc(100vh - 16mm);
              page-break-inside: avoid;
            }
            .form-container::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(135, 206, 235, 0.1) 0%, transparent 70%);
              animation: pulse 4s ease-in-out infinite;
              pointer-events: none;
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.1; transform: scale(1.1); }
            }
            .header {
              text-align: center;
              margin-bottom: 12px;
              background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
              color: white;
              padding: 10px;
              border-radius: 8px;
              position: relative;
              box-shadow: 0 3px 10px rgba(74, 144, 226, 0.3);
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: -10px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 15px solid transparent;
              border-right: 15px solid transparent;
              border-top: 10px solid #357abd;
            }
            .hospital-name {
              font-size: 14px;
              font-weight: bold;
              margin: 0;
              text-transform: uppercase;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
              letter-spacing: 0.5px;
            }
            .form-title {
              font-size: 12px;
              font-weight: bold;
              margin: 4px 0 2px 0;
              color: #e6f3ff;
            }
            .form-subtitle {
              font-size: 8px;
              margin: 0;
              font-style: italic;
              color: #b3dbff;
            }
            .main-content {
              display: flex;
              gap: 15px;
              width: 100%;
            }
            .left-section {
              flex: 2.2;
              min-width: 0;
            }
            .right-section {
              flex: 0.8;
              max-width: 180px;
              min-width: 160px;
            }
            .section-title {
              font-size: 10px;
              font-weight: bold;
              margin: 8px 0 6px 0;
              padding: 6px 12px;
              background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
              color: white;
              text-align: center;
              text-transform: uppercase;
              border-radius: 15px;
              box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
              position: relative;
              letter-spacing: 0.3px;
              transition: all 0.3s ease;
            }
            .section-title::before {
              content: '';
              position: absolute;
              left: 15px;
              top: 50%;
              transform: translateY(-50%);
              width: 6px;
              height: 6px;
              background: white;
              border-radius: 50%;
            }
            .section-title::after {
              content: '';
              position: absolute;
              right: 15px;
              top: 50%;
              transform: translateY(-50%);
              width: 6px;
              height: 6px;
              background: white;
              border-radius: 50%;
            }
            .form-row {
              display: flex;
              margin-bottom: 6px;
              align-items: center;
              padding: 3px;
              border-radius: 4px;
              background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(232,244,253,0.5) 100%);
              border: 1px solid rgba(74, 144, 226, 0.2);
              transition: all 0.3s ease;
            }
            .form-row:hover {
              background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(232,244,253,0.8) 100%);
              border-color: rgba(74, 144, 226, 0.4);
              transform: translateY(-1px);
              box-shadow: 0 3px 10px rgba(74, 144, 226, 0.15);
            }
            .form-row-double {
              display: flex;
              gap: 12px;
              margin-bottom: 6px;
              padding: 3px;
              border-radius: 4px;
              background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(232,244,253,0.5) 100%);
              border: 1px solid rgba(74, 144, 226, 0.2);
              transition: all 0.3s ease;
            }
            .form-row-double:hover {
              background: linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(232,244,253,0.8) 100%);
              border-color: rgba(74, 144, 226, 0.4);
              transform: translateY(-1px);
              box-shadow: 0 3px 10px rgba(74, 144, 226, 0.15);
            }
            .form-field {
              display: flex;
              align-items: center;
              flex: 1;
            }
            .field-label {
              font-weight: bold;
              margin-right: 6px;
              min-width: 80px;
              color: #2d5aa0;
              font-size: 9px;
            }
            .field-value {
              border-bottom: 1px solid #4a90e2;
              padding: 2px 6px;
              min-width: 100px;
              background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,251,255,0.9) 100%);
              border-radius: 3px;
              color: #1a365d;
              font-weight: 500;
              transition: all 0.3s ease;
              font-size: 9px;
            }
            .field-value:hover {
              background: rgba(255,255,255,1);
              box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
            }
            .checkbox-field {
              display: flex;
              align-items: center;
              margin-right: 20px;
            }
            .checkbox {
              width: 18px;
              height: 18px;
              border: 2px solid #4a90e2;
              border-radius: 4px;
              margin-right: 8px;
              display: inline-block;
              text-align: center;
              line-height: 14px;
              font-weight: bold;
              background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%);
              transition: all 0.3s ease;
            }
            .checkbox.checked {
              background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
              color: white;
              box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
              transform: scale(1.1);
            }
            .photo-box {
              width: 120px;
              height: 140px;
              border: 2px solid #4a90e2;
              border-radius: 6px;
              margin: 5px auto;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 50%, #e6f3ff 100%);
              box-shadow: 0 2px 10px rgba(74, 144, 226, 0.2);
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
            }
            .photo-box::before {
              content: '';
              position: absolute;
              top: -2px;
              left: -2px;
              right: -2px;
              bottom: -2px;
              background: linear-gradient(45deg, #4a90e2, #87ceeb, #4a90e2);
              border-radius: 15px;
              z-index: -1;
              animation: borderGlow 3s ease-in-out infinite;
            }
            @keyframes borderGlow {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }
            .photo-box img {
              max-width: 110px;
              max-height: 130px;
              object-fit: cover;
              border-radius: 4px;
              transition: all 0.3s ease;
            }
            .photo-box img:hover {
              transform: scale(1.02);
            }
            .photo-placeholder {
              text-align: center;
              color: #4a90e2;
              font-style: italic;
              font-weight: bold;
              background: linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(135, 206, 235, 0.1) 100%);
              padding: 20px;
              border-radius: 8px;
              border: 2px dashed #87ceeb;
            }
            .signature-section {
              margin-top: 8px;
              display: flex;
              justify-content: space-between;
              gap: 15px;
            }
            .signature-box {
              width: 160px;
              text-align: center;
              background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.9) 100%);
              padding: 8px;
              border-radius: 6px;
              border: 1px solid rgba(74, 144, 226, 0.3);
              box-shadow: 0 2px 10px rgba(74, 144, 226, 0.15);
              transition: all 0.3s ease;
            }
            .signature-box:hover {
              transform: translateY(-2px);
              box-shadow: 0 5px 20px rgba(74, 144, 226, 0.25);
            }
            .signature-line {
              border-bottom: 2px solid #4a90e2;
              height: 50px;
              margin-bottom: 8px;
              background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,251,255,0.8) 100%);
              border-radius: 4px;
              position: relative;
            }
            .signature-line::after {
              content: '✍️';
              position: absolute;
              right: 10px;
              bottom: 5px;
              font-size: 16px;
              opacity: 0.3;
            }
            .notes-section {
              margin-top: 25px;
              padding: 15px;
              background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.9) 100%);
              border-radius: 12px;
              border: 2px solid rgba(74, 144, 226, 0.3);
            }
            .notes-area {
              width: 100%;
              height: 100px;
              border: 2px solid #87ceeb;
              border-radius: 8px;
              padding: 10px;
              background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,251,255,0.95) 100%);
              font-family: 'Arial', sans-serif;
              font-size: 12px;
              line-height: 1.5;
              color: #1a365d;
              resize: none;
              transition: all 0.3s ease;
            }
            .notes-area:focus {
              outline: none;
              border-color: #4a90e2;
              box-shadow: 0 0 15px rgba(74, 144, 226, 0.3);
            }
            .form-footer {
              margin-top: 25px;
              background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
              color: white;
              padding: 15px;
              border-radius: 12px;
              font-size: 10px;
              text-align: center;
              box-shadow: 0 3px 15px rgba(74, 144, 226, 0.3);
              position: relative;
            }
            .form-footer::before {
              content: '🏥';
              position: absolute;
              left: 20px;
              top: 50%;
              transform: translateY(-50%);
              font-size: 16px;
            }
            .form-footer::after {
              content: '📋';
              position: absolute;
              right: 20px;
              top: 50%;
              transform: translateY(-50%);
              font-size: 16px;
            }
            .health-assessment-box {
              margin-bottom: 8px;
              padding: 6px;
              background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.9) 100%);
              border-radius: 6px;
              border: 1px solid rgba(74, 144, 226, 0.3);
              transition: all 0.3s ease;
            }
            .health-assessment-box:hover {
              border-color: rgba(74, 144, 226, 0.5);
              box-shadow: 0 3px 15px rgba(74, 144, 226, 0.15);
            }
            .assessment-title {
              font-weight: bold;
              margin-bottom: 4px;
              color: #2d5aa0;
              font-size: 8px;
              display: flex;
              align-items: center;
            }
            .assessment-title::before {
              content: '📝';
              margin-right: 4px;
              font-size: 8px;
            }
            .assessment-content {
              border: 1px solid #87ceeb;
              border-radius: 4px;
              padding: 6px;
              min-height: 25px;
              background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,251,255,0.95) 100%);
              color: #1a365d;
              font-size: 8px;
              line-height: 1.2;
              transition: all 0.3s ease;
            }
            .assessment-content.not-assessed {
              background: linear-gradient(135deg, rgba(240,240,240,0.8) 0%, rgba(248,248,248,0.8) 100%);
              color: #666;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="form-container">
            <!-- Header -->
            <div class="header">
              <h1 class="hospital-name">Child Health Assessment Center</h1>
              <h2 class="form-title">Pediatric Health Evaluation Form</h2>
              <p class="form-subtitle">Confidential Medical Record - For Healthcare Professional Use Only</p>
            </div>

            <!-- Patient Information Section -->
            <div class="section-title">📄 Patient Information</div>
            
            <div class="main-content">
              <div class="left-section">
                <div class="form-row-double">
                  <div class="form-field">
                    <span class="field-label">Health ID:</span>
                    <span class="field-value">${userData.healthId || '___________________'}</span>
                  </div>
                  <div class="form-field">
                    <span class="field-label">Date:</span>
                    <span class="field-value">${new Date(userData.dateCollected).toLocaleDateString()}</span>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field">
                    <span class="field-label">Patient Name:</span>
                    <span class="field-value">${userData.childName || '___________________________________________________'}</span>
                  </div>
                </div>

                <div class="form-row-double">
                  <div class="form-field">
                    <span class="field-label">Age:</span>
                    <span class="field-value">${userData.age || '______'} years</span>
                  </div>
                  <div class="form-field">
                    <span class="field-label">Gender:</span>
                    <div class="checkbox-field">
                      <span class="checkbox ${userData.gender === 'Male' ? 'checked' : ''}">${userData.gender === 'Male' ? '✓' : ''}</span>
                      <span>Male</span>
                    </div>
                    <div class="checkbox-field">
                      <span class="checkbox ${userData.gender === 'Female' ? 'checked' : ''}">${userData.gender === 'Female' ? '✓' : ''}</span>
                      <span>Female</span>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field">
                    <span class="field-label">Guardian/Parent:</span>
                    <span class="field-value">${userData.guardianName || '___________________________________________________'}</span>
                  </div>
                </div>

                <div class="form-row-double">
                  <div class="form-field">
                    <span class="field-label">Relation:</span>
                    <span class="field-value">${userData.relation || '___________________'}</span>
                  </div>
                  <div class="form-field">
                    <span class="field-label">Phone:</span>
                    <span class="field-value">${userData.countryCode || '+91'} ${userData.phone || '___________________'}</span>
                  </div>
                </div>

                ${userData.idType && userData.localId ? `
                <div class="form-row">
                  <div class="form-field">
                    <span class="field-label">${userData.idType === 'aadhar' ? 'Aadhar Number:' : 'Local ID Number:'}</span>
                    <span class="field-value">${userData.localId}</span>
                  </div>
                </div>
                ` : ''}
              </div>

              <div class="right-section">
                <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">PATIENT PHOTO</div>
                <div class="photo-box">
                  ${userData.facePhoto ? 
                    `<img src="${userData.facePhoto}" alt="Patient Photo" />` : 
                    `<div class="photo-placeholder">AFFIX<br>RECENT<br>PHOTOGRAPH<br>HERE</div>`
                  }
                </div>
              </div>
            </div>

            <!-- Physical Assessment Section -->
            <div class="section-title">📏 Physical Assessment</div>
            
            <div class="form-row-double">
              <div class="form-field">
                <span class="field-label">Weight:</span>
                <span class="field-value">${userData.weight || '______'} kg</span>
              </div>
              <div class="form-field">
                <span class="field-label">Height:</span>
                <span class="field-value">${userData.height || '______'} cm</span>
              </div>
            </div>

            <!-- Health Assessment Section -->
            <div class="section-title">🩺 Health Assessment</div>
            
            <div class="health-assessment-box">
              <div class="assessment-title">Recent Illnesses/Medical Conditions:</div>
              <div class="assessment-content ${userData.skipIllnesses ? 'not-assessed' : ''}">
                ${userData.skipIllnesses ? 'Not Assessed' : (userData.recentIllnesses || 'None reported at time of assessment')}
              </div>
            </div>

            <div class="health-assessment-box">
              <div class="assessment-title">Malnutrition Signs/Observations:</div>
              <div class="assessment-content ${userData.skipMalnutrition ? 'not-assessed' : ''}">
                ${userData.skipMalnutrition ? 'Not Assessed' : (userData.malnutritionSigns || 'No visible signs of malnutrition observed')}
              </div>
            </div>

            <!-- Consent Section -->
            <div class="section-title">📜 Legal Consent</div>
            
            <div class="form-row">
              <span class="field-label">Parental/Guardian Consent for Assessment:</span>
              <div class="checkbox-field">
                <span class="checkbox ${userData.parentsConsent ? 'checked' : ''}">${userData.parentsConsent ? '✓' : ''}</span>
                <span>Yes, consent given</span>
              </div>
              <div class="checkbox-field">
                <span class="checkbox ${!userData.parentsConsent ? 'checked' : ''}">${!userData.parentsConsent ? '✓' : ''}</span>
                <span>No, consent not given</span>
              </div>
            </div>

            <!-- Notes Section -->
            <div class="notes-section">
              <div style="font-weight: bold; margin-bottom: 8px;">Additional Notes/Observations:</div>
              <div class="notes-area"></div>
            </div>

            <!-- Signature Section -->
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div>Healthcare Professional Signature</div>
                <div style="font-size: 10px;">Date: ${new Date().toLocaleDateString()}</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div>Guardian/Parent Signature</div>
                <div style="font-size: 10px;">Date: ${new Date().toLocaleDateString()}</div>
              </div>
            </div>

            <!-- Footer -->
            <div class="form-footer">
              <div>Form ID: CHF-${userData.healthId || 'XXXX'} | Generated: ${new Date().toLocaleString()}</div>
              <div style="margin-top: 5px;">This document contains confidential medical information. Handle in accordance with HIPAA guidelines.</div>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Share the generated PDF
      await shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });
      
      Alert.alert('PDF Generated', 'Child health report has been generated and is ready to share!');
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Export Error', 'Failed to generate PDF: ' + error.message);
    }
  };

  // const handleDataRequest = () => {
  //   Alert.alert(
  //     'Data Request',
  //     'Your data request has been submitted. You will receive a complete copy of your child\'s data within 24 hours.',
  //     [{ text: 'OK' }]
  //   );
  // };

  // const handleDataDeletion = () => {
  //   Alert.alert(
  //     'Delete Data',
  //     'Are you sure you want to delete all data for this child? This action cannot be undone.',
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       {
  //         text: 'Delete',
  //         style: 'destructive',
  //         onPress: () => {
  //           Alert.alert('Data Deleted', 'All data has been permanently deleted.');
  //           navigation.goBack();
  //         },
  //       },
  //     ]
  //   );
  // };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <Text style={styles.title}>Data Export & Sharing</Text>
      <Text style={styles.subtitle}>
        Manage your child's health data - export, share, or upload pending records
      </Text>

      {/* Export Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📤 Export Data</Text>
        <Text style={styles.sectionDescription}>
          Export your child's health data in different formats
        </Text>

        <View style={styles.formatSelector}>
          <Text style={styles.label}>Export Format:</Text>
          <View style={styles.formatButtons}>
            {['json', 'csv', 'txt'].map((format) => (
              <TouchableOpacity
                key={format}
                style={[
                  styles.formatButton,
                  exportFormat === format && styles.formatButtonActive,
                ]}
                onPress={() => setExportFormat(format)}
              >
                <Text
                  style={[
                    styles.formatButtonText,
                    exportFormat === format && styles.formatButtonTextActive,
                  ]}
                >
                  {format.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.exportButton]}
          onPress={handleExport}
          disabled={isExporting}
        >
          <Text style={styles.actionButtonText}>
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Share Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Share Data</Text>
        <Text style={styles.sectionDescription}>
          Generate and share a PDF document with child's health information and photo
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={generatePDF}
        >
          <Text style={styles.actionButtonText}>Generate PDF Report</Text>
        </TouchableOpacity>
      </View>

      {/* Upload Pending Records Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>☁️ Upload Child Data</Text>
        <Text style={styles.sectionDescription}>
          Upload all pending child records to the server
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.uploadButton]}
          onPress={uploadPendingRecords}
          disabled={isUploading || pendingRecords.length === 0}
        >
          <Text style={styles.actionButtonText}>
            {isUploading ? 'Uploading...' : `Upload All Child Data (${pendingRecords.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pending Records Section */}
      {pendingRecords.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Pending Records</Text>
          <Text style={styles.sectionDescription}>
            Tap on a child's name to view their complete data
          </Text>

          {pendingRecords.map((record, index) => (
            <View key={index} style={styles.recordItem}>
              <TouchableOpacity
                style={styles.recordHeader}
                onPress={() => setExpandedRecordIndex(expandedRecordIndex === index ? null : index)}
              >
                <Text style={styles.recordName}>{record.childName}</Text>
                <Text style={styles.recordToggle}>
                  {expandedRecordIndex === index ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              
              {expandedRecordIndex === index && (
                <View style={styles.recordDetails}>
                  <Text style={styles.detailText}>Health ID: {record.healthId}</Text>
                  <Text style={styles.detailText}>Age: {record.age} years</Text>
                  <Text style={styles.detailText}>Gender: {record.gender}</Text>
                  <Text style={styles.detailText}>Weight: {record.weight}kg</Text>
                  <Text style={styles.detailText}>Height: {record.height}cm</Text>
                  <Text style={styles.detailText}>Guardian: {record.guardianName} ({record.relation})</Text>
                  <Text style={styles.detailText}>Phone: {record.countryCode} {record.phone}</Text>
                  {record.idType === 'local' && record.localId && (
                    <Text style={styles.detailText}>Local ID: {record.localId}</Text>
                  )}
                  {record.idType === 'aadhar' && record.aadharNumber && (
                    <Text style={styles.detailText}>Aadhar: {record.aadharNumber}</Text>
                  )}
                  {!record.skipMalnutrition && record.malnutritionSigns && (
                    <Text style={styles.detailText}>Malnutrition Signs: {record.malnutritionSigns}</Text>
                  )}
                  {!record.skipIllnesses && record.recentIllnesses && (
                    <Text style={styles.detailText}>Recent Illnesses: {record.recentIllnesses}</Text>
                  )}
                  <Text style={styles.detailText}>
                    Data Collected: {new Date(record.dateCollected).toLocaleDateString()}
                  </Text>
                  <Text style={styles.detailText}>
                    Status: {record.isOffline ? 'Offline' : 'Online'}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Data Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Data Summary</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            Child: {userData.childName}
          </Text>
          <Text style={styles.summaryText}>Health ID: {userData.healthId}</Text>
          <Text style={styles.summaryText}>Age: {userData.age} years</Text>
          <Text style={styles.summaryText}>Gender: {userData.gender}</Text>
          <Text style={styles.summaryText}>Weight: {userData.weight}kg</Text>
          <Text style={styles.summaryText}>Height: {userData.height}cm</Text>
          <Text style={styles.summaryText}>Guardian: {userData.guardianName} ({userData.relation})</Text>
          <Text style={styles.summaryText}>Phone: {userData.countryCode} {userData.phone}</Text>
          {userData.idType === 'local' && userData.localId && (
            <Text style={styles.summaryText}>Local ID: {userData.localId}</Text>
          )}
          {userData.idType === 'aadhar' && userData.aadharNumber && (
            <Text style={styles.summaryText}>Aadhar: {userData.aadharNumber}</Text>
          )}
          {!userData.skipMalnutrition && userData.malnutritionSigns && (
            <Text style={styles.summaryText}>Malnutrition Signs: {userData.malnutritionSigns}</Text>
          )}
          {!userData.skipIllnesses && userData.recentIllnesses && (
            <Text style={styles.summaryText}>Recent Illnesses: {userData.recentIllnesses}</Text>
          )}
          <Text style={styles.summaryText}>
            Data Collected: {new Date(userData.dateCollected).toLocaleDateString()}
          </Text>
          <Text style={styles.summaryText}>
            Status: {userData.isOffline ? 'Offline' : 'Online'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>← Back to Registration</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom for scroll
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
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  formatSelector: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 8,
  },
  formatButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  formatButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A7C59',
    backgroundColor: '#fff',
  },
  formatButtonActive: {
    backgroundColor: '#4A7C59',
  },
  formatButtonText: {
    color: '#4A7C59',
    fontWeight: '600',
  },
  formatButtonTextActive: {
    color: '#fff',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#4A7C59',
  },
  shareButton: {
    backgroundColor: '#007AFF',
  },
  requestButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  uploadButton: {
    backgroundColor: '#28A745',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recordItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
  },
  recordName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
  },
  recordToggle: {
    fontSize: 16,
    color: '#666',
  },
  recordDetails: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4A7C59',
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A7C59',
    backgroundColor: '#fff',
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#4A7C59',
    fontSize: 16,
    fontWeight: '600',
  },
});
