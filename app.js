const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { buildMathConversionOptions, svgFromTeX } = require('./services/mathJaxConverters');

const app = express();

// Security & Performance
app.use(helmet());
app.use(cors());
app.use(compression());

// Disable x-powered-by
app.disable('x-powered-by');

// Routes
app.use('/', require('./routes/index'));
app.use('/latex', require('./routes/latex'));
app.use('/asciimath', require('./routes/asciimath'));
app.use('/mathml', require('./routes/mathml'));
app.use('/speechtext', require('./routes/speechText'));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;