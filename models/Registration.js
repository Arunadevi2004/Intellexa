const mongoose = require('mongoose');

const PaperSubmissionSchema = new mongoose.Schema({
  teamName: String,
  memberCount: Number,
  memberNames: [String],
  abstractTitle: String,
  abstractText: String,
  wordCount: Number
}, { _id: false });

const RegistrationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  yearOfStudy: { type: String, required: true },
  degree: { type: String, required: true },
  department: { type: String, required: true },
  collegeName: { type: String, required: true },
  collegeLocation: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  referralCode: String,
  transactionId: { type: String, required: true, unique: true },
  screenshotPath: { type: String, required: true },
  events: [String],
  isPaper: { type: Boolean, default: false },
  paperSubmission: PaperSubmissionSchema,
  status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  ipAddress: String,
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Registration', RegistrationSchema);
