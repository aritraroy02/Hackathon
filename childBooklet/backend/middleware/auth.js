const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret - In production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'child-health-demo-secret-key-2025';

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid token format.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. User not found or deactivated.'
      });
    }

    // Add user info to request
    req.user = {
      id: user._id,
      uinNumber: user.uinNumber,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired.'
      });
    } else {
      console.error('Token verification error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error during authentication.'
      });
    }
  }
};

// Function to generate JWT token
const generateToken = (userId, uinNumber) => {
  return jwt.sign(
    { 
      userId, 
      uinNumber,
      type: 'access'
    },
    JWT_SECRET,
    { 
      expiresIn: '24h' // Token expires in 24 hours
    }
  );
};

module.exports = {
  verifyToken,
  generateToken,
  JWT_SECRET
};
