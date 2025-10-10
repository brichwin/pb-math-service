const { applySvgColor } = require('../services/imageConverter');
const assert = require('assert');
const { test } = require('node:test');

test('should add style attribute when none exists', () => {
  const svg = '<svg width="100" height="100"><circle/></svg>';
  const result = applySvgColor(svg, 'FF0000');
  
  assert(result.includes('style="color: #FF0000;"'), 'Should add style with color');
});

test('should update existing style without color', () => {
  const svg = '<svg style="fill: blue;" width="100"><circle/></svg>';
  const result = applySvgColor(svg, 'FF0000');
  
  assert(result.includes('color: #FF0000'), 'Should add color to existing style');
  assert(result.includes('fill: blue'), 'Should preserve existing properties');
});

test('should replace existing color in style', () => {
  const svg = '<svg style="color: #0000FF; fill: red;" width="100"><circle/></svg>';
  const result = applySvgColor(svg, 'FF0000');
  
  assert(result.includes('color: #FF0000'), 'Should update color');
  assert(result.includes('fill: red'), 'Should preserve other properties');
  assert(!result.includes('#0000FF'), 'Should not contain old color');
});

test('should handle style with no semicolon', () => {
  const svg = '<svg style="fill: blue" width="100"><circle/></svg>';
  const result = applySvgColor(svg, 'FF0000');
  
  assert(result.includes('color: #FF0000'), 'Should add color');
  assert(result.includes('fill: blue'), 'Should preserve fill');
});

test('should handle default black color', () => {
  const svg = '<svg width="100"><circle/></svg>';
  const result = applySvgColor(svg, '000000');
  
  assert(result.includes('color: #000000'), 'Should add black color');
});

test('should handle invalid color by using default', () => {
  const svg = '<svg width="100"><circle/></svg>';
  const result = applySvgColor(svg, 'invalid');
  
  assert(result.includes('color: #000000'), 'Should use default black for invalid color');
});