const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middleware/cache');
const { processFormula } = require('../utils');
const { speechTextFromTeX, speechTextFromMathML, speechTextFromAM } = require('../services/speechGenerators');

router.use(cacheMiddleware);

const sendSpeechText = (text="", res) => {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(text);
}

router.get('/', async (req, res, next) => {
  try {    
    const { asciimath, latex, mathml } = req.query;

    if(latex) {
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
      return res.status(400).send('One of "asciimath", "latex", or "mathml" parameter is required.');
    }
    
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
    return style === 'MathSpeak' ? 'Verbose' : 'Explicit';
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