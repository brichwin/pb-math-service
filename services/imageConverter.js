const { Resvg } = require('@resvg/resvg-js');
const config = require('../config');
const { toBool, toNum, getNumberParam } = require('../utils');

/**
 * Convert SVG string to PNG buffer
 */
function pngFromSvg(svgString, pngOptions = {}) {
  try {
    const resvg = new Resvg(svgString, {
      fitTo: {
        mode: 'width',
        value: pngOptions.width || config.image.defaultWidth,
      },
      font: {
        loadSystemFonts: false,
      },
      dpi: pngOptions.dpi,
    });
    
    const pngData = resvg.render();
    return pngData.asPng();
    
  } catch (error) {
    console.error('SVG to PNG conversion failed:', {
      error: error.message,
      svgLength: svgString.length,
      options: pngOptions
    });
    throw new Error(`Failed to convert SVG to PNG: ${error.message}`);
  }
}


/**
 * Build a MathJax conversion options object from req.query parameters.
 *
 * @param {object} query - Express req.query object
 * @returns {object} MathJax conversion options
 */
const buildPngFromSvgConversionOptions = (query = {}) => {
  
  const fields = {
    dpi: 'number',
    maxHeight: 'number',
    maxWidth: 'number',
    width: 'number',
    bgColor: 'string',
  };

  const options = {};

  for (const [key, type] of Object.entries(fields)) {
    if (query[key] === undefined) continue;

    switch (type) {
      case 'boolean':
        options[key] = toBool(query[key]);
        break;
      case 'number':
        options[key] = toNum(query[key]);
        break;
      case 'string':
        options[key] = query[key];
        break;
    }
  }

  // Merge defaults if fields were not present
  if (options.display === undefined) options.dpi = getNumberParam(options.dpi, config.image.minDpi, config.image.maxDpi, config.image.defaultDpi);
  if (options.em === undefined) options.maxHeight = getNumberParam(options.maxHeight || options.width, 1, 2000, config.image.defaultMaxHeight);
  if (options.ex === undefined) options.maxWidth = getNumberParam(options.maxWidth, 1, 2000, config.image.defaultMaxWidth);

  return options;
}

module.exports = {
  buildPngFromSvgConversionOptions,
  pngFromSvg
};