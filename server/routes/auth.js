const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// ✅ Robust Register Route with Error Handling
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Register attempt:', req.body); // Debug log
    
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      console.log('❌ Missing fields');
      return res.status(400).json({ 
        message: 'Username, email, and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      console.log('❌ User already exists');
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();
    console.log('✅ User registered successfully');

    res.status(201).json({ 
      message: 'User registered successfully',
      user: { username, email } 
    });

  } catch (error) {
    console.error('💥 Register error:', error);
    res.status(500).json({ 
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ Login Route 
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', { email: req.body.email });
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful');
    res.json({
      message: 'Login successful',
      token,
      user: { 
        _id: user._id, 
        username: user.username, 
        email: user.email 
      }
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ 
      message: 'Internal server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
