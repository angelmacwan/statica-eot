/**
 * Drawing Engine Common Types
 * Statica EOT Crane Engineering Platform
 */

export interface DrawingResult {
  title: string;
  filename: string;
  svg: string;
  dxf: string;
  description?: string;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}
