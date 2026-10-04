const express = require('express');
const Case = require('../models/Case');
const Artifact = require('../models/Artifact');
const AuditLog = require('../models/AuditLog');
const authenticate = require('../middleware/auth');
const { allow } = require('../middleware/rbac');
const { transitionArtifactStatus } = require('../services/stateMachine');

const router = express.Router();

router.use(authenticate);

// List cases (filtered by status)
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const cases = await Case.find(filter)
      .populate({
        path: 'artifactId',
        populate: { path: 'ownerId', select: 'name organization email' }
      })
      .populate('recoveredObjectId')
      .populate('verifiedBy', 'name role organization')
      .populate('timeline.updatedBy', 'name role organization')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (err) {
    next(err);
  }
});

// Get case by ID (mongo _id or caseId)
router.get('/:id', async (req, res, next) => {
  try {
    let caseItem = await Case.findById(req.params.id)
      .populate({
        path: 'artifactId',
        populate: { path: 'ownerId', select: 'name organization email' }
      })
      .populate('recoveredObjectId')
      .populate('verifiedBy', 'name role organization')
      .populate('timeline.updatedBy', 'name role organization');

    if (!caseItem) {
      caseItem = await Case.findOne({ caseId: req.params.id })
        .populate({
          path: 'artifactId',
          populate: { path: 'ownerId', select: 'name organization email' }
        })
        .populate('recoveredObjectId')
        .populate('verifiedBy', 'name role organization')
        .populate('timeline.updatedBy', 'name role organization');
    }

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json(caseItem);
  } catch (err) {
    next(err);
  }
});

// Verification by Expert (approve or reject)
router.post('/:id/verify', allow('expert', 'admin'), async (req, res, next) => {
  try {
    const { decision, note } = req.body;
    if (!decision || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: "Decision must be 'approve' or 'reject'" });
    }
    if (!note || note.trim() === '') {
      return res.status(400).json({ message: 'A verification note/justification is required.' });
    }

    let caseItem = await Case.findById(req.params.id);
    if (!caseItem) {
      caseItem = await Case.findOne({ caseId: req.params.id });
    }

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const artifact = await Artifact.findById(caseItem.artifactId);
    if (!artifact) {
      return res.status(404).json({ message: 'Associated artifact not found' });
    }

    if (decision === 'approve') {
      caseItem.status = 'verified';
      caseItem.verifiedBy = req.user._id;
      caseItem.note = note;
      caseItem.timeline.push({
        status: 'verified',
        updatedBy: req.user._id,
        timestamp: new Date(),
        note: `Match verified by Expert (${req.user.name}, ${req.user.organization}): ${note}`
      });

      // State machine transition on Artifact
      await transitionArtifactStatus(artifact, 'verified', req.user, `Verified match: ${note}`);
    } else {
      caseItem.status = 'rejected';
      caseItem.verifiedBy = req.user._id;
      caseItem.note = note;
      caseItem.timeline.push({
        status: 'rejected',
        updatedBy: req.user._id,
        timestamp: new Date(),
        note: `Match rejected by Expert (${req.user.name}): ${note}`
      });

      // Revert artifact back to stolen if rejected
      await transitionArtifactStatus(artifact, 'stolen', req.user, `Match verification rejected: ${note}`);
    }

    await caseItem.save();

    await AuditLog.create({
      userId: req.user._id,
      action: `CASE_VERIFICATION_${decision.toUpperCase()}`,
      targetId: caseItem.caseId,
      at: new Date()
    });

    const updatedCase = await Case.findById(caseItem._id)
      .populate({
        path: 'artifactId',
        populate: { path: 'ownerId', select: 'name organization email' }
      })
      .populate('recoveredObjectId')
      .populate('verifiedBy', 'name role organization')
      .populate('timeline.updatedBy', 'name role organization');

    res.json({
      message: `Case ${decision === 'approve' ? 'verified successfully' : 'match rejected'}`,
      case: updatedCase
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
