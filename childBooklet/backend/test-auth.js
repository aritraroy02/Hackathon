const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5001/api';

async function testAuthenticationFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test 1: Verify UIN
    console.log('1️⃣ Testing UIN Verification...');
    const uinResponse = await fetch(`${API_BASE}/auth/verify-uin/1234567890`);
    const uinResult = await uinResponse.json();
    
    if (uinResult.success) {
      console.log('✅ UIN Verification successful!');
      console.log('   User:', uinResult.data.name);
      console.log('   Phone:', uinResult.data.phone);
      console.log('   Email:', uinResult.data.email);
    } else {
      console.log('❌ UIN Verification failed:', uinResult.error);
    }
    console.log();

    // Test 2: Verify OTP and get JWT token
    console.log('2️⃣ Testing OTP Verification...');
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
    
    const otpResult = await otpResponse.json();
    
    if (otpResult.success) {
      console.log('✅ OTP Verification successful!');
      console.log('   Token received:', otpResult.data.accessToken.substring(0, 20) + '...');
      console.log('   User:', otpResult.data.userData.name);
      console.log('   Employee ID:', otpResult.data.userData.employeeId);
      
      // Test 3: Use JWT token to access protected endpoint
      console.log('\n3️⃣ Testing Protected Endpoint Access...');
      const protectedResponse = await fetch(`${API_BASE}/children`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${otpResult.data.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const protectedResult = await protectedResponse.json();
      
      if (protectedResult.success) {
        console.log('✅ Protected endpoint access successful!');
        console.log('   Children records found:', protectedResult.data.length);
      } else {
        console.log('❌ Protected endpoint access failed:', protectedResult.error);
      }
      
    } else {
      console.log('❌ OTP Verification failed:', otpResult.error);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }

  console.log('\n🎯 Authentication flow testing completed!');
}

// Test invalid UIN
async function testInvalidUIN() {
  console.log('\n🧪 Testing Invalid UIN...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/verify-uin/9999999999`);
    const result = await response.json();
    
    if (!result.success && result.code === 'UIN_NOT_FOUND') {
      console.log('✅ Invalid UIN correctly rejected!');
      console.log('   Message:', result.error);
    } else {
      console.log('❌ Invalid UIN test failed - should have been rejected');
    }
  } catch (error) {
    console.error('❌ Invalid UIN test error:', error.message);
  }
}

// Run tests
testAuthenticationFlow().then(() => {
  testInvalidUIN().then(() => {
    process.exit(0);
  });
});
