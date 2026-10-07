const express = require('express');
const jwt = require('jsonwebtoken');
const Case = require('../models/Case');
const Artifact = require('../models/Artifact');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const authenticate = require('../middleware/auth');
const { allow } = require('../middleware/rbac');
const { transitionArtifactStatus } = require('../services/stateMachine');

const router = express.Router();

// Optional authentication middleware for GET/POST public accessibility
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexdata_super_secret_jwt_key_2026_antiquities');
      const user = await User.findById(decoded.id);
      if (user && user.status === 'approved') {
        req.user = user;
      }
    }
  } catch (e) {
    // continue unauthenticated
  }
  next();
};

// Generate dynamic unique Case ID (DHA-000001, DHA-000002, etc.)
async function generateUniqueCaseId() {
  const cases = await Case.find({ caseId: /^DHA-\d+$/ }).select('caseId');
  let maxNum = 0;
  for (const c of cases) {
    if (c.caseId) {
      const parts = c.caseId.split('-');
      if (parts.length === 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  const nextNum = maxNum + 1;
  const formattedNum = String(nextNum).padStart(6, '0');
  return `DHA-${formattedNum}`;
}

/**
 * @route   GET /api/cases
 * @desc    Get all registered recovery cases (Global Registry source)
 */
router.get('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.caseType) {
      filter.caseType = req.query.caseType;
    }

    const cases = await Case.find(filter)
      .populate('artifactId')
      .populate('verifiedBy', 'name role organization')
      .sort({ createdAt: -1 });

    res.json(cases);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/cases
 * @desc    Register a new recovery case (Phase 20)
 */
router.post('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const {
      artifactName,
      caseType,
      description,
      reporterName,
      contactInformation,
      location,
      reportDate,
      templeName,
      monumentName,
      district,
      state,
      country,
      historicalPeriod,
      dynasty,
      approximateDate,
      material,
      originalLocation,
      currentSuspectedLocation,
      evidenceImage,
      aiMatchImage,
      aiSimilarity,
      aiModel,
      metadataSource,
      metadataConfidence,
      verificationStatus,
      note,
      status
    } = req.body;

    // Required fields validation
    const errors = [];
    if (!artifactName || !artifactName.trim()) errors.push('Artifact name is required.');
    if (!caseType || !caseType.trim()) errors.push('Case type is required.');
    if (!description || !description.trim()) errors.push('Description is required.');
    if (!reporterName || !reporterName.trim()) errors.push('Reporter/organization name is required.');
    if (!contactInformation || !contactInformation.trim()) errors.push('Contact information is required.');
    if (!location || !location.trim()) errors.push('Location where artifact was last known is required.');
    if (!reportDate) errors.push('Date reported is required.');

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(' ') });
    }

    const caseId = await generateUniqueCaseId();

    const newCase = await Case.create({
      caseId,
      artifactName: artifactName.trim(),
      caseType: caseType.trim(),
      description: description.trim(),
      reporterName: reporterName.trim(),
      contactInformation: contactInformation.trim(),
      location: location.trim(),
      reportDate: new Date(reportDate),
      templeName: templeName ? templeName.trim() : '',
      monumentName: monumentName ? monumentName.trim() : '',
      district: district ? district.trim() : '',
      state: state ? state.trim() : '',
      country: country ? country.trim() : '',
      historicalPeriod: historicalPeriod ? historicalPeriod.trim() : '',
      dynasty: dynasty ? dynasty.trim() : '',
      approximateDate: approximateDate ? approximateDate.trim() : '',
      material: material ? material.trim() : '',
      originalLocation: originalLocation ? originalLocation.trim() : '',
      currentSuspectedLocation: currentSuspectedLocation ? currentSuspectedLocation.trim() : '',
      evidenceImage: evidenceImage || '',
      aiMatchImage: aiMatchImage || '',
      aiSimilarity: aiSimilarity !== undefined && aiSimilarity !== null ? Number(aiSimilarity) : null,
      aiModel: aiModel || '',
      metadataSource: metadataSource || '',
      metadataConfidence: metadataConfidence || '',
      verificationStatus: verificationStatus || '',
      status: status || 'Registered',
      note: note || ''
    });

    if (req.user) {
      await AuditLog.create({
        userId: req.user._id,
        action: 'CASE_REGISTERED',
        targetId: newCase.caseId,
        at: new Date()
      });
    }

    return res.status(201).json({
      message: 'Recovery case registered successfully.',
      caseId: newCase.caseId,
      case: newCase
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/cases/:id
 * @desc    Get single case by caseId or mongo _id
 */
router.get('/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    let caseItem = await Case.findOne({ caseId: req.params.id })
      .populate('artifactId')
      .populate('verifiedBy', 'name role organization');

    if (!caseItem && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      caseItem = await Case.findById(req.params.id)
        .populate('artifactId')
        .populate('verifiedBy', 'name role organization');
    }

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }

    res.json(caseItem);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/cases/:id
 * @desc    Update a registered recovery case
 */
router.put('/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    let caseItem = await Case.findOne({ caseId: req.params.id });
    if (!caseItem && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      caseItem = await Case.findById(req.params.id);
    }

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }

    Object.assign(caseItem, req.body);
    await caseItem.save();

    res.json({ message: 'Case updated successfully', case: caseItem });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   DELETE /api/cases/:id
 * @desc    Delete a case (if authorized)
 */
router.delete('/:id', authenticate, allow('admin', 'authority'), async (req, res, next) => {
  try {
    let caseItem = await Case.findOne({ caseId: req.params.id });
    if (!caseItem && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      caseItem = await Case.findById(req.params.id);
    }

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }

    await Case.deleteOne({ _id: caseItem._id });
    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/cases/:id/verify
 * @desc    Verification by Expert (approve or reject)
 */
router.post('/:id/verify', authenticate, allow('expert', 'admin'), async (req, res, next) => {
  try {
    const { decision, note } = req.body;
    if (!decision || !['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: "Decision must be 'approve' or 'reject'" });
    }
    if (!note || note.trim() === '') {
      return res.status(400).json({ message: 'A verification note/justification is required.' });
    }

    let caseItem = await Case.findOne({ caseId: req.params.id });
    if (!caseItem && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      caseItem = await Case.findById(req.params.id);
    }

    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
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
    }

    await caseItem.save();

    await AuditLog.create({
      userId: req.user._id,
      action: `CASE_VERIFICATION_${decision.toUpperCase()}`,
      targetId: caseItem.caseId,
      at: new Date()
    });

    res.json({
      message: `Case ${decision === 'approve' ? 'verified successfully' : 'match rejected'}`,
      case: caseItem
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

