require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Registration = require('./models/Registration');
const Participant = require('./models/Participant');

const app = express();
const PORT = process.env.PORT || 5000;

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname))); // Serve root folder (index.html, script.js, etc.)

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Root route - serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    const fileName = `txn_${Date.now()}_${Math.round(Math.random() * 1E9)}${safeExt}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB Limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimeType && extName) {
      return cb(null, true);
    }
    cb(new Error('Only JPG, PNG, and WEBP images are allowed.'));
  }
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.post('/api/register', upload.single('screenshot'), async (req, res) => {
  try {
    const {
      full_name, year_of_study, degree, department,
      college_name, college_location, email, phone,
      referral_code, transaction_id, events, is_paper,
      team_name, member_count, member_names, abstract
    } = req.body;

    const parsedEvents = JSON.parse(events || '[]');
    const isPaper = is_paper === '1';

    const registrationData = {
      fullName: full_name,
      yearOfStudy: year_of_study,
      degree,
      department,
      collegeName: college_name,
      collegeLocation: college_location,
      email,
      phone,
      referralCode: referral_code || null,
      transactionId: transaction_id,
      events: parsedEvents,
      isPaper,
      ipAddress: req.ip,
      screenshotPath: req.file ? `uploads/${req.file.filename}` : null // Initial local fallback
    };

    // --- Cloudinary Upload ---
    if (req.file) {
      try {
        // Sanitize name for filename (fallback to 'participant' if missing)
        const namePart = full_name ? full_name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'participant';
        const timestamp = Date.now();
        
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'intellexa_registrations',
          public_id: `${namePart}_${timestamp}`,
          resource_type: 'auto'
        });
        
        // Use Cloudinary secure URL if upload is successful
        registrationData.screenshotPath = result.secure_url;
        
        // Delete local temporary file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadError) {
        console.error('CLOUDINARY UPLOAD ERROR:', uploadError);
        // Fallback: On Render, this local file will be lost eventually, 
        // but we keep the local path for now to satisfy the DB 'required' constraint.
      }
    }

    if (isPaper) {
      const parsedMemberNames = JSON.parse(member_names || '[]');
      registrationData.paperSubmission = {
        teamName: team_name,
        memberCount: parseInt(member_count),
        memberNames: parsedMemberNames,
        abstractText: abstract,
        wordCount: abstract.trim().split(/\s+/).length
      };
    }

    const registration = new Registration(registrationData);
    await registration.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        registration_id: registration._id,
        name: registration.fullName,
        email: registration.email
      }
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {} // Safe delete
    }
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email or transaction ID is already registered.'
      });
    }

    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
      error: error.message
    });
  }
});

// --- Admin Routes ---

// Admin Login (Simple implementation)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === (process.env.ADMIN_USER || 'admin') && 
      password === (process.env.ADMIN_PASS || 'Intellexa@2026')) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get Statistics
app.get('/api/admin/stats', async (req, res) => {
  try {
    const total = await Registration.countDocuments();
    const confirmed = await Registration.countDocuments({ status: 'confirmed' });
    const pending = await Registration.countDocuments({ status: 'pending' });
    const rejected = await Registration.countDocuments({ status: 'rejected' });
    res.json({ success: true, stats: { total, confirmed, pending, rejected } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// List Registrations
app.get('/api/admin/registrations', async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { collegeName: new RegExp(search, 'i') }
      ];
    }
    const registrations = await Registration.find(query).sort({ registeredAt: -1 });
    res.json({ success: true, registrations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Status
app.patch('/api/admin/registrations/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    // Logic for Participants Collection Sync
    if (status === 'confirmed') {
      try {
        const participantData = {
          registrationId: registration._id,
          fullName: registration.fullName,
          email: registration.email,
          phone: registration.phone,
          collegeName: registration.collegeName,
          department: registration.department,
          yearOfStudy: registration.yearOfStudy,
          events: registration.events,
          isPaper: registration.isPaper,
          teamName: (registration.isPaper && registration.paperSubmission) ? registration.paperSubmission.teamName : null,
          memberNames: (registration.isPaper && registration.paperSubmission) ? registration.paperSubmission.memberNames : [],
          confirmedAt: new Date()
        };

        await Participant.findOneAndUpdate(
          { registrationId: registration._id },
          participantData,
          { upsert: true, new: true }
        );
      } catch (syncErr) {
        console.error('Participant Sync ERROR:', syncErr);
      }
    } else {
      await Participant.findOneAndDelete({ registrationId: registration._id });
    }

    res.json({ success: true, registration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
