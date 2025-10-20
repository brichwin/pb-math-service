const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middleware/cache');
const { processFormula } = require('../utils');
const { withTimeout, mathJaxLock } = require('../utils/locks');
const { speechTextFromTeX, speechTextFromMathML, speechTextFromAM, getSpeechOptionsFromQuery, validateSpeechOptions } = require('../services/speechGenerators');
const { sendError } = require('../utils/sendErrorHandler');

router.use(cacheMiddleware);

const sendSpeechText = (text="", res) => {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(text);
}

router.get('/', async (req, res, next) => {
  try {    
    const { asciimath, latex, mathml } = req.query;

    const options = getSpeechOptionsFromQuery(req.query);
    const validation = validateSpeechOptions(options.engine, options.style, options.verbosity);

    if(!validation.valid) {
      sendError(req, res, 400, 'Invalid speech options', validation.error);
    } else if(latex) {
      const formula = processFormula(req, res, latex);
      if (!formula) return;
      console.log('Received Formula:', formula);
      const speechText = await speechTextFromTeX(formula, req.query);
      sendSpeechText(speechText, res);

    } else if(mathml) {
      const formula = processFormula(req, res, mathml);
      if (!formula) return;
      console.log('Received Formula:', formula);
      const speechText = await speechTextFromMathML(formula, req.query);
      sendSpeechText(speechText, res);

    } else if(asciimath) {
      const formula = processFormula(req, res, asciimath);
      if (!formula) return;
      console.log('Received Formula:', formula);
      const speechText = await speechTextFromAM(formula, req.query);
      sendSpeechText(speechText, res);

    } else {
      return sendError(req, res, 400, "Missing required parameter", 'One of "asciimath", "latex", or "mathml" parameter is required.');
    }
    
  } catch (error) {
    sendError(req, res, 500, 'Internal server error', `${error.message} ${error.stack}`);
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
    return style === 'MathSpeak' ? 'Verbose' : 'Explicit';
  }
}

function getValidOptions() {
  return {
    engines: ['mathcat', 'sre'],
    defaultEngine: 'mathcat',
    mathcat: {
      styles: {
        ClearSpeak: ['Verbose', 'Medium', 'Terse'],
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
        verbosity: 'Explicit',
      },
    },
  };
}

module.exports = router;