const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uinNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\d{10}$/ // 10-digit UIN validation
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  photo: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness for non-null values
  },
  lastProfileUpdate: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster UIN lookups
userSchema.index({ uinNumber: 1 });

module.exports = mongoose.model('User', userSchema);
