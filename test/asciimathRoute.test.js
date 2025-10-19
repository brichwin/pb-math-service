const { expect } = require('chai');
const request = require('supertest');
const app = require('../app');

const extractMessageFromSvg = (svgString) => {
  if (!svgString || typeof svgString !== 'string') {
    throw new Error('Invalid SVG string');
  }
  
  const match = svgString.match(/<text[^>]*>([\s\S]*?)<\/text>/);
  
  if (!match) {
    throw new Error('No text element found in SVG');
  }
  
  return match[1].trim();
}

describe('AsciiMath Route Tests', () => {
  const validAsciiMath = 'x = 2';
  const complexAsciiMath = 'E = mc^2';
  const fractionAsciiMath = 'a/b';
  const integralAsciiMath = 'int_0^oo e^(-x) dx';
  
  describe('SVG Output', () => {
    it('should return SVG when svg=1 is specified', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          expect(svgContent).to.include('<?xml version="1.0"');
          done();
        });
    });

    it('should return SVG when svg=true is specified', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 'true', asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          expect(svgContent).to.include('<?xml version="1.0"');
          done();
        });
    });

    it('should return SVG with custom scale parameter', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 1, scale: 2, asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          done();
        });
    });

    it('should return SVG with custom color parameter', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 1, fg: 'ff0000', asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          expect(svgContent).to.include('#ff0000');
          done();
        });
    });

    it('should return SVG with display mode enabled', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 1, display: 'true', asciimath: complexAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          done();
        });
    });

    it('should return SVG with custom font family', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 1, family: 'serif', asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          done();
        });
    });
  });

  describe('PNG Output', () => {
    it('should return PNG by default (no svg parameter)', (done) => {
      request(app)
        .get('/asciimath')
        .query({ asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Buffer);
          // Check PNG signature
          expect(res.body[0]).to.equal(0x89);
          expect(res.body[1]).to.equal(0x50);
          expect(res.body[2]).to.equal(0x4E);
          expect(res.body[3]).to.equal(0x47);
          done();
        });
    });

    it('should return PNG when svg=false', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 'false', asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Buffer);
          done();
        });
    });

    it('should return PNG with custom scale', (done) => {
      request(app)
        .get('/asciimath')
        .query({ scale: 3, asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Buffer);
          done();
        });
    });

    it('should return PNG with custom color', (done) => {
      request(app)
        .get('/asciimath')
        .query({ fg: '0000ff', asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Buffer);
          done();
        });
    });
  });

  describe('Error Handling', () => {
    it('should return SVG error msg for missing AsciiMath', (done) => {
      request(app)
        .get('/asciimath')
        .query({})
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          const message = extractMessageFromSvg(svgContent);
          expect(message).to.include('Missing required parameter', 
            `Expected message to include 'Missing required parameter' but got: "${message}"`);
          done();
        });
    });

    it('should return SVG error msg for empty AsciiMath', (done) => {
      request(app)
        .get('/asciimath')
        .query({ asciimath: '' })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          const message = extractMessageFromSvg(svgContent);
          expect(message).to.include('Missing required parameter', 
            `Expected message to include 'Missing required parameter' but got: "${message}"`);
          done();
        });
    });

    it('should handle invalid svg parameter gracefully', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 'invalid', asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end(done);
    });

    it('should handle invalid color parameter gracefully', (done) => {
      request(app)
        .get('/asciimath')
        .query({ fg: 'invalidcolor', asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end(done);
    });

    it('should return an image for malformed AsciiMath', (done) => {
      request(app)
        .get('/asciimath')
        .query({ asciimath: 'malformed(((' })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Buffer);
          done();
        });
    });
  });

  describe('Complex AsciiMath', () => {
    it('should handle fractions', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: fractionAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle integrals', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: integralAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle square roots', (done) => {
      const sqrtAsciiMath = 'sqrt(x^2 + y^2)';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: sqrtAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle matrices', (done) => {
      const matrixAsciiMath = '[[a, b], [c, d]]';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: matrixAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle summations', (done) => {
      const sumAsciiMath = 'sum_(i=1)^n x_i';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: sumAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle limits', (done) => {
      const limitAsciiMath = 'lim_(x->oo) (1 + 1/x)^x = e';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: limitAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle Greek letters', (done) => {
      const greekAsciiMath = 'alpha + beta + gamma + delta';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: greekAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle trigonometric functions', (done) => {
      const trigAsciiMath = 'sin(theta) + cos(phi) = 1';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: trigAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });
  });

  describe('Base64 Encoding Support', () => {
    it('should handle base64 encoded AsciiMath', (done) => {
      const base64AsciiMath = Buffer.from(validAsciiMath).toString('base64');
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: base64AsciiMath, isBase64: 'true' })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          done();
        });
    });

    it('should return 400 for invalid base64', (done) => {
      request(app)
        .get('/asciimath')
        .query({ asciimath: 'invalid_base64!@#', isBase64: 'true' })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          const message = extractMessageFromSvg(svgContent);
          expect(message).to.include('Invalid base64 string', 
            `Expected message to include 'Invalid base64 string' but got: "${message}"`);
          done();
        });
    });
  });

  describe('Performance and Limits', () => {
    it('should handle complex AsciiMath expressions', (done) => {
      const complexAsciiMath = 'int_(-oo)^oo 1/sqrt(2pi sigma^2) * e^(-(x-mu)^2/(2sigma^2)) dx = 1';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: complexAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    }).timeout(5000);

    it('should complete requests in reasonable time', (done) => {
      const startTime = Date.now();
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: complexAsciiMath })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const duration = Date.now() - startTime;
          expect(duration).to.be.below(3000); // Should complete within 3 seconds
          done();
        });
    });

    it('should handle inline math mode', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 1, display: 'false', asciimath: validAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle display math mode', (done) => {
      request(app)
        .get('/asciimath')
        .query({ svg: 1, display: 'true', asciimath: fractionAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });
  });

  describe('AsciiMath Specific Features', () => {
    it('should handle vector notation', (done) => {
      const vectorAsciiMath = 'vec(v) = <<1, 2, 3>>';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: vectorAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle set notation', (done) => {
      const setAsciiMath = '{x | x in RR, x > 0}';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: setAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle absolute values', (done) => {
      const absAsciiMath = '|x| = {(x, if x >= 0), (-x, if x < 0):}';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: absAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle derivatives', (done) => {
      const derivAsciiMath = '(d f)/(d x) = f\'(x)';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: derivAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle logarithms', (done) => {
      const logAsciiMath = 'log_a(x) = (ln x)/(ln a)';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: logAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle binomial coefficients', (done) => {
      const binomialAsciiMath = '(n; k) = (n!)/(k!(n-k)!)';
      request(app)
        .get('/asciimath')
        .query({ svg: 1, asciimath: binomialAsciiMath })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });
  });
});
