# pb-math-service

Modern math rendering microservice with MathJax 4, SVG/PNG generation, and accessible speech text support.

## Features

- **MathJax 4** - Latest version with improved performance
- **Multiple Formats** - LaTeX, AsciiMath, MathML
- **Image Generation** - SVG and PNG output via resvg-js
- **Accessibility** - Speech text generation via mathCAT
- **High Performance** - LRU caching with configurable limits
- **Production Ready** - Graceful shutdown, error handling, monitoring
- **Flexible Deployment** - Standalone, PM2, Docker, or AWS Lambda

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

## API Endpoints

### LaTeX to Image

```bash
# PNG output (default)
GET /latex?latex=x^2+y^2

# SVG output
GET /latex?latex=x^2+y^2&svg=1

# With color
GET /latex?latex=x^2+y^2&fg=FF0000

# Base64 encoded formula
GET /latex?latex=eDIreQ==&isBase64=true

# Get chunk count
GET /latex?latex=x^2&getChunkCount=true

# Get combined SVG (default)
GET /latex?latex=x^2&svg=1

# Get specific chunk (1-based indexing for individual chunks)
GET /latex?latex=x^2&svg=1&chunkIndex=1
GET /latex?latex=x^2&svg=1&chunkIndex=2

# Combined chunks (chunkIndex=0, which is the default)
GET /latex?latex=x^2&svg=1&chunkIndex=0
```

**Image Gen Query Parameters:**

- Formula - Use one of (required):
  - `asciimath` - formula in AsciiMath format
  - `latex` - formula in LaTeX format
  - `mathml` - formula in MathML format
- `isBase64` - Indicate if input is base64 encoded (default: `isBase64=0`)
- `display` - Indicate display style or inline style (default: `display=1`)
- `svg` - Output image format: `png` or `svg` (default: `svg=0`)
- `fg` - Foreground color as hex (default: `fg=000000`)
- `scale` -  a number giving a scaling factor to apply to the resulting conversion. Default is 1
- `width` - Image width in pixels (default: `1200`)
- `dpi` - DPI for PNG output (default: `96`)
- `em` - a number giving the number of pixels in an em for the surrounding font. Default is 16
- `ex` - a number giving the number of pixels in an ex for the surrounding font. Default is 8.


### AsciiMath to Image

```bash
GET /asciimath?asciimath=x^2+y^2
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

** Speech Text Generation Query Parameters:**

- Formula - Use one of (required):
  - `asciimath` - formula in AsciiMath format
  - `latex` - formula in LaTeX format
  - `mathml` - formula in MathML format
- `lang` - Language code (default: `en`)
- `engine` - Speech text converter: MathCAT or Speech Rule Engine (SRE) (default: `engine=mathcat`)
- `style` - Speech style: `ClearSpeak`, `MathSpeak`, `SimpleSpeak` (default: `style=clearspeak`)
- `verbosity` - Verbosity level: `Verbose`, `Medium`, `Terse`, `SuperBrief` (default: `Verbose`)
- `isBase64` - Indicate if input is base64 encoded (default: `isBase64=0`)

## Configuration

All configuration is done via environment variables. See `.env.example` for all options.

### Key Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `MATHCAT_URL` | `http://localhost:8080` | mathCAT service URL |
| `SPEECH_LANG` | `en` | Default speech language |
| `SPEECH_STYLE` | `ClearSpeak` | Default speech style |
| `CACHE_MAX_ENTRIES` | `2000` | Maximum cache entries |
| `CACHE_MAX_SIZE` | `104857600` | Max cache size in bytes (100MB) |
| `CACHE_TTL` | `86400000` | Cache TTL in ms (24 hours) |


## Error Handling

Image generation routes return a SVG with an error message. The speechtext 
route returns a string starting with "Error" and the error message.

## Performance

- **Caching**: URL-level LRU cache with configurable size limits

### Running Tests

```bash
npm test
```

### Manual Tests / Playround

Use `test/mathServicePlayground.html`

## License

GPL-3.0
