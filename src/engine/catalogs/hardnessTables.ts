/**
 * Wheel and Rail Hardness Reference Data
 * Source: HARDNESS-BHw,BHr sheet
 * Version: 2026.09.01
 */

export interface HardnessMaterialItem {
  id: string;
  material: string;
  typicalBhn: number;
  minRecommendedBhn: number;
  maxRecommendedBhn: number;
  application: 'WHEEL' | 'RAIL';
}

export const HARDNESS_CATALOG: HardnessMaterialItem[] = [
  { id: 'rail-std', material: 'Standard Crane Rail (IS 3443 / IRS 52)', typicalBhn: 200, minRecommendedBhn: 200, maxRecommendedBhn: 260, application: 'RAIL' },
  { id: 'rail-90uts', material: '90 UTS Crane Rail', typicalBhn: 260, minRecommendedBhn: 260, maxRecommendedBhn: 300, application: 'RAIL' },
  { id: 'wheel-cast-steel', material: 'Cast Steel IS 1030 Grade 280-520W', typicalBhn: 220, minRecommendedBhn: 220, maxRecommendedBhn: 280, application: 'WHEEL' },
  { id: 'wheel-forged-c55', material: 'Forged Steel C55 / 55C8 Rim Quenched', typicalBhn: 320, minRecommendedBhn: 300, maxRecommendedBhn: 350, application: 'WHEEL' },
  { id: 'wheel-forged-42crmo4', material: 'Alloy Steel 42CrMo4 Induction Hardened', typicalBhn: 340, minRecommendedBhn: 320, maxRecommendedBhn: 380, application: 'WHEEL' },
];
