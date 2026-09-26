import { describe, it, expect } from 'vitest';
import { DxfDocument, downloadDxf } from '../../../src/engine/drawing/dxfBuilder';

describe('DXF Builder Engine', () => {
  it('generates standard AutoCAD R12 ASCII DXF output with millimeter units', () => {
    const doc = new DxfDocument();
    doc.addLine(0, 0, 100, 100);
    doc.addRectOutline(10, 10, 50, 50);
    doc.addCircle(50, 50, 20);
    doc.addText(10, 20, 5, 'TEST');

    const output = doc.toString();

    expect(output).toContain('SECTION\n2\nHEADER');
    expect(output).toContain('$ACADVER\n1\nAC1009');
    expect(output).toContain('$INSUNITS\n70\n4');
    expect(output).toContain('SECTION\n2\nENTITIES');
    expect(output).toContain('0\nLINE');
    expect(output).toContain('0\nCIRCLE');
    expect(output).toContain('0\nTEXT');
    expect(output).toContain('0\nEOF');
  });

  it('safely handles downloadDxf in headless/Node environment without errors', () => {
    expect(() => downloadDxf('SAMPLE DXF', 'test.dxf')).not.toThrow();
  });
});
