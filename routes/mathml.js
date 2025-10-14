const express = require('express');
const router = express.Router();
const cacheMiddleware = require('../middleware/cache');
const { buildMathConversionOptions, svgFromMathML } = require('../services/mathJaxConverters');
const { buildPngFromSvgConversionOptions, pngFromSvg } = require('../services/imageConverter');
const { toBool, requiredParamsAreMissing, processFormula } = require('../utils');

router.use(cacheMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const { mathml, svg, fg } = req.query;
    
    if(requiredParamsAreMissing(res, req.query, ['mathml'])) return;

    const formula = processFormula(req, res, mathml);
    if (!formula) return; // processFormula already handled the response in case of error

    const mathConversionOptions = buildMathConversionOptions(req.query);
    const pngConversionOptions = buildPngFromSvgConversionOptions(req.query);

    // Generate SVG
    let newSvg = await svgFromMathML(formula, mathConversionOptions, fg);
    
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
    next(error);
  }
});

module.exports = router;