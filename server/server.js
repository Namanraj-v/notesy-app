const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');



// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',           // Local development
    'http://localhost:3000',           // Alternative local
    'https://notesy-ap.netlify.app'    // ✅ Your Netlify domain
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);


// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Notesy API is running!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notesy')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

