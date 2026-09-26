import { describe, it, expect } from 'vitest';
import {
  DRAWING_REGISTRY,
  getDrawingForToolInstance,
  hasDrawingGenerator,
  extractDrawingInputs,
} from '../../../src/engine/drawing/registry';
import { ToolInstance } from '../../../src/types/project';

describe('Drawing Registry (Phase 3)', () => {
  const createMockInstance = (toolId: string, inputs: Record<string, any> = {}, outputs: Record<string, any> = {}): ToolInstance => ({
    id: `inst-${toolId}`,
    projectId: 'proj-123',
    toolId,
    displayName: toolId,
    category: 'MECHANISM',
    tier: 'A',
    calculationStatus: 'PASS',
    inputs,
    outputs,
    inputRevision: 1,
    isStale: false,
    updatedAt: Date.now(),
  });

  it('correctly maps all 5 supported drawing tools', () => {
    expect(hasDrawingGenerator('box-beam-properties')).toBe(true);
    expect(hasDrawingGenerator('rope-drum')).toBe(true);
    expect(hasDrawingGenerator('cross-travel-wheel')).toBe(true);
    expect(hasDrawingGenerator('long-travel-wheel')).toBe(true);
    expect(hasDrawingGenerator('sheaves')).toBe(true);
    expect(hasDrawingGenerator('unknown-tool')).toBe(false);
  });

  it('extracts drawing inputs merging inputs and outputs', () => {
    const inst = createMockInstance(
      'rope-drum',
      { selectedDrumDiameterMm: 320 },
      { drumLengthMm: 1800 },
    );
    const data = extractDrawingInputs(inst);
    expect(data.selectedDrumDiameterMm).toBe(320);
    expect(data.drumLengthMm).toBe(1800);
  });

  it('generates drawing for box girder instance', () => {
    const inst = createMockInstance('box-beam-properties', {
      topFlangeWidthMm: 500,
      topFlangeThicknessMm: 12,
      webDepthMm: 1200,
      webThicknessMm: 8,
      webSpacingMm: 350,
      bottomFlangeWidthMm: 500,
      bottomFlangeThicknessMm: 12,
    });
    const drawing = getDrawingForToolInstance(inst);
    expect(drawing).not.toBeNull();
    expect(drawing?.title).toBe('Box Girder Cross Section');
    expect(drawing?.svg).toContain('<svg');
    expect(drawing?.dxf).toContain('AC1009');
  });

  it('generates drawing for rope drum instance', () => {
    const inst = createMockInstance('rope-drum', {
      selectedDrumDiameterMm: 320,
      drumLengthMm: 1869,
      selectedGroovePitchMm: 18,
      totalGroovesPerSide: 34,
    });
    const drawing = getDrawingForToolInstance(inst);
    expect(drawing).not.toBeNull();
    expect(drawing?.title).toBe('Rope Drum Detail & Grooving');
  });

  it('generates drawing for cross travel wheel instance', () => {
    const inst = createMockInstance('cross-travel-wheel', {
      selectedWheelDiameterMm: 160,
      hubBoreMm: 50,
    });
    const drawing = getDrawingForToolInstance(inst);
    expect(drawing).not.toBeNull();
    expect(drawing?.title).toContain('Cross Travel');
  });

  it('generates drawing for sheaves instance', () => {
    const inst = createMockInstance('sheaves', {
      selectedMainSheaveMm: 320,
      sheaveGrooveWidthMm: 24,
      hubBoreMm: 50,
    });
    const drawing = getDrawingForToolInstance(inst);
    expect(drawing).not.toBeNull();
    expect(drawing?.title).toContain('Sheave');
  });

  it('returns null for tools without drawing generator', () => {
    const inst = createMockInstance('main-hoist-motor', {});
    const drawing = getDrawingForToolInstance(inst);
    expect(drawing).toBeNull();
  });
});
