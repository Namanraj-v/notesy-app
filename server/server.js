// server.js - Updated with DNS fix for MongoDB Atlas connection

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Use Google Public DNS to fix SRV lookup

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',           // Local development
    'http://localhost:3000',           // Alternative local
    'https://notesy-ap.netlify.app'    // Your Netlify domain
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with better error handling
console.log('🔗 Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB');
  console.log('📊 Database ready for operations');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('🔍 Check your MONGODB_URI environment variable');
});

// Route imports
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Notesy API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err.message);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('🎉 ================================================');
  console.log(`🚀 Notesy Server running on port ${PORT}`);
  console.log(`🌍 API URL: http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/`);
  console.log('🎉 ================================================');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});
