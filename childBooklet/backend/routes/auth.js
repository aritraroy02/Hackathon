const express = require('express');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/auth/verify-uin/:uinNumber - Check if UIN exists in demo users
router.get('/verify-uin/:uinNumber', async (req, res) => {
  try {
    const { uinNumber } = req.params;
    
    // Validate UIN format
    if (!/^\d{10}$/.test(uinNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid UIN format. Please enter a valid 10-digit UIN.'
      });
    }

    // Check if user exists in database
    const user = await User.findOne({ uinNumber: uinNumber, isActive: true });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'UIN not found. Please contact your local administration for registration.',
        code: 'UIN_NOT_FOUND'
      });
    }

    // Return basic user info (no sensitive data)
    res.json({
      success: true,
      message: 'UIN verified successfully',
      data: {
        name: user.name,
        phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // Mask middle digits
        email: user.email.replace(/(.{2}).+(@.+)/, '$1***$2'), // Mask email
        uinExists: true
      }
    });

  } catch (error) {
    console.error('UIN verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during UIN verification'
    });
  }
});

// POST /api/auth/verify-otp - Accept any 6-digit OTP and return JWT token
router.post('/verify-otp', async (req, res) => {
  try {
    const { uinNumber, otp, transactionId } = req.body;

    // Validate required fields
    if (!uinNumber || !otp) {
      return res.status(400).json({
        success: false,
        error: 'UIN number and OTP are required'
      });
    }

    // Validate UIN format
    if (!/^\d{10}$/.test(uinNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid UIN format'
      });
    }

    // Validate OTP format (any 6-digit number for demo)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP format. Please enter 6 digits.'
      });
    }

    // Check if user exists and is active
    const user = await User.findOne({ uinNumber: uinNumber, isActive: true });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please contact your local administration.'
      });
    }

    // For demo purposes, accept any 6-digit OTP
    // In production, this would verify against a real OTP sent via SMS/email

    // Generate JWT token
    const accessToken = generateToken(user._id, user.uinNumber);

    // Prepare user data for response
    const userData = {
      id: user._id,
      uinNumber: user.uinNumber,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      photo: user.photo,
      employeeId: user.employeeId || `HW-${user.uinNumber.slice(-6)}`
    };

    // Return authentication success with token and user data
    res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 86400, // 24 hours in seconds
        userData,
        authenticatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during OTP verification'
    });
  }
});

// POST /api/auth/refresh-token - Refresh JWT token (optional)
router.post('/refresh-token', async (req, res) => {
  try {
    // This would typically validate a refresh token
    // For demo purposes, we'll keep it simple
    res.status(501).json({
      success: false,
      error: 'Token refresh not implemented in demo version'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during token refresh'
    });
  }
});

// POST /api/auth/profile-upload - Auto-upload user profile after authentication
router.post('/profile-upload', async (req, res) => {
  try {
    const { uinNumber, profileData } = req.body;

    if (!uinNumber || !profileData) {
      return res.status(400).json({
        success: false,
        error: 'UIN number and profile data are required'
      });
    }

    // Find user and update profile if needed
    const user = await User.findOne({ uinNumber, isActive: true });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user profile with any new data
    const updatedUser = await User.findOneAndUpdate(
      { uinNumber },
      { 
        ...profileData,
        lastProfileUpdate: new Date().toISOString()
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Profile uploaded successfully',
      data: {
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        employeeId: updatedUser.employeeId
      }
    });

  } catch (error) {
    console.error('Profile upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during profile upload'
    });
  }
});

module.exports = router;
