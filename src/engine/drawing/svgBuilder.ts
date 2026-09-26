/**
 * SVG Primitive Builder for Engineering Drawings
 * Statica EOT Crane Engineering Platform
 */

export interface SvgRectOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  rx?: number;
  className?: string;
  opacity?: number;
}

export interface SvgCircleOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  className?: string;
  opacity?: number;
}

export interface SvgLineOptions {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  className?: string;
  opacity?: number;
}

export interface SvgTextOptions {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fill?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  dominantBaseline?: 'auto' | 'middle' | 'central' | 'hanging' | 'baseline';
  transform?: string;
  className?: string;
}

export interface SvgDimensionOptions {
  offset?: number;
  extensionGap?: number;
  arrowSize?: number;
  color?: string;
  fontSize?: number;
  textOffset?: number;
  unit?: string;
}

export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  options: SvgRectOptions = {},
): string {
  const fill = options.fill ?? 'none';
  const stroke = options.stroke ?? '#1e293b';
  const strokeWidth = options.strokeWidth ?? 1.5;
  const rx = options.rx !== undefined ? ` rx="${options.rx}"` : '';
  const dash = options.strokeDasharray ? ` stroke-dasharray="${options.strokeDasharray}"` : '';
  const opacity = options.opacity !== undefined ? ` opacity="${options.opacity}"` : '';
  const cls = options.className ? ` class="${options.className}"` : '';

  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${rx}${dash}${opacity}${cls} />`;
}

export function circle(
  cx: number,
  cy: number,
  r: number,
  options: SvgCircleOptions = {},
): string {
  const fill = options.fill ?? 'none';
  const stroke = options.stroke ?? '#1e293b';
  const strokeWidth = options.strokeWidth ?? 1.5;
  const dash = options.strokeDasharray ? ` stroke-dasharray="${options.strokeDasharray}"` : '';
  const opacity = options.opacity !== undefined ? ` opacity="${options.opacity}"` : '';
  const cls = options.className ? ` class="${options.className}"` : '';

  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"${dash}${opacity}${cls} />`;
}

export function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: SvgLineOptions = {},
): string {
  const stroke = options.stroke ?? '#1e293b';
  const strokeWidth = options.strokeWidth ?? 1.5;
  const dash = options.strokeDasharray ? ` stroke-dasharray="${options.strokeDasharray}"` : '';
  const opacity = options.opacity !== undefined ? ` opacity="${options.opacity}"` : '';
  const cls = options.className ? ` class="${options.className}"` : '';

  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}"${dash}${opacity}${cls} />`;
}

export function centerline(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: SvgLineOptions = {},
): string {
  return line(x1, y1, x2, y2, {
    stroke: options.stroke ?? '#0284c7',
    strokeWidth: options.strokeWidth ?? 1,
    strokeDasharray: options.strokeDasharray ?? '12,4,3,4',
    ...options,
  });
}

export function text(
  x: number,
  y: number,
  content: string,
  options: SvgTextOptions = {},
): string {
  const fontSize = options.fontSize ?? 12;
  const fontFamily = options.fontFamily ?? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  const fontWeight = options.fontWeight ?? 'normal';
  const fill = options.fill ?? '#334155';
  const textAnchor = options.textAnchor ?? 'middle';
  const dominantBaseline = options.dominantBaseline ?? 'middle';
  const transform = options.transform ? ` transform="${options.transform}"` : '';
  const cls = options.className ? ` class="${options.className}"` : '';

  return `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" fill="${fill}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}"${transform}${cls}>${content}</text>`;
}

export function arrowMarker(
  tipX: number,
  tipY: number,
  angleRad: number,
  size: number = 6,
  color: string = '#64748b',
): string {
  const angle1 = angleRad + Math.PI - 0.35;
  const angle2 = angleRad + Math.PI + 0.35;
  const x1 = tipX + size * Math.cos(angle1);
  const y1 = tipY + size * Math.sin(angle1);
  const x2 = tipX + size * Math.cos(angle2);
  const y2 = tipY + size * Math.sin(angle2);

  return `<polygon points="${tipX},${tipY} ${x1},${y1} ${x2},${y2}" fill="${color}" />`;
}

