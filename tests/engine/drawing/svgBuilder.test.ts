import { describe, it, expect } from 'vitest';
import {
  rect,
  circle,
  line,
  centerline,
  text,
  horizontalDimension,
  verticalDimension,
  svgDocument,
} from '../../../src/engine/drawing/svgBuilder';

describe('SVG Builder Primitives', () => {
  it('builds valid rect element', () => {
    const el = rect(10, 20, 100, 200, { fill: '#fff', stroke: '#000', strokeWidth: 2 });
    expect(el).toBe('<rect x="10" y="20" width="100" height="200" fill="#fff" stroke="#000" stroke-width="2" />');
  });

  it('builds valid circle element', () => {
    const el = circle(50, 50, 25, { fill: 'red' });
    expect(el).toContain('cx="50" cy="50" r="25" fill="red"');
  });

  it('builds valid line and centerline', () => {
    const l = line(0, 0, 10, 10);
    expect(l).toContain('x1="0" y1="0" x2="10" y2="10"');

    const cl = centerline(0, 0, 100, 0);
    expect(cl).toContain('stroke-dasharray="12,4,3,4"');
  });

  it('builds horizontal and vertical dimensions with labels', () => {
    const hDim = horizontalDimension(0, 100, 50, '100 mm', 0);
    expect(hDim).toContain('100 mm');
    expect(hDim).toContain('polygon');

    const vDim = verticalDimension(0, 100, 50, '100 mm', 0);
    expect(vDim).toContain('100 mm');
    expect(vDim).toContain('transform="rotate(-90');
  });

  it('wraps content into full SVG document with viewBox', () => {
    const doc = svgDocument({ minX: 0, minY: 0, width: 500, height: 400 }, '<g></g>');
    expect(doc).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(doc).toContain('viewBox="0 0 500 400"');
    expect(doc).toContain('</svg>');
  });
});
