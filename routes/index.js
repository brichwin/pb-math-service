const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middleware/cache');

router.get('/', (req, res) => {
  res.json({
    service: 'pb-math-service',
    version: '2.0.0',
    endpoints: {
      latex: '/latex?latex=x^2&format=png',
      asciimath: '/asciimath?asciimath=x^2&format=svg',
      mathml: '/mathml?mathml=<math>...</math>&format=png',
      speechtext: '/speechtext?mathml=<math>...</math>&lang=en',
      health: '/health',
      stats: '/cache-stats',
    },
  });
});

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

router.get('/cache-stats', (req, res) => {
  res.json(cacheMiddleware.getStats());
});

router.post('/cache-clear', (req, res) => {
  const result = cacheMiddleware.clear();
  res.json(result);
});

module.exports = router;