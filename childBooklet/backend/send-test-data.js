const axios = require('axios');

// Test data for Child records
const testChildren = [
  {
    childName: "Arjun Kumar",
    age: "5",
    gender: "Male",
    weight: "18.5",
    height: "110",
    guardianName: "Priya Kumar",
    relation: "Mother",
    phone: "9876543210",
    parentsConsent: true,
    healthId: "HEALTH001",
    idType: "local",
    localId: "LOCAL001",
    countryCode: "+91",
    malnutritionSigns: "None observed",
    recentIllnesses: "Common cold last month",
    skipMalnutrition: false,
    skipIllnesses: false,
    isOffline: false
  },
  {
    childName: "Meera Singh",
    age: "3",
    gender: "Female",
    weight: "14.2",
    height: "95",
    guardianName: "Rajesh Singh",
    relation: "Father",
    phone: "9876543211",
    parentsConsent: true,
    healthId: "HEALTH002",
    idType: "aadhar",
    localId: "123456789012",
    countryCode: "+91",
    malnutritionSigns: "Mild stunting",
    recentIllnesses: "Fever and cough 2 weeks ago",
    skipMalnutrition: false,
    skipIllnesses: false,
    isOffline: false
  },
  {
    childName: "Rohit Sharma",
    age: "7",
    gender: "Male",
    weight: "22.8",
    height: "125",
    guardianName: "Sunita Sharma",
    relation: "Mother",
    phone: "9876543212",
    parentsConsent: true,
    healthId: "HEALTH003",
    idType: "local",
    localId: "LOCAL003",
    countryCode: "+91",
    malnutritionSigns: "Good nutritional status",
    recentIllnesses: "No recent illnesses",
    skipMalnutrition: false,
    skipIllnesses: false,
    isOffline: false
  }
];

const API_BASE_URL = 'http://localhost:5001/api';

async function sendTestData() {
  try {
    console.log('🧪 Starting test data upload...\n');

    // Test 1: Send individual child records
    for (let i = 0; i < testChildren.length; i++) {
      const child = testChildren[i];
      console.log(`📝 Sending child record ${i + 1}: ${child.childName}`);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/children`, child);
        console.log(`✅ Success: ${response.data.success ? 'Created' : 'Failed'}`);
        console.log(`   Health ID: ${response.data.data.healthId}`);
      } catch (error) {
        console.log(`❌ Error: ${error.response?.data?.error || error.message}`);
      }
      console.log('');
    }

    // Test 2: Get all children to verify data was saved
    console.log('📋 Fetching all children from database...');
    try {
      const response = await axios.get(`${API_BASE_URL}/children`);
      console.log(`✅ Found ${response.data.data.length} children in database:`);
      response.data.data.forEach((child, index) => {
        console.log(`   ${index + 1}. ${child.childName} (Health ID: ${child.healthId})`);
      });
    } catch (error) {
      console.log(`❌ Error fetching data: ${error.response?.data?.error || error.message}`);
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
sendTestData();
