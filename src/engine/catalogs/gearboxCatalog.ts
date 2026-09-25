/**
 * Gearbox Reference Catalog
 * Source: Mechanism Calculation sheets (M.H., C.T., L.T., CRAB WT.)
 * Version: 2026.09.01
 */

export interface GearboxCatalogItem {
  id: string;
  model: string;
  type: string;
  ratio: number;
  stages: number;
  ratedPowerKw: number;
  ratedPowerHp: number;
  weightKg: number;
  application: 'HOIST' | 'CROSS_TRAVEL' | 'LONG_TRAVEL';
}

export const GEARBOX_CATALOG: GearboxCatalogItem[] = [
  // Hoist Gearboxes
  { id: 'gb-hoist-hr500-103', model: 'HR 500 + 150', type: 'Horizontal Helical Multi-stage', ratio: 103.4, stages: 3, ratedPowerKw: 15.0, ratedPowerHp: 20.1, weightKg: 450, application: 'HOIST' },
  { id: 'gb-hoist-hr400-80', model: 'HR 400 + 125', type: 'Horizontal Helical Multi-stage', ratio: 80.0, stages: 3, ratedPowerKw: 11.0, ratedPowerHp: 14.75, weightKg: 380, application: 'HOIST' },
  { id: 'gb-hoist-hr500-94', model: 'HR 500 + 125', type: 'Horizontal Helical Multi-stage', ratio: 94.0, stages: 3, ratedPowerKw: 15.0, ratedPowerHp: 20.1, weightKg: 430, application: 'HOIST' },

  // Cross Travel Gearboxes
  { id: 'gb-ct-vr250-21.5', model: 'VR 250 / 21.5', type: 'Vertical / Helical Shaft Mounted', ratio: 21.5, stages: 2, ratedPowerKw: 1.5, ratedPowerHp: 2.01, weightKg: 150, application: 'CROSS_TRAVEL' },
  { id: 'gb-ct-vr200-16', model: 'VR 200 / 16', type: 'Vertical / Helical Shaft Mounted', ratio: 16.0, stages: 2, ratedPowerKw: 1.1, ratedPowerHp: 1.47, weightKg: 110, application: 'CROSS_TRAVEL' },
  { id: 'gb-ct-vr250-25', model: 'VR 250 / 25', type: 'Vertical / Helical Shaft Mounted', ratio: 25.0, stages: 2, ratedPowerKw: 1.5, ratedPowerHp: 2.01, weightKg: 150, application: 'CROSS_TRAVEL' },

  // Long Travel Gearboxes
  { id: 'gb-lt-vr350-21.5', model: 'VR 350 / 21.5 (Workbook Sample)', type: 'Vertical / Helical Shaft Mounted', ratio: 21.5, stages: 2, ratedPowerKw: 2.2, ratedPowerHp: 2.95, weightKg: 220, application: 'LONG_TRAVEL' },
  { id: 'gb-lt-vr350-28', model: 'VR 350 / 28', type: 'Vertical / Helical Shaft Mounted', ratio: 28.0, stages: 2, ratedPowerKw: 2.2, ratedPowerHp: 2.95, weightKg: 220, application: 'LONG_TRAVEL' },
  { id: 'gb-lt-vr350-31.5', model: 'VR 350 / 31.5', type: 'Vertical / Helical Shaft Mounted', ratio: 31.5, stages: 2, ratedPowerKw: 2.2, ratedPowerHp: 2.95, weightKg: 220, application: 'LONG_TRAVEL' },
];
