import { CalculationCheck, CheckStatus } from './types';
import { formatEngineeringNumber } from './safeMath';

export interface ToleranceCheckOptions {
  id: string;
  name: string;
  actual: number;
  required: number;
  tolerancePercent?: number; // e.g. 0.1 for +-10%
  unit?: string;
  parameterName?: string;
}

/**
 * Checks whether an actual speed or quantity is within a percentage tolerance band (default +-10%)
 * as defined in the SPEED sheet: lower = required * 0.9, upper = required * 1.1
 */
export function checkSpeedTolerance(options: ToleranceCheckOptions): CalculationCheck {
  const {
    id,
    name,
    actual,
    required,
    tolerancePercent = 0.1,
    unit = 'm/min',
    parameterName = 'Speed',
  } = options;

  const lowerBound = required * (1 - tolerancePercent);
  const upperBound = required * (1 + tolerancePercent);

  const passes = actual >= lowerBound && actual <= upperBound;
  const status: CheckStatus = passes ? 'PASS' : 'FAIL';

  const message = passes
    ? `Actual ${parameterName} (${formatEngineeringNumber(actual)} ${unit}) is within allowed range [${formatEngineeringNumber(lowerBound)} - ${formatEngineeringNumber(upperBound)} ${unit}].`
    : `Actual ${parameterName} (${formatEngineeringNumber(actual)} ${unit}) is outside required range [${formatEngineeringNumber(lowerBound)} - ${formatEngineeringNumber(upperBound)} ${unit}]. Required target: ${formatEngineeringNumber(required)} ${unit}.`;

  return {
    id,
    name,
    status,
    actual,
    required: `${formatEngineeringNumber(lowerBound)} to ${formatEngineeringNumber(upperBound)}`,
    criterion: `${formatEngineeringNumber(lowerBound)} <= actual <= ${formatEngineeringNumber(upperBound)}`,
    unit,
    message,
  };
}

/**
 * Checks capacity / rating: actual (selected) must be >= required
 */
export function checkCapacityAdequacy(
  id: string,
  name: string,
  selected: number,
  required: number,
  unit: string = 'kW',
  componentName: string = 'Component',
): CalculationCheck {
  const passes = selected >= required;
  const status: CheckStatus = passes ? 'PASS' : 'FAIL';

  const message = passes
    ? `Selected ${componentName} rating (${formatEngineeringNumber(selected)} ${unit}) satisfies required demand (${formatEngineeringNumber(required)} ${unit}).`
    : `Selected ${componentName} rating (${formatEngineeringNumber(selected)} ${unit}) is less than required demand (${formatEngineeringNumber(required)} ${unit}).`;

  return {
    id,
    name,
    status,
    actual: selected,
    required,
    criterion: `selected >= required (${formatEngineeringNumber(required)} ${unit})`,
    unit,
    message,
  };
}

/**
 * Checks maximum limit: actual must be <= limit
 */
export function checkMaxLimit(
  id: string,
  name: string,
  actual: number,
  limit: number,
  unit: string = '',
  description: string = 'Value',
): CalculationCheck {
  const passes = actual <= limit;
  const status: CheckStatus = passes ? 'PASS' : 'FAIL';

  const message = passes
    ? `${description} (${formatEngineeringNumber(actual)} ${unit}) is within maximum allowable limit of ${formatEngineeringNumber(limit)} ${unit}.`
    : `${description} (${formatEngineeringNumber(actual)} ${unit}) exceeds allowable limit of ${formatEngineeringNumber(limit)} ${unit}.`;

  return {
    id,
    name,
    status,
    actual,
    required: `<= ${formatEngineeringNumber(limit)}`,
    criterion: `actual <= ${formatEngineeringNumber(limit)}`,
    unit,
    message,
  };
}
