/**
 * Wire Rope Reference Catalog
 * Source: WIRE ROPE and GROOVING sheets, IS 2266 / EN 12385
 * Version: 2026.09.01
 */

export interface RopeCatalogItem {
  id: string;
  diameterMm: number;
  construction: string;
  tensileGradeNmm2: number;
  core: 'Fibre core' | 'Steel core (IWRC)';
  breakingForceKn: number;
  breakingForceTonnes: number;
  weightKgPer100m: number;
  standard: string;
}

export const ROPE_CATALOG: RopeCatalogItem[] = [
  { id: 'rope-10-6x36-1770', diameterMm: 10, construction: '6 x 36', tensileGradeNmm2: 1770, core: 'Fibre core', breakingForceKn: 58.2, breakingForceTonnes: 5.93, weightKgPer100m: 38.1, standard: 'IS 2266 / ISO 2408' },
  { id: 'rope-12-6x36-1770', diameterMm: 12, construction: '6 x 36', tensileGradeNmm2: 1770, core: 'Fibre core', breakingForceKn: 83.8, breakingForceTonnes: 8.54, weightKgPer100m: 54.9, standard: 'IS 2266 / ISO 2408' },
  { id: 'rope-13-6x36-1770', diameterMm: 13, construction: '6 x 36', tensileGradeNmm2: 1770, core: 'Fibre core', breakingForceKn: 98.4, breakingForceTonnes: 10.03, weightKgPer100m: 64.4, standard: 'IS 2266 / ISO 2408' },
  { id: 'rope-14-6x36-1770', diameterMm: 14, construction: '6 x 36', tensileGradeNmm2: 1770, core: 'Fibre core', breakingForceKn: 114.0, breakingForceTonnes: 11.62, weightKgPer100m: 74.7, standard: 'IS 2266 / ISO 2408' },
  { id: 'rope-16-6x36-1770', diameterMm: 16, construction: '6 x 36', tensileGradeNmm2: 1770, core: 'Fibre core', breakingForceKn: 149.0, breakingForceTonnes: 15.19, weightKgPer100m: 97.5, standard: 'IS 2266 / ISO 2408' },
  { id: 'rope-18-6x36-1770', diameterMm: 18, construction: '6 x 36', tensileGradeNmm2: 1770, core: 'Fibre core', breakingForceKn: 189.0, breakingForceTonnes: 19.27, weightKgPer100m: 123.0, standard: 'IS 2266 / ISO 2408' },
  { id: 'rope-20-6x36-1770', diameterMm: 20, construction: '6 x 36', tensileGradeNmm2: 1770, core: 'Fibre core', breakingForceKn: 233.0, breakingForceTonnes: 23.75, weightKgPer100m: 152.0, standard: 'IS 2266 / ISO 2408' },
  { id: 'rope-22-6x36-1770', diameterMm: 22, construction: '6 x 36', tensileGradeNmm2: 1770, core: 'Fibre core', breakingForceKn: 282.0, breakingForceTonnes: 28.75, weightKgPer100m: 184.0, standard: 'IS 2266 / ISO 2408' },
  { id: 'rope-24-6x36-1770', diameterMm: 24, construction: '6 x 36', tensileGradeNmm2: 1770, core: 'Fibre core', breakingForceKn: 335.0, breakingForceTonnes: 34.15, weightKgPer100m: 219.0, standard: 'IS 2266 / ISO 2408' },
];
