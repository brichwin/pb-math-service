const { expect } = require('chai');
const request = require('supertest');
const app = require('../app');

describe('MathML Route Tests', () => {
  const validMathML = '<math><mi>x</mi><mo>=</mo><mn>2</mn></math>';
  const complexMathML = '<math><mrow><mi>E</mi><mo>=</mo><mi>m</mi><msup><mi>c</mi><mn>2</mn></msup></mrow></math>';
  
  describe('SVG Output', () => {
    it('should return SVG when svg=1 is specified', (done) => {
      request(app)
        .get('/mathml')
        .query({ svg: 1, mathml: validMathML })
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
        .get('/mathml')
        .query({ svg: 'true', mathml: validMathML })
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
        .get('/mathml')
        .query({ svg: 1, scale: 2, mathml: validMathML })
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
        .get('/mathml')
        .query({ svg: 1, fg: 'ff0000', mathml: validMathML })
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
        .get('/mathml')
        .query({ svg: 1, display: 'true', mathml: complexMathML })
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
        .get('/mathml')
        .query({ svg: 1, family: 'serif', mathml: validMathML })
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
        .get('/mathml')
        .query({ mathml: validMathML })
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
        .get('/mathml')
        .query({ svg: 'false', mathml: validMathML })
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
        .get('/mathml')
        .query({ scale: 3, mathml: validMathML })
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
        .get('/mathml')
        .query({ fg: '0000ff', mathml: validMathML })
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
    it('should return 400 for missing MathML', (done) => {
      request(app)
        .get('/mathml')
        .query({})
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          expect(res.body.error).to.include('mathml');
          done();
        });
    });

    it('should return 400 for empty MathML', (done) => {
      request(app)
        .get('/mathml')
        .query({ mathml: '' })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('error');
          done();
        });
    });

    it('should handle invalid svg parameter gracefully', (done) => {
      request(app)
        .get('/mathml')
        .query({ svg: 'invalid', mathml: validMathML })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end(done);
    });

    it('should handle invalid color parameter gracefully', (done) => {
      request(app)
        .get('/mathml')
        .query({ fg: 'invalidcolor', mathml: validMathML })
        .expect(200)
        .expect('Content-Type', 'image/png')
        .end(done);
    });
  });

  describe('Complex MathML', () => {
    it('should handle fractions', (done) => {
      const fractionMathML = '<math><mfrac><mi>a</mi><mi>b</mi></mfrac></math>';
      request(app)
        .get('/mathml')
        .query({ svg: 1, mathml: fractionMathML })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle square roots', (done) => {
      const sqrtMathML = '<math><msqrt><mi>x</mi></msqrt></math>';
      request(app)
        .get('/mathml')
        .query({ svg: 1, mathml: sqrtMathML })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle subscripts and superscripts', (done) => {
      const scriptMathML = '<math><msub><mi>x</mi><mn>1</mn></msub><msup><mi>y</mi><mn>2</mn></msup></math>';
      request(app)
        .get('/mathml')
        .query({ svg: 1, mathml: scriptMathML })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });

    it('should handle matrices', (done) => {
      const matrixMathML = `<math>
        <mtable>
          <mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr>
          <mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr>
        </mtable>
      </math>`;
      request(app)
        .get('/mathml')
        .query({ svg: 1, mathml: matrixMathML })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    });
  });

  describe('Performance and Limits', () => {
    it('should handle large MathML expressions', (done) => {
      const largeMathML = '<math>' + '<mi>x</mi><mo>+</mo>'.repeat(100) + '<mn>1</mn></math>';
      request(app)
        .get('/mathml')
        .query({ svg: 1, mathml: largeMathML })
        .expect(200)
        .expect('Content-Type', /svg/)
        .end(done);
    }).timeout(5000);

    it('should complete requests in reasonable time', (done) => {
      const startTime = Date.now();
      request(app)
        .get('/mathml')
        .query({ svg: 1, mathml: complexMathML })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          const duration = Date.now() - startTime;
          expect(duration).to.be.below(3000); // Should complete within 3 seconds
          done();
        });
    });
  });

});