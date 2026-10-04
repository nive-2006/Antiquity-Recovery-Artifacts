const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

// Store uploaded files in memory buffer for proxying to Python AI microservice
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const PYTHON_AI_BASE_URL = process.env.PYTHON_AI_BASE_URL || 'http://localhost:8000';
const LOCAL_IMAGES_DIR = path.join(__dirname, '../../ai_microservice/images');

/**
 * @route   POST /api/heritage/search
 * @desc    Search trained Digital Heritage AI model (DINOv2 + best_projection_head.pt + 256-D FAISS)
 */
router.post('/search', upload.single('image'), async (req, res, next) => {
  try {
    const filePayload = req.file;
    if (!filePayload) {
      return res.status(400).json({ message: 'No image file uploaded. Please select an image.' });
    }

    const top_k = req.query.top_k || 10;

    const formData = new FormData();
    formData.append('file', filePayload.buffer, {
      filename: filePayload.originalname || 'artifact.jpg',
      contentType: filePayload.mimetype || 'image/jpeg',
    });

    try {
      const pythonResponse = await axios.post(`${PYTHON_AI_BASE_URL}/api/heritage/search`, formData, {
        headers: formData.getHeaders(),
        params: { top_k },
        timeout: 45000
      });

      return res.json(pythonResponse.data);
    } catch (aiErr) {
      console.error(`[Express Server] Python AI service search error: ${aiErr.message}`);
      return res.status(500).json({
        message: "Heritage AI search failed. Please try again."
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/heritage/images/:filename
 * @desc    Serve real local database image from ai_microservice/images/
 */
router.get('/images/:filename', (req, res) => {
  try {
    const decodedName = decodeURIComponent(req.params.filename);
    const safeName = path.basename(decodedName);
    const filePath = path.join(LOCAL_IMAGES_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("No registered artifact image available");
    }

    return res.sendFile(filePath);
  } catch (err) {
    return res.status(404).send("No registered artifact image available");
  }
});

module.exports = router;
