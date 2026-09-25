/**
 * Engineering Unit Conversion Constants and Helpers
 * Preserves the exact constants from the source Excel workbooks.
 */

// Workbook exact horsepower factor: HP = kW * 1.341
export const KW_TO_HP_FACTOR = 1.341;

// Standard gravitational constants used in specific sheets
export const G_STANDARD = 9.81; // m/s^2 used in general crane sheets
export const G_METRIC_GRAV = 9.80665; // N per kgf, used in torque conversion

export function kwToHp(kw: number): number {
  return kw * KW_TO_HP_FACTOR;
}

export function hpToKw(hp: number): number {
  return hp / KW_TO_HP_FACTOR;
}

export function kgmToNm(kgm: number): number {
  return kgm * G_METRIC_GRAV;
}

export function nmToKgm(nm: number): number {
  return nm / G_METRIC_GRAV;
}

export function tonnesToKg(tonnes: number): number {
  return tonnes * 1000;
}

export function kgToTonnes(kg: number): number {
  return kg / 1000;
}

export function tonnesToNewtons(tonnes: number, g = G_STANDARD): number {
  return tonnes * 1000 * g;
}

export function tonnesToKiloNewtons(tonnes: number, g = G_STANDARD): number {
  return (tonnes * 1000 * g) / 1000;
}

export function newtonsToTonnes(newtons: number, g = G_STANDARD): number {
  return newtons / (1000 * g);
}
