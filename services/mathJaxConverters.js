// node >=18
const { toBool, toNum } = require("../utils");
const { LRUCache } = require('lru-cache');

// Cache for MathJax SVG results to avoid recomputation
const svgCache = new LRUCache({
  max: 1000, // Maximum number of cached items
  ttl: 1000 * 60 * 60 * 24, // 24 hours TTL
});

let currentPackageSignature = 'mathjax needs loading';
let mathJaxReady = null;

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

/**
 * Extract required packages from a TeX string
 * @param {string} tex - The TeX string to analyze
 * @returns {string[]} Array of required package names
 */
function extractRequiredPackages(tex) {
  const requireRegex = /\\require\{([^}]+)\}/g;
  const packages = [];
  let match;
  
  while ((match = requireRegex.exec(tex)) !== null) {
    packages.push(match[1].trim());
  }
  
  return packages.sort(); // Sort for consistent signature
}

/**
 * Create a signature string from package array
 * @param {string[]} packages - Array of package names
 * @returns {string} Signature string for comparison
 */
function createPackageSignature(packages) {
  return packages.length > 0 ? packages.join(',') : 'default';
}

/**
 * Check if MathJax needs to be reset due to package changes
 * @param {string[]} requiredPackages - Array of required packages
 * @returns {boolean} True if reset is needed
 */
function needsMathJaxReset(requiredPackages) {
  const newSignature = createPackageSignature(requiredPackages);
  
  if (currentPackageSignature !== newSignature) {
    console.log(`Package signature changed: ${currentPackageSignature} -> ${newSignature}`);
    return true;
  }
  
  return false;
}

/**
 * Reset and reinitialize MathJax with new package configuration
 * @param {string[]} requiredPackages - Array of required packages
 * @returns {Promise} Promise that resolves when MathJax is ready
 */
async function configureMathJax(requiredPackages=[]) {
  console.log('Configuring MathJax with packages:', requiredPackages);
  
  // Clear the current MathJax instance
  delete global.MathJax;
  
  // Create package list
  const allPackages = [...new Set([...CoreV3ish, "mhchem", ...requiredPackages])];
  
  // Reinitialize MathJax configuration
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
        ...allPackages.map((p) => `[tex]/${p}`),
      ],
    },
    startup: { typeset: false },
    tex: {
      // enable the packages in the TeX input jax
      packages: { "[+]": allPackages },
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

  // Clear the module cache for MathJax components
  Object.keys(require.cache).forEach(key => {
    if (key.includes('@mathjax') || key.includes('mathjax')) {
      delete require.cache[key];
    }
  });

  // Reload and reinitialize
  require("@mathjax/src/bundle/startup.js");
  
  const mathJaxReady = MathJax.startup.promise
    .then(() => {
      console.log(`✓ MathJax initialized with packages: ${allPackages.join(', ')}`);
      currentPackageSignature = createPackageSignature(requiredPackages);
    })
    .catch((err) => {
      console.error("✗ MathJax initialization error:", err.message);
      throw err;
    });
    

  return mathJaxReady;
}

/**
 * Ensure MathJax is ready with the correct packages
 * @param {string} tex - The TeX string (to extract required packages)
 * @returns {Promise} Promise that resolves when MathJax is ready
 */
async function ensureMathJaxReady(tex = '') {
  const requiredPackages = extractRequiredPackages(tex);
  
  // Check if we need to reset MathJax
  if (needsMathJaxReset(requiredPackages)) {
    return configureMathJax(requiredPackages);
  }
  
  // Use existing MathJax instance
  return mathJaxReady || mathJaxReady;
}

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
 * Automatically handles package requirements and MathJax reinitialization.
 * @param {string} tex - The TeX mathematical expression to convert
 * @returns {Promise<string>} Promise that resolves to clean MathML markup
 * @throws {Error} If MathJax fails to convert the TeX expression
 */
