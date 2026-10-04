const AuditLog = require('../models/AuditLog');

const ALLOWED_TRANSITIONS = {
  registered: ['stolen'],
  stolen: ['recovered', 'match_pending'],
  recovered: ['match_pending'],
  match_pending: ['verified', 'stolen', 'recovered'],
  verified: ['repatriating'],
  repatriating: ['returned'],
  returned: []
};

const transitionArtifactStatus = async (artifact, newStatus, user, note = '') => {
  const currentStatus = artifact.status;
  
  if (currentStatus === newStatus) {
    return artifact;
  }

  const validNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!validNextStates.includes(newStatus)) {
    const err = new Error(`Illegal status transition from '${currentStatus}' to '${newStatus}'. Allowed: [${validNextStates.join(', ')}]`);
    err.statusCode = 400;
    throw err;
  }

  artifact.status = newStatus;
  artifact.history.push({
    status: newStatus,
    changedBy: user ? user._id : null,
    at: new Date(),
    note: note || `Status changed from ${currentStatus} to ${newStatus}`
  });

  await artifact.save();

  if (user) {
    await AuditLog.create({
      userId: user._id,
      action: `ARTIFACT_STATUS_CHANGE_${newStatus.toUpperCase()}`,
      targetId: artifact.artifactId,
      at: new Date()
    });
  }

  return artifact;
};

module.exports = {
  ALLOWED_TRANSITIONS,
  transitionArtifactStatus
};
