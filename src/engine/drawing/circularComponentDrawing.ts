/**
 * Circular Engineering Component Drawing Generator
 * Statica EOT Crane Engineering Platform
 *
 * Generates accurate front elevation and detailed cross-sectional side profiles
 * for crane wheels (cross-travel & long-travel) and wire rope sheaves.
 */

import { DxfDocument } from './dxfBuilder';
import {
  rect,
  circle,
  centerline,
  text,
  horizontalDimension,
  verticalDimension,
  svgDocument,
} from './svgBuilder';
import { DrawingResult } from './types';

export interface WheelInputs {
  selectedWheelDiameterMm?: number;
  treadWidthMm?: number;
  flangeHeightMm?: number;
  hubBoreMm?: number;
  selectedWheelId?: string;
  [key: string]: any;
}

export interface WheelGeometry {
  treadDiameterMm: number;
  treadWidthMm: number;
  flangeHeightMm: number;
  flangeThicknessMm: number;
  hubBoreMm: number;
  hubWidthMm: number;
  outerFlangeDiameterMm: number;
  totalWheelWidthMm: number;
}

export interface SheaveInputs {
  selectedMainSheaveMm?: number;
  selectedEqualizingSheaveMm?: number;
  sheaveGrooveWidthMm?: number;
  hubBoreMm?: number;
  ropeDiameterMm?: number;
  [key: string]: any;
}

export interface SheaveGeometry {
  pcdMm: number;
  outerDiameterMm: number;
  rimWidthMm: number;
  grooveDepthMm: number;
  hubBoreMm: number;
  hubWidthMm: number;
}

/**
 * Computes pure geometry metrics for a double-flanged crane wheel.
 */
export function computeWheelGeometry(inputs: WheelInputs): WheelGeometry {
  const treadDiameterMm = Number(inputs.selectedWheelDiameterMm ?? 200.0);
  const treadWidthMm = Number(inputs.treadWidthMm ?? 75.0);
  const flangeHeightMm = Number(inputs.flangeHeightMm ?? 25.0);
  const flangeThicknessMm = Math.max(12, Math.round(treadWidthMm * 0.2));
  const hubBoreMm = Number(inputs.hubBoreMm ?? 50.0);
  const hubWidthMm = treadWidthMm + 2 * flangeThicknessMm + 10;
  const outerFlangeDiameterMm = treadDiameterMm + 2 * flangeHeightMm;
  const totalWheelWidthMm = treadWidthMm + 2 * flangeThicknessMm;

  return {
    treadDiameterMm,
    treadWidthMm,
    flangeHeightMm,
    flangeThicknessMm,
    hubBoreMm,
    hubWidthMm,
    outerFlangeDiameterMm,
    totalWheelWidthMm,
  };
}

/**
 * Computes pure geometry metrics for a wire rope sheave.
 */
export function computeSheaveGeometry(inputs: SheaveInputs, isEqualizer = false): SheaveGeometry {
  const pcdMm = Number(
    isEqualizer
      ? inputs.selectedEqualizingSheaveMm ?? 200.0
      : inputs.selectedMainSheaveMm ?? 320.0,
  );
  const ropeDiameter = Number(inputs.ropeDiameterMm ?? 16.0);
  const grooveDepthMm = Math.max(6, ropeDiameter * 0.4);
  const rimWidthMm = Number(inputs.sheaveGrooveWidthMm ?? 24.0);
  const hubBoreMm = Number(inputs.hubBoreMm ?? 50.0);
  const outerDiameterMm = pcdMm + 2 * grooveDepthMm;
  const hubWidthMm = rimWidthMm + 8;

  return {
    pcdMm,
    outerDiameterMm,
    rimWidthMm,
    grooveDepthMm,
    hubBoreMm,
    hubWidthMm,
  };
}

/**
 * Generates SVG for a double-flanged crane wheel (Front view + Side section).
 */
