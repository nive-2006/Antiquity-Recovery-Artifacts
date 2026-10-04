const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect Database
connectDB();

// API Routes
app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/artifacts/detect', require('./routes/artifactDetection'));
app.use('/artifacts', require('./routes/artifacts'));
app.use('/recovered', require('./routes/recovered'));
app.use('/cases', require('./routes/cases'));
app.use('/stats', require('./routes/stats'));
app.use('/api/heritage', require('./routes/heritage'));


// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'NexData Backend Engine' });
});

// Centralized Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`NexData Server running on port ${PORT}`);
});
