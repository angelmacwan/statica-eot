/**
 * Box Girder Cross-Section Drawing Generator
 * Statica EOT Crane Engineering Platform
 *
 * Generates browser-native SVG previews and CAD-compatible DXF files
 * from the exact inputs of `boxBeamProperties.ts`.
 */

import { DxfDocument } from './dxfBuilder';
import {
  rect,
  centerline,
  text,
  horizontalDimension,
  verticalDimension,
  svgDocument,
} from './svgBuilder';
import { DrawingResult } from './types';

export interface BoxGirderInputs {
  topFlangeWidthMm?: number;
  topFlangeThicknessMm?: number;
  webDepthMm?: number;
  webThicknessMm?: number;
  webSpacingMm?: number;
  bottomFlangeWidthMm?: number;
  bottomFlangeThicknessMm?: number;
  [key: string]: any;
}

export interface BoxGirderGeometry {
  totalWidthMm: number;
  totalHeightMm: number;
  topFlangeWidthMm: number;
  topFlangeThicknessMm: number;
  webDepthMm: number;
  webThicknessMm: number;
  webSpacingMm: number;
  bottomFlangeWidthMm: number;
  bottomFlangeThicknessMm: number;
  webCenterDistanceMm: number;
  webOuterDistanceMm: number;
  topFlange: { x: number; y: number; width: number; height: number };
  bottomFlange: { x: number; y: number; width: number; height: number };
  leftWeb: { x: number; y: number; width: number; height: number };
  rightWeb: { x: number; y: number; width: number; height: number };
}

/**
 * Computes pure geometry metrics for the box girder cross-section.
 */
export function computeBoxGirderGeometry(inputs: BoxGirderInputs): BoxGirderGeometry {
  const topFlangeWidthMm = Number(inputs.topFlangeWidthMm ?? 500.0);
  const topFlangeThicknessMm = Number(inputs.topFlangeThicknessMm ?? 12.0);
  const webDepthMm = Number(inputs.webDepthMm ?? 1200.0);
  const webThicknessMm = Number(inputs.webThicknessMm ?? 8.0);
  const webSpacingMm = Number(inputs.webSpacingMm ?? 350.0);
  const bottomFlangeWidthMm = Number(inputs.bottomFlangeWidthMm ?? 500.0);
  const bottomFlangeThicknessMm = Number(inputs.bottomFlangeThicknessMm ?? 12.0);

  const totalHeightMm = bottomFlangeThicknessMm + webDepthMm + topFlangeThicknessMm;
  const totalWidthMm = Math.max(topFlangeWidthMm, bottomFlangeWidthMm);
  const webCenterDistanceMm = webSpacingMm + webThicknessMm;
  const webOuterDistanceMm = webSpacingMm + 2 * webThicknessMm;

  // Model coordinates centered horizontally on x = 0, y = 0 at bottom
  const bottomFlange = {
    x: -bottomFlangeWidthMm / 2,
    y: 0,
    width: bottomFlangeWidthMm,
    height: bottomFlangeThicknessMm,
  };

  const leftWeb = {
    x: -webSpacingMm / 2 - webThicknessMm,
    y: bottomFlangeThicknessMm,
    width: webThicknessMm,
    height: webDepthMm,
  };

  const rightWeb = {
    x: webSpacingMm / 2,
    y: bottomFlangeThicknessMm,
    width: webThicknessMm,
    height: webDepthMm,
  };

  const topFlange = {
    x: -topFlangeWidthMm / 2,
    y: bottomFlangeThicknessMm + webDepthMm,
    width: topFlangeWidthMm,
    height: topFlangeThicknessMm,
  };

  return {
    totalWidthMm,
    totalHeightMm,
    topFlangeWidthMm,
    topFlangeThicknessMm,
    webDepthMm,
    webThicknessMm,
    webSpacingMm,
    bottomFlangeWidthMm,
    bottomFlangeThicknessMm,
    webCenterDistanceMm,
    webOuterDistanceMm,
    topFlange,
    bottomFlange,
    leftWeb,
    rightWeb,
  };
}

