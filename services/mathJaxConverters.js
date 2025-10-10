// node >=18

const { toBool, toNum } = require('../utils');

const CoreV3ish = [
  // mirrors MathJax v3's AllPackages (practical subset)
  'ams', 'boldsymbol', 'bbox', 'braket', 'cancel',
  'color', 'colorv2', 'enclose', 'html', 'mathtools', 'newcommand',
  'noundefined', 'noerrors', 'setoptions', 'tagformat',
  'textmacros', 'unicode', 'upgreek'
];

// Add the extras you want:
const WantedPackages = [...new Set([...CoreV3ish, 'mhchem', 'physics'])];

global.MathJax ={
  loader: {
    paths: { mathjax: '@mathjax/src/bundle' },
    require: require,
    load: [
      'input/tex', 'input/mml', 'input/asciimath',
      'output/svg', 'adaptors/liteDOM',
      // Load the TeX extensions as components (prefixed form):
      ...WantedPackages.map(p => `[tex]/${p}`)
    ]
  },
  startup: { typeset: false },
  tex: {
    // enable the packages in the TeX input jax
    packages: { '[+]': WantedPackages },
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']]
  },
  svg: { 
    fontCache: 'none',
    font: 'mathjax-newcm'
  }
};

// Load the startup component and wait for it
require('@mathjax/src/bundle/startup.js');

const mathJaxReady = MathJax.startup.promise.then(() => {
  console.log('✓ MathJax initialized successfully');
}).catch((err) => {
  console.error('✗ MathJax initialization error:', err.message);
  throw err;
});

/**
 * Helper function to remove semantic attributes from SVG or MathML strings.
 * Removes data-latex, aria-*, and role attributes to create cleaner output.
 * @param {string} s - The string containing SVG or MathML markup
 * @returns {string} The cleaned string with semantic attributes removed
 */
const scrub = (s) =>
  s
    .replace(/\sdata-latex(?:-item)?="[^"]*"/g, '')
    .replace(/\saria-[\w-]+="[^"]*"/g, '')
    .replace(/\srole="[^"]*"/g, '');

/**
 * Extracts clean SVG markup from a MathJax SVG node.
 * If the node is wrapped in an mjx-container, extracts the inner SVG element.
 * @param {Object} svgNode - The MathJax SVG node or container
 * @returns {string} Clean SVG markup with semantic attributes removed
 */
const getCleanSvg = (svgNode) => {
  const adaptor = MathJax.startup.adaptor;
  // x2svgPromise often returns an <mjx-container> wrapping <svg>; dig out the <svg>
  if (adaptor.kind(svgNode) !== 'svg') {
    svgNode = adaptor.firstChild(svgNode);
  }
  return scrub(adaptor.outerHTML(svgNode));
}

/**
 * Apply color to SVG by modifying the style attribute
 */
function applySvgColor(svgString, color) {
  // Validate hex color (3 or 6 hex digits)
  const isValidHex = /^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);

  let hexColor = isValidHex ? color.toLowerCase() : '000000';

  // Expand 3-digit hex to 6-digit form (e.g., 'abc' -> 'aabbcc')
  if (hexColor.length === 3) {
    hexColor = hexColor.split('').map(ch => ch + ch).join('');
  }

  const colorStyle = `color: #${hexColor};`;

  // Check if SVG already has a style attribute
  const styleMatch = svgString.match(/<svg([^>]*?)style=["']([^"']*)["']([^>]*?)>/);

  if (styleMatch) {
    // SVG has existing style attribute
    const beforeStyle = styleMatch[1];
    const existingStyle = styleMatch[2];
    const afterStyle = styleMatch[3];

    // Update or add color property in existing style
    const updatedStyle = updateStyleProperty(existingStyle, 'color', `#${hexColor}`);

    // Replace the SVG tag with updated style
    return svgString.replace(
      /<svg([^>]*?)style=["'][^"']*["']([^>]*?)>/,
      `<svg${beforeStyle}style="${updatedStyle}"${afterStyle}>`
    );
  } else {
    // No style attribute exists, add it
    return svgString.replace(
      /<svg/,
      `<svg style="${colorStyle}"`
    );
  }
}

/**
 * Update or add a CSS property in a style string
 */
function updateStyleProperty(styleString, property, value) {
  // Remove whitespace and ensure we have a clean style string
  const style = styleString.trim();
  
  // Parse existing properties
  const properties = style
    .split(';')
    .map(prop => prop.trim())
    .filter(prop => prop.length > 0)
    .map(prop => {
      const [key, val] = prop.split(':').map(s => s.trim());
      return { key, val };
    });
  
  // Check if property already exists
  const existingIndex = properties.findIndex(
    p => p.key && p.key.toLowerCase() === property.toLowerCase()
  );
  
  if (existingIndex >= 0) {
    // Update existing property
    properties[existingIndex].val = value;
  } else {
    // Add new property
    properties.push({ key: property, val: value });
  }
  
  // Rebuild style string
  return properties
    .map(p => `${p.key}: ${p.val}`)
    .join('; ') + ';';
}


/**
 * Converts SVG string markup into a standalone SVG image with embedded CSS and XML declaration.
 * Adds styling for mathematical elements and removes accessibility attributes.
 * Based on: https://docs.mathjax.org/en/latest/web/convert.html#creating-stand-alone-svg-images
 * @param {string} svg - The SVG markup to make standalone
 * @returns {string} Complete standalone SVG with XML declaration and embedded styles
 */
