/**
 * Hand-rolled AutoCAD R12 ASCII DXF Document Generator
 * Statica EOT Crane Engineering Platform
 *
 * Implements standard ASCII DXF format compatible with AutoCAD, LibreCAD,
 * Fusion 360, SolidWorks, and laser/plasma CNC cutters.
 * Default units: Millimeters ($INSUNITS = 4).
 */

export class DxfDocument {
  private entities: string[] = [];

  constructor() {}

  /**
   * Adds a LINE entity to the DXF drawing.
   */
  addLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer: string = '0',
    color?: number,
  ): this {
    const parts = [
      '0',
      'LINE',
      '8',
      layer,
      '10',
      x1.toFixed(4),
      '20',
      y1.toFixed(4),
      '30',
      '0.0',
      '11',
      x2.toFixed(4),
      '21',
      y2.toFixed(4),
      '31',
      '0.0',
    ];
    if (color !== undefined) {
      parts.push('62', color.toString());
    }
    this.entities.push(parts.join('\n'));
    return this;
  }

  /**
   * Adds a 4-line rectangular outline to the DXF drawing.
   */
  addRectOutline(
    x: number,
    y: number,
    width: number,
    height: number,
    layer: string = '0',
    color?: number,
  ): this {
    const x2 = x + width;
    const y2 = y + height;
    this.addLine(x, y, x2, y, layer, color);
    this.addLine(x2, y, x2, y2, layer, color);
    this.addLine(x2, y2, x, y2, layer, color);
    this.addLine(x, y2, x, y, layer, color);
    return this;
  }

  /**
   * Adds a CIRCLE entity to the DXF drawing.
   */
  addCircle(
    cx: number,
    cy: number,
    radius: number,
    layer: string = '0',
    color?: number,
  ): this {
    const parts = [
      '0',
      'CIRCLE',
      '8',
      layer,
      '10',
      cx.toFixed(4),
      '20',
      cy.toFixed(4),
      '30',
      '0.0',
      '40',
      radius.toFixed(4),
    ];
    if (color !== undefined) {
      parts.push('62', color.toString());
    }
    this.entities.push(parts.join('\n'));
    return this;
  }

  /**
   * Adds a single-line TEXT entity to the DXF drawing.
   */
  addText(
    x: number,
    y: number,
    height: number,
    text: string,
    layer: string = '0',
    rotation: number = 0,
    color?: number,
  ): this {
    const parts = [
      '0',
      'TEXT',
      '8',
      layer,
      '10',
      x.toFixed(4),
      '20',
      y.toFixed(4),
      '30',
      '0.0',
      '40',
      height.toFixed(4),
      '1',
      text,
    ];
    if (rotation !== 0) {
      parts.push('50', rotation.toFixed(2));
    }
    if (color !== undefined) {
      parts.push('62', color.toString());
    }
    this.entities.push(parts.join('\n'));
    return this;
  }

  /**
   * Adds a centerline (long-dash-dot style or designated layer)
   */
  addCenterline(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer: string = 'CENTER',
  ): this {
    return this.addLine(x1, y1, x2, y2, layer, 4); // Color 4 = Cyan
  }

  /**
   * Generates the complete AutoCAD R12 ASCII DXF text.
   */
  toString(): string {
    const header = [
      '0',
      'SECTION',
      '2',
      'HEADER',
      '9',
      '$ACADVER',
      '1',
      'AC1009',
      '9',
      '$INSUNITS',
      '70',
      '4', // 4 = Millimeters
      '0',
      'ENDSEC',
      '0',
      'SECTION',
      '2',
      'TABLES',
      '0',
      'TABLE',
      '2',
      'LAYER',
      '70',
      '3',
      '0',
      'LAYER',
      '2',
      '0',
      '70',
      '0',
      '62',
      '7', // White / black
      '6',
      'CONTINUOUS',
      '0',
      'LAYER',
      '2',
      'DIMENSIONS',
      '70',
      '0',
      '62',
      '1', // Red
      '6',
      'CONTINUOUS',
      '0',
      'LAYER',
      '2',
      'CENTER',
      '70',
      '0',
      '62',
      '4', // Cyan
      '6',
      'CONTINUOUS',
      '0',
      'ENDTAB',
      '0',
      'ENDSEC',
      '0',
      'SECTION',
      '2',
      'ENTITIES',
    ].join('\n');

    const body = this.entities.join('\n');

    const footer = [
      '0',
      'ENDSEC',
      '0',
      'EOF',
      '',
    ].join('\n');

    return `${header}\n${body}\n${footer}`;
  }
}

/**
 * Triggers a browser download of the DXF string as a `.dxf` file.
 * Safe in non-browser (Node.js/SSR/tests) environments where window is undefined.
 */
export function downloadDxf(dxfContent: string, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const safeFilename = filename.endsWith('.dxf') ? filename : `${filename}.dxf`;
  const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
