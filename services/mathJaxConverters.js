// node >=18

const { toBool, toNum } = require("../utils");

const CoreV3ish = [
  // mirrors MathJax v3's AllPackages
  "action",
  "amscd",
  "bbox",
  "boldsymbol",
  "braket",
  "bussproofs",
  "cancel",
  "cases",
  "centernot",
  "color",
  "colortbl",
  "empheq",
  "enclose",
  "extpfeil",
  "gensymb",
  "html",
  "mathtools",
  "newcommand",
  "noerrors",
  "upgreek",
  "unicode",
  "verb",
  "tagformat",
  "textcomp",
];

// Add the extras you want:
const WantedPackages = [...new Set([...CoreV3ish, "mhchem", "physics"])];

global.MathJax = {
  loader: {
    paths: { mathjax: "@mathjax/src/bundle" },
    require: require,
    load: [
      "input/tex",
      "input/mml",
      "input/asciimath",
      "output/svg",
      "adaptors/liteDOM",
      "ui/safe",
      // Load the TeX extensions as components (prefixed form):
      ...WantedPackages.map((p) => `[tex]/${p}`),
    ],
  },
  startup: { typeset: false },
  tex: {
    // enable the packages in the TeX input jax
    packages: { "[+]": WantedPackages },
    inlineMath: [
      ["$", "$"],
      ["\\(", "\\)"],
    ],
    displayMath: [
      ["$$", "$$"],
      ["\\[", "\\]"],
    ],
  },
  svg: {
    fontCache: "local",
    font: "mathjax-newcm",
  },
};

// Load the startup component and wait for it
require("@mathjax/src/bundle/startup.js");

