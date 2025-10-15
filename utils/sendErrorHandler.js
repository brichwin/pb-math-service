const config = require("../config");

// Helper function to determine route type from request
function getRouteType(req) {
  if (!req) return "math"; // Default fallback
  const url = (req.originalUrl || '').toLowerCase();

  if (url.includes("/speechtext")) {
    return "speech";
  }

  // Default to math for other routes (asciimath, latex, mathml, etc.)
  return "math";
}

/**
 * Creates a SVG image displaying an error message with yellow background and red text.
 * Truncates the error message to 30 characters and auto-sizes the SVG to fit the text.
 * @param {string} errorMessage - The error message to display
 * @returns {Buffer} SVG image buffer
 */
function createErrorSvg(errorMessage) {
  // Configuration
  const fontSize = 14;
  const padding = 3;
  errorMessage = errorMessage || "Error processing math";

  // Truncate message to 30 characters
  const truncatedMessage =
    errorMessage.length > 30
      ? errorMessage.substring(0, 27) + "..."
      : errorMessage;

  // Escape XML special characters
  const escapedMessage = truncatedMessage
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  // Estimate text dimensions (rough approximation)
  // Average character width is roughly 0.6 * fontSize for most fonts
  const estimatedTextWidth = truncatedMessage.length * fontSize * 0.6;
  const textHeight = fontSize;

  // Calculate SVG dimensions with padding
  const svgWidth = Math.max(100, estimatedTextWidth + padding * 2);
  const svgHeight = Math.max(40, textHeight + padding * 2);

  // Create SVG with error styling that fits the text
  const errorSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#FFFF00" stroke="#FF0000" stroke-width="2"/>
  <text x="50%" y="50%" 
        dominant-baseline="central" 
        text-anchor="middle" 
        fill="#FF0000" 
        font-size="${fontSize}"
        font-weight="bold">
    ${escapedMessage}
  </text>
</svg>`;

  return errorSvg;
}

// Standardized error response helper
const defaultErrorMessage = "Error processing math";

const sendError = (req, res, status = 400, error = defaultErrorMessage, message) => {
  if (config.errors.logErrorsToConsole) {
    console.error("Error:", error, message || defaultErrorMessage);
  }

  if (config.errors.alwaysSendImageOrSpeechOnError) {
    const routeType = getRouteType(req);

    if (routeType === "speech") {
      // For speech routes, return a simple text message
      res.set("Content-Type", "text/plain");
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      if (config.errors.httpResponseErrorHeader) {
        res.set(
          config.errors.httpResponseErrorHeader,
          error || defaultErrorMessage
        );
      }
      return res.status(200).send(`Error: ${error}`);
    } else {
      // If configured to always send image or speech on error, send a SVG
      const errorSvg = createErrorSvg(error || defaultErrorMessage);
      res.set("Content-Type", "image/svg+xml");
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      if (config.errors.httpResponseErrorHeader) {
        res.set(
          config.errors.httpResponseErrorHeader,
          error || defaultErrorMessage
        );
      }
      return res.status(200).send(errorSvg);
    }
  } else {
    return res.status(status).json({
      error: error || "Bad Request",
      message: message || "An error occurred while processing your request",
    });
  }
};

module.exports = {
  sendError,
};
