/**
 * Safe numeric operations for engineering calculations
 * Prevents NaN, Infinity, and handles explicit workbook rounding
 */

export function assertFiniteNumber(value: any, name: string): number {
  if (value === null || value === undefined || value === '') {
    throw new Error(`Input "${name}" is required and cannot be empty.`);
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (isNaN(n) || !isFinite(n)) {
    throw new Error(`Input "${name}" must be a valid finite number. Received: ${value}`);
  }
  return n;
}

export function assertPositiveNumber(value: any, name: string): number {
  const n = assertFiniteNumber(value, name);
  if (n <= 0) {
    throw new Error(`Input "${name}" must be greater than zero. Received: ${n}`);
  }
  return n;
}

export function assertNonNegativeNumber(value: any, name: string): number {
  const n = assertFiniteNumber(value, name);
  if (n < 0) {
    throw new Error(`Input "${name}" cannot be negative. Received: ${n}`);
  }
  return n;
}

/**
 * Replicates Excel's ROUND(value, decimals) function
 */
export function excelRound(value: number, decimals: number = 0): number {
  if (!isFinite(value)) return value;
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Format a number for engineering display with sensible defaults
 */
export function formatEngineeringNumber(value: number | null | undefined, decimals: number = 3): string {
  if (value === null || value === undefined || !isFinite(value)) {
    return '—';
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}
