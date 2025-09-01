const express = require('express');
const Note = require('../models/Note');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directory exists
if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/', { recursive: true });
}

// Configure multer for multer 2.x
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5 // Maximum 5 files
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to clean up uploaded files
const cleanupFiles = (files) => {
  if (files && files.length > 0) {
    files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  }
};

// ✅ Optimized Cloudinary upload function
const uploadToCloudinary = async (file) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'notesy-screenshots',
    resource_type: 'image',
    // ✅ Performance optimizations
    quality: 'auto:good',      // Auto quality optimization
    fetch_format: 'auto',      // Auto format optimization
    width: 1200,               // Max width
    height: 1200,              // Max height
    crop: 'limit',             // Don't upscale, only downscale
    flags: 'progressive',      // Progressive JPEG
    // Transformation for web optimization
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  });
  
  console.log(`📎 Uploaded: ${result.secure_url} (${Math.round(result.bytes / 1024)}KB)`);
  return result.secure_url;
};

// Get all notes for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { search, category, tags } = req.query;
    let query = { userId: req.user._id };

    if (search) {
      query.$text = { $search: search };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (tags) {
      query.tags = { $in: tags.split(',').map(tag => tag.trim()) };
    }

    const notes = await Note.find(query).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new note
router.post('/', auth, (req, res) => {
  upload.array('screenshots', 5)(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 10MB per file.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ message: 'Too many files. Maximum is 5 files.' });
        }
      }
      return res.status(400).json({ message: err.message });
    }

    try {
      const { title, content, tags, category } = req.body;
      
      if (!title || !content) {
        cleanupFiles(req.files);
        return res.status(400).json({ message: 'Title and content are required' });
      }
      
      let screenshotUrls = [];
      
      // ✅ Upload screenshots to Cloudinary in parallel
      if (req.files && req.files.length > 0) {
        console.log(`📎 Uploading ${req.files.length} files in parallel...`);
        const startTime = Date.now();
        
        try {
          // ✅ Use Promise.all for parallel uploads
          const uploadPromises = req.files.map(file => uploadToCloudinary(file));
          screenshotUrls = await Promise.all(uploadPromises);
          
          const uploadTime = Date.now() - startTime;
          console.log(`✅ All uploads completed in ${uploadTime}ms`);
        } catch (cloudinaryError) {
          cleanupFiles(req.files);
          return res.status(500).json({ message: 'Error uploading images', error: cloudinaryError.message });
        }
        
        cleanupFiles(req.files);
      }

      const note = new Note({
        title,
        content,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        category: category || 'General',
        screenshots: screenshotUrls,
        userId: req.user._id
      });

      await note.save();
      res.status(201).json(note);
    } catch (error) {
      cleanupFiles(req.files);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
});

// ✅ Updated note route with parallel uploads and optimization
router.put('/:id', auth, (req, res) => {
  upload.array('screenshots', 5)(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 10MB per file.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ message: 'Too many files. Maximum is 5 files.' });
        }
      }
      return res.status(400).json({ message: err.message });
    }

    try {
      const { title, content, tags, category, keepExistingImages } = req.body;
      
      if (!title || !content) {
        cleanupFiles(req.files);
        return res.status(400).json({ message: 'Title and content are required' });
      }
      
      let updateData = {
        title,
        content,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [],
        category: category || 'General'
      };

      let finalScreenshots = [];
      
      // Parse existing images that should be kept
      if (keepExistingImages) {
        try {
          const existingImages = JSON.parse(keepExistingImages);
          if (Array.isArray(existingImages)) {
            finalScreenshots = [...existingImages];
            console.log(`📎 Keeping ${existingImages.length} existing images`);
          }
        } catch (e) {
          console.error('Error parsing existing images:', e);
        }
      }

      // ✅ Upload new screenshots in parallel with optimization
      if (req.files && req.files.length > 0) {
        console.log(`📎 Uploading ${req.files.length} new files in parallel...`);
        const startTime = Date.now();
        
        try {
          // ✅ Parallel upload with optimization
          const uploadPromises = req.files.map(file => uploadToCloudinary(file));
          const newUrls = await Promise.all(uploadPromises);
          
          finalScreenshots.push(...newUrls);
          
          const uploadTime = Date.now() - startTime;
          console.log(`✅ New uploads completed in ${uploadTime}ms`);
        } catch (cloudinaryError) {
          cleanupFiles(req.files);
          return res.status(500).json({ message: 'Error uploading images', error: cloudinaryError.message });
        }
        
        cleanupFiles(req.files);
      }

      updateData.screenshots = finalScreenshots;
      console.log(`📎 Final image count: ${finalScreenshots.length} images`);

      const note = await Note.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        updateData,
        { new: true }
      );

      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }

      res.json(note);
    } catch (error) {
      cleanupFiles(req.files);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
});

// Delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // ✅ Delete images from Cloudinary in parallel
    if (note.screenshots && note.screenshots.length > 0) {
      console.log(`🗑️ Deleting ${note.screenshots.length} images from Cloudinary...`);
      
      try {
        const deletePromises = note.screenshots.map(async (imageUrl) => {
          const urlParts = imageUrl.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = publicIdWithExtension.split('.')[0];
          
          return cloudinary.uploader.destroy(`notesy-screenshots/${publicId}`);
        });
        
        await Promise.all(deletePromises);
        console.log(`✅ All images deleted from Cloudinary`);
      } catch (cloudinaryError) {
        console.error('Error deleting images from Cloudinary:', cloudinaryError);
      }
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single note by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
