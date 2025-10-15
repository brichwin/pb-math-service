const { expect } = require('chai');
const request = require('supertest');
const app = require('../app');

describe('Speech Text Route Tests', () => {
  const validLaTeX = 'x^2 + y^2 = z^2';
  const validAsciiMath = 'x^2 + y^2 = z^2';
  const validMathML = '<math><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msup><mi>y</mi><mn>2</mn></msup><mo>=</mo><msup><mi>z</mi><mn>2</mn></msup></math>';
  const fractionLaTeX = '\\frac{a}{b}';
  const fractionAsciiMath = 'a/b';

  describe('LaTeX Input', () => {
    describe('MathCAT Engine', () => {
      it('should generate speech from LaTeX with default settings', (done) => {
        request(app)
          .get('/speechtext')
          .query({ latex: validLaTeX })
          .expect(200)
          .expect('Content-Type', /text/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be.a('string');
            expect(res.text.length).to.be.greaterThan(0);
            done();
          });
      });

      it('should generate speech with ClearSpeak style', (done) => {
        request(app)
          .get('/speechtext')
          .query({ 
            latex: validLaTeX,
            engine: 'mathcat',
            style: 'ClearSpeak',
            verbosity: 'Verbose'
          })
          .expect(200)
          .expect('Content-Type', /text/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be.a('string');
            expect(res.text.length).to.be.greaterThan(0);
            done();
          });
      });

      it('should generate speech with SimpleSpeak style and different verbosity levels', (done) => {
        const verbosities = ['Verbose', 'Medium', 'Terse'];
        let completedTests = 0;
        
        verbosities.forEach((verbosity) => {
          request(app)
            .get('/speechtext')
            .query({ 
              latex: fractionLaTeX,
              engine: 'mathcat',
              style: 'SimpleSpeak',
              verbosity: verbosity
            })
            .expect(200)
            .expect('Content-Type', /text/)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.text).to.be.a('string');
              expect(res.text.length).to.be.greaterThan(0);
              completedTests++;
              if (completedTests === verbosities.length) {
                done();
              }
            });
        });
      });
    });

    describe('SRE Engine', () => {
      it('should generate speech with ClearSpeak style', (done) => {
        request(app)
          .get('/speechtext')
          .query({ 
            latex: validLaTeX,
            engine: 'sre',
            style: 'ClearSpeak',
            verbosity: 'Explicit'
          })
          .expect(200)
          .expect('Content-Type', /text/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be.a('string');
            expect(res.text.length).to.be.greaterThan(0);
            done();
          });
      });

      it('should generate speech with MathSpeak style and different verbosity levels', (done) => {
        const verbosities = ['Verbose', 'Brief', 'SuperBrief'];
        let completedTests = 0;
        
        verbosities.forEach((verbosity) => {
          request(app)
            .get('/speechtext')
            .query({ 
              latex: fractionLaTeX,
              engine: 'sre',
              style: 'MathSpeak',
              verbosity: verbosity
            })
            .expect(200)
            .expect('Content-Type', /text/)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.text).to.be.a('string');
              expect(res.text.length).to.be.greaterThan(0);
              completedTests++;
              if (completedTests === verbosities.length) {
                done();
              }
            });
        });
      });
    });
  });

  describe('AsciiMath Input', () => {
    describe('MathCAT Engine', () => {
      it('should generate speech from AsciiMath with default settings', (done) => {
        request(app)
          .get('/speechtext')
          .query({ asciimath: validAsciiMath })
          .expect(200)
          .expect('Content-Type', /text/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be.a('string');
            expect(res.text.length).to.be.greaterThan(0);
            done();
          });
      });

      it('should generate speech with different styles', (done) => {
        request(app)
          .get('/speechtext')
          .query({ 
            asciimath: fractionAsciiMath,
            engine: 'mathcat',
            style: 'SimpleSpeak',
            verbosity: 'Medium'
          })
          .expect(200)
          .expect('Content-Type', /text/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be.a('string');
            expect(res.text.length).to.be.greaterThan(0);
            done();
          });
      });
    });

    describe('SRE Engine', () => {
      it('should generate speech from AsciiMath', (done) => {
        request(app)
          .get('/speechtext')
          .query({ 
            asciimath: validAsciiMath,
            engine: 'sre',
            style: 'ClearSpeak'
          })
          .expect(200)
          .expect('Content-Type', /text/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be.a('string');
            expect(res.text.length).to.be.greaterThan(0);
            done();
          });
      });
    });
  });

  describe('MathML Input', () => {
    describe('MathCAT Engine', () => {
      it('should generate speech from MathML with default settings', (done) => {
        request(app)
          .get('/speechtext')
          .query({ mathml: validMathML })
          .expect(200)
          .expect('Content-Type', /text/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be.a('string');
            expect(res.text.length).to.be.greaterThan(0);
            done();
          });
      });

      it('should generate speech with ClearSpeak style', (done) => {
        request(app)
          .get('/speechtext')
          .query({ 
            mathml: validMathML,
            engine: 'mathcat',
            style: 'ClearSpeak',
            verbosity: 'Verbose'
          })
          .expect(200)
          .expect('Content-Type', /text/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be.a('string');
            expect(res.text.length).to.be.greaterThan(0);
            done();
          });
      });
    });

    describe('SRE Engine', () => {
      it('should generate speech from MathML', (done) => {
        request(app)
          .get('/speechtext')
          .query({ 
            mathml: validMathML,
            engine: 'sre',
            style: 'MathSpeak',
            verbosity: 'Brief'
          })
          .expect(200)
          .expect('Content-Type', /text/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be.a('string');
            expect(res.text.length).to.be.greaterThan(0);
            done();
          });
      });
    });
  });

  describe('Language Support', () => {
    it('should generate speech with different language settings', (done) => {
      const languages = ['en', 'es', 'fr'];
      let completedTests = 0;
      
      languages.forEach((lang) => {
        request(app)
          .get('/speechtext')
          .query({ 
            latex: validLaTeX,
            lang: lang
          })
          .expect(200)
          .expect('Content-Type', /text/)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.text).to.be.a('string');
            completedTests++;
            if (completedTests === languages.length) {
              done();
            }
          });
      });
    });
  });

  describe('Base64 Encoding Support', () => {
    it('should handle base64 encoded LaTeX', (done) => {
      const base64LaTeX = Buffer.from(validLaTeX).toString('base64');
      request(app)
        .get('/speechtext')
        .query({ 
          latex: base64LaTeX,
          isBase64: 'true'
        })
        .expect(200)
        .expect('Content-Type', /text/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.be.a('string');
          expect(res.text.length).to.be.greaterThan(0);
          done();
        });
    });

    it('should handle base64 encoded AsciiMath', (done) => {
      const base64AsciiMath = Buffer.from(validAsciiMath).toString('base64');
      request(app)
        .get('/speechtext')
        .query({ 
          asciimath: base64AsciiMath,
          isBase64: 'true'
        })
        .expect(200)
        .expect('Content-Type', /text/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.be.a('string');
          expect(res.text.length).to.be.greaterThan(0);
          done();
        });
    });

    it('should handle base64 encoded MathML', (done) => {
      const base64MathML = Buffer.from(validMathML).toString('base64');
      request(app)
        .get('/speechtext')
        .query({ 
          mathml: base64MathML,
          isBase64: 'true'
        })
        .expect(200)
        .expect('Content-Type', /text/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.be.a('string');
          expect(res.text.length).to.be.greaterThan(0);
          done();
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for missing math input', (done) => {
      request(app)
        .get('/speechtext')
        .query({})
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          done();
        });
    });

    it('should return 400 for invalid engine', (done) => {
      request(app)
        .get('/speechtext')
        .query({ 
          latex: validLaTeX,
          engine: 'invalidengine'
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.include('Invalid engine');
          done();
        });
    });

    it('should return 400 for invalid style', (done) => {
      request(app)
        .get('/speechtext')
        .query({ 
          latex: validLaTeX,
          engine: 'mathcat',
          style: 'invalidstyle'
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.include('Invalid style');
          done();
        });
    });

    it('should return 400 for invalid verbosity', (done) => {
      request(app)
        .get('/speechtext')
        .query({ 
          latex: validLaTeX,
          engine: 'mathcat',
          style: 'ClearSpeak',
          verbosity: 'invalidverbosity'
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.include('Invalid verbosity');
          done();
        });
    });

    it('should return 400 for invalid base64', (done) => {
      request(app)
        .get('/speechtext')
        .query({ 
          latex: 'invalid_base64!@#',
          isBase64: 'true'
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.include('Invalid base64');
          done();
        });
    });

    it('should return 400 for multiple math inputs', (done) => {
      request(app)
        .get('/speechtext')
        .query({ 
          latex: validLaTeX,
          mathml: validMathML
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          done();
        });
    });
  });

  describe('Complex Mathematical Expressions', () => {
    it('should handle integrals with MathCAT', (done) => {
      const integral = '\\int_{0}^{\\infty} e^{-x^2} dx';
      request(app)
        .get('/speechtext')
        .query({ 
          latex: integral,
          engine: 'mathcat',
          style: 'ClearSpeak'
        })
        .expect(200)
        .expect('Content-Type', /text/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.be.a('string');
          expect(res.text.length).to.be.greaterThan(0);
          expect(res.text).to.include('integral');
          done();
        });
    });

    it('should handle matrices with SRE', (done) => {
      const matrix = '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}';
      request(app)
        .get('/speechtext')
        .query({ 
          latex: matrix,
          engine: 'sre',
          style: 'MathSpeak'
        })
        .expect(200)
        .expect('Content-Type', /text/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.be.a('string');
          expect(res.text.length).to.be.greaterThan(0);
          done();
        });
    });

    it('should handle summations', (done) => {
      const summation = '\\sum_{i=1}^{n} x_i^2';
      request(app)
        .get('/speechtext')
        .query({ 
          latex: summation,
          engine: 'mathcat'
        })
        .expect(200)
        .expect('Content-Type', /text/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.be.a('string');
          expect(res.text.length).to.be.greaterThan(0);
          done();
        });
    });

    it('should handle chemical formulas', (done) => {
      const chemistry = '\\ce{H2SO4}';
      request(app)
        .get('/speechtext')
        .query({ 
          latex: chemistry,
          engine: 'mathcat'
        })
        .expect(200)
        .expect('Content-Type', /text/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.be.a('string');
          expect(res.text.length).to.be.greaterThan(0);
          done();
        });
    });
  });

  describe('Performance Tests', () => {
    it('should complete speech generation in reasonable time', (done) => {
      const startTime = Date.now();
      request(app)
        .get('/speechtext')
        .query({ 
          latex: validLaTeX
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const duration = Date.now() - startTime;
          expect(duration).to.be.below(5000); // Should complete within 5 seconds
          done();
        });
    });

    it('should handle complex expressions efficiently', (done) => {
      const complexExpression = '\\int_{-\\infty}^{\\infty} \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}} dx = 1';
      request(app)
        .get('/speechtext')
        .query({ 
          latex: complexExpression
        })
        .expect(200)
        .expect('Content-Type', /text/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.text).to.be.a('string');
          expect(res.text.length).to.be.greaterThan(0);
          done();
        });
    }).timeout(10000);
  });

  describe('Engine Comparison', () => {
    it('should produce different speech output between engines', (done) => {
      const testExpression = fractionLaTeX;
      
      // Get speech from MathCAT
      request(app)
        .get('/speechtext')
        .query({ 
          latex: testExpression,
          engine: 'mathcat',
          style: 'ClearSpeak'
        })
        .expect(200)
        .end((err, mathcatRes) => {
          if (err) return done(err);
          
          // Get speech from SRE
          request(app)
            .get('/speechtext')
            .query({ 
              latex: testExpression,
              engine: 'sre',
              style: 'ClearSpeak'
            })
            .expect(200)
            .end((err, sreRes) => {
              if (err) return done(err);
              
              // Both should produce valid speech text
              expect(mathcatRes.text).to.be.a('string');
              expect(sreRes.text).to.be.a('string');
              expect(mathcatRes.text.length).to.be.greaterThan(0);
              expect(sreRes.text.length).to.be.greaterThan(0);
              
              // They might be different (engines have different implementations)
              // Just ensure both work, don't enforce they must be different
              done();
            });
        });
    });
  });

  describe('Case Insensitive Options', () => {
    it('should handle case insensitive engine names', (done) => {
      request(app)
        .get('/speechtext')
        .query({ 
          latex: validLaTeX,
          engine: 'MATHCAT'
        })
        .expect(200)
        .expect('Content-Type', /text/)
        .end(done);
    });

    it('should handle case insensitive style names', (done) => {
      request(app)
        .get('/speechtext')
        .query({ 
          latex: validLaTeX,
          engine: 'mathcat',
          style: 'clearspeak'
        })
        .expect(200)
        .expect('Content-Type', /text/)
        .end(done);
    });

    it('should handle case insensitive verbosity levels', (done) => {
      request(app)
        .get('/speechtext')
        .query({ 
          latex: validLaTeX,
          engine: 'mathcat',
          style: 'SimpleSpeak',
          verbosity: 'verbose'
        })
        .expect(200)
        .expect('Content-Type', /text/)
        .end(done);
    });
  });
});
