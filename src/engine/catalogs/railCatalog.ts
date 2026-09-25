/**
 * Crane Rail Reference Catalog
 * Source: TABLES / IS 3443 / DIN 536
 * Version: 2026.09.01
 */

export interface RailCatalogItem {
  id: string;
  designation: string;
  headWidthMm: number;
  baseWidthMm: number;
  heightMm: number;
  weightKgPerM: number;
  standard: string;
}

export const RAIL_CATALOG: RailCatalogItem[] = [
  {
    id: 'sq-40',
    designation: '40 x 40 Square Bar',
    headWidthMm: 40,
    baseWidthMm: 40,
    heightMm: 40,
    weightKgPerM: 12.56,
    standard: 'IS 2062',
  },
  {
    id: 'sq-50',
    designation: '50 x 50 Square Bar',
    headWidthMm: 50,
    baseWidthMm: 50,
    heightMm: 50,
    weightKgPerM: 19.63,
    standard: 'IS 2062',
  },
  {
    id: 'sq-60',
    designation: '60 x 60 Square Bar',
    headWidthMm: 60,
    baseWidthMm: 60,
    heightMm: 60,
    weightKgPerM: 28.26,
    standard: 'IS 2062',
  },
  {
    id: 'cr-80',
    designation: 'CR 80 (IS 3443)',
    headWidthMm: 80,
    baseWidthMm: 130,
    heightMm: 130,
    weightKgPerM: 64.2,
    standard: 'IS 3443',
  },
  {
    id: 'cr-100',
    designation: 'CR 100 (IS 3443)',
    headWidthMm: 100,
    baseWidthMm: 150,
    heightMm: 150,
    weightKgPerM: 89.0,
    standard: 'IS 3443',
  },
  {
    id: 'cr-120',
    designation: 'CR 120 (IS 3443)',
    headWidthMm: 120,
    baseWidthMm: 170,
    heightMm: 170,
    weightKgPerM: 118.0,
    standard: 'IS 3443',
  },
  {
    id: 'a-65',
    designation: 'DIN 536 A 65',
    headWidthMm: 65,
    baseWidthMm: 175,
    heightMm: 75,
    weightKgPerM: 43.1,
    standard: 'DIN 536',
  },
  {
    id: 'a-100',
    designation: 'DIN 536 A 100',
    headWidthMm: 100,
    baseWidthMm: 200,
    heightMm: 95,
    weightKgPerM: 74.3,
    standard: 'DIN 536',
  },
];
