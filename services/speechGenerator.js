const path = require('path');
const config = require('../config');
const { toMathML } = require('./mathJax');

// MathCAT (napi-rs)
const { initMathcat, processMath: processMathCAT } = require('mathcat-wrapper');

// MathJax speech (built-in)
let mjSpeech = null;

// Initialize MathCAT once
let mathcatInitialized = false;

function ensureMathCATInitialized() {
  if (!mathcatInitialized) {
    const rulesPath = path.join(__dirname, '..', 'Rules');
    try {
      initMathcat(rulesPath);
      mathcatInitialized = true;
      console.log('✓ MathCAT initialized');
    } catch (error) {
      console.error('Failed to initialize MathCAT:', error);
      throw error;
    }
  }
}

async function ensureMathJaxSpeechInitialized() {
  if (!mjSpeech) {
    const { mathjax } = require('mathjax');
    mjSpeech = await mathjax.init({
      loader: {
        load: ['input/mml', '[sre]']
      },
      sre: {
        domain: 'clearspeak', // Will be changed based on options
        style: 'default',
      }
    });
    console.log('✓ MathJax speech initialized');
  }
  return mjSpeech;
}

/**
 * Generate speech using MathCAT
 */
function generateMathCATSpeech(mathml, options = {}) {
  ensureMathCATInitialized();
  
  // Map options to MathCAT settings
  // MathCAT options: ClearSpeak/SimpleSpeak + Verbose/Medium/Terse
  const style = options.style || 'ClearSpeak';
  const verbosity = options.verbosity || 'Verbose';
  const lang = options.lang || 'en';
  
  // Set environment variables for MathCAT
  // Adjust these based on how your wrapper reads settings
  process.env.MATHCAT_LANGUAGE = lang;
  process.env.MATHCAT_STYLE = style;
  process.env.MATHCAT_VERBOSITY = verbosity;
  
  try {
    const result = processMathCAT(mathml);
    
    if (result.startsWith('-!ERROR!-')) {
      console.warn('MathCAT error:', result);
      return null;
    }
    
    return result;
  } catch (error) {
    console.error('MathCAT speech generation failed:', error);
    return null;
  }
}

/**
 * Generate speech using MathJax
 */
async function generateMathJaxSpeech(mathml, options = {}) {
  const mj = await ensureMathJaxSpeechInitialized();
  
  // Map style/verbosity to MathJax SRE settings
  const style = options.style || 'ClearSpeak';
  const verbosity = options.verbosity || 'Auto';
  
  let domain, speechStyle;
  
  // Map to MathJax SRE settings
  if (style === 'ClearSpeak') {
    domain = 'clearspeak';
    if (verbosity === 'Auto') {
      speechStyle = 'default';
    } else if (verbosity === 'Explicit') {
      // Custom preferences would go here
      speechStyle = 'default';
    }
  } else if (style === 'MathSpeak') {
    domain = 'mathspeak';
    if (verbosity === 'Verbose') {
      speechStyle = 'default';
    } else if (verbosity === 'Brief') {
      speechStyle = 'brief';
    } else if (verbosity === 'Superbrief') {
      speechStyle = 'sbrief';
    }
  }
  
  try {
    // MathJax SRE (Speech Rule Engine)
    const adaptor = mj.startup.adaptor;
    const node = mj.mathml2svg(mathml);
    
    // Get speech text - this depends on MathJax version
    // You may need to adjust based on actual MathJax 4 SRE API
    const speechText = adaptor.textContent(node); // Placeholder - adjust for actual API
    
    return speechText;
  } catch (error) {
    console.error('MathJax speech generation failed:', error);
    return null;
  }
}

/**
 * Generate speech text from MathML with configurable engine
 */
async function generateSpeechText(mathml, options = {}) {
  const engine = (options.engine || config.speech.defaultEngine || 'mathcat').toLowerCase();
  
  try {
    if (engine === 'mathcat') {
      return generateMathCATSpeech(mathml, options);
    } else if (engine === 'mathjax') {
      return await generateMathJaxSpeech(mathml, options);
    } else {
      throw new Error(`Unknown speech engine: ${engine}`);
    }
  } catch (error) {
    console.error('Speech generation failed:', {
      engine,
      error: error.message,
    });
    return null;
  }
}

/**
 * Get speech text or fall back to original formula
 */
async function getSpeechOrFallback(mathml, originalFormula, options = {}) {
  const speechText = await generateSpeechText(mathml, options);
  return speechText || originalFormula || 'Mathematical expression';
}

/**
 * Validate speech options
 */
function validateSpeechOptions(engine, style, verbosity) {
  const validOptions = {
    mathcat: {
      ClearSpeak: ['Verbose'],
      SimpleSpeak: ['Verbose', 'Medium', 'Terse'],
    },
    mathjax: {
      ClearSpeak: ['Auto', 'Explicit'],
      MathSpeak: ['Verbose', 'Brief', 'Superbrief'],
    },
  };
  
  const engineLower = engine.toLowerCase();
  
  if (!validOptions[engineLower]) {
    return { valid: false, error: `Invalid engine: ${engine}. Must be 'mathcat' or 'mathjax'` };
  }
  
  if (!validOptions[engineLower][style]) {
    return { 
      valid: false, 
      error: `Invalid style '${style}' for ${engine}. Valid styles: ${Object.keys(validOptions[engineLower]).join(', ')}` 
    };
  }
  
  if (!validOptions[engineLower][style].includes(verbosity)) {
    return { 
      valid: false, 
      error: `Invalid verbosity '${verbosity}' for ${engine} ${style}. Valid: ${validOptions[engineLower][style].join(', ')}` 
    };
  }
  
  return { valid: true };
}

module.exports = {
  generateSpeechText,
  getSpeechOrFallback,
  validateSpeechOptions,
};