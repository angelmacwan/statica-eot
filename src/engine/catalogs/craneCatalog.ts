/**
 * Crane Category Reference Data
 * Source: CRANE CAT sheet
 * Version: 2026.09.01
 */

export interface CraneCategoryItem {
  id: string;
  capacityTonnes: number;
  spanM: number;
  classDuty: string;
  headroomMm: number;
  wheelBaseMm: number;
  hookApproachLeftM: number;
  hookApproachRightM: number;
  approxWheelLoadTonnes: number;
  approxCraneWeightTonnes: number;
}

export const CRANE_CATEGORY_CATALOG: CraneCategoryItem[] = [
  {
    id: 'cat-5t-10m',
    capacityTonnes: 5,
    spanM: 10,
    classDuty: 'Class II / M5',
    headroomMm: 1100,
    wheelBaseMm: 2200,
    hookApproachLeftM: 0.8,
    hookApproachRightM: 0.8,
    approxWheelLoadTonnes: 3.2,
    approxCraneWeightTonnes: 4.5,
  },
  {
    id: 'cat-7.5t-12m',
    capacityTonnes: 7.5,
    spanM: 12,
    classDuty: 'Class II / M5',
    headroomMm: 1250,
    wheelBaseMm: 2400,
    hookApproachLeftM: 0.9,
    hookApproachRightM: 0.9,
    approxWheelLoadTonnes: 4.8,
    approxCraneWeightTonnes: 6.2,
  },
  {
    id: 'cat-10t-10m',
    capacityTonnes: 10,
    spanM: 10,
    classDuty: 'Class II / M5',
    headroomMm: 1350,
    wheelBaseMm: 2500,
    hookApproachLeftM: 0.9,
    hookApproachRightM: 0.9,
    approxWheelLoadTonnes: 5.8,
    approxCraneWeightTonnes: 7.5,
  },
  {
    id: 'cat-10t-15m',
    capacityTonnes: 10,
    spanM: 15,
    classDuty: 'Class II / M5',
    headroomMm: 1400,
    wheelBaseMm: 2800,
    hookApproachLeftM: 1.0,
    hookApproachRightM: 1.0,
    approxWheelLoadTonnes: 6.5,
    approxCraneWeightTonnes: 9.8,
  },
  {
    id: 'cat-15t-15m',
    capacityTonnes: 15,
    spanM: 15,
    classDuty: 'Class II / M5',
    headroomMm: 1550,
    wheelBaseMm: 3000,
    hookApproachLeftM: 1.1,
    hookApproachRightM: 1.1,
    approxWheelLoadTonnes: 9.2,
    approxCraneWeightTonnes: 12.5,
  },
  {
    id: 'cat-20t-16m',
    capacityTonnes: 20,
    spanM: 16,
    classDuty: 'Class III / M6',
    headroomMm: 1750,
    wheelBaseMm: 3400,
    hookApproachLeftM: 1.2,
    hookApproachRightM: 1.2,
    approxWheelLoadTonnes: 12.6,
    approxCraneWeightTonnes: 16.5,
  },
  {
    id: 'cat-30t-18m',
    capacityTonnes: 30,
    spanM: 18,
    classDuty: 'Class III / M6',
    headroomMm: 1950,
    wheelBaseMm: 3800,
    hookApproachLeftM: 1.3,
    hookApproachRightM: 1.3,
    approxWheelLoadTonnes: 18.5,
    approxCraneWeightTonnes: 24.0,
  },
  {
    id: 'cat-40t-10m',
    capacityTonnes: 40,
    spanM: 10,
    classDuty: 'Class III / M5',
    headroomMm: 2100,
    wheelBaseMm: 4000,
    hookApproachLeftM: 1.2,
    hookApproachRightM: 1.2,
    approxWheelLoadTonnes: 22.0,
    approxCraneWeightTonnes: 28.0,
  },
  {
    id: 'cat-60t-10m',
    capacityTonnes: 60,
    spanM: 10,
    classDuty: 'Class III / M5',
    headroomMm: 2400,
    wheelBaseMm: 4500,
    hookApproachLeftM: 1.2,
    hookApproachRightM: 1.2,
    approxWheelLoadTonnes: 32.5,
    approxCraneWeightTonnes: 38.0,
  },
];
