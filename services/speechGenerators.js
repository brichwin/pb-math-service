const path = require('path');
const config = require('../config');
const { initMathcat, getSpeechTextFromMathcat, setMathcatPreference, getMathcatVersion } = require('../lib/mathcat-wrapper');
const SRE = require('speech-rule-engine');
const { mmlFromAM, mmlFromMathML, mmlFromTeX } = require('./mathJaxConverters');  

// Initialize MathCAT once
let mathcatInitialized = false;

let currentMathcatOptions = {};
let currentSREOptions = {};

function ensureMathCATInitialized() {
  if (!mathcatInitialized) {
    const rulesPath = path.join(__dirname, '..', '/lib/mathcat-wrapper/Rules');
    console.log('Initializing MathCAT with rules from:', rulesPath);
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

function getDefaultStyle(engine) {
  return engine.toLowerCase() === 'sre' ? 'ClearSpeak' : 'ClearSpeak';
}

function getDefaultVerbosity(engine='mathcat', style='') {
  if (engine.toLowerCase() === 'sre') {
    if(style.toLowerCase() === 'mathspeak') {
      return 'Verbose';
    } else {
      return 'Explicit';
    }
  } else {
    return 'Verbose';
  }
}

function getSpeechOptionsFromQuery(query) {
  const correctCasingForMathCAT = {
    clearspeak: 'ClearSpeak',
    simplespeak: 'SimpleSpeak',
    verbose: 'Verbose',
    medium: 'Medium',
    terse: 'Terse'
  }

  const engine = (query.engine || 'mathcat').trim().toLowerCase();
  let style = (query.style || getDefaultStyle(engine)).trim();
  let verbosity = (query.verbosity || getDefaultVerbosity(engine, style)).trim();
  const lang = (query.lang || config.speech.defaultLang).trim().toLowerCase();

  if(engine !== 'sre') {
    style = correctCasingForMathCAT[style.toLowerCase()] || style;
    verbosity = correctCasingForMathCAT[verbosity.toLowerCase()] || verbosity;
  } else {
    if(style.toLowerCase() === 'mathspeak' && verbosity.toLowerCase() === 'superbrief') {
      verbosity = 'sbrief';
    }
  }
 console.log(`gsofq: Speech options - Engine: ${engine}, Style: ${style}, Verbosity: ${verbosity}, Language: ${lang}`);
  const options = { engine, style, verbosity, lang };
  return options;
}

function generateSpeechWithMathCAT(mathml, options = {}) {
  ensureMathCATInitialized();

  // Set MathCAT preferences if they have changed
  const { engine, style, verbosity, lang } = options;

  const valid = validateSpeechOptions(engine, style, verbosity);
  if (!valid.valid) {
    throw new Error(valid.error);
  }

  console.log(`Using MathCAT with Style: ${style}, Verbosity: ${verbosity}, Language: ${lang}`);
  if (currentMathcatOptions.style !== style) {
    setMathcatPreference('SpeechStyle', style);
  }
  if (currentMathcatOptions.verbosity !== verbosity) {
    setMathcatPreference('Verbosity', verbosity);
  }
  if (currentMathcatOptions.lang !== lang) {
    setMathcatPreference('Language', lang);
  }

  // Update current options
  currentMathcatOptions = {...options };

  try {
    const result = getSpeechTextFromMathcat(mathml);
    
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

const generateSpeechWithSRE = async (mml, options) => {
    // Set SRE preferences if they have changed
  const { engine, style, verbosity, lang } = options;

    let SREDomain = style;
    let SREStyle = verbosity;
    
  if (!validateSpeechOptions(engine, style, verbosity).valid) {
    throw new Error('Invalid speech options provided.');
  }

  console.log(`Using SRE with Style: ${style}, Verbosity: ${verbosity}, Language: ${lang}`);

  if(SREDomain && SREDomain.toLowerCase() === 'clearspeak') {
    if(SREStyle && SREStyle.toLowerCase() === 'explicit') {
      SREStyle = config.speech.SREClearSpeakExplicitPrefs;
    } else {
      SREStyle = '';
    }
  }
  
  const SREOptions = {
    domain: SREDomain,
    style: SREStyle,
    locale: lang,
    markup: 'none',
    modality: 'speech'
  }

  console.log('SRE Options:', JSON.stringify(SREOptions));
  await SRE.engineReady();
  await SRE.setupEngine(SREOptions);
  const speech = SRE.toSpeech(mml);
  return speech;
}

const generateSpeechText = async (mml, options) => {
  // TODO Validate speech options here
  if(options.engine === 'sre') {
    return await generateSpeechWithSRE(mml, options);
  } else {
    return generateSpeechWithMathCAT(mml, options);
  }
}

const speechTextFromTeX = async (latex, query = {}) => {
  const options = getSpeechOptionsFromQuery(query);
  const mml = await mmlFromTeX(latex);
  const speechText = generateSpeechText(mml, options);
  return speechText;
}

const speechTextFromMathML = async (mathml, query = {}) => {
  const options = getSpeechOptionsFromQuery(query);
  const mml = await mmlFromMathML(mathml);
  const speechText = generateSpeechText(mml, options);
  return speechText;
}

const speechTextFromAM = async (asciimath, query = {}) => {
  const options = getSpeechOptionsFromQuery(query);
  const mml = await mmlFromAM(asciimath);
  const speechText = generateSpeechText(mml, options);
  return speechText;
}

/**
 * Validate speech options
 */
function validateSpeechOptions(engine, style, verbosity) {
  const validOptions = {
    mathcat: {
      clearspeak: ['verbose'],
      simplespeak: ['verbose', 'medium', 'terse'],
    },
    sre: {
      clearspeak: ['auto', 'explicit'],
      mathspeak: ['verbose', 'brief', 'sbrief'],
    },
  };
  
  const engineLower = (engine||'').toLowerCase();
  
  if (!validOptions[engineLower]) {
    return { valid: false, error: `Invalid engine: '${engine}'. Must be 'mathcat' or 'sre'` };
  }

  const styleLower = (style||'').toLowerCase();
  
  if (!validOptions[engineLower][styleLower]) {
    return { 
      valid: false, 
      error: `Invalid style '${style}' for ${engine}. Valid styles: ${Object.keys(validOptions[engineLower]).join(', ')}` 
    };
  }

  if (!validOptions[engineLower][styleLower].includes((verbosity||'').toLowerCase())) {
    return { 
      valid: false, 
      error: `Invalid verbosity '${verbosity}' for ${engine} ${style}. Valid: ${validOptions[engineLower][styleLower].join(', ')}` 
    };
  }
  
  return { valid: true };
}

const getSpeechGeneratorsInfo = async () => {
    ensureMathCATInitialized();
    await SRE.engineReady();
    const sreVersion = SRE.version || 'unknown';
    const mathcatVersion = getMathcatVersion() || 'unknown';

    return [{engine: 'mathcat', version: mathcatVersion}, {engine: 'sre', version: sreVersion}];
}

module.exports = {
  getSpeechGeneratorsInfo,
  speechTextFromTeX,
  speechTextFromMathML,
  speechTextFromAM,
  getSpeechOptionsFromQuery,
  validateSpeechOptions
};