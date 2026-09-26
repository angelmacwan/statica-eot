/**
 * Rope Drum Engineering Drawing Generator
 * Statica EOT Crane Engineering Platform
 *
 * Generates side profile with grooving sections and circular end view.
 * Consumes inputs/outputs from `ropeDrum.ts`.
 */

import { DxfDocument } from './dxfBuilder';
import {
  rect,
  circle,
  line,
  centerline,
  text,
  horizontalDimension,
  verticalDimension,
  svgDocument,
} from './svgBuilder';
import { DrawingResult } from './types';

export interface RopeDrumInputs {
  selectedDrumDiameterMm?: number;
  drumLengthMm?: number;
  selectedGroovePitchMm?: number;
  totalGroovesPerSide?: number;
  centerUngroovedLengthMm?: number;
  endFlangeAllowanceMm?: number;
  selectedGrooveDepthMm?: number;
  [key: string]: any;
}

export interface RopeDrumGeometry {
  diameterMm: number;
  lengthMm: number;
  groovePitchMm: number;
  totalGroovesPerSide: number;
  grooveDepthMm: number;
  centerUngroovedLengthMm: number;
  endAllowanceMm: number;
  groovedLengthPerSideMm: number;
  numGroovesToDraw: number;
  endViewRadiusMm: number;
  shaftBoreRadiusMm: number;
}

/**
 * Computes pure geometry metrics for the rope drum.
 */
export function computeRopeDrumGeometry(inputs: RopeDrumInputs): RopeDrumGeometry {
  const diameterMm = Number(inputs.selectedDrumDiameterMm ?? 320.0);
  const groovePitchMm = Number(inputs.selectedGroovePitchMm ?? 18.0);
  const totalGroovesPerSide = Number(inputs.totalGroovesPerSide ?? 34.0);
  const grooveDepthMm = Number(inputs.selectedGrooveDepthMm ?? 5.5);
  const centerUngroovedLengthMm = Number(inputs.centerUngroovedLengthMm ?? 450.0);
  const endAllowanceMm = Number(inputs.endFlangeAllowanceMm ?? 100.0);

  // If drumLengthMm is not explicitly provided, calculate according to IS 3177 formula
  const calculatedLength =
    2 * (totalGroovesPerSide * groovePitchMm) + centerUngroovedLengthMm + 2 * endAllowanceMm;
  const lengthMm = Number(inputs.drumLengthMm ?? calculatedLength);

  const groovedLengthPerSideMm = totalGroovesPerSide * groovePitchMm;
  const numGroovesToDraw = Math.max(1, Math.floor(groovedLengthPerSideMm / groovePitchMm));

  const endViewRadiusMm = diameterMm / 2;
  const shaftBoreRadiusMm = Math.max(25, diameterMm * 0.2);

  return {
    diameterMm,
    lengthMm,
    groovePitchMm,
    totalGroovesPerSide,
    grooveDepthMm,
    centerUngroovedLengthMm,
    endAllowanceMm,
    groovedLengthPerSideMm,
    numGroovesToDraw,
    endViewRadiusMm,
    shaftBoreRadiusMm,
  };
}

/**
 * Generates standalone SVG drawing for rope drum (Side profile + End view).
 */
