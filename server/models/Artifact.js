const mongoose = require('mongoose');

const artifactSchema = new mongoose.Schema({
  artifactId: { type: String, required: true, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  material: { type: String, required: true },
  era: { type: String, required: true },
  region: { type: String, required: true },
  dimensions: { type: String },
  inscriptionText: { type: String, default: '' },
  images: [{
    url: { type: String, required: true },
    angle: { type: String, default: 'front' }
  }],
  provenance: [{
    event: { type: String, required: true },
    date: { type: String },
    location: { type: String },
    note: { type: String }
  }],
  status: {
    type: String,
    enum: ['registered', 'stolen', 'recovered', 'match_pending', 'verified', 'repatriating', 'returned'],
    default: 'registered'
  },
  isHeritageImage: {
    type: Boolean,
    default: false
  },
  history: [{
    status: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    note: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Artifact', artifactSchema);