/**
 * Draws a horizontal dimension line with extension lines, arrows, and dimension text.
 * yBase is where the measured feature is located.
 * dimY is where the dimension line should run.
 */
export function horizontalDimension(
  x1: number,
  x2: number,
  dimY: number,
  label: string,
  yBase: number,
  options: SvgDimensionOptions = {},
): string {
  const color = options.color ?? '#64748b';
  const fontSize = options.fontSize ?? 11;
  const arrowSize = options.arrowSize ?? 6;
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const dist = maxX - minX;

  const extOvershoot = (dimY < yBase ? -1 : 1) * 6;
  const extY2 = dimY + extOvershoot;

  // Extension lines from measured feature to dimension line
  const ext1 = line(minX, yBase, minX, extY2, { stroke: color, strokeWidth: 0.8, opacity: 0.75 });
  const ext2 = line(maxX, yBase, maxX, extY2, { stroke: color, strokeWidth: 0.8, opacity: 0.75 });

  // Dimension main line
  const dimLine = line(minX, dimY, maxX, dimY, { stroke: color, strokeWidth: 1 });

  // Arrows
  const leftArrow = arrowMarker(minX, dimY, 0, arrowSize, color);
  const rightArrow = arrowMarker(maxX, dimY, Math.PI, arrowSize, color);

  // Label text centered
  const midX = (minX + maxX) / 2;
  const textY = dimY - (dist < 40 ? 12 : 5);
  const labelElem = text(midX, textY, label, {
    fontSize,
    fill: color,
    textAnchor: 'middle',
    dominantBaseline: 'auto',
  });

  return `${ext1}\n${ext2}\n${dimLine}\n${leftArrow}\n${rightArrow}\n${labelElem}`;
}

/**
 * Draws a vertical dimension line with extension lines, arrows, and dimension text.
 * xBase is where the measured feature is located.
 * dimX is where the dimension line should run.
 */
export function verticalDimension(
  y1: number,
  y2: number,
  dimX: number,
  label: string,
  xBase: number,
  options: SvgDimensionOptions = {},
): string {
  const color = options.color ?? '#64748b';
  const fontSize = options.fontSize ?? 11;
  const arrowSize = options.arrowSize ?? 6;
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  const extOvershoot = (dimX < xBase ? -1 : 1) * 6;
  const extX2 = dimX + extOvershoot;

  // Extension lines from measured feature to dimension line
  const ext1 = line(xBase, minY, extX2, minY, { stroke: color, strokeWidth: 0.8, opacity: 0.75 });
  const ext2 = line(xBase, maxY, extX2, maxY, { stroke: color, strokeWidth: 0.8, opacity: 0.75 });

  // Dimension main line
  const dimLine = line(dimX, minY, dimX, maxY, { stroke: color, strokeWidth: 1 });

  // Arrows
  const topArrow = arrowMarker(dimX, minY, Math.PI / 2, arrowSize, color);
  const bottomArrow = arrowMarker(dimX, maxY, -Math.PI / 2, arrowSize, color);

  // Label text centered vertically, rotated -90 deg
  const midY = (minY + maxY) / 2;
  const textX = dimX - 6;
  const labelElem = `<text x="${textX}" y="${midY}" font-size="${fontSize}" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" fill="${color}" text-anchor="middle" dominant-baseline="auto" transform="rotate(-90 ${textX} ${midY})">${label}</text>`;

  return `${ext1}\n${ext2}\n${dimLine}\n${topArrow}\n${bottomArrow}\n${labelElem}`;
}

/**
 * Wraps content in a full standalone SVG document with viewBox and responsive attributes.
 */
export function svgDocument(
  viewBox: { minX: number; minY: number; width: number; height: number } | string,
  content: string,
  width: number | string = '100%',
  height: number | string = '100%',
  backgroundColor: string = '#ffffff',
): string {
  const vb = typeof viewBox === 'string'
    ? viewBox
    : `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`;

  const bgRect = backgroundColor && backgroundColor !== 'transparent'
    ? `<rect width="100%" height="100%" fill="${backgroundColor}" />\n`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${width}" height="${height}" style="background-color: ${backgroundColor}; display: block; max-width: 100%;">\n${bgRect}${content}\n</svg>`;
}
