const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true, unique: true },
  fullName: String,
  email: String,
  phone: String,
  collegeName: String,
  department: String,
  yearOfStudy: String,
  events: [String],
  isPaper: Boolean,
  teamName: String,
  memberNames: [String],
  abstractTitle: String,
  confirmedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Participant', ParticipantSchema);
