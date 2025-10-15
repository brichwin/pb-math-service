const { expect } = require('chai');
const request = require('supertest');
const app = require('../app');

describe('LaTeX Route Tests', () => {
  const validLaTeX = 'x = 2';
  const complexLaTeX = 'E = mc^2';
  const fractionLaTeX = '\\frac{a}{b}';
  const integralLaTeX = '\\int_{0}^{\\infty} e^{-x} dx';
  
  describe('SVG Output', () => {
    it('should return SVG when svg=1 is specified', (done) => {
      request(app)
        .get('/latex')
        .query({ svg: 1, latex: validLaTeX })
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
        .get('/latex')
        .query({ svg: 'true', latex: validLaTeX })
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
        .get('/latex')
        .query({ svg: 1, scale: 2, latex: validLaTeX })
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
        .get('/latex')
        .query({ svg: 1, fg: 'ff0000', latex: validLaTeX })
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
        .get('/latex')
        .query({ svg: 1, display: 'true', latex: complexLaTeX })
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
        .get('/latex')
        .query({ svg: 1, family: 'serif', latex: validLaTeX })
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
        .get('/latex')
        .query({ latex: validLaTeX })
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
        .get('/latex')
        .query({ svg: 'false', latex: validLaTeX })
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
        .get('/latex')
        .query({ scale: 3, latex: validLaTeX })
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
        .get('/latex')
        .query({ fg: '0000ff', latex: validLaTeX })
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
    it('should return 400 for missing LaTeX', (done) => {
      request(app)
        .get('/latex')
        .query({})
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.include('latex');
          done();
        });
    });

    it('should return 400 for empty LaTeX', (done) => {
      request(app)
        .get('/latex')
        .query({ latex: '' })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          done();
        });
    });

    it('should handle invalid svg parameter gracefully', (done) => {
      request(app)
        .get('/latex')
        .query({ svg: 'invalid', latex: validLaTeX })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end(done);
    });

    it('should handle invalid color parameter gracefully', (done) => {
      request(app)
        .get('/latex')
        .query({ fg: 'invalidcolor', latex: validLaTeX })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end(done);
    });

    it('should return an image for invalid LaTeX syntax', (done) => {
      request(app)
        .get('/latex')
        .query({ latex: '\\invalidcommand{test}' })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Buffer);
          done();
        });
    });
  });

  describe('Complex LaTeX', () => {
    it('should handle fractions', (done) => {
      request(app)
        .get('/latex')
        .query({ svg: 1, latex: fractionLaTeX })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle integrals', (done) => {
      request(app)
        .get('/latex')
        .query({ svg: 1, latex: integralLaTeX })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle square roots', (done) => {
      const sqrtLaTeX = '\\sqrt{x^2 + y^2}';
      request(app)
        .get('/latex')
        .query({ svg: 1, latex: sqrtLaTeX })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle matrices', (done) => {
      const matrixLaTeX = '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}';
      request(app)
        .get('/latex')
        .query({ svg: 1, latex: matrixLaTeX })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle summations', (done) => {
      const sumLaTeX = '\\sum_{i=1}^{n} x_i';
      request(app)
        .get('/latex')
        .query({ svg: 1, latex: sumLaTeX })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle chemical formulas with mhchem', (done) => {
      const chemLaTeX = '\\ce{H2SO4}';
      request(app)
        .get('/latex')
        .query({ svg: 1, latex: chemLaTeX })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });
  });

  describe('Base64 Encoding Support', () => {
    it('should handle base64 encoded LaTeX', (done) => {
      const base64LaTeX = Buffer.from(validLaTeX).toString('base64');
      request(app)
        .get('/latex')
        .query({ svg: 1, latex: base64LaTeX, isBase64: 'true' })
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
        .get('/latex')
        .query({ latex: 'invalid_base64!@#', isBase64: 'true' })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.include('Invalid base64');
          done();
        });
    });
  });

  describe('Performance and Limits', () => {
    it('should handle complex LaTeX expressions', (done) => {
      const complexLaTeX = '\\int_{-\\infty}^{\\infty} \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}} dx = 1';
      request(app)
        .get('/latex')
        .query({ svg: 1, latex: complexLaTeX })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    }).timeout(5000);

    it('should complete requests in reasonable time', (done) => {
      const startTime = Date.now();
      request(app)
        .get('/latex')
        .query({ svg: 1, latex: complexLaTeX })
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
        .get('/latex')
        .query({ svg: 1, display: 'false', latex: validLaTeX })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle display math mode', (done) => {
      request(app)
        .get('/latex')
        .query({ svg: 1, display: 'true', latex: fractionLaTeX })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });
  });
});
