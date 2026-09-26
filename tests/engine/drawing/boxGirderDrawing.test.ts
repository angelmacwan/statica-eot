import { describe, it, expect } from 'vitest';
import {
  computeBoxGirderGeometry,
  boxGirderToSVG,
  boxGirderToDXF,
  generateBoxGirderDrawing,
} from '../../../src/engine/drawing/boxGirderDrawing';
import { boxBeamProperties } from '../../../src/engine/structural/boxBeamProperties';

describe('Box Girder Drawing Engine (Phase 1)', () => {
  const defaultInputs = {
    topFlangeWidthMm: 500.0,
    topFlangeThicknessMm: 12.0,
    webDepthMm: 1200.0,
    webThicknessMm: 8.0,
    webSpacingMm: 350.0,
    bottomFlangeWidthMm: 500.0,
    bottomFlangeThicknessMm: 12.0,
  };

  it('computes exact geometry matching boxBeamProperties defaults', () => {
    const geom = computeBoxGirderGeometry(defaultInputs);

    // Acceptance test requirement from backlog:
    // totalHeightMm = t_bf + h_w + t_tf = 12 + 1200 + 12 = 1224
    expect(geom.totalHeightMm).toBe(1224);
    expect(geom.totalWidthMm).toBe(500);
    expect(geom.topFlangeWidthMm).toBe(500);
    expect(geom.bottomFlangeWidthMm).toBe(500);
    expect(geom.webDepthMm).toBe(1200);
    expect(geom.webThicknessMm).toBe(8);
    expect(geom.webSpacingMm).toBe(350);
    expect(geom.webCenterDistanceMm).toBe(358); // 350 + 8
    expect(geom.webOuterDistanceMm).toBe(366); // 350 + 2*8

    // Cross-check against boxBeamProperties calc output
    const calcRes = boxBeamProperties.calculate(defaultInputs);
    const neutralAxisFromBottom = calcRes.outputs.neutralAxisFromBottomMm.value as number;
    // For symmetric box, totalHeightMm === neutralAxisFromBottom * 2
    expect(geom.totalHeightMm).toBeCloseTo(neutralAxisFromBottom * 2, 4);
  });

  it('computes asymmetric flange widths and thicknesses correctly', () => {
    const geom = computeBoxGirderGeometry({
      topFlangeWidthMm: 600,
      topFlangeThicknessMm: 16,
      webDepthMm: 1400,
      webThicknessMm: 10,
      webSpacingMm: 400,
      bottomFlangeWidthMm: 550,
      bottomFlangeThicknessMm: 14,
    });

    expect(geom.totalHeightMm).toBe(16 + 1400 + 14); // 1430
    expect(geom.totalWidthMm).toBe(600);
    expect(geom.topFlange.width).toBe(600);
    expect(geom.topFlange.height).toBe(16);
    expect(geom.bottomFlange.width).toBe(550);
    expect(geom.bottomFlange.height).toBe(14);
    expect(geom.leftWeb.width).toBe(10);
    expect(geom.leftWeb.height).toBe(1400);
    expect(geom.rightWeb.width).toBe(10);
  });

  it('generates valid SVG string containing required elements', () => {
    const svg = boxGirderToSVG(defaultInputs);

    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox=');
    expect(svg).toContain('BOX GIRDER CROSS SECTION');
    expect(svg).toContain('Top Flange: 500 mm');
    expect(svg).toContain('Bottom Flange: 500 mm');
    expect(svg).toContain('Total Height: 1224 mm');
  });

  it('generates valid DXF R12 string with HEADER, ENTITIES, and EOF', () => {
    const dxf = boxGirderToDXF(defaultInputs);

    expect(typeof dxf).toBe('string');
    expect(dxf).toContain('HEADER');
    expect(dxf).toContain('$ACADVER\n1\nAC1009');
    expect(dxf).toContain('$INSUNITS\n70\n4');
    expect(dxf).toContain('ENTITIES');
    expect(dxf).toContain('LINE');
    expect(dxf).toContain('TEXT');
    expect(dxf).toContain('EOF');
  });

  it('produces DrawingResult bundle', () => {
    const bundle = generateBoxGirderDrawing(defaultInputs);

    expect(bundle.title).toBe('Box Girder Cross Section');
    expect(bundle.filename).toBe('box_girder_cross_section');
    expect(bundle.svg).toContain('<svg');
    expect(bundle.dxf).toContain('AC1009');
  });
});
