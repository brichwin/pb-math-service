const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middleware/cache');
const { buildMathConversionOptions, svgFromTeX } = require('../services/mathJaxConverters');
const { buildPngFromSvgConversionOptions, pngFromSvg } = require('../services/imageConverter');
const { toBool, requiredParamsAreMissing, processFormula } = require('../utils');
const { sendError } = require('../utils/sendErrorHandler');

router.use(cacheMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const { latex, svg, fg } = req.query;
    
    if(requiredParamsAreMissing(req, res, ['latex'])) return;
    const formula = processFormula(req, res, latex);
    if (!formula) return; // processFormula already handled the response in case of error

    console.log('Processed formula:', formula);
    const mathConversionOptions = buildMathConversionOptions(req.query);
    const pngConversionOptions = buildPngFromSvgConversionOptions(req.query);

    // Generate SVG
    let newSvg = await svgFromTeX(formula, mathConversionOptions, fg);

    // If SVG output is requested, return it directly
    if (toBool(svg)) {
      res.set('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'public, max-age=86400');
      console.log('Returning SVG response');
      return res.send(newSvg);
    }
    
    // Convert to PNG
    const png = pngFromSvg(newSvg, pngConversionOptions);
    
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    console.log('Returning PNG response');
    res.send(png);
    
  } catch (error) {
    sendError(req, res, 500, 'Internal server error', `${error.message} ${error.stack}`);
  }
});

module.exports = router;