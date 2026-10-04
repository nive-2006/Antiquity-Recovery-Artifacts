const axios = require('axios');

const match = async (images) => {
  const aiUrl = process.env.AI_URL || process.env.PYTHON_AI_BASE_URL || 'http://localhost:8000';

  if (!aiUrl || aiUrl.trim() === '') {
    throw new Error('Heritage AI service URL (AI_URL) is not configured.');
  }

  try {
    const response = await axios.post(`${aiUrl}/api/heritage/search`, { images });
    return response.data.results || response.data.matches || [];
  } catch (err) {
    console.error('Heritage AI match call failed:', err.message);
    throw new Error('Heritage AI search failed. Please try again.');
  }
};

module.exports = {
  match
};

