const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true, unique: true },
  registrationIdReadable: String,
  fullName: String,
  email: String,
  phone: String,
  collegeName: String,
  department: String,
  yearOfStudy: String,
  events: [String],
  isPaper: Boolean,
  isIpl: Boolean,
  teamName: String,

  memberNames: [String],
  paperTitle: String,
  confirmedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Participant', ParticipantSchema);
