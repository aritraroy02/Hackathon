import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ViewRecordsScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [pendingRecords, setPendingRecords] = useState([]);
  const [uploadedRecords, setUploadedRecords] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'uploaded'

  const themedStyles = createThemedStyles(theme, insets);

  useEffect(() => {
    loadAllRecords();
    // Set up focus listener to reload records when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadAllRecords();
    });
    return unsubscribe;
  }, [navigation]);

  const loadAllRecords = async () => {
    try {
      // Load pending records
      const pendingData = await AsyncStorage.getItem('pendingChildRecords');
      const pending = pendingData ? JSON.parse(pendingData) : [];
      setPendingRecords(pending);

      // Load uploaded records
      const uploadedData = await AsyncStorage.getItem('uploadedChildRecords');
      const uploaded = uploadedData ? JSON.parse(uploadedData) : [];
      setUploadedRecords(uploaded);

      console.log('Loaded records - Pending:', pending.length, 'Uploaded:', uploaded.length);
    } catch (error) {
      console.error('Error loading records:', error);
      Alert.alert('Error', 'Failed to load records. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllRecords();
    setRefreshing(false);
  };

  const getFilteredRecords = () => {
    switch (activeTab) {
      case 'pending':
        return pendingRecords.map(record => ({ ...record, status: 'pending' }));
      case 'uploaded':
        return uploadedRecords.map(record => ({ ...record, status: 'uploaded' }));
      default:
        return [
          ...pendingRecords.map(record => ({ ...record, status: 'pending' })),
          ...uploadedRecords.map(record => ({ ...record, status: 'uploaded' }))
        ].sort((a, b) => new Date(b.dateCollected) - new Date(a.dateCollected));
    }
  };

  const renderRecord = (record, index) => {
    const isUploaded = record.status === 'uploaded';
    
    return (
      <View key={`${record.healthId}-${index}`} style={themedStyles.recordCard}>
        <View style={themedStyles.recordHeader}>
          <View style={themedStyles.recordInfo}>
            <Text style={themedStyles.recordName}>{record.childName}</Text>
            <Text style={themedStyles.recordId}>Health ID: {record.healthId}</Text>
          </View>
          <View style={[
            themedStyles.statusBadge,
            isUploaded ? themedStyles.uploadedBadge : themedStyles.pendingBadge
          ]}>
            <Ionicons 
              name={isUploaded ? "cloud-done" : "time"} 
              size={12} 
              color="#fff" 
              style={{ marginRight: 4 }}
            />
            <Text style={themedStyles.statusText}>
              {isUploaded ? 'Uploaded' : 'Pending'}
            </Text>
          </View>
        </View>

        <View style={themedStyles.recordDetails}>
          <View style={themedStyles.detailRow}>
            <Text style={themedStyles.detailLabel}>Age:</Text>
            <Text style={themedStyles.detailValue}>{record.age} years</Text>
          </View>
          <View style={themedStyles.detailRow}>
            <Text style={themedStyles.detailLabel}>Gender:</Text>
            <Text style={themedStyles.detailValue}>{record.gender}</Text>
          </View>
          <View style={themedStyles.detailRow}>
            <Text style={themedStyles.detailLabel}>Guardian:</Text>
            <Text style={themedStyles.detailValue}>{record.guardianName}</Text>
          </View>
          <View style={themedStyles.detailRow}>
            <Text style={themedStyles.detailLabel}>Date:</Text>
            <Text style={themedStyles.detailValue}>
              {new Date(record.dateCollected).toLocaleDateString()}
            </Text>
          </View>
          {isUploaded && record.uploadedAt && (
            <View style={themedStyles.detailRow}>
              <Text style={themedStyles.detailLabel}>Uploaded:</Text>
              <Text style={[themedStyles.detailValue, themedStyles.uploadedText]}>
                {new Date(record.uploadedAt).toLocaleDateString()} at {new Date(record.uploadedAt).toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>

        {record.location && (
          <View style={themedStyles.locationInfo}>
            <Ionicons name="location" size={14} color={theme.primary} />
            <Text style={themedStyles.locationText}>
              {record.location.city}, {record.location.state}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const filteredRecords = getFilteredRecords();

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
        <Text style={themedStyles.headerTitle}>Child Records</Text>
        <TouchableOpacity 
          style={themedStyles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={themedStyles.summaryContainer}>
        <View style={themedStyles.summaryCard}>
          <Text style={themedStyles.summaryNumber}>{pendingRecords.length}</Text>
          <Text style={themedStyles.summaryLabel}>Pending</Text>
          <Ionicons name="time" size={20} color="#FF9500" />
        </View>
        <View style={themedStyles.summaryCard}>
          <Text style={themedStyles.summaryNumber}>{uploadedRecords.length}</Text>
          <Text style={themedStyles.summaryLabel}>Uploaded</Text>
          <Ionicons name="cloud-done" size={20} color="#4CAF50" />
        </View>
        <View style={themedStyles.summaryCard}>
          <Text style={themedStyles.summaryNumber}>{pendingRecords.length + uploadedRecords.length}</Text>
          <Text style={themedStyles.summaryLabel}>Total</Text>
          <Ionicons name="people" size={20} color={theme.primary} />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={themedStyles.tabContainer}>
        <TouchableOpacity
          style={[themedStyles.tab, activeTab === 'all' && themedStyles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[themedStyles.tabText, activeTab === 'all' && themedStyles.activeTabText]}>
            All ({pendingRecords.length + uploadedRecords.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[themedStyles.tab, activeTab === 'pending' && themedStyles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[themedStyles.tabText, activeTab === 'pending' && themedStyles.activeTabText]}>
            Pending ({pendingRecords.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[themedStyles.tab, activeTab === 'uploaded' && themedStyles.activeTab]}
          onPress={() => setActiveTab('uploaded')}
        >
          <Text style={[themedStyles.tabText, activeTab === 'uploaded' && themedStyles.activeTabText]}>
            Uploaded ({uploadedRecords.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Records List */}
      <ScrollView
        style={themedStyles.recordsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredRecords.length === 0 ? (
          <View style={themedStyles.emptyState}>
            <Ionicons name="document-outline" size={64} color={theme.lightText} />
            <Text style={themedStyles.emptyStateText}>No records found</Text>
            <Text style={themedStyles.emptyStateSubtext}>
              {activeTab === 'all' ? 'No child records available' :
               activeTab === 'pending' ? 'No pending records' :
               'No uploaded records'}
            </Text>
          </View>
        ) : (
          filteredRecords.map((record, index) => renderRecord(record, index))
        )}
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
  refreshButton: {
    padding: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primaryText,
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.secondaryText,
    marginBottom: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: theme.tabBackground,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.secondaryText,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.whiteText,
  },
  recordsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  recordCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primaryText,
    marginBottom: 4,
  },
  recordId: {
    fontSize: 12,
    color: theme.secondaryText,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
  },
  uploadedBadge: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  recordDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.secondaryText,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: theme.primaryText,
  },
  uploadedText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  locationText: {
    fontSize: 12,
    color: theme.secondaryText,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.secondaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.lightText,
    textAlign: 'center',
  },
});