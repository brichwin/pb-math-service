
  // Helper functions for type coercion
  const toBool = (v) =>
    typeof v === 'string'
      ? ['true', '1', 'yes', 'on'].includes(v.toLowerCase())
      : !!v;

  const toNum = (v) => (v !== undefined ? Number(v) : undefined);


/**
 * Get a numeric query parameter with min/max bounds and default fallback.
 * @param {number} value - parameter
 * @param {number} min - minimum allowed value
 * @param {number} max - maximum allowed value
 * @param {number} defaultValue - fallback if not present or invalid
 * @returns {number} - validated number within [min, max]
 */
function getNumberParam(value, min, max, defaultValue) {
  // If missing or empty, use default
  if (value === undefined || value === '') {
    return defaultValue;
  }

  // Parse to float or integer as you need
  value = Number(value);

  // If NaN, use default
  if (Number.isNaN(value)) {
    return defaultValue;
  }

  // Clamp to min and max
  if (value < min) value = min;
  if (value > max) value = max;

  return value;
}

/**
 * Checks that required query parameters are present.
 * @param {Object} query - The req.query object.
 * @param {string[]} required - A list of required parameter names.
 * @returns {string[]} - A list of missing parameter names.
 */
function requiredParamsAreMissing(res, query, required) {
  const missing = required.filter(param => query[param] === undefined || query[param] === '');
  if (missing.length > 0) {
      res.status(400).json({
        error:
          missing.length === 1
            ? `${missing[0]} parameter is required`
            : `Missing required parameters: ${missing.join(', ')}`
      });
      return true;
    }
  return false;
}

/*
 * Helper to process and validate formula input from requests
* @param {object} req - Express request object
* @param {object} res - Express response object
* @param {string} formula - The formula input (LaTeX, AsciiMath, or MathML)
* @returns {string|null} - The processed formula string or null if there was an error (response already sent)
*/
const processFormula = (req, res, formula) => { 
  // Check if the formula is base64 encoded
  if (toBool(req.query.isBase64) && formula) {
    try {
      formula = Buffer.from(formula, 'base64').toString('utf-8').trim();
    } catch (error) {
      res.status(400).json({
        error: 'Invalid base64 string',
        message: 'The provided formula is not a valid base64 encoded string'
      });
      return null; 
    }
  }

  if (!formula || formula.length === 0) {
    res.status(400).json({
      error: 'Formula is required',
      message: 'Please provide a formula to process'
    });
    return null;
  }

  return formula;
};

module.exports = {
  toBool,
  toNum,
  getNumberParam,
  requiredParamsAreMissing,
  processFormula
};