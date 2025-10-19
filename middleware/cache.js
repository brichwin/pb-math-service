const { LRUCache } = require('lru-cache');
const config = require('../config');
const { truncateMiddle } = require('../utils');

// Create cache once at module load
const responseCache = new LRUCache({
  max: config.cache.max,
  maxSize: config.cache.maxSize,
  sizeCalculation: (value) => {
    return value.buffer.length + JSON.stringify(value.headers).length;
  },
  ttl: config.cache.ttl,
});

// Track statistics
let hits = 0;
let misses = 0;

const originalGet = responseCache.get.bind(responseCache);
responseCache.get = function(key) {
  const value = originalGet(key);
  if (value) hits++;
  else misses++;
  return value;
};

/**
 * Cache middleware - caches complete HTTP responses by URL
 */
function cacheMiddleware(req, res, next) {
  if (req.method !== 'GET') {
    return next();
  }

  const cacheKey = req.originalUrl;
  
  // Check cache
  const cached = responseCache.get(cacheKey);
  if (cached) {
    console.log('Cache hit:', cacheKey);
    
    Object.keys(cached.headers).forEach(key => {
      res.set(key, cached.headers[key]);
    });
    res.set('X-Cache', 'HIT');
    
    return res.send(cached.buffer);
  }

  console.log('Cache miss:', truncateMiddle(cacheKey, 80));

  // Intercept res.send
  const originalSend = res.send.bind(res);
  
  res.send = function(data) {
    if (res.statusCode === 200) {
      try {
        const contentType = res.get('Content-Type') || 'application/octet-stream';
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        
        responseCache.set(cacheKey, {
          buffer,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': res.get('Cache-Control') || 'public, max-age=86400',
          },
          timestamp: Date.now(),
        });
        
        console.log('Cached:', truncateMiddle(cacheKey, 80), `(${buffer.length} bytes)`);
      } catch (error) {
        console.error('Failed to cache:', error);
      }
    }
    
    res.set('X-Cache', 'MISS');
    return originalSend(data);
  };
  
  next();
}

function getStats() {
  const total = hits + misses;
  return {
    size: responseCache.size,
    calculatedSize: responseCache.calculatedSize,
    maxSize: responseCache.maxSize,
    max: responseCache.max,
    hits,
    misses,
    hitRate: total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : 'N/A',
  };
}

function clear() {
  const sizeBefore = responseCache.size;
  responseCache.clear();
  hits = 0;
  misses = 0;
  return { cleared: sizeBefore };
}

module.exports = cacheMiddleware;
module.exports.getStats = getStats;
module.exports.clear = clear;