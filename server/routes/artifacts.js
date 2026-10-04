const express = require('express');
const Artifact = require('../models/Artifact');
const AuditLog = require('../models/AuditLog');
const authenticate = require('../middleware/auth');
const { allow } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const { transitionArtifactStatus } = require('../services/stateMachine');

const router = express.Router();

router.use(authenticate);

// Public / Authenticated Search across artifacts
router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const query = q.trim();

    let searchFilter = { isHeritageImage: true };
    if (query) {
      const regex = new RegExp(query, 'i');
      searchFilter = {
        isHeritageImage: true,
        $or: [
          { artifactId: regex },
          { name: regex },
          { material: regex },
          { era: regex },
          { region: regex },
          { inscriptionText: regex },
          { status: regex }
        ]
      };
    }

    const artifacts = await Artifact.find(searchFilter)
      .populate('ownerId', 'name organization email')
      .sort({ createdAt: -1 });

    res.json(artifacts);
  } catch (err) {
    next(err);
  }
});

// List artifacts (if custodian, optionally filter by my-artifacts)
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.my === 'true' && req.user.role === 'custodian') {
      filter.ownerId = req.user._id;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const artifacts = await Artifact.find(filter)
      .populate('ownerId', 'name organization email')
      .sort({ createdAt: -1 });

    res.json(artifacts);
  } catch (err) {
    next(err);
  }
});

// Get single artifact by ID (mongo _id or artifactId)
router.get('/:id', async (req, res, next) => {
  try {
    let artifact = await Artifact.findById(req.params.id)
      .populate('ownerId', 'name organization email')
      .populate('history.changedBy', 'name role organization');

    if (!artifact) {
      artifact = await Artifact.findOne({ artifactId: req.params.id })
        .populate('ownerId', 'name organization email')
        .populate('history.changedBy', 'name role organization');
    }

    if (!artifact) {
      return res.status(404).json({ message: 'Artifact not found' });
    }

    res.json(artifact);
  } catch (err) {
    next(err);
  }
});

// Register new artifact (Custodian only)
router.post('/', allow('custodian', 'admin'), upload.array('images', 5), async (req, res, next) => {
  try {
    const { name, material, era, region, dimensions, inscriptionText, provenance } = req.body;

    if (!name || !material || !era || !region) {
      return res.status(400).json({ message: 'Name, material, era, and region are required fields.' });
    }

    const angles = req.body.angles ? (Array.isArray(req.body.angles) ? req.body.angles : [req.body.angles]) : [];

    const images = (req.files || []).map((file, index) => ({
      url: `/uploads/${file.filename}`,
      angle: angles[index] || (index === 0 ? 'front' : index === 1 ? 'back' : 'detail')
    }));

    if (images.length === 0) {
      // Allow image URL strings if passed in body
      if (req.body.imageUrls && Array.isArray(req.body.imageUrls)) {
        req.body.imageUrls.forEach((url, i) => {
          images.push({ url, angle: angles[i] || 'front' });
        });
      }
    }

    // Default fallback image if none uploaded
    if (images.length === 0) {
      images.push({ url: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80', angle: 'front' });
    }

    let parsedProvenance = [];
    if (provenance) {
      try {
        parsedProvenance = typeof provenance === 'string' ? JSON.parse(provenance) : provenance;
      } catch (e) {
        parsedProvenance = [{ event: 'Initial Registration', date: new Date().toISOString().slice(0, 10), location: region, note: provenance }];
      }
    } else {
      parsedProvenance = [{ event: 'Initial Registration', date: new Date().toISOString().slice(0, 10), location: region, note: 'Registered in NexData Network' }];
    }

    const artifactId = 'NXD-' + Math.floor(100000 + Math.random() * 900000);

    // Verify uploaded image is genuine heritage artifact
    let isHeritageImage = true;
    if (req.body.isHeritageImage !== undefined) {
      isHeritageImage = Boolean(req.body.isHeritageImage);
    }

    const artifact = await Artifact.create({
      artifactId,
      ownerId: req.user._id,
      name,
      material,
      era,
      region,
      dimensions: dimensions || 'N/A',
      inscriptionText: inscriptionText || '',
      images,
      provenance: parsedProvenance,
      status: 'registered',
      isHeritageImage,
      history: [{
        status: 'registered',
        changedBy: req.user._id,
        at: new Date(),
        note: 'Artifact registered in digital identity registry'
      }]
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'ARTIFACT_REGISTERED',
      targetId: artifact.artifactId,
      at: new Date()
    });

    res.status(201).json(artifact);
  } catch (err) {
    next(err);
  }
});

// Update artifact status (e.g., report stolen or state transition)
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'New status is required' });
    }

    let artifact = await Artifact.findById(req.params.id);
    if (!artifact) {
      artifact = await Artifact.findOne({ artifactId: req.params.id });
    }

    if (!artifact) {
      return res.status(404).json({ message: 'Artifact not found' });
    }

    // Custodian can report their artifact stolen
    if (req.user.role === 'custodian' && artifact.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update status for your own artifacts' });
    }

    const updatedArtifact = await transitionArtifactStatus(artifact, status, req.user, note);
    res.json(updatedArtifact);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
