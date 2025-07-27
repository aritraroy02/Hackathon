const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  // Required fields
  childName: { type: String, required: true },
  age: { type: String, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female'] },
  weight: { type: String, required: true },
  height: { type: String, required: true },
  guardianName: { type: String, required: true },
  relation: { type: String, required: true },
  phone: { type: String, required: true },
  parentsConsent: { type: Boolean, required: true },
  healthId: { type: String, required: true, unique: true },

  // Optional fields
  facePhoto: { type: String },  // URL or base64 string
  localId: { type: String },
  idType: { type: String, enum: ['local', 'aadhar', ''] },
  countryCode: { type: String, default: '+91' },
  malnutritionSigns: { type: String, default: '' },
  recentIllnesses: { type: String, default: '' },
  skipMalnutrition: { type: Boolean, default: false },
  skipIllnesses: { type: Boolean, default: false },
  dateCollected: { type: Date, default: Date.now },
  isOffline: { type: Boolean, default: false },
  
  // Location data (captured when data is uploaded)
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    accuracy: { type: Number },
    timestamp: { type: Date }
  }
});

module.exports = mongoose.model('Child', childSchema);
