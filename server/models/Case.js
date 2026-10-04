const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  artifactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact', required: true },
  recoveredObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecoveredObject', required: true },
  status: {
    type: String,
    enum: ['match_pending', 'verified', 'rejected', 'repatriating', 'returned'],
    default: 'match_pending'
  },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String, default: '' },
  timeline: [{
    status: { type: String, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema);
