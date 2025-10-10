# pb-math-service

Modern math rendering microservice with MathJax 4, SVG/PNG generation, and accessible speech text support.

## Features

- ✅ **MathJax 4** - Latest version with improved performance
- ✅ **Multiple Formats** - LaTeX, AsciiMath, MathML
- ✅ **Image Generation** - SVG and PNG output via resvg-js
- ✅ **Accessibility** - Speech text generation via mathCAT
- ✅ **High Performance** - LRU caching with configurable limits
- ✅ **Production Ready** - Graceful shutdown, error handling, monitoring
- ✅ **Flexible Deployment** - Standalone, PM2, Docker, or AWS Lambda

## Installation

```bash
npm install
cp .env.example .env
# Edit .env with your settings
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### With PM2
```bash
pm2 start bin/www --name pb-math-service
```

### With Docker
```bash
docker build -t pb-math-service .
docker run -p 3000:3000 pb-math-service
```

## API Endpoints

### LaTeX to Image
```bash
# PNG output (default)
GET /latex?latex=x^2+y^2

# SVG output
GET /latex?latex=x^2+y^2&format=svg

# With color
GET /latex?latex=x^2+y^2&fg=FF0000&format=png

# Base64 encoded input
GET /latex?latex=eDIreQ==&isBase64=true
```

**Query Parameters:**
- `latex` (required) - LaTeX formula
- `format` - Output format: `png` or `svg` (default: `png`)
- `fg` - Foreground color as hex (default: `000000`)
- `width` - Image width in pixels (default: `1200`)
- `dpi` - DPI for PNG output (default: `96`)
- `speech` - Include speech text: `true` or `false` (default: `true`)
- `isBase64` - Indicate if input is base64 encoded (default: `false`)

### AsciiMath to Image
```bash
GET /asciimath?asciimath=x^2+y^2&format=png
```

**Query Parameters:** Same as LaTeX endpoint, but use `asciimath` parameter

### MathML to Image
```bash
GET /mathml?mathml=<math><mi>x</mi></math>&format=png
```

**Query Parameters:** Same as LaTeX endpoint, but use `mathml` parameter

### Speech Text Generation
```bash
# From MathML
GET /speechtext?mathml=<math><mi>x</mi></math>

# From LaTeX
GET /speechtext?latex=x^2&lang=en&style=ClearSpeak

# From AsciiMath
GET /speechtext?asciimath=x^2&verbosity=Verbose
```

**Query Parameters:**
- `mathml` - MathML input
- `latex` - LaTeX input (will be converted to MathML)
- `asciimath` - AsciiMath input (will be converted to MathML)
- `lang` - Language code (default: `en`)
- `style` - Speech style: `ClearSpeak`, `MathSpeak`, `SimpleSpeak` (default: `ClearSpeak`)
- `verbosity` - Verbosity level: `Verbose`, `Medium`, `Brief` (default: `Medium`)
- `isBase64` - Indicate if input is base64 encoded (default: `false`)

### Health Check
```bash
GET /health
```

Returns service health status and metrics.

### Cache Statistics
```bash
GET /cache-stats
```

Returns cache performance metrics.

### Clear Cache
```bash
POST /cache-clear
```

Clears the entire response cache.

## Configuration

All configuration is done via environment variables. See `.env.example` for all options.

### Key Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `MATHCAT_URL` | `http://localhost:8080` | mathCAT service URL |
| `SPEECH_ENABLED` | `true` | Enable speech generation |
| `SPEECH_LANG` | `en` | Default speech language |
| `SPEECH_STYLE` | `ClearSpeak` | Default speech style |
| `CACHE_MAX_ENTRIES` | `2000` | Maximum cache entries |
| `CACHE_MAX_SIZE` | `104857600` | Max cache size in bytes (100MB) |
| `CACHE_TTL` | `86400000` | Cache TTL in ms (24 hours) |

## Response Headers

All responses include these headers:

- `Content-Type` - MIME type of the response
- `Cache-Control` - Caching directives for browsers/CDNs
- `X-Cache` - `HIT` or `MISS` indicating cache status
- `X-Alt-Text` - URL-encoded accessible description (for image endpoints)

## Error Handling

All errors return JSON with this structure:

```json
{
  "error": {
    "message": "Error description",
    "status": 400
  }
}
```

Common error codes:
- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (invalid endpoint)
- `500` - Internal Server Error
- `503` - Service Unavailable (speech service down)

## Performance

- **Caching**: URL-level LRU cache with configurable size limits
- **Response Times**: 
  - Cache hit: < 5ms
  - SVG generation: 10-50ms
  - PNG conversion: 20-100ms
  - Speech generation: 50-500ms (depends on mathCAT service)

## Architecture

```
pb-math-service/
├── bin/www              # Server entry point
├── app.js               # Express app setup
├── config/              # Configuration management
├── middleware/          # Cache, error handling
├── routes/              # API endpoints
├── services/            # Core logic (MathJax, image, speech)
└── utils/               # Utilities and helpers
```

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Code Formatting
```bash
npm run format
```

## Deployment

### Standalone Server
```bash
npm start
```

### PM2 (Process Manager)
```bash
pm2 start bin/www --name pb-math-service
pm2 logs pb-math-service
pm2 restart pb-math-service
```

### Docker
```bash
docker build -t pb-math-service .
docker run -d -p 3000:3000 --name pb-math-service pb-math-service
```

### AWS Lambda
Deploy using the included `lambda.js` handler with your preferred Lambda deployment tool.

## Requirements

- Node.js >= 18.0.0
- mathCAT service (optional, for speech generation)

## Dependencies

- **mathjax** v4 - Math rendering engine
- **@resvg/resvg-js** - Fast SVG to PNG conversion
- **lru-cache** - High-performance caching
- **express** - Web framework
- **axios** - HTTP client for mathCAT integration

## License

GPL-3.0

## Support

For issues and questions:
- GitHub Issues: https://github.com/pressbooks/pb-math-service
- Documentation: See this README

## Credits

Built by Pressbooks for accessible math content delivery.