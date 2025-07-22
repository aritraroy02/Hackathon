const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Child = require('./models/Child');

// Load environment variables (only if not in production/cloud environment)
if (!process.env.MONGODB_URI || process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    // Debug all environment variables
    console.log('All environment variables:');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PORT:', process.env.PORT);
    
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/childHealth';
    console.log('Attempting to connect to MongoDB...');
    console.log('Final MongoDB URI:', mongoURI.substring(0, 50) + '...');
    console.log('MongoDB URI configured:', mongoURI ? 'Yes' : 'No');
    console.log('Environment variables:', {
      MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
      PORT: process.env.PORT || 'Not set'
    });
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 second timeout for cloud connection
      socketTimeoutMS: 45000, // Socket timeout
      maxPoolSize: 10, // Maximum number of connections in pool
      retryWrites: true,
      w: 'majority'
    });
    
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);
    
    // Create indexes for better query performance
    try {
      await Child.collection.createIndex({ healthId: 1 }, { unique: true });
      console.log('✅ Database indexes created');
    } catch (indexError) {
      if (indexError.code === 11000) {
        console.log('✅ Index already exists');
      } else {
        console.log('⚠️  Index creation warning:', indexError.message);
      }
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('Full error:', error);
    // Don't exit in production, let the app continue and retry
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected');
});

// Connect to MongoDB
connectDB();

// Routes

// Root health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Child Health Backend API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      children: '/api/children',
      bulkUpload: '/api/children/bulk'
    }
  });
});

// Create new child record
app.post('/api/children', async (req, res) => {
  try {
    const child = new Child(req.body);
    await child.save();
    res.status(201).json({ success: true, data: child });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all children records
app.get('/api/children', async (req, res) => {
  try {
    const children = await Child.find();
    res.json({ success: true, data: children });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get child by healthId
app.get('/api/children/:healthId', async (req, res) => {
  try {
    const child = await Child.findOne({ healthId: req.params.healthId });
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }
    res.json({ success: true, data: child });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update child record
app.put('/api/children/:healthId', async (req, res) => {
  try {
    const child = await Child.findOneAndUpdate(
      { healthId: req.params.healthId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }
    res.json({ success: true, data: child });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete child record
app.delete('/api/children/:healthId', async (req, res) => {
  try {
    const child = await Child.findOneAndDelete({ healthId: req.params.healthId });
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk upload for offline records with retry mechanism
app.post('/api/children/bulk', async (req, res) => {
  try {
    const children = req.body;
    const results = {
      success: [],
      failed: [],
      duplicates: []
    };

    // Process each child record individually to handle partial success
    for (const child of children) {
      try {
        // Check if record already exists
        const existingChild = await Child.findOne({ healthId: child.healthId });
        
        if (existingChild) {
          // If record exists, update it with new data
          const updatedChild = await Child.findOneAndUpdate(
            { healthId: child.healthId },
            child,
            { new: true, runValidators: true }
          );
          results.duplicates.push({
            healthId: child.healthId,
            action: 'updated',
            data: updatedChild
          });
        } else {
          // If record is new, create it
          const newChild = new Child(child);
          await newChild.save();
          results.success.push({
            healthId: child.healthId,
            action: 'created',
            data: newChild
          });
        }
      } catch (error) {
        results.failed.push({
          healthId: child.healthId,
          error: error.message
        });
      }
    }

    // Return detailed response about what happened with each record
    res.status(207).json({
      success: true,
      summary: {
        total: children.length,
        successful: results.success.length,
        updated: results.duplicates.length,
        failed: results.failed.length
      },
      details: results
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during bulk upload',
      details: error.message
    });
  }
});

// Health check endpoint to verify server and database connectivity
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    await mongoose.connection.db.admin().ping();
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      readyState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 5001;  // Changed to 5001

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Add error logging middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: err.message });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  const { address, port } = server.address();
  console.log(`Server running at http://${address}:${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please choose a different port.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});