const makeSvgStandAlone = (svg) => {
  // based on: https://docs.mathjax.org/en/latest/web/convert.html#creating-stand-alone-svg-images
  const svgCss = [
    'svg a{fill:blue;stroke:blue}',
    '[data-mml-node="merror"]>g{fill:red;stroke:red}',
    '[data-mml-node="merror"]>rect[data-background]{fill:yellow;stroke:none}',
    '[data-frame],[data-line]{stroke-width:70px;fill:none}',
    '.mjx-dashed{stroke-dasharray:140}',
    '.mjx-dotted{stroke-linecap:round;stroke-dasharray:0,140}',
    'use[data-c]{stroke-width:3px}'
  ].join('');
 
  const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';

  svg = (svg.match(/^<svg.*?><defs>/)
        ? svg.replace(/<defs>/, `<defs><style>${svgCss}</style>`)
        : svg.replace(/^(<svg.*?>)/, `$1<defs><style>${svgCss}</style></defs>`));
  svg = svg.replace(/ (?:role|focusable|aria-hidden)=".*?"/g, '')
        .replace(/"currentColor"/g, '"black"');

  return xmlDeclaration + '\n' + svg;
}

/**
 * Converts TeX mathematical notation to clean MathML markup.
 * @param {string} tex - The TeX mathematical expression to convert
 * @returns {Promise<string>} Promise that resolves to clean MathML markup
 */
const mmlFromTeX = async (tex) => {
  await mathJaxReady; 
  const mml = await MathJax.tex2mmlPromise(tex);
  return scrub(mml);
}

/**
 * Converts AsciiMath notation to clean MathML markup.
 * @param {string} asciimath - The AsciiMath expression to convert
 * @returns {Promise<string>} Promise that resolves to clean MathML markup
 */
const mmlFromAM = async (asciimath) => {
  await mathJaxReady; 
  const mml = await MathJax.asciimath2mmlPromise(asciimath);
  return scrub(mml);
}

/**
 * Processes existing MathML markup to clean MathML format.
 * Useful for normalizing or cleaning existing MathML content.
 * @param {string} mathml - The MathML markup to process
 * @returns {Promise<string>} Promise that resolves to clean MathML markup
 */
const mmlFromMML = async (mathml) => {
  await mathJaxReady; 
  const mml = await MathJax.mathml2mmlPromise(mathml);
  return scrub(mml);
}

/**
 * Converts TeX mathematical notation to standalone SVG image.
 * @param {string} tex - The TeX mathematical expression to convert
 * @param {Object} [options] - Optional configuration object for MathJax rendering
 * @returns {Promise<string>} Promise that resolves to standalone SVG markup
 */
const svgFromTeX = async (tex, options, fgColor) => {
  console.log('svgFromTeX called with tex:', tex, 'options:', JSON.stringify(options), 'fgColor:', fgColor);
  console.log('keys:', Object.keys(MathJax));

  await mathJaxReady; 
  console.log('MathJax startup promise resolved');
  const svgNode = await MathJax.tex2svgPromise(tex, options);
  console.log('tex2svgPromise resolved');
  return applySvgColor(makeSvgStandAlone(getCleanSvg(svgNode)), fgColor);
}

/**
 * Converts AsciiMath notation to standalone SVG image.
 * @param {string} asciimath - The AsciiMath expression to convert
 * @param {Object} [options] - Optional configuration object for MathJax rendering
 * @returns {Promise<string>} Promise that resolves to standalone SVG markup
 */
const svgFromAM = async (asciimath, options, fgColor) => {
  await mathJaxReady; 
  const svgNode = await MathJax.asciimath2svgPromise(asciimath, options);
  return applySvgColor(makeSvgStandAlone(getCleanSvg(svgNode)), fgColor);
}

/**
 * Converts MathML markup to standalone SVG image.
 * @param {string} mathml - The MathML markup to convert
 * @param {Object} [options] - Optional configuration object for MathJax rendering
 * @returns {Promise<string>} Promise that resolves to standalone SVG markup
 */
const svgFromMathML = async (mathml, options, fgColor) => {
  await mathJaxReady; 
  const svgNode = await MathJax.mathml2svgPromise(mathml, options);
  return applySvgColor(makeSvgStandAlone(getCleanSvg(svgNode)), fgColor);
}

/**
 * Build a MathJax conversion options object from req.query parameters.
 *
 * @param {object} query - Express req.query object
 * @returns {object} MathJax conversion options
 */
const buildMathConversionOptions = (query = {}) => {
  
  // Core MathJax conversion options
  // See: https://docs.mathjax.org/en/v4.0/web/convert.html#conversion-options
  const fields = {
    display: 'boolean',
    em: 'number',
    ex: 'number',
    containerWidth: 'number',
    scale: 'number',
    family: 'string',
  };

  // Default values
  const defaults = {
    display: true,
    em: 16,
    ex: 8,
    containerWidth: undefined, // we'll compute this below
    scale: 1
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
  if (options.display === undefined) options.display = defaults.display;
  if (options.em === undefined) options.em = defaults.em;
  if (options.ex === undefined) options.ex = defaults.ex;

  // If containerWidth is not provided, calculate from ex
  if (options.containerWidth === undefined) {
    options.containerWidth =
      defaults.containerWidth ?? (options.ex ?? defaults.ex) * 80;
  }

  if (options.scale === undefined) options.scale = defaults.scale;

  return options;
}

const getMathJaxInfo = () => {
  const mj = global.MathJax || {};
  const version = mj.version || 'unknown';

  const configured =
    (mj.config && mj.config.tex && (
      Array.isArray(mj.config.tex.packages)
        ? mj.config.tex.packages
        : mj.config.tex.packages?.['[+]']
    )) || [];

  const packages = configured.length ? configured : [];

  return { version, packages };
}

module.exports = {
  mathJaxReady,
  buildMathConversionOptions,
  mmlFromTeX,
  mmlFromAM,
  mmlFromMML,
  svgFromTeX,
  svgFromAM,
  svgFromMathML,
  getMathJaxInfo
};