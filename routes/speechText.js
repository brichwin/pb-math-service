const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middleware/cache');

router.use(cacheMiddleware);

router.get('/', async (req, res, next) => {
  try {    
    const speechText = "test";    
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(speechText);
    
  } catch (error) {
    next(error);
  }
});

// Helper endpoint to get valid options
router.get('/options', (req, res) => {
  res.json(getValidOptions());
});

function getDefaultStyle(engine) {
  return engine.toLowerCase() === 'mathcat' ? 'ClearSpeak' : 'ClearSpeak';
}

function getDefaultVerbosity(engine, style) {
  if (engine.toLowerCase() === 'mathcat') {
    return 'Verbose';
  } else {
    return style === 'MathSpeak' ? 'Verbose' : 'Auto';
  }
}

function getValidOptions() {
  return {
    engines: ['mathcat', 'mathjax'],
    mathcat: {
      styles: {
        ClearSpeak: ['Verbose'],
        SimpleSpeak: ['Verbose', 'Medium', 'Terse'],
      },
      defaults: {
        style: 'ClearSpeak',
        verbosity: 'Verbose',
      },
    },
    mathjax: {
      styles: {
        ClearSpeak: ['Auto', 'Explicit'],
        MathSpeak: ['Verbose', 'Brief', 'Superbrief'],
      },
      defaults: {
        style: 'ClearSpeak',
        verbosity: 'Auto',
      },
    },
  };
}

module.exports = router;