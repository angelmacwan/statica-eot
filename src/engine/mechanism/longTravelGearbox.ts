/**
 * Long Travel Gearbox Calculation Tool & CRITICAL REGRESSION TEST
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: L.T., SPEED
 *
 * Golden Values:
 *   Required ratio = 27.0177
 *   Selected ratio = 21.5
 *   Calculated actual speed ≈ 25.136 m/min
 *   Required speed = 20.0 m/min
 *   Allowed range = 18.0 to 22.0 m/min
 *   STATUS = FAIL (Speed 25.136 m/min exceeds upper limit 22.0 m/min)
 */

import {
  CalculationToolDefinition,
  CalculationResult,
  CalculationStep,
  CalculationCheck,
  StandardReference,
} from '../types';
import { assertPositiveNumber } from '../safeMath';
import { checkSpeedTolerance } from '../comparisons';
import { GEARBOX_CATALOG } from '../catalogs/gearboxCatalog';

export const longTravelGearbox: CalculationToolDefinition = {
  id: 'long-travel-gearbox',
  version: '1.0.0',
  name: 'Long Travel Gearbox',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description: 'Calculates the required reduction ratio for long travel, computes actual bridge travel speed, and verifies that the speed falls within the required +-10% band.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['L.T.', 'SPEED'],

  inputs: [
    { key: 'selectedWheelDiameterMm', label: 'Selected Wheel Diameter', unit: 'mm', type: 'number', defaultValue: 200.0, required: true, min: 100.0, description: 'Wheel tread diameter (H80)' },
    { key: 'motorRpm', label: 'Motor Speed', unit: 'rpm', type: 'number', defaultValue: 860.0, required: true, min: 100.0, description: 'LT motor speed (J89)' },
    { key: 'requiredSpeedMPerMin', label: 'Required LT Speed', unit: 'm/min', type: 'number', defaultValue: 20.0, required: true, min: 1.0, description: 'Design LT speed (J90)' },
    { key: 'selectedGearboxId', label: 'Selected Gearbox', unit: '', type: 'select', defaultValue: 'gb-lt-vr350-21.5', required: true, options: GEARBOX_CATALOG.filter(g => g.application === 'LONG_TRAVEL').map(g => ({ label: `${g.model} (Ratio: ${g.ratio}, Rating: ${g.ratedPowerKw} kW)`, value: g.id })), description: 'Catalog gearbox' },
    { key: 'selectedRatio', label: 'Selected Gearbox Ratio', unit: '', type: 'number', defaultValue: 21.5, required: true, min: 1.0, description: 'Ratio of chosen LT reducer (D98)' },
  ],

  outputs: [
    { key: 'requiredRatio', label: 'Required Gear Ratio', unit: '', description: 'Theoretical required ratio (J92)' },
    { key: 'selectedRatio', label: 'Selected Gear Ratio', unit: '', description: 'Gearbox catalog ratio' },
    { key: 'actualSpeedMPerMin', label: 'Actual LT Speed', unit: 'm/min', description: 'Actual speed delivered at runway rails (H101)' },
    { key: 'allowedSpeedMinMPerMin', label: 'Allowed Minimum Speed (-10%)', unit: 'm/min', description: 'Lower allowed speed bound' },
    { key: 'allowedSpeedMaxMPerMin', label: 'Allowed Maximum Speed (+10%)', unit: 'm/min', description: 'Upper allowed speed bound' },
  ],

  dependencies: [
    { sourceToolId: 'long-travel-wheel', sourceKey: 'selectedWheelDiameterMm', targetKey: 'selectedWheelDiameterMm', label: 'Wheel Diameter' },
    { sourceToolId: 'long-travel-motor', sourceKey: 'selectedMotorRpm', targetKey: 'motorRpm', label: 'Motor Speed' },
    { sourceToolId: 'master', sourceKey: 'longTravelSpeedMPerMin', targetKey: 'requiredSpeedMPerMin', label: 'LT Speed' },
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const selectedWheelDiameterMm = assertPositiveNumber(inputs.selectedWheelDiameterMm ?? 200.0, 'selectedWheelDiameterMm');
    const motorRpm = assertPositiveNumber(inputs.motorRpm ?? 860.0, 'motorRpm');
    const requiredSpeedMPerMin = assertPositiveNumber(inputs.requiredSpeedMPerMin ?? 20.0, 'requiredSpeedMPerMin');

    const selectedGearboxId = String(inputs.selectedGearboxId ?? 'gb-lt-vr350-21.5');
    const catalogItem = GEARBOX_CATALOG.find((g) => g.id === selectedGearboxId);
    const selectedRatio = assertPositiveNumber(inputs.selectedRatio ?? catalogItem?.ratio ?? 21.5, 'selectedRatio');

    // J92 = PI() * J88 * J89 / (J90 * 1000)
    // where J88 = wheel diameter in mm
    const requiredRatio = (Math.PI * selectedWheelDiameterMm * motorRpm) / (requiredSpeedMPerMin * 1000);

    // H101 = (J89 / D98) * (3.142 * H80 / 1000)
    // Note: in sample with 860 rpm, ratio 21.5, wheel 200 mm:
    // (860 / 21.5) * (3.142 * 200 / 1000) = 40 * 0.6284 = 25.136 m/min!
    const actualSpeedMPerMin = (motorRpm / selectedRatio) * (3.142 * selectedWheelDiameterMm / 1000);

    const allowedSpeedMinMPerMin = requiredSpeedMPerMin * 0.9;
    const allowedSpeedMaxMPerMin = requiredSpeedMPerMin * 1.1;

    const steps: CalculationStep[] = [
      {
        id: 'step-lt-req-ratio',
        label: 'Required LT Reduction Ratio (J92)',
        formulaText: 'i_req = (pi * D_wheel * N_motor) / (V_req * 1000)',
        formulaMath: 'i_{req} = \\frac{\\pi \\times D_{wheel} \\times N_{motor}}{V_{req} \\times 1000}',
        variables: {
          D_wheel: { value: selectedWheelDiameterMm, unit: 'mm', label: 'Wheel Diameter' },
          N_motor: { value: motorRpm, unit: 'rpm', label: 'Motor Speed' },
          V_req: { value: requiredSpeedMPerMin, unit: 'm/min', label: 'Design Speed' },
        },
        substitutedExpression: `(pi * ${selectedWheelDiameterMm} * ${motorRpm}) / (${requiredSpeedMPerMin} * 1000) = ${requiredRatio.toFixed(4)}`,
        result: { value: requiredRatio, unit: '', label: 'Required Ratio' },
        dependsOn: ['selectedWheelDiameterMm', 'motorRpm', 'requiredSpeedMPerMin'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'L.T.',
        sourceCell: 'J92',
      },
      {
        id: 'step-lt-actual-speed',
        label: 'Actual Bridge Long Travel Speed (H101)',
        formulaText: 'V_actual = (N_motor / i_sel) * (3.142 * D_wheel / 1000)',
        formulaMath: 'V_{actual} = \\frac{N_{motor}}{i_{sel}} \\times \\frac{3.142 \\times D_{wheel}}{1000}',
        variables: {
          N_motor: { value: motorRpm, unit: 'rpm', label: 'Motor Speed' },
          i_sel: { value: selectedRatio, unit: '', label: 'Selected Ratio' },
          D_wheel: { value: selectedWheelDiameterMm, unit: 'mm', label: 'Wheel Diameter' },
        },
        substitutedExpression: `(${motorRpm} / ${selectedRatio}) * (3.142 * ${selectedWheelDiameterMm} / 1000) = ${actualSpeedMPerMin.toFixed(3)} m/min`,
        result: { value: actualSpeedMPerMin, unit: 'm/min', label: 'Actual LT Speed' },
        dependsOn: ['step-lt-req-ratio', 'selectedRatio'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'L.T.',
        sourceCell: 'H101',
      },
    ];

    const checks: CalculationCheck[] = [
      checkSpeedTolerance({
        id: 'CHK-LT-SPEED-TOLERANCE',
        name: 'Long Travel Speed Tolerance (within +-10%)',
        actual: actualSpeedMPerMin,
        required: requiredSpeedMPerMin,
        tolerancePercent: 0.1,
        unit: 'm/min',
        parameterName: 'Long Travel Speed',
      }),
    ];

    // Status is numerically derived: 25.136 is outside [18, 22] so this evaluates to FAIL
    const status = checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL';

    const warnings: string[] = [];
    if (status === 'FAIL') {
      warnings.push(
        `Critical Engineering Check Failed: Calculated actual LT speed (${actualSpeedMPerMin.toFixed(3)} m/min) exceeds the maximum allowed range [${allowedSpeedMinMPerMin.toFixed(1)} - ${allowedSpeedMaxMPerMin.toFixed(1)} m/min]. Selected gearbox ratio ${selectedRatio} is too low; a higher ratio (e.g. 27 to 31.5) must be selected.`,
      );
    }

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'Clause 22 (Gears and Pinions)',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'long-travel-gearbox',
      toolVersion: '1.0.0',
      status,
      inputsUsed: {
        selectedWheelDiameterMm: { value: selectedWheelDiameterMm, unit: 'mm' },
        motorRpm: { value: motorRpm, unit: 'rpm' },
        requiredSpeedMPerMin: { value: requiredSpeedMPerMin, unit: 'm/min' },
        selectedRatio: { value: selectedRatio, unit: '' },
        selectedGearboxId: { value: selectedGearboxId, unit: '' },
      },
      derived: {
        requiredRatio: { value: requiredRatio, unit: '' },
        actualSpeedMPerMin: { value: actualSpeedMPerMin, unit: 'm/min' },
        allowedSpeedMinMPerMin: { value: allowedSpeedMinMPerMin, unit: 'm/min' },
        allowedSpeedMaxMPerMin: { value: allowedSpeedMaxMPerMin, unit: 'm/min' },
      },
      outputs: {
        requiredRatio: { value: requiredRatio, unit: '', label: 'Required Ratio' },
        selectedRatio: { value: selectedRatio, unit: '', label: 'Selected Ratio' },
        actualSpeedMPerMin: { value: actualSpeedMPerMin, unit: 'm/min', label: 'Actual LT Speed' },
        allowedSpeedMinMPerMin: { value: allowedSpeedMinMPerMin, unit: 'm/min', label: 'Minimum Allowed Speed' },
        allowedSpeedMaxMPerMin: { value: allowedSpeedMaxMPerMin, unit: 'm/min', label: 'Maximum Allowed Speed' },
      },
      checks,
      steps,
      assumptions: [
        'Bridge travel speed must be within +-10% of design speed 20.0 m/min per IS 3177',
        'Circumference formula cell H101 uses 3.142 constant',
      ],
      warnings,
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'L.T.',
        cells: ['J88', 'J89', 'J90', 'J92', 'D98', 'H101'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
