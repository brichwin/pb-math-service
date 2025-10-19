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

describe('Base64 Encoded Formulas', () => {
  
  describe('LaTeX Format', () => {
    it('should handle simple base64 encoded formula', (done) => {
      const formula = 'x^2 + y^2 = z^2';
      const base64Formula = Buffer.from(formula).toString('base64');
      
      request(app)
        .get('/latex')
        .query({ 
          latex: base64Formula, 
          isBase64: 'true',
          svg: '1'
        })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          done();
        });
    });

    it('should handle complex base64 encoded formula', (done) => {
      const formula = '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}';
      const base64Formula = Buffer.from(formula).toString('base64');
      
      request(app)
        .get('/latex')
        .query({ 
          latex: base64Formula, 
          isBase64: 'true',
          svg: '1'
        })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          done();
        });
    });

    it('should handle base64 encoded formula with special characters', (done) => {
      const formula = '\\alpha\\beta\\gamma\\delta';
      const base64Formula = Buffer.from(formula).toString('base64');
      
      request(app)
        .get('/latex')
        .query({ 
          latex: base64Formula, 
          isBase64: 'true',
          svg: '1'
        })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          done();
        });
    });

    it('should handle base64 encoded formula with matrices', (done) => {
      const formula = '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}';
      const base64Formula = Buffer.from(formula).toString('base64');
      
      request(app)
        .get('/latex')
        .query({ 
          latex: base64Formula, 
          isBase64: 'true',
          svg: '1'
        })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          done();
        });
    });

    it('should handle base64 encoded formula with physics package', (done) => {
      const formula = '\\dv{f}{x}, \\pdv{f}{x}, \\expval{A}, \\ket{\\psi}';
      const base64Formula = Buffer.from(formula).toString('base64');
      
      request(app)
        .get('/latex')
        .query({ 
          latex: base64Formula, 
          isBase64: 'true',
          svg: '1'
        })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          done();
        });
    });

    it('should generate PNG for base64 encoded formula', (done) => {
      const formula = '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}';
      const base64Formula = Buffer.from(formula).toString('base64');
      
      request(app)
        .get('/latex')
        .query({ 
          latex: base64Formula, 
          isBase64: 'true'
        })
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

    it('should handle double base64 encoding differently than single encoding', (done) => {
      // Original formula
      const formula = '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}';
      
      // Single encode
      const singleEncoded = Buffer.from(formula).toString('base64');
      
      // Double encode  
      const doubleEncoded = Buffer.from(singleEncoded).toString('base64');
      
      // Test single encoded (should work)
      request(app)
        .get('/latex')
        .query({ 
          latex: singleEncoded, 
          isBase64: 'true',
          svg: '1'
        })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, singleRes) => {
          if (err) return done(err);
          
          // Test double encoded (should produce different result - likely error)
          request(app)
            .get('/latex')
            .query({ 
              latex: doubleEncoded, 
              isBase64: 'true',
              svg: '1'
            })
            .end((err, doubleRes) => {
              // Either should fail (400) or produce different content
              const outputsAreDifferent = 
                (singleRes.status !== doubleRes.status) ||
                (singleRes.headers['content-type'] !== doubleRes.headers['content-type']) ||
                (singleRes.text !== doubleRes.text);
              
              expect(outputsAreDifferent).to.be.true;
              done();
            });
        });
    });
  });

  describe('MathML Format', () => {
    it('should handle base64 encoded MathML formula', (done) => {
      const formula = '<math><mi>x</mi><mo>=</mo><mn>2</mn></math>';
      const base64Formula = Buffer.from(formula).toString('base64');
      
      request(app)
        .get('/mathml')
        .query({ 
          mathml: base64Formula, 
          isBase64: 'true',
          svg: '1'
        })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          done();
        });
    });

    it('should generate PNG for base64 encoded MathML formula', (done) => {
      const formula = '<math><mi>x</mi><mo>=</mo><mn>2</mn></math>';
      const base64Formula = Buffer.from(formula).toString('base64');
      
      request(app)
        .get('/mathml')
        .query({ 
          mathml: base64Formula, 
          isBase64: 'true'
        })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Buffer);
          done();
        });
    });
  });

  describe('AsciiMath Format', () => {
    it('should handle base64 encoded AsciiMath formula', (done) => {
      const formula = 'sum_(i=1)^n i^3=((n(n+1))/2)^2';
      const base64Formula = Buffer.from(formula).toString('base64');
      
      request(app)
        .get('/asciimath')
        .query({ 
          asciimath: base64Formula, 
          isBase64: 'true',
          svg: '1'
        })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end((err, res) => {
          if (err) return done(err);
          const svgContent = res.text || res.body.toString();
          expect(svgContent).to.include('<svg');
          done();
        });
    });

    it('should generate PNG for base64 encoded AsciiMath formula', (done) => {
      const formula = 'x^n + y^n = z^n';
      const base64Formula = Buffer.from(formula).toString('base64');
      
      request(app)
        .get('/asciimath')
        .query({ 
          asciimath: base64Formula, 
          isBase64: 'true'
        })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Buffer);
          done();
        });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty base64 encoded formula', (done) => {
      const base64Formula = Buffer.from('').toString('base64');
      
      request(app)
        .get('/latex')
        .query({ 
          latex: base64Formula, 
          isBase64: 'true'
        })
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

    it('should handle invalid base64 encoded formula', (done) => {
      const invalidBase64 = 'not-valid-base64!@#$';
      
      request(app)
        .get('/latex')
        .query({ 
          latex: invalidBase64, 
          isBase64: 'true'
        })
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

    it('should handle base64 with padding issues', (done) => {
      // Create a base64 string with incorrect padding
      const formula = 'x=2';
      const base64Formula = Buffer.from(formula).toString('base64');
      const malformedBase64 = base64Formula.slice(0, -1); // Remove padding
      
      request(app)
        .get('/latex')
        .query({ 
          latex: malformedBase64, 
          isBase64: 'true'
        })
        .expect(200)
        .expect('Content-Type', /png/)
        .end(done);
    });

    it('should handle base64 with whitespace', (done) => {
      const formula = 'x^2 + y^2 = z^2';
      const base64Formula = Buffer.from(formula).toString('base64');
      const base64WithWhitespace = '  ' + base64Formula + '  \n';
      
      request(app)
        .get('/latex')
        .query({ 
          latex: base64WithWhitespace, 
          isBase64: 'true'
        })
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

    it('should handle non-base64 when isBase64=false', (done) => {
      const formula = 'x^2 + y^2 = z^2';
      
      request(app)
        .get('/latex')
        .query({ 
          latex: formula, 
          isBase64: 'false'
        })
        .expect(200)
        .expect('Content-Type', /png/)
        .end(done);
    });

    it('should handle base64 parameter variations', (done) => {
      const formula = 'x=2';
      const base64Formula = Buffer.from(formula).toString('base64');
      
      // Test different truthy values for isBase64
      const testCases = ['1', 'true', 'TRUE', 'yes', 'on'];
      let completedTests = 0;
      
      testCases.forEach((value) => {
        request(app)
          .get('/latex')
          .query({ 
            latex: base64Formula, 
            isBase64: value,
            svg: '1'
          })
          .expect(200)
          .expect('Content-Type', /svg/)
          .end((err) => {
            if (err) return done(err);
            completedTests++;
            if (completedTests === testCases.length) {
              done();
            }
          });
      });
    });
  });

  describe('Security Tests', () => {
    it('should not execute code in base64 decoded content', (done) => {
      // Try to inject potentially harmful content
      const maliciousContent = '<script>alert("xss")</script>';
      const base64Malicious = Buffer.from(maliciousContent).toString('base64');
      
      request(app)
        .get('/latex')
        .query({ 
          latex: base64Malicious, 
          isBase64: 'true'
        })
        .end((err, res) => {
          // Should either return 400 (invalid LaTeX) or process as LaTeX (safe)
          // Should NOT execute any script content
          expect(res.status).to.be.oneOf([200, 400]);
          if (res.status === 200) {
            expect(res.headers['content-type']).to.match(/image\/(png|svg)/);
          }
          done();
        });
    });

    it('should handle very long base64 strings', (done) => {
      // Create a very long formula
      const longFormula = 'x = ' + 'a + '.repeat(1000) + '1';
      const base64Formula = Buffer.from(longFormula).toString('base64');
      
      request(app)
        .get('/latex')
        .query({ 
          latex: base64Formula, 
          isBase64: 'true',
          svg: '1'
        })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    }).timeout(10000);
  });
});
