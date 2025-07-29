const mongoose = require('mongoose');
const User = require('./models/User');

// Load environment variables
require('dotenv').config();

// Mock MOSIP data from the frontend (matching ESignetAuthScreen.js)
const MOCK_MOSIP_DATA = {
  '1234567890': {
    name: 'ARITRADITYA ROY',
    email: 'aritraditya.roy@gmailcom',
    phone: '+91-9876543210',
    address: '123 Main Street, New Delhi, Delhi 110001',
    dateOfBirth: '1985-06-15',
    gender: 'Male',
    photo: null
  },
  '9876543210': {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+91-8765432109',
    address: '456 Park Avenue, Mumbai, Maharashtra 400001',
    dateOfBirth: '1990-03-20',
    gender: 'Female',
    photo: null
  },
  '5555555555': {
    name: 'Dr. Alice Johnson',
    email: 'alice.johnson@healthcare.gov.in',
    phone: '+91-7654321098',
    address: '789 Hospital Road, Bangalore, Karnataka 560001',
    dateOfBirth: '1982-11-10',
    gender: 'Female',
    photo: null
  },
  '1111111111': {
    name: 'Health Worker Demo',
    email: 'demo@health.gov.in',
    phone: '+91-9999999999',
    address: 'Demo Address, Demo City, Demo State 123456',
    dateOfBirth: '1988-01-01',
    gender: 'Male',
    photo: null
  }
};

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/childHealth';
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Convert MOCK_MOSIP_DATA to user documents
    const users = Object.entries(MOCK_MOSIP_DATA).map(([uinNumber, userData]) => ({
      uinNumber,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      photo: userData.photo,
      employeeId: `HW-${uinNumber.slice(-6)}`,
      isActive: true
    }));

    // Insert users into database
    const insertedUsers = await User.insertMany(users);
    
    console.log('✅ Demo users seeded successfully!');
    console.log(`📊 Inserted ${insertedUsers.length} users:`);
    
    insertedUsers.forEach(user => {
      console.log(`   - ${user.name} (UIN: ${user.uinNumber})`);
    });

    console.log('\n🎯 You can now test authentication with these UINs:');
    Object.keys(MOCK_MOSIP_DATA).forEach(uin => {
      console.log(`   - UIN: ${uin} (Name: ${MOCK_MOSIP_DATA[uin].name})`);
    });
    
    console.log('\n💡 Use any 6-digit number as OTP (e.g., 123456)');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    if (error.code === 11000) {
      console.log('⚠️  Some users already exist in the database');
    }
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seed script
if (require.main === module) {
  console.log('🌱 Starting user seeding process...');
  seedUsers();
}

module.exports = { seedUsers, MOCK_MOSIP_DATA };