const mmlFromTeX = async (tex) => {
  await ensureMathJaxReady(tex);
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
 * Generate a cache key for SVG results
 * @param {string} input - The mathematical expression
 * @param {string} type - Type of input (tex, asciimath, mathml)
 * @param {Object} options - Conversion options
 * @returns {string} Cache key
 */
function generateSvgCacheKey(input, type, options = {}) {
  const optionsStr = JSON.stringify(options);
  return `${type}:${optionsStr}:${input}`;
}

/**
 * Extract multiple SVG elements from MathJax result
 * @param {Object} svgNode - The MathJax SVG result
 * @returns {Object[]} Array of SVG nodes
 */
function extractSvgChunks(svgNode) {
  const adaptor = MathJax.startup.adaptor;
  const chunks = [];
  
  // Handle both single SVG and multiple SVG cases
  if (adaptor.kind(svgNode) === 'svg') {
    chunks.push(svgNode);
  } else {
    // Look for multiple SVG elements in the container
    let child = adaptor.firstChild(svgNode);
    while (child) {
      if (adaptor.kind(child) === 'svg') {
        chunks.push(child);
      }
      child = adaptor.next(child);
    }
    
    // If no SVG children found, look deeper
    if (chunks.length === 0) {
      const findSvgs = (node) => {
        let current = adaptor.firstChild(node);
        while (current) {
          if (adaptor.kind(current) === 'svg') {
            chunks.push(current);
          } else {
            findSvgs(current);
          }
          current = adaptor.next(current);
        }
      };
      findSvgs(svgNode);
    }
  }
  
  return chunks.length > 0 ? chunks : [svgNode];
}

/**
 * Combine multiple MathJax v4 SVG chunks into a single SVG.
 * - Preserves baselines by aligning on a global viewBox minY/maxY
 * - Adds a fixed horizontal margin between chunks (given in ex; converted to viewBox units)
 * - Merges <defs> and de-duplicates by id
 *
 * @param {string[]} svgChunks  Array of per-chunk SVG strings (or nodes you stringify earlier)
 * @param {number}   scale      Optional: scale you already applied inside cleanAndScaleSvg
 * @param {string}   fgColor    6-hex foreground color (no #)
 * @param {number}   marginEx   Horizontal gap between chunks, in ex
 * @returns {string} Standalone combined SVG string with XML declaration
 */
function combineSvgChunks(svgChunks, scale = 1, fgColor = '000000', marginEx = 0.4) {
  console.log(`Combining ${svgChunks.length} SVG chunks with scale ${scale} and fgColor #${fgColor}`);

  // Fast-path single chunk
  if (svgChunks.length === 1) {
    return applySvgColor(
      makeSvgStandAlone(cleanAndScaleSvg(svgChunks[0], scale), fgColor),
      fgColor
    );
  }

  const processed = [];
  const defsById = new Map(); // id -> element string (first wins)
  let globalMinY = +Infinity;
  let globalMaxY = -Infinity;

  // Parse helpers
  const num = (s, d = 0) => (s == null ? d : parseFloat(String(s)));
  const getAttr = (svg, name) => {
    const m = svg.match(new RegExp(`${name}="([^"]+)"`));
    return m ? m[1] : null;
  };

  // Preprocess chunks: clean, pull metrics, stash content and defs
  svgChunks.forEach((chunk, index) => {
    console.log(`Processing chunk ${index + 1}/${svgChunks.length}`);
    const s = cleanAndScaleSvg(chunk, scale); // must return a complete <svg ...>...</svg> string

    const widthAttr = getAttr(s, 'width');   // e.g. "4.359ex"
    const heightAttr = getAttr(s, 'height'); // e.g. "2.452ex"
    const vbAttr = getAttr(s, 'viewBox');    // e.g. "0 -833.9 1926.8 1083.9"

    // display sizes in ex (strip units if present)
    const displayWidthEx = num(widthAttr?.replace(/ex$/, ''), 0);
    const displayHeightEx = num(heightAttr?.replace(/ex$/, ''), 0);

    // viewBox numbers: minX, minY, width, height
    let vbMinX = 0, vbMinY = 0, vbWidth = displayWidthEx, vbHeight = displayHeightEx;
    if (vbAttr) {
      const p = vbAttr.trim().split(/\s+/).map(parseFloat);
      if (p.length >= 4) {
        [vbMinX, vbMinY, vbWidth, vbHeight] = p;
      }
    }

    // Track global vertical extents
    globalMinY = Math.min(globalMinY, vbMinY);
    globalMaxY = Math.max(globalMaxY, vbMinY + vbHeight);

    // Extract <defs> content and inner SVG content
    const defsMatch = s.match(/<defs[^>]*>([\s\S]*?)<\/defs>/);
    if (defsMatch && defsMatch[1].trim()) {
      // Find any elements with id="" and de-dup
      const rawDefs = defsMatch[1];
      // naive split: keep whole tagged elements; good enough for MathJax's defs (paths, glyphs, etc.)
      const els = rawDefs.match(/<[^>]+id="[^"]+"[\s\S]*?<\/[^>]+>|<[^>]+id="[^"]+"[^>]*\/>/g) || [];
      for (const el of els) {
        const id = (el.match(/id="([^"]+)"/) || [])[1];
        if (id && !defsById.has(id)) defsById.set(id, el);
      }
      // Also keep any defs children without id (once)
      const anonEls = rawDefs.match(/<(?:linearGradient|clipPath|style|mask|filter)\b[\s\S]*?<\/\1>|<(?:linearGradient|clipPath|style|mask|filter)\b[^>]*\/>/g) || [];
      // Use a synthetic key to avoid over-duplication
      for (const el of anonEls) {
        const key = 'anon:' + el.replace(/\s+/g, ' ').trim();
        if (!defsById.has(key)) defsById.set(key, el);
      }
    }

    // Remove outer <svg> and any <defs> to get drawable content
    const inner = s
      .replace(/^[\s\S]*?<svg[^>]*>/, '')   // drop everything up to opening <svg>
      .replace(/<\/svg>\s*$/, '')           // drop closing
      .replace(/<defs[^>]*>[\s\S]*?<\/defs>/g, ''); // drop defs

    // Per-chunk scale (viewBox units per ex unit)
    const vbPerEx = displayWidthEx > 0 ? vbWidth / displayWidthEx : 1;

    processed.push({
      content: inner,
      displayWidthEx,
      displayHeightEx,
      vbMinX, vbMinY, vbWidth, vbHeight,
      vbPerEx
    });
  });

  // Combined display size in ex
  const totalDisplayWidthEx = processed.reduce((acc, c, i) =>
    acc + c.displayWidthEx + (i ? marginEx : 0), 0);
  const maxDisplayHeightEx = processed.reduce((m, c) => Math.max(m, c.displayHeightEx), 0);

  // Horizontal placement (in viewBox units)
  let xVb = 0;
  const placements = [];
  let totalVbWidth = 0;

  processed.forEach((c, i) => {
    const marginVb = i ? (c.vbPerEx * marginEx) : 0; // convert ex margin to this chunk's vb units
    xVb += i ? marginVb : 0;
    placements.push({
      x: xVb,
      y: (c.vbMinY - globalMinY), // shift vertically so baselines align
      content: c.content
    });
    xVb += c.vbWidth;
  });

  totalVbWidth = xVb;
  const globalHeight = (globalMaxY - globalMinY);

  // Build combined SVG
  const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';
  const svgCss = [
    'svg a{fill:blue;stroke:blue}',
    '[data-mml-node="merror"]>g{fill:red;stroke:red}',
    '[data-mml-node="merror"]>rect[data-background]{fill:yellow;stroke:none}',
    '[data-frame],[data-line]{stroke-width:70px;fill:none}',
    '.mjx-dashed{stroke-dasharray:140}',
    '.mjx-dotted{stroke-linecap:round;stroke-dasharray:0,140}',
    'use[data-c]{stroke-width:3px}',
  ].join('');

  let out = '';
  out += `<svg xmlns="http://www.w3.org/2000/svg"`;
  out += ` xmlns:xlink="http://www.w3.org/1999/xlink"`;
  out += ` role="img" focusable="false"`;
  out += ` width="${totalDisplayWidthEx}ex" height="${maxDisplayHeightEx}ex"`;
  out += ` viewBox="0 ${globalMinY} ${totalVbWidth} ${globalHeight}">`;

  // <defs> (CSS + de-duped entries)
  out += `<defs><style>${svgCss}</style>`;
  for (const el of defsById.values()) out += el;
  out += `</defs>`;

  // Place each chunk with translate(x, y)
  for (const p of placements) {
    if (p.x !== 0 || p.y !== 0) {
      out += `<g transform="translate(${p.x}, ${p.y})">${p.content}</g>`;
    } else {
      out += p.content; // first chunk often needs no transform
    }
  }

  out += `</svg>`;

  // Apply color and ensure currentColor gets replaced
  const combined = xmlDeclaration + '\n' +
    out.replace(/"currentColor"/g, `"#${fgColor}"`);
  return applySvgColor(combined, fgColor);
}


/**
 * Get the number of SVG chunks that would be produced for a TeX expression
 * @param {string} tex - The TeX mathematical expression
 * @param {Object} [options={}] - Conversion options
 * @returns {Promise<number>} Promise that resolves to the number of SVG chunks
 */
const getSvgCountForTeX = async (tex, options = {}) => {
  const cacheKey = generateSvgCacheKey(tex, 'tex', options);
  
  let cached = svgCache.get(cacheKey);
  if (!cached) {
    await ensureMathJaxReady(tex);
    const svgNode = await MathJax.tex2svgPromise(tex, options);
    const chunks = extractSvgChunks(svgNode);
    
    cached = { chunks, count: chunks.length };
    svgCache.set(cacheKey, cached);
  }
  
  return cached.count;
};

/**
 * Get the number of SVG chunks that would be produced for an AsciiMath expression
 * @param {string} asciimath - The AsciiMath expression
 * @param {Object} [options={}] - Conversion options
 * @returns {Promise<number>} Promise that resolves to the number of SVG chunks
 */
const getSvgCountForAM = async (asciimath, options = {}) => {
  const cacheKey = generateSvgCacheKey(asciimath, 'asciimath', options);
  
  let cached = svgCache.get(cacheKey);
  if (!cached) {
    await mathJaxReady;
    const svgNode = await MathJax.asciimath2svgPromise(asciimath, options);
    const chunks = extractSvgChunks(svgNode);
    
    cached = { chunks, count: chunks.length };
    svgCache.set(cacheKey, cached);
  }
  
  return cached.count;
};

/**
 * Get the number of SVG chunks that would be produced for a MathML expression
 * @param {string} mathml - The MathML markup
 * @param {Object} [options={}] - Conversion options
 * @returns {Promise<number>} Promise that resolves to the number of SVG chunks
 */
const getSvgCountForMathML = async (mathml, options = {}) => {
  const cacheKey = generateSvgCacheKey(mathml, 'mathml', options);
  
  let cached = svgCache.get(cacheKey);
  if (!cached) {
    await mathJaxReady;
    const svgNode = await MathJax.mathml2svgPromise(mathml, options);
    const chunks = extractSvgChunks(svgNode);
    
    cached = { chunks, count: chunks.length };
    svgCache.set(cacheKey, cached);
  }
  
  return cached.count;
};

/**
 * Converts TeX mathematical notation to standalone SVG image.
 * Automatically handles package requirements and MathJax reinitialization.
 * @param {string} tex - The TeX mathematical expression to convert
 * @param {Object} [options={}] - Optional configuration object for MathJax rendering
 * @param {string} fgColor - Hex color value for foreground
 * @param {number} [chunkIndex=0] - Which SVG chunk to return (1-based, 0 = combined)
 * @returns {Promise<string>} Promise that resolves to standalone SVG markup
 * @throws {Error} If MathJax fails to convert the TeX expression
 */
const svgFromTeX = async (tex, options = {}, fgColor, chunkIndex = 0) => {
  const scale = options.scale || 1;
  if ("scale" in options) {
    delete options.scale;
  }

  const cacheKey = generateSvgCacheKey(tex, 'tex', options);
  let cached = svgCache.get(cacheKey);
  
  if (!cached) {
    await ensureMathJaxReady(tex);
    const svgNode = await MathJax.tex2svgPromise(tex, options);
    const chunks = extractSvgChunks(svgNode);
    
    cached = { chunks, count: chunks.length };
    svgCache.set(cacheKey, cached);
  }
  
  if (chunkIndex === 0) {
    // Return combined SVG
    return combineSvgChunks(cached.chunks, scale, fgColor);
  } else if (chunkIndex > 0 && chunkIndex <= cached.count) {
    // Return specific chunk (1-based index)
    const chunk = cached.chunks[chunkIndex - 1];
    return applySvgColor(
      makeSvgStandAlone(cleanAndScaleSvg(chunk, scale), fgColor),
      fgColor
    );
  } else {
    throw new Error(`Invalid chunk index: ${chunkIndex}. Valid range is 1-${cached.count}`);
  }
};

/**
 * Converts AsciiMath notation to standalone SVG image.
 * @param {string} asciimath - The AsciiMath expression to convert
 * @param {Object} [options={}] - Optional configuration object for MathJax rendering
 * @param {boolean} [options.display] - Whether to render in display mode (forced to true)
 * @param {number} [options.em] - Font size in em units
 * @param {number} [options.ex] - Ex-height in pixels
 * @param {number} [options.containerWidth] - Container width for line breaking
 * @param {number} [options.scale] - Scale factor for SVG dimensions
 * @param {string} [options.family] - Font family to use
 * @param {string} fgColor - Hex color value (3 or 6 digits, without # prefix) for foreground
 * @param {number} [chunkIndex=0] - Which SVG chunk to return (1-based, 0 = combined)
 * @returns {Promise<string>} Promise that resolves to standalone SVG markup
 * @throws {Error} If MathJax fails to convert the AsciiMath expression
 */
const svgFromAM = async (asciimath, options = {}, fgColor, chunkIndex = 0) => {
  const scale = options.scale || 1;
  if ("scale" in options) {
    delete options.scale;
  }

  const cacheKey = generateSvgCacheKey(asciimath, 'asciimath', options);
  let cached = svgCache.get(cacheKey);
  
  if (!cached) {
    await mathJaxReady;
    const svgNode = await MathJax.asciimath2svgPromise(asciimath, options);
    const chunks = extractSvgChunks(svgNode);
    
    cached = { chunks, count: chunks.length };
    svgCache.set(cacheKey, cached);
  }
  
  if (chunkIndex === 0) {
    // Return combined SVG
    return combineSvgChunks(cached.chunks, scale, fgColor);
  } else if (chunkIndex > 0 && chunkIndex <= cached.count) {
    // Return specific chunk (1-based index)
    const chunk = cached.chunks[chunkIndex - 1];
    return applySvgColor(
      makeSvgStandAlone(cleanAndScaleSvg(chunk, scale), fgColor),
      fgColor
    );
  } else {
    throw new Error(`Invalid chunk index: ${chunkIndex}. Valid range is 1-${cached.count}`);
  }
};

/**
 * Converts MathML markup to standalone SVG image.
 * @param {string} mathml - The MathML markup to convert
 * @param {Object} [options={}] - Optional configuration object for MathJax rendering
 * @param {boolean} [options.display] - Whether to render in display mode (forced to true)
 * @param {number} [options.em] - Font size in em units
 * @param {number} [options.ex] - Ex-height in pixels
 * @param {number} [options.containerWidth] - Container width for line breaking
 * @param {number} [options.scale] - Scale factor for SVG dimensions
 * @param {string} [options.family] - Font family to use
 * @param {string} fgColor - Hex color value (3 or 6 digits, without # prefix) for foreground
 * @param {number} [chunkIndex=0] - Which SVG chunk to return (1-based, 0 = combined)
 * @returns {Promise<string>} Promise that resolves to standalone SVG markup
 * @throws {Error} If MathJax fails to convert the MathML
 */
const svgFromMathML = async (mathml, options = {}, fgColor, chunkIndex = 0) => {
  const scale = options.scale || 1;
  if ("scale" in options) {
    delete options.scale;
  }

  const cacheKey = generateSvgCacheKey(mathml, 'mathml', options);
  let cached = svgCache.get(cacheKey);
  
  if (!cached) {
    await mathJaxReady;
    const svgNode = await MathJax.mathml2svgPromise(mathml, options);
    const chunks = extractSvgChunks(svgNode);
    
    cached = { chunks, count: chunks.length };
    svgCache.set(cacheKey, cached);
  }
  
  if (chunkIndex === 0) {
    // Return combined SVG
    return combineSvgChunks(cached.chunks, scale, fgColor);
  } else if (chunkIndex > 0 && chunkIndex <= cached.count) {
    // Return specific chunk (1-based index)
    const chunk = cached.chunks[chunkIndex - 1];
    return applySvgColor(
      makeSvgStandAlone(cleanAndScaleSvg(chunk, scale), fgColor),
      fgColor
    );
  } else {
    throw new Error(`Invalid chunk index: ${chunkIndex}. Valid range is 1-${cached.count}`);
  }
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
    containerWidth: undefined, // computed this below
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
 * @returns {string[]} returns.versions - Array of component version strings
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

configureMathJax(); // initial load


module.exports = {
  mathJaxReady,
  ensureMathJaxReady,
  buildMathConversionOptions,
  mmlFromTeX,
  mmlFromAM,
  mmlFromMathML,
  svgFromTeX,
  svgFromAM,
  svgFromMathML,
  getSvgCountForTeX,
  getSvgCountForAM,
  getSvgCountForMathML,
  getMathJaxInfo,
};