const mathJaxReady = MathJax.startup.promise
  .then(() => {
    console.log("✓ MathJax initialized successfully");
  })
  .catch((err) => {
    console.error("✗ MathJax initialization error:", err.message);
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
    .replace(/\sdata-latex(?:-item)?="[^"]*"/g, "")
    .replace(/\saria-[\w-]+="[^"]*"/g, "")
    .replace(/\srole="[^"]*"/g, "");

/**
 * Extracts clean SVG markup from a MathJax SVG node and optionally scales it.
 * If the node is wrapped in an mjx-container, extracts the inner SVG element.
 * Applies scaling to width and height attributes when scale factor is provided.
 * @param {Object} svgNode - The MathJax SVG node or container
 * @param {number} [scale=1] - Scale factor to apply to SVG dimensions
 * @returns {string} Clean SVG markup with semantic attributes removed and scaling applied
 */
const cleanAndScaleSvg = (svgNode, scale = 1) => {
  const adaptor = MathJax.startup.adaptor;

  // Ensure we have the <svg>
  if (adaptor.kind(svgNode) !== "svg") {
    let child = adaptor.firstChild(svgNode);
    while (child && adaptor.kind(child) !== "svg") {
      child = adaptor.next(child);
    }
    if (child) svgNode = child;
  }

  if (scale !== 1) {
    const width = parseFloat(adaptor.getAttribute(svgNode, "width")) || 0;
    const height = parseFloat(adaptor.getAttribute(svgNode, "height")) || 0;
    if (width && height) {
      adaptor.setAttribute(svgNode, "width", `${width * scale}ex`);
      adaptor.setAttribute(svgNode, "height", `${height * scale}ex`);
    }
    // Do NOT add any transform to the inner <g>.
  }

  return scrub(adaptor.outerHTML(svgNode));
};

/**
 * Apply color to SVG by modifying the style attribute.
 * Validates and normalizes hex color values, expanding 3-digit hex to 6-digit format.
 * Updates existing style attribute or adds new one if none exists.
 * @param {string} svgString - The SVG string to colorize
 * @param {string} color - Hex color value (3 or 6 digits, without # prefix)
 * @returns {string} SVG string with color applied via style attribute
 */
function applySvgColor(svgString, color) {
  // Validate hex color (3 or 6 hex digits)
  const isValidHex = /^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);

  let hexColor = isValidHex ? color.toLowerCase() : "000000";

  // Expand 3-digit hex to 6-digit form (e.g., 'abc' -> 'aabbcc')
  if (hexColor.length === 3) {
    hexColor = hexColor
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }

  const colorStyle = `color: #${hexColor};`;

  // Check if SVG already has a style attribute
  const styleMatch = svgString.match(
    /<svg([^>]*?)style=["']([^"']*)["']([^>]*?)>/
  );

  if (styleMatch) {
    // SVG has existing style attribute
    const beforeStyle = styleMatch[1];
    const existingStyle = styleMatch[2];
    const afterStyle = styleMatch[3];

    // Update or add color property in existing style
    const updatedStyle = updateStyleProperty(
      existingStyle,
      "color",
      `#${hexColor}`
    );

    // Replace the SVG tag with updated style
    return svgString.replace(
      /<svg([^>]*?)style=["'][^"']*["']([^>]*?)>/,
      `<svg${beforeStyle}style="${updatedStyle}"${afterStyle}>`
    );
  } else {
    // No style attribute exists, add it
    return svgString.replace(/<svg/, `<svg style="${colorStyle}"`);
  }
}

/**
 * Update or add a CSS property in a style string.
 * Parses existing CSS properties and either updates an existing property or adds a new one.
 * @param {string} styleString - The existing CSS style string
 * @param {string} property - The CSS property name to update or add
 * @param {string} value - The CSS property value to set
 * @returns {string} Updated CSS style string with the property set
 */
function updateStyleProperty(styleString, property, value) {
  // Remove whitespace and ensure we have a clean style string
  const style = styleString.trim();

  // Parse existing properties
  const properties = style
    .split(";")
    .map((prop) => prop.trim())
    .filter((prop) => prop.length > 0)
    .map((prop) => {
      const [key, val] = prop.split(":").map((s) => s.trim());
      return { key, val };
    });

  // Check if property already exists
  const existingIndex = properties.findIndex(
    (p) => p.key && p.key.toLowerCase() === property.toLowerCase()
  );

  if (existingIndex >= 0) {
    // Update existing property
    properties[existingIndex].val = value;
  } else {
    // Add new property
    properties.push({ key: property, val: value });
  }

  // Rebuild style string
  return properties.map((p) => `${p.key}: ${p.val}`).join("; ") + ";";
}

/**
 * Converts SVG string markup into a standalone SVG image with embedded CSS and XML declaration.
 * Adds styling for mathematical elements, removes accessibility attributes, and applies foreground color.
 * Based on: https://docs.mathjax.org/en/latest/web/convert.html#creating-stand-alone-svg-images
 * @param {string} svg - The SVG markup to make standalone
 * @param {string} fgColor - Hex color value (6 digits, without # prefix) for foreground elements
 * @returns {string} Complete standalone SVG with XML declaration and embedded styles
 */
const makeSvgStandAlone = (svg, fgColor) => {
  // based on: https://docs.mathjax.org/en/latest/web/convert.html#creating-stand-alone-svg-images
  const svgCss = [
    "svg a{fill:blue;stroke:blue}",
    '[data-mml-node="merror"]>g{fill:red;stroke:red}',
    '[data-mml-node="merror"]>rect[data-background]{fill:yellow;stroke:none}',
    "[data-frame],[data-line]{stroke-width:70px;fill:none}",
    ".mjx-dashed{stroke-dasharray:140}",
    ".mjx-dotted{stroke-linecap:round;stroke-dasharray:0,140}",
    "use[data-c]{stroke-width:3px}",
  ].join("");

  const xmlDeclaration =
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';

  svg = svg.match(/^<svg.*?><defs>/)
    ? svg.replace(/<defs>/, `<defs><style>${svgCss}</style>`)
    : svg.replace(/^(<svg.*?>)/, `$1<defs><style>${svgCss}</style></defs>`);
  svg = svg
    .replace(/ (?:role|focusable|aria-hidden)=".*?"/g, "")
    .replace(/"currentColor"/g, `"#${fgColor}"`);

  return xmlDeclaration + "\n" + svg;
};

/**
 * Converts TeX mathematical notation to clean MathML markup.
 * @param {string} tex - The TeX mathematical expression to convert
 * @returns {Promise<string>} Promise that resolves to clean MathML markup
 * @throws {Error} If MathJax fails to convert the TeX expression
 */
const mmlFromTeX = async (tex) => {
  await mathJaxReady;
  const mml = await MathJax.tex2mmlPromise(tex);
  return scrub(mml);
};

/**
 * Converts AsciiMath notation to clean MathML markup.
 * @param {string} asciimath - The AsciiMath expression to convert
 * @returns {Promise<string>} Promise that resolves to clean MathML markup
 * @throws {Error} If MathJax fails to convert the AsciiMath expression
 */
const mmlFromAM = async (asciimath) => {
  await mathJaxReady;
  const mml = await MathJax.asciimath2mmlPromise(asciimath);
  return scrub(mml);
};

/**
 * Processes existing MathML markup to clean MathML format.
 * Useful for normalizing or cleaning existing MathML content.
 * @param {string} mathml - The MathML markup to process
 * @returns {Promise<string>} Promise that resolves to clean MathML markup
 * @throws {Error} If MathJax fails to process the MathML
 */
const mmlFromMathML = async (mathml) => {
  await mathJaxReady;
  const mml = await MathJax.mathml2mmlPromise(mathml);
  return scrub(mml);
};

/**
 * Converts TeX mathematical notation to standalone SVG image.
 * Supports scaling and color customization options.
 * @param {string} tex - The TeX mathematical expression to convert
 * @param {Object} [options={}] - Optional configuration object for MathJax rendering
 * @param {boolean} [options.display] - Whether to render in display mode
 * @param {number} [options.em] - Font size in em units
 * @param {number} [options.ex] - Ex-height in pixels
 * @param {number} [options.containerWidth] - Container width for line breaking
 * @param {number} [options.scale] - Scale factor for SVG dimensions
 * @param {string} [options.family] - Font family to use
 * @param {string} fgColor - Hex color value (3 or 6 digits, without # prefix) for foreground
 * @returns {Promise<string>} Promise that resolves to standalone SVG markup
 * @throws {Error} If MathJax fails to convert the TeX expression
 */
const svgFromTeX = async (tex, options = {}, fgColor) => {
  const scale = options.scale || 1;
  if ("scale" in options) {
    delete options.scale;
  }

  await mathJaxReady;
  const svgNode = await MathJax.tex2svgPromise(tex, options);
  return applySvgColor(
    makeSvgStandAlone(cleanAndScaleSvg(svgNode, scale), fgColor),
    fgColor
  );
};

/**
 * Converts AsciiMath notation to standalone SVG image.
 * @param {string} asciimath - The AsciiMath expression to convert
 * @param {Object} [options] - Optional configuration object for MathJax rendering
 * @param {boolean} [options.display] - Whether to render in display mode
 * @param {number} [options.em] - Font size in em units
 * @param {number} [options.ex] - Ex-height in pixels
 * @param {number} [options.containerWidth] - Container width for line breaking
 * @param {number} [options.scale] - Scale factor for SVG dimensions
 * @param {string} [options.family] - Font family to use
 * @param {string} fgColor - Hex color value (3 or 6 digits, without # prefix) for foreground
 * @returns {Promise<string>} Promise that resolves to standalone SVG markup
 * @throws {Error} If MathJax fails to convert the AsciiMath expression
 */
const svgFromAM = async (asciimath, options = {}, fgColor) => {
  const scale = options.scale || 1;
  if ("scale" in options) {
    delete options.scale;
  }
  await mathJaxReady;
  const svgNode = await MathJax.asciimath2svgPromise(asciimath, options);
  return applySvgColor(
    makeSvgStandAlone(cleanAndScaleSvg(svgNode, scale)),
    fgColor
  );
};

/**
 * Converts MathML markup to standalone SVG image.
 * @param {string} mathml - The MathML markup to convert
 * @param {Object} [options] - Optional configuration object for MathJax rendering
 * @param {boolean} [options.display] - Whether to render in display mode
 * @param {number} [options.em] - Font size in em units
 * @param {number} [options.ex] - Ex-height in pixels
 * @param {number} [options.containerWidth] - Container width for line breaking
 * @param {number} [options.scale] - Scale factor for SVG dimensions
 * @param {string} [options.family] - Font family to use
 * @param {string} fgColor - Hex color value (3 or 6 digits, without # prefix) for foreground
 * @returns {Promise<string>} Promise that resolves to standalone SVG markup
 * @throws {Error} If MathJax fails to convert the MathML
 */
const svgFromMathML = async (mathml, options = {}, fgColor) => {
  const scale = options.scale || 1;
  if ("scale" in options) {
    delete options.scale;
  }
  await mathJaxReady;
  const svgNode = await MathJax.mathml2svgPromise(mathml, options);
  return applySvgColor(
    makeSvgStandAlone(cleanAndScaleSvg(svgNode, scale)),
    fgColor
  );
};

/**
 * Build a MathJax conversion options object from Express request query parameters.
 * Validates and converts query parameters to appropriate types for MathJax configuration.
 * Applies sensible defaults for missing parameters.
 * @param {Object} [query={}] - Express req.query object containing URL parameters
 * @param {string|boolean} [query.display] - Whether to render in display mode (default: true)
 * @param {string|number} [query.em] - Font size in em units (default: 16)
 * @param {string|number} [query.ex] - Ex-height in pixels (default: 8)
 * @param {string|number} [query.containerWidth] - Container width for line breaking
 * @param {string|number} [query.scale] - Scale factor for output (default: 1)
 * @param {string} [query.family] - Font family to use
 * @returns {Object} MathJax conversion options object with validated and typed parameters
 */
const buildMathConversionOptions = (query = {}) => {
  // Core MathJax conversion options
  // See: https://docs.mathjax.org/en/v4.0/web/convert.html#conversion-options
  const fields = {
    display: "boolean",
    em: "number",
    ex: "number",
    containerWidth: "number",
    scale: "number",
    family: "string",
  };

  // Default values
  const defaults = {
    display: true,
    em: 16,
    ex: 8,
    containerWidth: undefined, // we'll compute this below
    scale: 1,
  };

  const options = {};

  for (const [key, type] of Object.entries(fields)) {
    if (query[key] === undefined) continue;

    switch (type) {
      case "boolean":
        options[key] = toBool(query[key]);
        break;
      case "number":
        options[key] = toNum(query[key]);
        break;
      case "string":
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
};

/**
 * Get information about the current MathJax configuration and version.
 * Returns version information and list of loaded TeX packages.
 * @returns {Object} Object containing MathJax version and package information
 * @returns {string} returns.version - MathJax version string or "unknown"
 * @returns {string[]} returns.packages - Array of loaded TeX package names
 */
const getMathJaxInfo = () => {
  const mj = global.MathJax || {};
  const version = mj.version || "unknown";

  const versions = [];

  if (mj.loader && mj.loader.versions) {
    mj.loader.versions.forEach((version, name) => {
      versions.push(`${name}: ${version}`);
    });
  }

  const configured =
    (mj.config &&
      mj.config.tex &&
      (Array.isArray(mj.config.tex.packages)
        ? mj.config.tex.packages
        : mj.config.tex.packages?.["[+]"])) ||
    [];

  const packages = configured.length ? configured : [];

  return { version, packages, versions };
};

module.exports = {
  mathJaxReady,
  buildMathConversionOptions,
  mmlFromTeX,
  mmlFromAM,
  mmlFromMathML,
  svgFromTeX,
  svgFromAM,
  svgFromMathML,
  getMathJaxInfo,
};