export function wheelToSVG(inputs: WheelInputs, title = 'CRANE WHEEL ASSEMBLY'): string {
  const geom = computeWheelGeometry(inputs);

  const padLeft = 80;
  const padRight = 80;
  const padTop = 80;
  const padBottom = 80;
  const viewGap = 90;

  const frontRadius = geom.outerFlangeDiameterMm / 2;
  const frontDia = geom.outerFlangeDiameterMm;
  const sideWidth = geom.totalWheelWidthMm;

  const viewBoxWidth = padLeft + frontDia + viewGap + sideWidth + padRight;
  const viewBoxHeight = frontDia + padTop + padBottom;

  // Front View Center
  const frontCenterX = padLeft + frontRadius;
  const frontCenterY = padTop + frontRadius;

  // Front View Circles
  const flangeCircle = circle(frontCenterX, frontCenterY, frontRadius, {
    fill: '#f1f5f9',
    stroke: '#0f172a',
    strokeWidth: 2,
  });

  const treadCircle = circle(frontCenterX, frontCenterY, geom.treadDiameterMm / 2, {
    stroke: '#0284c7',
    strokeWidth: 1.5,
    strokeDasharray: '4,4',
  });

  const hubCircle = circle(frontCenterX, frontCenterY, geom.hubBoreMm / 2, {
    fill: '#ffffff',
    stroke: '#0f172a',
    strokeWidth: 1.5,
  });

  const frontCenterH = centerline(
    frontCenterX - frontRadius - 20,
    frontCenterY,
    frontCenterX + frontRadius + 20,
    frontCenterY,
    { stroke: '#0284c7', strokeWidth: 1.2 },
  );

  const frontCenterV = centerline(
    frontCenterX,
    frontCenterY - frontRadius - 20,
    frontCenterX,
    frontCenterY + frontRadius + 20,
    { stroke: '#0284c7', strokeWidth: 1.2 },
  );

  // Side Section View
  const sideX = padLeft + frontDia + viewGap;
  const axisY = frontCenterY;

  // Hub boss outline
  const hubY = axisY - geom.hubBoreMm;
  const hubHeight = geom.hubBoreMm * 2;
  const hubSvg = rect(sideX - 5, hubY, geom.totalWheelWidthMm + 10, hubHeight, {
    fill: '#e2e8f0',
    stroke: '#0f172a',
    strokeWidth: 1.5,
  });

  // Bore hole cut
  const boreY = axisY - geom.hubBoreMm / 2;
  const boreHeight = geom.hubBoreMm;
  const boreSvg = rect(sideX - 10, boreY, geom.totalWheelWidthMm + 20, boreHeight, {
    fill: '#ffffff',
    stroke: '#64748b',
    strokeWidth: 1,
    strokeDasharray: '4,4',
  });

  // Tread body (upper & lower rims)
  const treadUpperY = axisY - geom.treadDiameterMm / 2;
  const flangeUpperY = axisY - geom.outerFlangeDiameterMm / 2;
  const flangeLowerY = axisY + geom.outerFlangeDiameterMm / 2;

  // Left Flange (upper & lower)
  const leftFlangeUpper = rect(
    sideX,
    flangeUpperY,
    geom.flangeThicknessMm,
    geom.treadDiameterMm / 2 - geom.hubBoreMm / 2 + geom.flangeHeightMm,
    { fill: '#cbd5e1', stroke: '#0f172a', strokeWidth: 1.5 },
  );
  const leftFlangeLower = rect(
    sideX,
    hubY + hubHeight,
    geom.flangeThicknessMm,
    geom.treadDiameterMm / 2 - geom.hubBoreMm / 2 + geom.flangeHeightMm,
    { fill: '#cbd5e1', stroke: '#0f172a', strokeWidth: 1.5 },
  );

  // Tread Surface (middle)
  const treadMiddleUpper = rect(
    sideX + geom.flangeThicknessMm,
    treadUpperY,
    geom.treadWidthMm,
    treadUpperY - hubY + (geom.treadDiameterMm / 2 - geom.hubBoreMm),
    { fill: '#e2e8f0', stroke: '#0f172a', strokeWidth: 1.5 },
  );

  // Right Flange (upper & lower)
  const rightFlangeUpper = rect(
    sideX + geom.flangeThicknessMm + geom.treadWidthMm,
    flangeUpperY,
    geom.flangeThicknessMm,
    geom.treadDiameterMm / 2 - geom.hubBoreMm / 2 + geom.flangeHeightMm,
    { fill: '#cbd5e1', stroke: '#0f172a', strokeWidth: 1.5 },
  );
  const rightFlangeLower = rect(
    sideX + geom.flangeThicknessMm + geom.treadWidthMm,
    hubY + hubHeight,
    geom.flangeThicknessMm,
    geom.treadDiameterMm / 2 - geom.hubBoreMm / 2 + geom.flangeHeightMm,
    { fill: '#cbd5e1', stroke: '#0f172a', strokeWidth: 1.5 },
  );

  // Side view axle centerline
  const sideAxisLine = centerline(sideX - 25, axisY, sideX + sideWidth + 25, axisY, {
    stroke: '#0284c7',
    strokeWidth: 1.2,
  });

  // Dimensions
  // 1. Tread Width (above side view)
  const dimTreadWidth = horizontalDimension(
    sideX + geom.flangeThicknessMm,
    sideX + geom.flangeThicknessMm + geom.treadWidthMm,
    flangeUpperY - 20,
    `Tread: ${geom.treadWidthMm} mm`,
    flangeUpperY,
    { color: '#0369a1', fontSize: 11 },
  );

  // 2. Total Width (below side view)
  const dimTotalWidth = horizontalDimension(
    sideX,
    sideX + geom.totalWheelWidthMm,
    flangeLowerY + 30,
    `Total: ${geom.totalWheelWidthMm} mm`,
    flangeLowerY,
    { color: '#334155', fontSize: 11 },
  );

  // 3. Tread Dia (left of front view)
  const dimTreadDia = verticalDimension(
    frontCenterY - geom.treadDiameterMm / 2,
    frontCenterY + geom.treadDiameterMm / 2,
    frontCenterX - frontRadius - 35,
    `Tread Dia: Ø${geom.treadDiameterMm} mm`,
    frontCenterX - frontRadius,
    { color: '#0284c7', fontSize: 11 },
  );

  // 4. Flange Dia (right of side view)
  const dimFlangeDia = verticalDimension(
    flangeUpperY,
    flangeLowerY,
    sideX + geom.totalWheelWidthMm + 35,
    `Flange Dia: Ø${geom.outerFlangeDiameterMm} mm`,
    sideX + geom.totalWheelWidthMm,
    { color: '#0f172a', fontSize: 11 },
  );

  // Labels
  const titleSvg = text(
    viewBoxWidth / 2,
    padTop - 50,
    `${title} (Ø${geom.treadDiameterMm} mm × ${geom.treadWidthMm} mm)`,
    { fontSize: 13, fontWeight: 'bold', fill: '#0f172a' },
  );

  const frontLabel = text(frontCenterX, frontCenterY + frontRadius + 45, 'FRONT ELEVATION', {
    fontSize: 11,
    fill: '#64748b',
  });

  const sideLabel = text(
    sideX + sideWidth / 2,
    flangeLowerY + 55,
    'CROSS-SECTION PROFILE',
    { fontSize: 11, fill: '#64748b' },
  );

  const elements = [
    titleSvg,
    flangeCircle,
    treadCircle,
    hubCircle,
    frontCenterH,
    frontCenterV,
    hubSvg,
    leftFlangeUpper,
    leftFlangeLower,
    treadMiddleUpper,
    rightFlangeUpper,
    rightFlangeLower,
    boreSvg,
    sideAxisLine,
    dimTreadWidth,
    dimTotalWidth,
    dimTreadDia,
    dimFlangeDia,
    frontLabel,
    sideLabel,
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
 * Generates DXF for a double-flanged crane wheel.
 */
export function wheelToDXF(inputs: WheelInputs, title = 'CRANE WHEEL'): string {
  const geom = computeWheelGeometry(inputs);
  const doc = new DxfDocument();

  // Front View Circles
  const frontCx = geom.outerFlangeDiameterMm / 2;
  const frontCy = geom.outerFlangeDiameterMm / 2;

  doc.addCircle(frontCx, frontCy, geom.outerFlangeDiameterMm / 2, '0');
  doc.addCircle(frontCx, frontCy, geom.treadDiameterMm / 2, '0');
  doc.addCircle(frontCx, frontCy, geom.hubBoreMm / 2, '0');
  doc.addCenterline(
    frontCx - geom.outerFlangeDiameterMm / 2 - 20,
    frontCy,
    frontCx + geom.outerFlangeDiameterMm / 2 + 20,
    frontCy,
    'CENTER',
  );
  doc.addCenterline(
    frontCx,
    frontCy - geom.outerFlangeDiameterMm / 2 - 20,
    frontCx,
    frontCy + geom.outerFlangeDiameterMm / 2 + 20,
    'CENTER',
  );

  // Side Section View
  const sideX = geom.outerFlangeDiameterMm + 80;
  const axisY = frontCy;

  // Tread outline
  doc.addRectOutline(
    sideX + geom.flangeThicknessMm,
    axisY - geom.treadDiameterMm / 2,
    geom.treadWidthMm,
    geom.treadDiameterMm,
    '0',
  );

  // Left flange
  doc.addRectOutline(
    sideX,
    axisY - geom.outerFlangeDiameterMm / 2,
    geom.flangeThicknessMm,
    geom.outerFlangeDiameterMm,
    '0',
  );

  // Right flange
  doc.addRectOutline(
    sideX + geom.flangeThicknessMm + geom.treadWidthMm,
    axisY - geom.outerFlangeDiameterMm / 2,
    geom.flangeThicknessMm,
    geom.outerFlangeDiameterMm,
    '0',
  );

  // Bore line
  doc.addCenterline(sideX - 20, axisY, sideX + geom.totalWheelWidthMm + 20, axisY, 'CENTER');

  // Text annotations
  doc.addText(
    0,
    geom.outerFlangeDiameterMm + 25,
    15,
    `${title}: DIA ${geom.treadDiameterMm} mm x TREAD ${geom.treadWidthMm} mm`,
    'DIMENSIONS',
  );
  doc.addText(
    sideX,
    -25,
    12,
    `TOTAL WIDTH: ${geom.totalWheelWidthMm} mm | BORE: DIA ${geom.hubBoreMm} mm | FLANGE HT: ${geom.flangeHeightMm} mm`,
    'DIMENSIONS',
  );

  return doc.toString();
}

/**
 * Generates SVG for a wire rope sheave (Elevation + Cross-section with rope groove).
 */
export function sheaveToSVG(inputs: SheaveInputs, isEqualizer = false): string {
  const geom = computeSheaveGeometry(inputs, isEqualizer);
  const title = isEqualizer ? 'EQUALIZER SHEAVE' : 'MAIN LOAD SHEAVE';

  const padLeft = 80;
  const padRight = 80;
  const padTop = 80;
  const padBottom = 80;
  const viewGap = 90;

  const frontRadius = geom.outerDiameterMm / 2;
  const frontDia = geom.outerDiameterMm;
  const sideWidth = geom.rimWidthMm;

  const viewBoxWidth = padLeft + frontDia + viewGap + sideWidth + padRight;
  const viewBoxHeight = frontDia + padTop + padBottom;

  const frontCenterX = padLeft + frontRadius;
  const frontCenterY = padTop + frontRadius;

  // Front View Circles
  const rimCircle = circle(frontCenterX, frontCenterY, frontRadius, {
    fill: '#f8fafc',
    stroke: '#0f172a',
    strokeWidth: 2,
  });

  const pcdCircle = circle(frontCenterX, frontCenterY, geom.pcdMm / 2, {
    stroke: '#0284c7',
    strokeWidth: 1.5,
    strokeDasharray: '5,5',
  });

  const boreCircle = circle(frontCenterX, frontCenterY, geom.hubBoreMm / 2, {
    fill: '#ffffff',
    stroke: '#0f172a',
    strokeWidth: 1.5,
  });

  const centerH = centerline(
    frontCenterX - frontRadius - 20,
    frontCenterY,
    frontCenterX + frontRadius + 20,
    frontCenterY,
    { stroke: '#0284c7', strokeWidth: 1.2 },
  );

  const centerV = centerline(
    frontCenterX,
    frontCenterY - frontRadius - 20,
    frontCenterX,
    frontCenterY + frontRadius + 20,
    { stroke: '#0284c7', strokeWidth: 1.2 },
  );

  // Side Section View
  const sideX = padLeft + frontDia + viewGap;
  const axisY = frontCenterY;

  // Sheave body
  const bodyUpperY = axisY - geom.outerDiameterMm / 2;
  const bodyLowerY = axisY + geom.outerDiameterMm / 2;

  const rimUpper = rect(
    sideX,
    bodyUpperY + geom.grooveDepthMm,
    geom.rimWidthMm,
    geom.outerDiameterMm / 2 - geom.grooveDepthMm - geom.hubBoreMm / 2,
    { fill: '#e2e8f0', stroke: '#0f172a', strokeWidth: 1.5 },
  );

  const rimLower = rect(
    sideX,
    axisY + geom.hubBoreMm / 2,
    geom.rimWidthMm,
    geom.outerDiameterMm / 2 - geom.grooveDepthMm - geom.hubBoreMm / 2,
    { fill: '#e2e8f0', stroke: '#0f172a', strokeWidth: 1.5 },
  );

  // Groove cuts at top and bottom
  const grooveTop = rect(
    sideX + geom.rimWidthMm * 0.15,
    bodyUpperY,
    geom.rimWidthMm * 0.7,
    geom.grooveDepthMm,
    { fill: '#cbd5e1', stroke: '#0284c7', strokeWidth: 1.5 },
  );

  const grooveBottom = rect(
    sideX + geom.rimWidthMm * 0.15,
    bodyLowerY - geom.grooveDepthMm,
    geom.rimWidthMm * 0.7,
    geom.grooveDepthMm,
    { fill: '#cbd5e1', stroke: '#0284c7', strokeWidth: 1.5 },
  );

  // Hub bore cutout
  const boreCut = rect(
    sideX - 5,
    axisY - geom.hubBoreMm / 2,
    geom.rimWidthMm + 10,
    geom.hubBoreMm,
    { fill: '#ffffff', stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4,4' },
  );

  const sideAxis = centerline(sideX - 25, axisY, sideX + sideWidth + 25, axisY, {
    stroke: '#0284c7',
    strokeWidth: 1.2,
  });

  // Dimensions
  const dimPcd = verticalDimension(
    frontCenterY - geom.pcdMm / 2,
    frontCenterY + geom.pcdMm / 2,
    frontCenterX - frontRadius - 35,
    `PCD: Ø${geom.pcdMm} mm`,
    frontCenterX - frontRadius,
    { color: '#0284c7', fontSize: 11 },
  );

  const dimWidth = horizontalDimension(
    sideX,
    sideX + geom.rimWidthMm,
    bodyUpperY - 20,
    `Rim: ${geom.rimWidthMm} mm`,
    bodyUpperY,
    { color: '#0f172a', fontSize: 11 },
  );

  const dimOuterDia = verticalDimension(
    bodyUpperY,
    bodyLowerY,
    sideX + geom.rimWidthMm + 35,
    `Outer: Ø${geom.outerDiameterMm.toFixed(0)} mm`,
    sideX + geom.rimWidthMm,
    { color: '#475569', fontSize: 11 },
  );

  // Labels
  const titleSvg = text(
    viewBoxWidth / 2,
    padTop - 50,
    `${title} (PCD Ø${geom.pcdMm} mm)`,
    { fontSize: 13, fontWeight: 'bold', fill: '#0f172a' },
  );

  const frontLabel = text(frontCenterX, frontCenterY + frontRadius + 45, 'FRONT ELEVATION', {
    fontSize: 11,
    fill: '#64748b',
  });

  const sideLabel = text(
    sideX + sideWidth / 2,
    bodyLowerY + 45,
    'GROOVE SECTION',
    { fontSize: 11, fill: '#64748b' },
  );

  const elements = [
    titleSvg,
    rimCircle,
    pcdCircle,
    boreCircle,
    centerH,
    centerV,
    rimUpper,
    rimLower,
    grooveTop,
    grooveBottom,
    boreCut,
    sideAxis,
    dimPcd,
    dimWidth,
    dimOuterDia,
    frontLabel,
    sideLabel,
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
 * Generates DXF for a wire rope sheave.
 */
export function sheaveToDXF(inputs: SheaveInputs, isEqualizer = false): string {
  const geom = computeSheaveGeometry(inputs, isEqualizer);
  const title = isEqualizer ? 'EQUALIZER SHEAVE' : 'MAIN SHEAVE';
  const doc = new DxfDocument();

  const cx = geom.outerDiameterMm / 2;
  const cy = geom.outerDiameterMm / 2;

  doc.addCircle(cx, cy, geom.outerDiameterMm / 2, '0');
  doc.addCircle(cx, cy, geom.pcdMm / 2, '0');
  doc.addCircle(cx, cy, geom.hubBoreMm / 2, '0');
  doc.addCenterline(
    cx - geom.outerDiameterMm / 2 - 20,
    cy,
    cx + geom.outerDiameterMm / 2 + 20,
    cy,
    'CENTER',
  );
  doc.addCenterline(
    cx,
    cy - geom.outerDiameterMm / 2 - 20,
    cx,
    cy + geom.outerDiameterMm / 2 + 20,
    'CENTER',
  );

  // Side view
  const sideX = geom.outerDiameterMm + 80;
  doc.addRectOutline(sideX, cy - geom.outerDiameterMm / 2, geom.rimWidthMm, geom.outerDiameterMm, '0');
  doc.addCenterline(sideX - 20, cy, sideX + geom.rimWidthMm + 20, cy, 'CENTER');

  doc.addText(
    0,
    geom.outerDiameterMm + 25,
    15,
    `${title}: PCD ${geom.pcdMm} mm x WIDTH ${geom.rimWidthMm} mm`,
    'DIMENSIONS',
  );

  return doc.toString();
}

/**
 * High-level DrawingResult generator for Wheels and Sheaves.
 */
export function generateWheelDrawing(
  inputs: WheelInputs,
  type: 'cross-travel' | 'long-travel',
): DrawingResult {
  const isCT = type === 'cross-travel';
  const title = isCT ? 'Cross Travel Wheel Assembly' : 'Long Travel Wheel Assembly';
  const filename = isCT ? 'cross_travel_wheel_drawing' : 'long_travel_wheel_drawing';

  return {
    title,
    filename,
    svg: wheelToSVG(inputs, title.toUpperCase()),
    dxf: wheelToDXF(inputs, title.toUpperCase()),
    description: `Double-flanged crane rail wheel with tread width, hub bore, and flange elevation dimensions conforming to IS 3177.`,
  };
}

export function generateSheaveDrawing(
  inputs: SheaveInputs,
  type: 'main' | 'equalizer' = 'main',
): DrawingResult {
  const isEqualizer = type === 'equalizer';
  const title = isEqualizer ? 'Equalizing Sheave Detail' : 'Main Hoist Sheave Detail';
  const filename = isEqualizer ? 'equalizer_sheave_drawing' : 'main_sheave_drawing';

  return {
    title,
    filename,
    svg: sheaveToSVG(inputs, isEqualizer),
    dxf: sheaveToDXF(inputs, isEqualizer),
    description: `Wire rope groove profile and pitch circle diameter (PCD) for ${title.toLowerCase()}.`,
  };
}