export function ropeDrumToSVG(inputs: RopeDrumInputs): string {
  const geom = computeRopeDrumGeometry(inputs);

  const padLeft = 90;
  const padRight = 80;
  const padTop = 90;
  const padBottom = 90;
  const viewGap = 100;

  const sideWidth = geom.lengthMm;
  const sideHeight = geom.diameterMm;
  const endViewDia = geom.diameterMm;

  const viewBoxWidth = padLeft + sideWidth + viewGap + endViewDia + padRight;
  const viewBoxHeight = Math.max(sideHeight, endViewDia) + padTop + padBottom;

  const sideY = padTop + (viewBoxHeight - padTop - padBottom - sideHeight) / 2;
  const sideX = padLeft;

  // 1. Drum Body Rect
  const drumBodySvg = rect(sideX, sideY, sideWidth, sideHeight, {
    fill: '#f8fafc',
    stroke: '#0f172a',
    strokeWidth: 2,
  });

  // End Flanges / Collars
  const leftFlangeSvg = rect(sideX, sideY - 15, geom.endAllowanceMm * 0.2, sideHeight + 30, {
    fill: '#cbd5e1',
    stroke: '#0f172a',
    strokeWidth: 1.5,
  });
  const rightFlangeSvg = rect(
    sideX + sideWidth - geom.endAllowanceMm * 0.2,
    sideY - 15,
    geom.endAllowanceMm * 0.2,
    sideHeight + 30,
    {
      fill: '#cbd5e1',
      stroke: '#0f172a',
      strokeWidth: 1.5,
    },
  );

  // Groove sections
  const leftGrooveStart = sideX + geom.endAllowanceMm;
  const rightGrooveStart = leftGrooveStart + geom.groovedLengthPerSideMm + geom.centerUngroovedLengthMm;

  const grooveLines: string[] = [];
  // Left grooving ticks
  for (let i = 0; i <= geom.numGroovesToDraw; i++) {
    const gx = leftGrooveStart + i * geom.groovePitchMm;
    if (gx <= leftGrooveStart + geom.groovedLengthPerSideMm) {
      grooveLines.push(
        line(gx, sideY, gx, sideY + sideHeight, {
          stroke: '#94a3b8',
          strokeWidth: 1,
          strokeDasharray: i % 5 === 0 ? undefined : '2,2',
        }),
      );
    }
  }

  // Right grooving ticks
  for (let i = 0; i <= geom.numGroovesToDraw; i++) {
    const gx = rightGrooveStart + i * geom.groovePitchMm;
    if (gx <= rightGrooveStart + geom.groovedLengthPerSideMm) {
      grooveLines.push(
        line(gx, sideY, gx, sideY + sideHeight, {
          stroke: '#94a3b8',
          strokeWidth: 1,
          strokeDasharray: i % 5 === 0 ? undefined : '2,2',
        }),
      );
    }
  }

  // Center ungrooved zone shading / indicator
  const centerZoneSvg = rect(
    leftGrooveStart + geom.groovedLengthPerSideMm,
    sideY,
    geom.centerUngroovedLengthMm,
    sideHeight,
    { fill: '#f1f5f9', stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4,4' },
  );

  // Side view centerline
  const axisY = sideY + sideHeight / 2;
  const sideCenterlineSvg = centerline(sideX - 30, axisY, sideX + sideWidth + 30, axisY, {
    stroke: '#0284c7',
    strokeWidth: 1.2,
  });

  // End View (Circle)
  const endCenterX = sideX + sideWidth + viewGap + geom.endViewRadiusMm;
  const endCenterY = axisY;

  const endOuterCircle = circle(endCenterX, endCenterY, geom.endViewRadiusMm, {
    fill: '#f1f5f9',
    stroke: '#0f172a',
    strokeWidth: 2,
  });

  const endInnerBore = circle(endCenterX, endCenterY, geom.shaftBoreRadiusMm, {
    fill: '#ffffff',
    stroke: '#0f172a',
    strokeWidth: 1.5,
  });

  const endPitchCircle = circle(endCenterX, endCenterY, geom.endViewRadiusMm - geom.grooveDepthMm, {
    stroke: '#64748b',
    strokeWidth: 1,
    strokeDasharray: '4,4',
  });

  const endCenterlineH = centerline(
    endCenterX - geom.endViewRadiusMm - 20,
    endCenterY,
    endCenterX + geom.endViewRadiusMm + 20,
    endCenterY,
    { stroke: '#0284c7', strokeWidth: 1.2 },
  );

  const endCenterlineV = centerline(
    endCenterX,
    endCenterY - geom.endViewRadiusMm - 20,
    endCenterX,
    endCenterY + geom.endViewRadiusMm + 20,
    { stroke: '#0284c7', strokeWidth: 1.2 },
  );

  // Dimension Lines
  // 1. Drum Length (below side view)
  const dimLength = horizontalDimension(
    sideX,
    sideX + sideWidth,
    sideY + sideHeight + 45,
    `Drum Length (L): ${geom.lengthMm.toFixed(1)} mm`,
    sideY + sideHeight,
    { color: '#0f172a', fontSize: 12 },
  );

  // 2. Center Ungrooved Length (above)
  const centerStart = leftGrooveStart + geom.groovedLengthPerSideMm;
  const dimCenter = horizontalDimension(
    centerStart,
    centerStart + geom.centerUngroovedLengthMm,
    sideY - 35,
    `Center Ungrooved: ${geom.centerUngroovedLengthMm} mm`,
    sideY,
    { color: '#475569', fontSize: 11 },
  );

  // 3. Drum Diameter (left of side view)
  const dimDiameter = verticalDimension(
    sideY,
    sideY + sideHeight,
    sideX - 45,
    `PCD (D): Ø${geom.diameterMm} mm`,
    sideX,
    { color: '#0f172a', fontSize: 12 },
  );

  // 4. End view diameter
  const dimEndDia = verticalDimension(
    endCenterY - geom.endViewRadiusMm,
    endCenterY + geom.endViewRadiusMm,
    endCenterX + geom.endViewRadiusMm + 35,
    `Outer Dia: Ø${geom.diameterMm} mm`,
    endCenterX + geom.endViewRadiusMm,
    { color: '#475569', fontSize: 11 },
  );

  // Titles / Labels
  const titleSvg = text(
    padLeft + sideWidth / 2,
    padTop - 55,
    `ROPE DRUM (Ø${geom.diameterMm} mm × ${geom.lengthMm.toFixed(0)} mm)`,
    { fontSize: 14, fontWeight: 'bold', fill: '#0f172a' },
  );

  const sideLabel = text(
    sideX + sideWidth / 2,
    sideY + sideHeight + 70,
    `SIDE ELEVATION (Pitch p = ${geom.groovePitchMm} mm, ~${geom.totalGroovesPerSide} grooves/side)`,
    { fontSize: 11, fill: '#64748b' },
  );

  const endLabel = text(endCenterX, sideY + sideHeight + 70, 'END VIEW', {
    fontSize: 11,
    fill: '#64748b',
  });

  const elements = [
    titleSvg,
    drumBodySvg,
    centerZoneSvg,
    leftFlangeSvg,
    rightFlangeSvg,
    ...grooveLines,
    sideCenterlineSvg,
    endOuterCircle,
    endPitchCircle,
    endInnerBore,
    endCenterlineH,
    endCenterlineV,
    dimLength,
    dimCenter,
    dimDiameter,
    dimEndDia,
    sideLabel,
    endLabel,
  ].join('\n');

  return svgDocument(
    { minX: 0, minY: 0, width: viewBoxWidth, height: viewBoxHeight },
    elements,
    '100%',
    '100%',
    '#ffffff',
  );
}

/**
 * Generates standard AutoCAD R12 ASCII DXF text for rope drum.
 */
export function ropeDrumToDXF(inputs: RopeDrumInputs): string {
  const geom = computeRopeDrumGeometry(inputs);
  const doc = new DxfDocument();

  const sideX = 0;
  const sideY = 0;
  const sideWidth = geom.lengthMm;
  const sideHeight = geom.diameterMm;

  // Drum body rectangle
  doc.addRectOutline(sideX, sideY, sideWidth, sideHeight, '0');

  // Axis centerline
  doc.addCenterline(sideX - 50, sideHeight / 2, sideX + sideWidth + 50, sideHeight / 2, 'CENTER');

  // Left & right grooving bounds
  const leftGrooveStart = sideX + geom.endAllowanceMm;
  const rightGrooveStart = leftGrooveStart + geom.groovedLengthPerSideMm + geom.centerUngroovedLengthMm;

  // Left grooves
  for (let i = 0; i <= geom.numGroovesToDraw; i++) {
    const gx = leftGrooveStart + i * geom.groovePitchMm;
    if (gx <= leftGrooveStart + geom.groovedLengthPerSideMm) {
      doc.addLine(gx, sideY, gx, sideY + sideHeight, '0');
    }
  }

  // Right grooves
  for (let i = 0; i <= geom.numGroovesToDraw; i++) {
    const gx = rightGrooveStart + i * geom.groovePitchMm;
    if (gx <= rightGrooveStart + geom.groovedLengthPerSideMm) {
      doc.addLine(gx, sideY, gx, sideY + sideHeight, '0');
    }
  }

  // End View (Offset to right)
  const endCenterX = sideWidth + 150 + geom.endViewRadiusMm;
  const endCenterY = sideHeight / 2;

  doc.addCircle(endCenterX, endCenterY, geom.endViewRadiusMm, '0');
  doc.addCircle(endCenterX, endCenterY, geom.shaftBoreRadiusMm, '0');
  doc.addCenterline(
    endCenterX - geom.endViewRadiusMm - 30,
    endCenterY,
    endCenterX + geom.endViewRadiusMm + 30,
    endCenterY,
    'CENTER',
  );
  doc.addCenterline(
    endCenterX,
    endCenterY - geom.endViewRadiusMm - 30,
    endCenterX,
    endCenterY + geom.endViewRadiusMm + 30,
    'CENTER',
  );

  // Annotations
  doc.addText(
    sideX,
    sideHeight + 20,
    15,
    `ROPE DRUM: DIA ${geom.diameterMm} mm x LENGTH ${geom.lengthMm.toFixed(1)} mm`,
    'DIMENSIONS',
  );
  doc.addText(
    sideX,
    -30,
    15,
    `PITCH: ${geom.groovePitchMm} mm | GROOVES/SIDE: ${geom.totalGroovesPerSide} | CENTER UNGROOVED: ${geom.centerUngroovedLengthMm} mm`,
    'DIMENSIONS',
  );

  return doc.toString();
}

/**
 * Returns unified DrawingResult for Rope Drum.
 */
export function generateRopeDrumDrawing(inputs: RopeDrumInputs): DrawingResult {
  return {
    title: 'Rope Drum Detail & Grooving',
    filename: 'rope_drum_drawing',
    svg: ropeDrumToSVG(inputs),
    dxf: ropeDrumToDXF(inputs),
    description: 'Precision grooved rope drum schematic including active winding lengths, center fleet angle clearance, and end section.',
  };
}