/**
 * Generates standalone SVG drawing for box girder cross section.
 */
export function boxGirderToSVG(inputs: BoxGirderInputs): string {
  const geom = computeBoxGirderGeometry(inputs);

  // Layout padding for annotations and dimension lines
  const padLeft = 110;
  const padRight = 110;
  const padTop = 90;
  const padBottom = 90;

  const viewBoxWidth = geom.totalWidthMm + padLeft + padRight;
  const viewBoxHeight = geom.totalHeightMm + padTop + padBottom;

  const centerX = padLeft + geom.totalWidthMm / 2;

  // SVG Y coords (top down):
  const topFlangeY = padTop;
  const websY = topFlangeY + geom.topFlangeThicknessMm;
  const bottomFlangeY = websY + geom.webDepthMm;
  const bottomOfSectionY = bottomFlangeY + geom.bottomFlangeThicknessMm;

  // Shapes
  const topFlangeSvg = rect(
    centerX - geom.topFlangeWidthMm / 2,
    topFlangeY,
    geom.topFlangeWidthMm,
    geom.topFlangeThicknessMm,
    { fill: '#e2e8f0', stroke: '#0f172a', strokeWidth: 2 },
  );

  const leftWebSvg = rect(
    centerX - geom.webSpacingMm / 2 - geom.webThicknessMm,
    websY,
    geom.webThicknessMm,
    geom.webDepthMm,
    { fill: '#e2e8f0', stroke: '#0f172a', strokeWidth: 2 },
  );

  const rightWebSvg = rect(
    centerX + geom.webSpacingMm / 2,
    websY,
    geom.webThicknessMm,
    geom.webDepthMm,
    { fill: '#e2e8f0', stroke: '#0f172a', strokeWidth: 2 },
  );

  const bottomFlangeSvg = rect(
    centerX - geom.bottomFlangeWidthMm / 2,
    bottomFlangeY,
    geom.bottomFlangeWidthMm,
    geom.bottomFlangeThicknessMm,
    { fill: '#e2e8f0', stroke: '#0f172a', strokeWidth: 2 },
  );

  // Centerline
  const centerLineSvg = centerline(
    centerX,
    padTop - 45,
    centerX,
    bottomOfSectionY + 45,
    { stroke: '#0284c7', strokeWidth: 1.2 },
  );

  // Dimension lines
  // 1. Top Flange Width (above)
  const dimTopWidth = horizontalDimension(
    centerX - geom.topFlangeWidthMm / 2,
    centerX + geom.topFlangeWidthMm / 2,
    topFlangeY - 35,
    `Top Flange: ${geom.topFlangeWidthMm} mm (thk: ${geom.topFlangeThicknessMm} mm)`,
    topFlangeY,
    { color: '#475569', fontSize: 12 },
  );

  // 2. Bottom Flange Width (below)
  const dimBottomWidth = horizontalDimension(
    centerX - geom.bottomFlangeWidthMm / 2,
    centerX + geom.bottomFlangeWidthMm / 2,
    bottomOfSectionY + 38,
    `Bottom Flange: ${geom.bottomFlangeWidthMm} mm (thk: ${geom.bottomFlangeThicknessMm} mm)`,
    bottomOfSectionY,
    { color: '#475569', fontSize: 12 },
  );

  // 3. Clear Web Spacing (middle)
  const dimWebSpacing = horizontalDimension(
    centerX - geom.webSpacingMm / 2,
    centerX + geom.webSpacingMm / 2,
    websY + geom.webDepthMm / 2,
    `Web Gap: ${geom.webSpacingMm} mm`,
    websY + geom.webDepthMm / 2,
    { color: '#0369a1', fontSize: 11 },
  );

  // 4. Web Depth (left)
  const dimWebDepth = verticalDimension(
    websY,
    bottomFlangeY,
    centerX - geom.totalWidthMm / 2 - 45,
    `Web Depth: ${geom.webDepthMm} mm (thk: ${geom.webThicknessMm} mm)`,
    centerX - geom.webSpacingMm / 2 - geom.webThicknessMm,
    { color: '#475569', fontSize: 12 },
  );

  // 5. Total Section Height (right)
  const dimTotalHeight = verticalDimension(
    topFlangeY,
    bottomOfSectionY,
    centerX + geom.totalWidthMm / 2 + 45,
    `Total Height: ${geom.totalHeightMm} mm`,
    centerX + geom.totalWidthMm / 2,
    { color: '#0f172a', fontSize: 12 },
  );

  // Title text inside SVG
  const titleSvg = text(
    centerX,
    padTop - 65,
    'BOX GIRDER CROSS SECTION',
    { fontSize: 14, fontWeight: 'bold', fill: '#0f172a' },
  );

  const elements = [
    titleSvg,
    topFlangeSvg,
    leftWebSvg,
    rightWebSvg,
    bottomFlangeSvg,
    centerLineSvg,
    dimTopWidth,
    dimBottomWidth,
    dimWebSpacing,
    dimWebDepth,
    dimTotalHeight,
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
 * Generates standard AutoCAD R12 ASCII DXF text for box girder cross section.
 */
export function boxGirderToDXF(inputs: BoxGirderInputs): string {
  const geom = computeBoxGirderGeometry(inputs);
  const doc = new DxfDocument();

  // Bottom Flange
  doc.addRectOutline(
    geom.bottomFlange.x,
    geom.bottomFlange.y,
    geom.bottomFlange.width,
    geom.bottomFlange.height,
    '0',
  );

  // Left Web
  doc.addRectOutline(
    geom.leftWeb.x,
    geom.leftWeb.y,
    geom.leftWeb.width,
    geom.leftWeb.height,
    '0',
  );

  // Right Web
  doc.addRectOutline(
    geom.rightWeb.x,
    geom.rightWeb.y,
    geom.rightWeb.width,
    geom.rightWeb.height,
    '0',
  );

  // Top Flange
  doc.addRectOutline(
    geom.topFlange.x,
    geom.topFlange.y,
    geom.topFlange.width,
    geom.topFlange.height,
    '0',
  );

  // Centerline
  doc.addCenterline(0, -30, 0, geom.totalHeightMm + 30, 'CENTER');

  // Text labels
  doc.addText(
    -geom.topFlangeWidthMm / 2,
    geom.totalHeightMm + 15,
    15,
    `TOP FLANGE: ${geom.topFlangeWidthMm}x${geom.topFlangeThicknessMm} mm`,
    'DIMENSIONS',
  );

  doc.addText(
    -geom.bottomFlangeWidthMm / 2,
    -25,
    15,
    `BOTTOM FLANGE: ${geom.bottomFlangeWidthMm}x${geom.bottomFlangeThicknessMm} mm`,
    'DIMENSIONS',
  );

  doc.addText(
    geom.totalWidthMm / 2 + 20,
    geom.totalHeightMm / 2,
    15,
    `TOTAL HEIGHT: ${geom.totalHeightMm} mm`,
    'DIMENSIONS',
    90,
  );

  doc.addText(
    -geom.totalWidthMm / 2 - 40,
    geom.totalHeightMm / 2,
    15,
    `WEB DEPTH: ${geom.webDepthMm} mm (THK: ${geom.webThicknessMm} mm, GAP: ${geom.webSpacingMm} mm)`,
    'DIMENSIONS',
    90,
  );

  return doc.toString();
}

/**
 * Returns unified DrawingResult for Box Girder.
 */
export function generateBoxGirderDrawing(inputs: BoxGirderInputs): DrawingResult {
  return {
    title: 'Box Girder Cross Section',
    filename: 'box_girder_cross_section',
    svg: boxGirderToSVG(inputs),
    dxf: boxGirderToDXF(inputs),
    description: 'Symmetric welded box girder cross-section showing flanges, dual continuous webs, and clearance dimensions.',
  };
}
