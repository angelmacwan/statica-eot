/**
 * Brake Catalog
 * Source: BRAKE SOC and BRAKE sheets
 * Version: 2026.09.01
 */

export interface BrakeCatalogItem {
  id: string;
  model: string;
  type: string;
  drumDiameterMm: number;
  ratedTorqueKgm: number;
  ratedTorqueNm: number;
  weightKg: number;
}

export const BRAKE_CATALOG: BrakeCatalogItem[] = [
  { id: 'mdt-100-18', model: 'MDT-100-18', type: 'Electro-hydraulic Thruster', drumDiameterMm: 100, ratedTorqueKgm: 6, ratedTorqueNm: 60, weightKg: 17 },
  { id: 'mdt-150-18', model: 'MDT-150-18', type: 'Electro-hydraulic Thruster', drumDiameterMm: 150, ratedTorqueKgm: 9, ratedTorqueNm: 90, weightKg: 20 },
  { id: 'mdt-160-18', model: 'MDT-160-18', type: 'Electro-hydraulic Thruster', drumDiameterMm: 160, ratedTorqueKgm: 9, ratedTorqueNm: 90, weightKg: 20 },
  { id: 'mdt-200-18', model: 'MDT-200-18', type: 'Electro-hydraulic Thruster', drumDiameterMm: 200, ratedTorqueKgm: 20, ratedTorqueNm: 200, weightKg: 27 },
  { id: 'mdt-250-18', model: 'MDT-250-18', type: 'Electro-hydraulic Thruster', drumDiameterMm: 250, ratedTorqueKgm: 35, ratedTorqueNm: 350, weightKg: 30 },
  { id: 'mdt-250-34', model: 'MDT-250-34', type: 'Electro-hydraulic Thruster', drumDiameterMm: 250, ratedTorqueKgm: 42, ratedTorqueNm: 420, weightKg: 30 },
  { id: 'mdt-300-34', model: 'MDT-300-34', type: 'Electro-hydraulic Thruster', drumDiameterMm: 300, ratedTorqueKgm: 62, ratedTorqueNm: 620, weightKg: 70 },
  { id: 'mdt-400-46', model: 'MDT-400-46', type: 'Electro-hydraulic Thruster', drumDiameterMm: 400, ratedTorqueKgm: 90, ratedTorqueNm: 900, weightKg: 85 },
  { id: 'mdt-400-68', model: 'MDT-400-68', type: 'Electro-hydraulic Thruster', drumDiameterMm: 400, ratedTorqueKgm: 110, ratedTorqueNm: 1100, weightKg: 88 },
  { id: 'mdt-500-46', model: 'MDT-500-46', type: 'Electro-hydraulic Thruster', drumDiameterMm: 500, ratedTorqueKgm: 190, ratedTorqueNm: 1900, weightKg: 125 },
  { id: 'mdt-500-68', model: 'MDT-500-68', type: 'Electro-hydraulic Thruster', drumDiameterMm: 500, ratedTorqueKgm: 290, ratedTorqueNm: 2900, weightKg: 125 },
  { id: 'mdt-500-114', model: 'MDT-500-114', type: 'Electro-hydraulic Thruster', drumDiameterMm: 500, ratedTorqueKgm: 485, ratedTorqueNm: 4850, weightKg: 125 },
  { id: 'mdt-600-68', model: 'MDT-600-68', type: 'Electro-hydraulic Thruster', drumDiameterMm: 600, ratedTorqueKgm: 350, ratedTorqueNm: 3500, weightKg: 190 },
  { id: 'mdt-600-114', model: 'MDT-600-114', type: 'Electro-hydraulic Thruster', drumDiameterMm: 600, ratedTorqueKgm: 580, ratedTorqueNm: 5800, weightKg: 190 },
];
