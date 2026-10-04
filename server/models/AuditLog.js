const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  targetId: { type: String, required: true },
  at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
