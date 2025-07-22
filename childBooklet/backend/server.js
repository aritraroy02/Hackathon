const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Child = require('./models/Child');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb://127.0.0.1:27017/childHealth', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      heartbeatFrequencyMS: 1000, // Check server every second
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for better query performance
    await Child.collection.createIndex({ healthId: 1 }, { unique: true });
    console.log('Database indexes created');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Routes


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
