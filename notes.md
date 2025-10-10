pb-math-service/
├── bin/
│   └── www                          # Server startup script
├── config/
│   └── index.js                     # Configuration management
├── middleware/
│   ├── cache.js                     # URL-level caching middleware
│   └── errorHandler.js              # Centralized error handling
├── routes/
│   ├── index.js                     # Route registry
│   ├── latex.js                     # LaTeX endpoint
│   ├── asciimath.js                 # AsciiMath endpoint
│   ├── mathml.js                    # MathML endpoint
│   └── speechtext.js                # Speech text endpoint
├── services/
│   ├── mathJax.js                   # MathJax 4 integration
│   ├── imageConverter.js            # SVG to PNG with resvg-js
│   └── speechGenerator.js           # mathCAT wrapper
├── utils/
│   └── logger.js                    # Logging utility
├── public/
│   └── health.html                  # Health check page
├── test/
│   └── api.test.js                  # API tests
├── .env.example                     # Environment variables template
├── .gitignore
├── app.js                           # Express app configuration
├── lambda.js                        # AWS Lambda handler (optional)
├── package.json
└── README.md

