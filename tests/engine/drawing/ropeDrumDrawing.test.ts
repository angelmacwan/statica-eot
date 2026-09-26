import { describe, it, expect } from 'vitest';
import {
  computeRopeDrumGeometry,
  ropeDrumToSVG,
  ropeDrumToDXF,
  generateRopeDrumDrawing,
} from '../../../src/engine/drawing/ropeDrumDrawing';
import { ropeDrum } from '../../../src/engine/mechanism/ropeDrum';

describe('Rope Drum Drawing Engine (Phase 1)', () => {
  const defaultInputs = {
    selectedDrumDiameterMm: 320.0,
    drumLengthMm: 1869.155,
    selectedGroovePitchMm: 18.0,
    totalGroovesPerSide: 34.0,
    centerUngroovedLengthMm: 450.0,
    endFlangeAllowanceMm: 100.0,
  };

  it('computes exact geometry matching ropeDrum inputs/outputs', () => {
    const geom = computeRopeDrumGeometry(defaultInputs);

    expect(geom.diameterMm).toBe(320);
    expect(geom.lengthMm).toBe(1869.155);
    expect(geom.groovePitchMm).toBe(18);
    expect(geom.totalGroovesPerSide).toBe(34);
    expect(geom.centerUngroovedLengthMm).toBe(450);
    expect(geom.endAllowanceMm).toBe(100);
    expect(geom.groovedLengthPerSideMm).toBe(34 * 18); // 612
    expect(geom.numGroovesToDraw).toBe(34);
    expect(geom.endViewRadiusMm).toBe(160);
  });

  it('derives drum length automatically if not explicitly provided', () => {
    const geom = computeRopeDrumGeometry({
      selectedDrumDiameterMm: 320.0,
      selectedGroovePitchMm: 18.0,
      totalGroovesPerSide: 34.0,
      centerUngroovedLengthMm: 450.0,
      endFlangeAllowanceMm: 100.0,
    });

    // 2 * (34 * 18) + 450 + 200 = 1224 + 450 + 200 = 1874
    expect(geom.lengthMm).toBe(1874);
  });

  it('caps number of grooves drawn to never exceed side width', () => {
    const geom = computeRopeDrumGeometry({
      selectedDrumDiameterMm: 250,
      drumLengthMm: 500,
      selectedGroovePitchMm: 16,
      totalGroovesPerSide: 10,
    });

    expect(geom.numGroovesToDraw).toBe(10);
  });

  it('generates valid SVG with side profile and circular end view', () => {
    const svg = ropeDrumToSVG(defaultInputs);

    expect(typeof svg).toBe('string');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('ROPE DRUM (Ø320 mm × 1869 mm)');
    expect(svg).toContain('SIDE ELEVATION');
    expect(svg).toContain('END VIEW');
    expect(svg).toContain('Drum Length (L): 1869.2 mm');
  });

  it('generates valid DXF R12 string for rope drum', () => {
    const dxf = ropeDrumToDXF(defaultInputs);

    expect(typeof dxf).toBe('string');
    expect(dxf).toContain('HEADER');
    expect(dxf).toContain('AC1009');
    expect(dxf).toContain('ENTITIES');
    expect(dxf).toContain('CIRCLE');
    expect(dxf).toContain('LINE');
    expect(dxf).toContain('TEXT');
    expect(dxf).toContain('EOF');
  });

  it('produces DrawingResult bundle', () => {
    const bundle = generateRopeDrumDrawing(defaultInputs);

    expect(bundle.title).toBe('Rope Drum Detail & Grooving');
    expect(bundle.filename).toBe('rope_drum_drawing');
    expect(bundle.svg).toContain('<svg');
    expect(bundle.dxf).toContain('AC1009');
  });
});
