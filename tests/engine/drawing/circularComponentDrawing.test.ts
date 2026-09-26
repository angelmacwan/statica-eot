import { describe, it, expect } from 'vitest';
import {
  computeWheelGeometry,
  wheelToSVG,
  wheelToDXF,
  generateWheelDrawing,
  computeSheaveGeometry,
  sheaveToSVG,
  sheaveToDXF,
  generateSheaveDrawing,
} from '../../../src/engine/drawing/circularComponentDrawing';

describe('Circular Component Drawing Engine (Phase 2)', () => {
  describe('Crane Wheel Geometry & Drawings', () => {
    const wheelInputs = {
      selectedWheelDiameterMm: 200,
      treadWidthMm: 75,
      flangeHeightMm: 25,
      hubBoreMm: 60,
    };

    it('computes wheel geometry with tread width and flange elevations', () => {
      const geom = computeWheelGeometry(wheelInputs);

      expect(geom.treadDiameterMm).toBe(200);
      expect(geom.treadWidthMm).toBe(75);
      expect(geom.flangeHeightMm).toBe(25);
      expect(geom.outerFlangeDiameterMm).toBe(250); // 200 + 2*25
      expect(geom.hubBoreMm).toBe(60);
      expect(geom.totalWheelWidthMm).toBeGreaterThan(75);
    });

    it('generates valid SVG for wheel elevation and cross-section', () => {
      const svg = wheelToSVG(wheelInputs, 'TEST WHEEL');

      expect(svg).toContain('<svg');
      expect(svg).toContain('TEST WHEEL');
      expect(svg).toContain('FRONT ELEVATION');
      expect(svg).toContain('CROSS-SECTION PROFILE');
      expect(svg).toContain('Tread: 75 mm');
      expect(svg).toContain('Tread Dia: Ø200 mm');
    });

    it('generates valid DXF R12 for wheel', () => {
      const dxf = wheelToDXF(wheelInputs, 'LT WHEEL');

      expect(dxf).toContain('HEADER');
      expect(dxf).toContain('AC1009');
      expect(dxf).toContain('CIRCLE');
      expect(dxf).toContain('LINE');
      expect(dxf).toContain('EOF');
    });

    it('creates DrawingResult bundle for cross-travel and long-travel', () => {
      const ctBundle = generateWheelDrawing(wheelInputs, 'cross-travel');
      expect(ctBundle.title).toContain('Cross Travel');
      expect(ctBundle.filename).toBe('cross_travel_wheel_drawing');

      const ltBundle = generateWheelDrawing(wheelInputs, 'long-travel');
      expect(ltBundle.title).toContain('Long Travel');
      expect(ltBundle.filename).toBe('long_travel_wheel_drawing');
    });
  });

  describe('Sheave Geometry & Drawings', () => {
    const sheaveInputs = {
      selectedMainSheaveMm: 320,
      selectedEqualizingSheaveMm: 200,
      sheaveGrooveWidthMm: 24,
      hubBoreMm: 50,
      ropeDiameterMm: 16,
    };

    it('computes main sheave and equalizer sheave geometry', () => {
      const mainGeom = computeSheaveGeometry(sheaveInputs, false);
      expect(mainGeom.pcdMm).toBe(320);
      expect(mainGeom.rimWidthMm).toBe(24);
      expect(mainGeom.hubBoreMm).toBe(50);
      expect(mainGeom.outerDiameterMm).toBeGreaterThan(320);

      const eqGeom = computeSheaveGeometry(sheaveInputs, true);
      expect(eqGeom.pcdMm).toBe(200);
      expect(eqGeom.rimWidthMm).toBe(24);
    });

    it('generates valid SVG and DXF for sheaves', () => {
      const svg = sheaveToSVG(sheaveInputs, false);
      expect(svg).toContain('MAIN LOAD SHEAVE');
      expect(svg).toContain('PCD: Ø320 mm');
      expect(svg).toContain('GROOVE SECTION');

      const dxf = sheaveToDXF(sheaveInputs, false);
      expect(dxf).toContain('AC1009');
      expect(dxf).toContain('MAIN SHEAVE: PCD 320 mm');
    });

    it('creates DrawingResult bundle for sheaves', () => {
      const bundle = generateSheaveDrawing(sheaveInputs, 'main');
      expect(bundle.title).toContain('Main Hoist Sheave');
      expect(bundle.filename).toBe('main_sheave_drawing');
    });
  });
});
