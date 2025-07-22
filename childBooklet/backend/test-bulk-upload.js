const axios = require('axios');

const bulkTestData = [
  {
    childName: "Sanya Patel",
    age: "4",
    gender: "Female",
    weight: "16.2",
    height: "102",
    guardianName: "Kiran Patel",
    relation: "Mother",
    phone: "9876543213",
    parentsConsent: true,
    healthId: "HEALTH004",
    idType: "local",
    localId: "LOCAL004",
    malnutritionSigns: "Normal growth",
    recentIllnesses: "None"
  },
  {
    childName: "Dev Gupta",
    age: "6",
    gender: "Male",
    weight: "20.1",
    height: "118",
    guardianName: "Amit Gupta",
    relation: "Father",
    phone: "9876543214",
    parentsConsent: true,
    healthId: "HEALTH005",
    idType: "aadhar",
    localId: "987654321098",
    malnutritionSigns: "Slight underweight",
    recentIllnesses: "Stomach bug last week"
  }
];

async function testBulkUpload() {
  try {
    console.log('📦 Testing bulk upload functionality...\n');
    
    const response = await axios.post('http://localhost:5001/api/children/bulk', bulkTestData);
    
    console.log('✅ Bulk upload successful!');
    console.log(`📊 Summary:`);
    console.log(`   Total records: ${response.data.summary.total}`);
    console.log(`   Successful: ${response.data.summary.successful}`);
    console.log(`   Updated: ${response.data.summary.updated}`);
    console.log(`   Failed: ${response.data.summary.failed}`);
    
    if (response.data.details.success.length > 0) {
      console.log('\n✅ Successfully created:');
      response.data.details.success.forEach(item => {
        console.log(`   - ${item.data.childName} (${item.healthId})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Bulk upload failed:', error.response?.data || error.message);
  }
}

testBulkUpload();
