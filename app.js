const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Security & Performance
app.use(helmet({
  // Allow other origins to embed images/SVGs from this service
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // (Optional) If you see issues with previews opening new tabs, you can disable COOP:
  // crossOriginOpenerPolicy: false,
}));
/**
 * CORS:
 * - For local/dev: allow everything
 * - For prod: restrict to your known front-ends
 */
const allowedOrigins = [
  'http://localhost:5500',   // Live Server for the mathServicePlayground test page
  'http://127.0.0.1:5500',
  'http://oss-pb-local.lndo.site/',
  'https://localhost:5500',   // Live Server for the mathServicePlayground test page
  'https://127.0.0.1:5500',
  'https://oss-pb-local.lndo.site/',
  'http://pressbooks.test',
  'http://appserver',
  'http://appserver_nginx',
  null
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow curl/file:// etc.
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  }
  // credentials: true  // only if you *need* cookies; then don't use '*' origins
}));

app.use(compression());

// Disable x-powered-by
app.disable('x-powered-by');

// Routes
app.use('/', require('./routes/index'));
app.use('/latex', require('./routes/latex'));
app.use('/asciimath', require('./routes/asciimath'));
app.use('/mathml', require('./routes/mathml'));
app.use('/speechtext', require('./routes/speechtext'));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
