require("dotenv").config();

module.exports = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Speech configuration
  speech: {
    defaultEngine: process.env.SPEECH_ENGINE || "mathcat", // 'mathcat' or 'mathjax'
    defaultLang: process.env.SPEECH_LANG || "en",
    defaultMathcatStyle: "ClearSpeak",
    defaultMathcatVerbosity: "Verbose",
    defaultSREStyle: "ClearSpeak",
    defaultSREVerbosity: "Explicit",
    SREClearSpeakExplicitPrefs:
      "Fraction_GeneralEndFrac:Roots_RootEnd:Paren_Speak",
  },

  errors: {
    alwaysSendImageOrSpeechOnError: true,
    httpResponseErrorHeader: "pb-mathjax-error",
    logErrorsToConsole: true,
  },

  // Cache settings
  cache: {
    max: parseInt(process.env.CACHE_MAX_ENTRIES) || 2000,
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100 * 1024 * 1024,
    ttl: parseInt(process.env.CACHE_TTL) || 1000 * 60 * 60 * 24,
  },

  // Image generation
  image: {
    defaultMaxWidth: 1000,
    defaultMaxHeight: 1000,
    defaultDpi: 75,
    maxDpi: 2400,
    minDpi: 75,
    defaultFg: "000000",
    defaultBg: "FFFFFF",
  },

  // Server timeouts
  timeout: 30000,
  keepAliveTimeout: 65000,
  headersTimeout: 66000,
};
