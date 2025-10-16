const {sendError} = require("./sendErrorHandler");

// Helper functions for type coercion
const toBool = (v) =>
  typeof v === "string"
    ? ["true", "1", "yes", "on"].includes(v.toLowerCase())
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
  if (value === undefined || value === "") {
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
function requiredParamsAreMissing(req, res, required) {
  const query = req.query;
  const missing = required.filter(
    (param) => query[param] === undefined || query[param] === ""
  );
  if (missing.length > 0) {
    sendError(req, res, 400, "Missing required parameter(s)",
        missing.length === 1
          ? `${missing[0]} parameter is required`
          : `Missing required parameters: ${missing.join(", ")}`
    );
    return true;
  }
  return false;
}

const urlSafeBase64ToBase64 = (urlSafeBase64) => {
    let base64 = urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/');
    
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }
    
    return base64;
}

const isBase64 = (str) => {
  // Check if empty or not a string
  if (!str || typeof str !== "string") {
    return false;
  }

  // Remove whitespace (base64 can have line breaks in some formats)
  str = str.trim();

  // Allows both standard (+/) and URL-safe (-_) base64
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(str)) {
    console.error("Invalid base64 string: Contains invalid characters");
    return false;
  }
  return true
};

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
      formula = urlSafeBase64ToBase64(formula);
      console.log("processFormula: urlSafeBase64ToBase64 applied:", formula);
      if(!isBase64(formula)) {
        console.error("processFormula: Not valid base64");
        throw new Error("Not valid base64");
      }
      formula = Buffer.from(formula, "base64").toString("utf-8").trim();
    } catch (error) {
      console.error("processFormula: Error decoding base64", error);
      sendError(req, res, 400, "Invalid base64 string", "The provided formula is not a valid base64 encoded string");
      return null;
    }
  }

  if (!formula || formula.length === 0) {
    sendError(req, res, 400, "Formula is required", "Please provide a formula to process");
    return null;
  }

  return formula.trim();
};

module.exports = {
  toBool,
  toNum,
  getNumberParam,
  requiredParamsAreMissing,
  processFormula,
};
