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


# Package Notes:
## color vs. colorv2

The color and colorv2 packages in MathJax relate to how the \color macro behaves, particularly when transitioning from MathJax version 2 to version 3 and later.
color package: This package provides the standard LaTeX-compatible \color command. In standard LaTeX, \color acts as a switch, changing the color of all subsequent content until another \color command is encountered or the scope ends. It also defines other color-related macros like \colorbox, \fcolorbox, and \definecolor, along with supporting various color spaces (named colors, RGB, grayscale).
colorv2 package: This package provides the non-standard \color macro that was the default in MathJax version 2. In this version, \color takes two arguments: the color name (or an HTML color code like #RGB or #RRGGBB) and the specific math content to be colored. This behavior is different from the LaTeX standard where \color acts as a switch. 
In essence:
If you want the \color command to behave like it does in standard LaTeX, use the color package.
If you need to maintain compatibility with older MathJax version 2 content that used the two-argument \color macro, use the colorv2 package.
Note: In MathJax 3 and later, the color extension is generally preferred and often autoloaded when \color is first used. If you explicitly load colorv2, you should not also load the color extension, as they provide conflicting implementations of the \color macro.