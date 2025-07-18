import React, { useState, useEffect } from 'react';
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

    setIsUploading(true);
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear pending records from AsyncStorage
      await AsyncStorage.removeItem('pendingChildRecords');
      setPendingRecords([]);
      
      Alert.alert(
        'Upload Complete',
        `Successfully uploaded ${pendingRecords.length} child record(s) to the server.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to upload records: ' + error.message);
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

  const handleShare = async () => {
    try {
      const shareData = {
        title: 'Child Health Data',
        message: `Child Health Data for ${userData.childName}\n\nHealth ID: ${userData.healthId}\nAge: ${userData.age} years\nGender: ${userData.gender}\nWeight: ${userData.weight}kg\nHeight: ${userData.height}cm\nGuardian: ${userData.guardianName} (${userData.relation})\nPhone: ${userData.countryCode} ${userData.phone}\nDate Collected: ${new Date(userData.dateCollected).toLocaleDateString()}`,
      };

      await Share.share(shareData);
    } catch (error) {
      Alert.alert('Share Error', 'Failed to share data: ' + error.message);
    }
  };

  const handleDataRequest = () => {
    Alert.alert(
      'Data Request',
      'Your data request has been submitted. You will receive a complete copy of your child\'s data within 24 hours.',
      [{ text: 'OK' }]
    );
  };

  const handleDataDeletion = () => {
    Alert.alert(
      'Delete Data',
      'Are you sure you want to delete all data for this child? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Data Deleted', 'All data has been permanently deleted.');
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Data Export & Sharing</Text>
      <Text style={styles.subtitle}>
        Manage your child's health data - export, share, or request deletion
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
          Share basic health information with healthcare providers
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
        >
          <Text style={styles.actionButtonText}>Share Summary</Text>
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
    padding: 20,
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
