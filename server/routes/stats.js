const express = require('express');
const Artifact = require('../models/Artifact');
const Case = require('../models/Case');
const RecoveredObject = require('../models/RecoveredObject');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/overview', authenticate, async (req, res, next) => {
  try {
    const isCustodian = req.user.role === 'custodian';
    const artifactFilter = isCustodian ? { ownerId: req.user._id } : {};

    const totalArtifacts = await Artifact.countDocuments(artifactFilter);
    const registeredCount = await Artifact.countDocuments({ ...artifactFilter, status: 'registered' });
    const stolenCount = await Artifact.countDocuments({ ...artifactFilter, status: 'stolen' });
    const matchPendingCount = await Artifact.countDocuments({ ...artifactFilter, status: 'match_pending' });
    const verifiedCount = await Artifact.countDocuments({ ...artifactFilter, status: 'verified' });
    const repatriatingCount = await Artifact.countDocuments({ ...artifactFilter, status: 'repatriating' });
    const returnedCount = await Artifact.countDocuments({ ...artifactFilter, status: 'returned' });

    const totalRecoveredObjects = await RecoveredObject.countDocuments({});
    const totalCases = await Case.countDocuments({});
    const pendingCases = await Case.countDocuments({ status: 'match_pending' });
    const verifiedCases = await Case.countDocuments({ status: 'verified' });

    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const totalUsers = await User.countDocuments({});

    // Grouping by material and era for charts
    const materialAggregation = await Artifact.aggregate([
      { $match: artifactFilter },
      { $group: { _id: '$material', count: { $sum: 1 } } }
    ]);

    const statusAggregation = [
      { name: 'Registered', value: registeredCount, color: '#3b82f6' },
      { name: 'Stolen', value: stolenCount, color: '#ef4444' },
      { name: 'Match Pending', value: matchPendingCount, color: '#f59e0b' },
      { name: 'Verified', value: verifiedCount, color: '#10b981' },
      { name: 'Repatriating', value: repatriatingCount, color: '#8b5cf6' },
      { name: 'Returned', value: returnedCount, color: '#06b6d4' }
    ];

    res.json({
      counts: {
        totalArtifacts,
        registeredCount,
        stolenCount,
        matchPendingCount,
        verifiedCount,
        repatriatingCount,
        returnedCount,
        totalRecoveredObjects,
        totalCases,
        pendingCases,
        verifiedCases,
        pendingUsers,
        totalUsers
      },
      statusDistribution: statusAggregation,
      materialDistribution: materialAggregation.map(m => ({ name: m._id || 'Unknown', count: m.count }))
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
