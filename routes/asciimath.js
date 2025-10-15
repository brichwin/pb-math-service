const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middleware/cache');
const { buildMathConversionOptions, svgFromAM } = require('../services/mathJaxConverters');
const { buildPngFromSvgConversionOptions, pngFromSvg } = require('../services/imageConverter');
const { toBool, requiredParamsAreMissing, processFormula } = require('../utils');
const { sendError } = require('../utils/sendErrorHandler');

router.use(cacheMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const { asciimath, svg, fg } = req.query;
    
    if(requiredParamsAreMissing(req, res, ['asciimath'])) return;

    const formula = processFormula(req, res, asciimath);
    if (!formula) return; // processFormula already handled the response in case of error

    const mathConversionOptions = buildMathConversionOptions(req.query);
    const pngConversionOptions = buildPngFromSvgConversionOptions(req.query);

    // Generate SVG
    let newSvg = await svgFromAM(formula, mathConversionOptions, fg);
    
    // If SVG output is requested, return it directly    
    if (toBool(svg)) {
      res.set('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'public, max-age=86400');
      return res.send(newSvg);
    }
    
    // Convert to PNG
    const png = pngFromSvg(newSvg, pngConversionOptions);
    
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(png);
    
  } catch (error) {
    sendError(req, res, 500, 'Internal server error', `${error.message} ${error.stack}`);
  }
});

module.exports = router;