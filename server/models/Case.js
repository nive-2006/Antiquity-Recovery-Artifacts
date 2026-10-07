const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true }, // Format: DHA-000001
  artifactName: { type: String, required: true },
  caseType: {
    type: String,
    required: true,
    enum: ['Missing', 'Stolen', 'Illicitly removed', 'Recovered', 'Suspected trafficking', 'Repatriation', 'match_pending', 'verified', 'rejected']
  },
  description: { type: String, required: true },

  templeName: { type: String, default: '' },
  monumentName: { type: String, default: '' },

  location: { type: String, required: true },
  district: { type: String, default: '' },
  state: { type: String, default: '' },
  country: { type: String, default: '' },

  historicalPeriod: { type: String, default: '' },
  dynasty: { type: String, default: '' },
  approximateDate: { type: String, default: '' },
  material: { type: String, default: '' },

  originalLocation: { type: String, default: '' },
  currentSuspectedLocation: { type: String, default: '' },

  reporterName: { type: String, required: true },
  contactInformation: { type: String, required: true },

  reportDate: { type: Date, default: Date.now },

  evidenceImage: { type: String, default: '' },
  aiMatchImage: { type: String, default: '' },

  aiSimilarity: { type: Number, default: null },
  aiModel: { type: String, default: '' },

  metadataSource: { type: String, default: '' },
  metadataConfidence: { type: String, default: '' },
  verificationStatus: { type: String, default: '' },

  status: { type: String, default: 'Registered' },

  // Optional fields for legacy compatibility
  artifactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact', required: false },
  recoveredObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecoveredObject', required: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String, default: '' },
  timeline: [{
    status: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    note: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema, 'recovery_cases');

