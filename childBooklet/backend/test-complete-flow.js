const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5001/api';

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Authentication + Data Upload Flow...\n');

  try {
    // Step 1: Authenticate user
    console.log('1️⃣ Authenticating user...');
    const otpResponse = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uinNumber: '1234567890',
        otp: '123456',
        transactionId: 'test_transaction'
      })
    });
    
    const authResult = await otpResponse.json();
    
    if (!authResult.success) {
      console.log('❌ Authentication failed:', authResult.error);
      return;
    }

    console.log('✅ Authentication successful!');
    console.log('   User:', authResult.data.userData.name);
    const token = authResult.data.accessToken;

    // Step 2: Test bulk upload with JWT token
    console.log('\n2️⃣ Testing bulk upload with authentication...');
    
    const sampleChildData = [{
      childName: "Test Child",
      age: "2 years",
      gender: "Male",
      weight: "12.5 kg",
      height: "85 cm",
      guardianName: "Test Parent",
      relation: "Mother",
      phone: "+91-9876543210",
      parentsConsent: true,
      healthId: `TEST-${Date.now()}`,
      facePhoto: null,
      malnutritionSigns: "None observed",
      recentIllnesses: "Common cold last month",
      dateCollected: new Date().toISOString(),
      isOffline: true,
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: "New Delhi, India",
        accuracy: 10,
        timestamp: new Date().toISOString()
      }
    }];

    const bulkResponse = await fetch(`${API_BASE}/children/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sampleChildData)
    });
    
    const bulkResult = await bulkResponse.json();
    
    if (bulkResult.success) {
      console.log('✅ Bulk upload successful!');
      console.log('   Records uploaded:', bulkResult.summary.successful);
      console.log('   Uploaded by:', bulkResult.summary.uploadedBy);
      console.log('   Uploader UIN:', bulkResult.summary.uploaderUIN);
    } else {
      console.log('❌ Bulk upload failed:', bulkResult.error);
    }

    // Step 3: Test accessing uploaded data
    console.log('\n3️⃣ Testing data retrieval...');
    const getResponse = await fetch(`${API_BASE}/children`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const getResult = await getResponse.json();
    
    if (getResult.success) {
      console.log('✅ Data retrieval successful!');
      console.log('   Total records:', getResult.data.length);
      
      // Show tracking info for the last record
      const lastRecord = getResult.data[getResult.data.length - 1];
      if (lastRecord.uploadedBy) {
        console.log('   Last record uploaded by:', lastRecord.uploadedBy);
        console.log('   Uploader UIN:', lastRecord.uploaderUIN);
      }
    } else {
      console.log('❌ Data retrieval failed:', getResult.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  console.log('\n🎯 Complete flow testing finished!');
}

// Test unauthorized access
async function testUnauthorizedAccess() {
  console.log('\n🛡️ Testing unauthorized access...');
  
  try {
    const response = await fetch(`${API_BASE}/children/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        childName: "Unauthorized Test",
        healthId: "UNAUTHORIZED-TEST"
      }])
    });
    
    const result = await response.json();
    
    if (!result.success && response.status === 401) {
      console.log('✅ Unauthorized access correctly blocked!');
      console.log('   Error:', result.error);
    } else {
      console.log('❌ Unauthorized access test failed - should have been blocked');
    }
  } catch (error) {
    console.error('❌ Unauthorized access test error:', error.message);
  }
}

// Run tests
testCompleteFlow().then(() => {
  testUnauthorizedAccess().then(() => {
    console.log('\n✨ All tests completed!');
    process.exit(0);
  });
});
