/**
 * Crane Wheel Reference Catalog
 * Source: Mechanism Calculation sheets and IS 3177
 * Version: 2026.09.01
 */

export interface WheelCatalogItem {
  id: string;
  nominalDiameterMm: number;
  treadWidthMm: number;
  flangeHeightMm: number;
  material: string;
  approxWeightKg: number;
  standard: string;
}

export const WHEEL_CATALOG: WheelCatalogItem[] = [
  {
    id: 'wh-160',
    nominalDiameterMm: 160,
    treadWidthMm: 65,
    flangeHeightMm: 20,
    material: 'Forged Steel C55 / 42CrMo4',
    approxWeightKg: 35,
    standard: 'IS 3177',
  },
  {
    id: 'wh-200',
    nominalDiameterMm: 200,
    treadWidthMm: 75,
    flangeHeightMm: 25,
    material: 'Forged Steel C55 / 42CrMo4',
    approxWeightKg: 55,
    standard: 'IS 3177',
  },
  {
    id: 'wh-250',
    nominalDiameterMm: 250,
    treadWidthMm: 90,
    flangeHeightMm: 25,
    material: 'Forged Steel C55 / 42CrMo4',
    approxWeightKg: 85,
    standard: 'IS 3177',
  },
  {
    id: 'wh-315',
    nominalDiameterMm: 315,
    treadWidthMm: 100,
    flangeHeightMm: 30,
    material: 'Forged Steel C55 / 42CrMo4',
    approxWeightKg: 135,
    standard: 'IS 3177',
  },
  {
    id: 'wh-400',
    nominalDiameterMm: 400,
    treadWidthMm: 110,
    flangeHeightMm: 30,
    material: 'Forged Steel C55 / 42CrMo4',
    approxWeightKg: 210,
    standard: 'IS 3177',
  },
  {
    id: 'wh-500',
    nominalDiameterMm: 500,
    treadWidthMm: 125,
    flangeHeightMm: 35,
    material: 'Forged Steel C55 / 42CrMo4',
    approxWeightKg: 320,
    standard: 'IS 3177',
  },
  {
    id: 'wh-630',
    nominalDiameterMm: 630,
    treadWidthMm: 140,
    flangeHeightMm: 40,
    material: 'Forged Steel C55 / 42CrMo4',
    approxWeightKg: 490,
    standard: 'IS 3177',
  },
];
