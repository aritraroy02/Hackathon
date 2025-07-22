const axios = require('axios');

const testHealthIds = [
  'HEALTH001',
  'HEALTH002', 
  'HEALTH003',
  'HEALTH004',
  'HEALTH005'
];

async function clearTestData() {
  try {
    console.log('🧹 Clearing test data from database...\n');

    for (const healthId of testHealthIds) {
      try {
        console.log(`🗑️  Deleting record: ${healthId}`);
        const response = await axios.delete(`http://localhost:5001/api/children/${healthId}`);
        
        if (response.data.success) {
          console.log(`✅ Successfully deleted ${healthId}`);
        } else {
          console.log(`❌ Failed to delete ${healthId}`);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`ℹ️  Record ${healthId} not found (already deleted)`);
        } else {
          console.log(`❌ Error deleting ${healthId}: ${error.response?.data?.error || error.message}`);
        }
      }
    }

    // Verify all data is cleared
    console.log('\n📋 Verifying database is empty...');
    const response = await axios.get('http://localhost:5001/api/children');
    const remainingRecords = response.data.data.length;
    
    if (remainingRecords === 0) {
      console.log('✅ Database is now clean! All test data removed.');
    } else {
      console.log(`⚠️  ${remainingRecords} records still remain in database:`);
      response.data.data.forEach((child, index) => {
        console.log(`   ${index + 1}. ${child.childName} (${child.healthId})`);
      });
    }

    console.log('\n🎉 Cleanup completed!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

clearTestData();
