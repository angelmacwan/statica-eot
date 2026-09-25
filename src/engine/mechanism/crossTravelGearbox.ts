/**
 * Cross Travel Gearbox Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: C.T., SPEED
 * Golden Values:
 *   Required ratio = 21.61416
 *   Selected ratio = 21.5
 *   Actual CT speed = 20.1088 m/min (Allowed range: 18 - 22 m/min) -> PASS
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

export const crossTravelGearbox: CalculationToolDefinition = {
  id: 'cross-travel-gearbox',
  version: '1.0.0',
  name: 'Cross Travel Gearbox',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description:
    'Calculates the required reduction ratio for cross travel, computes actual trolley speed, and checks tolerance within +-10% range.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['C.T.', 'SPEED'],

  inputs: [
    {
      key: 'selectedWheelDiameterMm',
      label: 'Selected Wheel Diameter',
      unit: 'mm',
      type: 'number',
      defaultValue: 160.0,
      required: true,
      min: 100.0,
      description: 'Wheel tread diameter (H79)',
    },
    {
      key: 'motorRpm',
      label: 'Motor Speed',
      unit: 'rpm',
      type: 'number',
      defaultValue: 860.0,
      required: true,
      min: 100.0,
      description: 'CT motor speed (J88)',
    },
    {
      key: 'requiredSpeedMPerMin',
      label: 'Required CT Speed',
      unit: 'm/min',
      type: 'number',
      defaultValue: 20.0,
      required: true,
      min: 1.0,
      description: 'Design CT speed (J89)',
    },
    {
      key: 'selectedGearboxId',
      label: 'Selected Gearbox',
      unit: '',
      type: 'select',
      defaultValue: 'gb-ct-vr250-21.5',
      required: true,
      options: GEARBOX_CATALOG.filter((g) => g.application === 'CROSS_TRAVEL').map((g) => ({
        label: `${g.model} (Ratio: ${g.ratio}, Rating: ${g.ratedPowerKw} kW)`,
        value: g.id,
      })),
      description: 'Catalog gearbox',
    },
    {
      key: 'selectedRatio',
      label: 'Selected Gearbox Ratio',
      unit: '',
      type: 'number',
      defaultValue: 21.5,
      required: true,
      min: 1.0,
      description: 'Actual ratio of chosen CT reducer (D97)',
    },
  ],

  outputs: [
    { key: 'requiredRatio', label: 'Required Gear Ratio', unit: '', description: 'Exact reduction ratio (J91)' },
    { key: 'selectedRatio', label: 'Selected Gear Ratio', unit: '', description: 'Gearbox catalog ratio' },
    {
      key: 'actualSpeedMPerMin',
      label: 'Actual CT Speed',
      unit: 'm/min',
      description: 'Actual speed delivered at wheels (H100)',
    },
    {
      key: 'allowedSpeedMinMPerMin',
      label: 'Allowed Minimum Speed (-10%)',
      unit: 'm/min',
      description: 'Lower allowed speed bound',
    },
    {
      key: 'allowedSpeedMaxMPerMin',
      label: 'Allowed Maximum Speed (+10%)',
      unit: 'm/min',
      description: 'Upper allowed speed bound',
    },
  ],

  dependencies: [
    {
      sourceToolId: 'cross-travel-wheel',
      sourceKey: 'selectedWheelDiameterMm',
      targetKey: 'selectedWheelDiameterMm',
      label: 'Wheel Diameter',
    },
    { sourceToolId: 'cross-travel-motor', sourceKey: 'selectedMotorRpm', targetKey: 'motorRpm', label: 'Motor Speed' },
    {
      sourceToolId: 'master',
      sourceKey: 'crossTravelSpeedMPerMin',
      targetKey: 'requiredSpeedMPerMin',
      label: 'CT Speed',
    },
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const selectedWheelDiameterMm = assertPositiveNumber(
      inputs.selectedWheelDiameterMm ?? 160.0,
      'selectedWheelDiameterMm',
    );
    const motorRpm = assertPositiveNumber(inputs.motorRpm ?? 860.0, 'motorRpm');
    const requiredSpeedMPerMin = assertPositiveNumber(inputs.requiredSpeedMPerMin ?? 20.0, 'requiredSpeedMPerMin');

    const selectedGearboxId = String(inputs.selectedGearboxId ?? 'gb-ct-vr250-21.5');
    const catalogItem = GEARBOX_CATALOG.find((g) => g.id === selectedGearboxId);
    const selectedRatio = assertPositiveNumber(inputs.selectedRatio ?? catalogItem?.ratio ?? 21.5, 'selectedRatio');

    // J91 = PI() * J87 * J88 / (J89 * 1000)
    // where J87 = wheel diameter in mm
    const requiredRatio = (Math.PI * selectedWheelDiameterMm * motorRpm) / (requiredSpeedMPerMin * 1000);

    // H100 = (J88 / D97) * (3.142 * H79 / 1000)
    const actualSpeedMPerMin = (motorRpm / selectedRatio) * ((3.142 * selectedWheelDiameterMm) / 1000);

    const allowedSpeedMinMPerMin = requiredSpeedMPerMin * 0.9;
    const allowedSpeedMaxMPerMin = requiredSpeedMPerMin * 1.1;

    const steps: CalculationStep[] = [
      {
        id: 'step-ct-req-ratio',
        label: 'Required CT Reduction Ratio (J91)',
        formulaText: 'i_req = (pi * D_wheel * N_motor) / (V_req * 1000)',
        formulaMath: 'i_{req} = \\frac{\\pi \\times D_{wheel} \\times N_{motor}}{V_{req} \\times 1000}',
        variables: {
          D_wheel: { value: selectedWheelDiameterMm, unit: 'mm', label: 'Wheel Diameter' },
          N_motor: { value: motorRpm, unit: 'rpm', label: 'Motor Speed' },
          V_req: { value: requiredSpeedMPerMin, unit: 'm/min', label: 'Design Speed' },
        },
        substitutedExpression: `(pi * ${selectedWheelDiameterMm} * ${motorRpm}) / (${requiredSpeedMPerMin} * 1000) = ${requiredRatio.toFixed(5)}`,
        result: { value: requiredRatio, unit: '', label: 'Required Ratio' },
        dependsOn: ['selectedWheelDiameterMm', 'motorRpm', 'requiredSpeedMPerMin'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'C.T.',
        sourceCell: 'J91',
      },
      {
        id: 'step-ct-actual-speed',
        label: 'Actual Cross Travel Speed (H100)',
        formulaText: 'V_actual = (N_motor / i_sel) * (3.142 * D_wheel / 1000)',
        formulaMath: 'V_{actual} = \\frac{N_{motor}}{i_{sel}} \\times \\frac{3.142 \\times D_{wheel}}{1000}',
        variables: {
          N_motor: { value: motorRpm, unit: 'rpm', label: 'Motor Speed' },
          i_sel: { value: selectedRatio, unit: '', label: 'Selected Ratio' },
          D_wheel: { value: selectedWheelDiameterMm, unit: 'mm', label: 'Wheel Diameter' },
        },
        substitutedExpression: `(${motorRpm} / ${selectedRatio}) * (3.142 * ${selectedWheelDiameterMm} / 1000) = ${actualSpeedMPerMin.toFixed(4)} m/min`,
        result: { value: actualSpeedMPerMin, unit: 'm/min', label: 'Actual CT Speed' },
        dependsOn: ['step-ct-req-ratio', 'selectedRatio'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'C.T.',
        sourceCell: 'H100',
      },
    ];

    const checks: CalculationCheck[] = [
      checkSpeedTolerance({
        id: 'CHK-CT-SPEED-TOLERANCE',
        name: 'Cross Travel Speed Tolerance (within +-10%)',
        actual: actualSpeedMPerMin,
        required: requiredSpeedMPerMin,
        tolerancePercent: 0.1,
        unit: 'm/min',
        parameterName: 'Cross Travel Speed',
      }),
    ];

    const status = checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL';

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'Clause 22 (Gears and Pinions)',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'cross-travel-gearbox',
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
        actualSpeedMPerMin: { value: actualSpeedMPerMin, unit: 'm/min', label: 'Actual CT Speed' },
        allowedSpeedMinMPerMin: { value: allowedSpeedMinMPerMin, unit: 'm/min', label: 'Minimum Allowed Speed' },
        allowedSpeedMaxMPerMin: { value: allowedSpeedMaxMPerMin, unit: 'm/min', label: 'Maximum Allowed Speed' },
      },
      checks,
      steps,
      assumptions: [
        'Speed is acceptable within +-10% of nominal design speed per IS 3177 standard practice',
        'Circumference formula cell H100 uses 3.142 constant',
      ],
      warnings: [],
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'C.T.',
        cells: ['J87', 'J88', 'J89', 'J91', 'D97', 'H100'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
