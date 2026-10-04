const mongoose = require('mongoose');

const recoveredObjectSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  images: [{ type: String, required: true }],
  location: { type: String, required: true },
  foundDate: { type: Date, default: Date.now },
  matches: [{
    artifactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artifact' },
    score: { type: Number, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('RecoveredObject', recoveredObjectSchema);
