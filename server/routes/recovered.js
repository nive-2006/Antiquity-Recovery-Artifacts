const express = require('express');
const RecoveredObject = require('../models/RecoveredObject');
const Case = require('../models/Case');
const Artifact = require('../models/Artifact');
const AuditLog = require('../models/AuditLog');
const authenticate = require('../middleware/auth');
const { allow } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const aiClient = require('../services/aiClient');
const { transitionArtifactStatus } = require('../services/stateMachine');

const router = express.Router();

router.use(authenticate);

// Report recovered object (Authority only)
router.post('/', allow('authority', 'admin'), upload.array('images', 5), async (req, res, next) => {
  try {
    const { location, foundDate } = req.body;
    if (!location) {
      return res.status(400).json({ message: 'Location is required' });
    }

    const images = (req.files || []).map(file => `/uploads/${file.filename}`);
    if (images.length === 0 && req.body.imageUrls) {
      const urls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls];
      images.push(...urls);
    }
    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80');
    }

    // Call AI client to get top 5 matches
    const topMatches = await aiClient.match(images);

    const recoveredObj = await RecoveredObject.create({
      reportedBy: req.user._id,
      images,
      location,
      foundDate: foundDate ? new Date(foundDate) : new Date(),
      matches: topMatches
    });

    let createdCase = null;
    // If top match exists, create a Case and transition artifact status to 'match_pending'
    if (topMatches.length > 0 && topMatches[0].artifactId) {
      const topMatchArtifact = await Artifact.findById(topMatches[0].artifactId);
      if (topMatchArtifact) {
        // Transition artifact to match_pending if valid
        if (['stolen', 'registered', 'recovered'].includes(topMatchArtifact.status)) {
          await transitionArtifactStatus(
            topMatchArtifact, 
            'match_pending', 
            req.user, 
            `AI Image Match identified recovered artifact in ${location} with score ${topMatches[0].score}%`
          );
        }

        const caseId = 'CASE-' + Math.floor(100000 + Math.random() * 900000);
        createdCase = await Case.create({
          caseId,
          artifactId: topMatchArtifact._id,
          recoveredObjectId: recoveredObj._id,
          status: 'match_pending',
          timeline: [{
            status: 'match_pending',
            updatedBy: req.user._id,
            timestamp: new Date(),
            note: `Recovery reported at ${location}. AI matched with artifact ${topMatchArtifact.artifactId} (${topMatches[0].score}% similarity).`
          }]
        });
      }
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'RECOVERED_OBJECT_REPORTED',
      targetId: recoveredObj._id.toString(),
      at: new Date()
    });

    const populatedObj = await RecoveredObject.findById(recoveredObj._id)
      .populate('reportedBy', 'name organization email')
      .populate('matches.artifactId');

    res.status(201).json({
      recoveredObject: populatedObj,
      case: createdCase
    });
  } catch (err) {
    next(err);
  }
});

// Get recovered object details and top-5 matches
router.get('/:id/matches', async (req, res, next) => {
  try {
    const recoveredObj = await RecoveredObject.findById(req.params.id)
      .populate('reportedBy', 'name organization email')
      .populate({
        path: 'matches.artifactId',
        populate: { path: 'ownerId', select: 'name organization email' }
      });

    if (!recoveredObj) {
      return res.status(404).json({ message: 'Recovered object record not found' });
    }

    res.json(recoveredObj);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
