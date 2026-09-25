/**
 * Long Travel Brake Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: L.T., BRAKE SOC
 * Golden Values:
 *   Required brake torque = 0.6452449378 kg-m (6.327691269 N-m)
 *   Selected = MDT-100-18 (6 kg-m) -> PASS
 */

import {
  CalculationToolDefinition,
  CalculationResult,
  CalculationStep,
  CalculationCheck,
  StandardReference,
} from '../types';
import { assertPositiveNumber } from '../safeMath';
import { checkCapacityAdequacy } from '../comparisons';
import { BRAKE_CATALOG } from '../catalogs/brakes';

export const longTravelBrake: CalculationToolDefinition = {
  id: 'long-travel-brake',
  version: '1.0.0',
  name: 'Long Travel Brake',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description: 'Calculates the required stopping torque for bridge long travel and validates catalog brake capacity.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['L.T.', 'BRAKE SOC'],

  inputs: [
    { key: 'requiredMotorKw', label: 'LT Motor Power', unit: 'kW', type: 'number', defaultValue: 0.5990938154, required: true, min: 0.05, description: 'Motor power from LT Motor tool' },
    { key: 'deratingFactor', label: 'Derating Factor (J16)', unit: '', type: 'number', defaultValue: 0.95, required: true, min: 0.5, max: 1.0, description: 'Motor derating factor' },
    { key: 'motorRpm', label: 'Motor Speed (RPM)', unit: 'rpm', type: 'number', defaultValue: 860, required: true, min: 100, description: 'Motor speed (F28 / J40)' },
    { key: 'selectedBrakeId', label: 'Selected Brake Model', unit: '', type: 'select', defaultValue: 'mdt-100-18', required: true, options: BRAKE_CATALOG.map(b => ({ label: `${b.model} (${b.ratedTorqueKgm} kg-m / ${b.ratedTorqueNm} N-m)`, value: b.id })), description: 'Catalog brake' },
    { key: 'selectedBrakeTorqueKgm', label: 'Selected Brake Torque', unit: 'kg-m', type: 'number', defaultValue: 6.0, required: true, min: 0.1, description: 'Selected brake rated torque' },
  ],

  outputs: [
    { key: 'requiredBrakeTorqueKgm', label: 'Required Brake Torque (kg-m)', unit: 'kg-m', description: 'Calculated holding torque in kg-m (F42)' },
    { key: 'requiredBrakeTorqueNm', label: 'Required Brake Torque (N-m)', unit: 'N-m', description: 'Calculated holding torque in N-m (I42)' },
    { key: 'selectedBrakeTorqueKgm', label: 'Selected Brake Torque', unit: 'kg-m', description: 'Torque rating of selected brake' },
  ],

  dependencies: [
    { sourceToolId: 'long-travel-motor', sourceKey: 'requiredMotorKw', targetKey: 'requiredMotorKw', label: 'LT Motor Power' },
    { sourceToolId: 'long-travel-motor', sourceKey: 'selectedMotorRpm', targetKey: 'motorRpm', label: 'Motor Speed' },
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const requiredMotorKw = assertPositiveNumber(inputs.requiredMotorKw ?? 0.5990938154, 'requiredMotorKw');
    const deratingFactor = assertPositiveNumber(inputs.deratingFactor ?? 0.95, 'deratingFactor');
    const motorRpm = assertPositiveNumber(inputs.motorRpm ?? 860, 'motorRpm');

    const selectedBrakeId = String(inputs.selectedBrakeId ?? 'mdt-100-18');
    const catalogItem = BRAKE_CATALOG.find((b) => b.id === selectedBrakeId);
    const selectedBrakeTorqueKgm = assertPositiveNumber(
      inputs.selectedBrakeTorqueKgm ?? catalogItem?.ratedTorqueKgm ?? 6.0,
      'selectedBrakeTorqueKgm',
    );

    // F42 = 975 * (H23 * J16) / J40
    const requiredBrakeTorqueKgm = (975 * (requiredMotorKw * deratingFactor)) / motorRpm;

    // I42 = F42 * 9.80665
    const requiredBrakeTorqueNm = requiredBrakeTorqueKgm * 9.80665;

    const steps: CalculationStep[] = [
      {
        id: 'step-lt-brake-torque-kgm',
        label: 'Required Long Travel Brake Torque (F42)',
        formulaText: 'T_brake(kg-m) = 975 * (P_req * K_derating) / N_motor',
        formulaMath: 'T_{brake} = \\frac{975 \\times (P_{req} \\times K_{amb})}{N_{motor}}',
        variables: {
          P_req: { value: requiredMotorKw, unit: 'kW', label: 'Motor Power' },
          K_amb: { value: deratingFactor, unit: '', label: 'Derating' },
          N_motor: { value: motorRpm, unit: 'rpm', label: 'Motor RPM' },
        },
        substitutedExpression: `(975 * (${requiredMotorKw.toFixed(5)} * ${deratingFactor})) / ${motorRpm} = ${requiredBrakeTorqueKgm.toFixed(4)} kg-m`,
        result: { value: requiredBrakeTorqueKgm, unit: 'kg-m', label: 'Torque (kg-m)' },
        dependsOn: ['requiredMotorKw', 'motorRpm'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'L.T.',
        sourceCell: 'F42',
      },
      {
        id: 'step-lt-brake-torque-nm',
        label: 'Required Long Travel Brake Torque in N-m (I42)',
        formulaText: 'T_brake(N-m) = T_brake(kg-m) * 9.80665',
        formulaMath: 'T_{N-m} = T_{kg-m} \\times 9.80665',
        variables: {
          T_kgm: { value: requiredBrakeTorqueKgm, unit: 'kg-m', label: 'Brake Torque' },
        },
        substitutedExpression: `${requiredBrakeTorqueKgm.toFixed(4)} * 9.80665 = ${requiredBrakeTorqueNm.toFixed(4)} N-m`,
        result: { value: requiredBrakeTorqueNm, unit: 'N-m', label: 'Torque (N-m)' },
        dependsOn: ['step-lt-brake-torque-kgm'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'L.T.',
        sourceCell: 'I42',
      },
    ];

    const checks: CalculationCheck[] = [
      checkCapacityAdequacy(
        'CHK-LT-BRAKE-TORQUE',
        'Long Travel Brake Holding Capacity',
        selectedBrakeTorqueKgm,
        requiredBrakeTorqueKgm,
        'kg-m',
        'Long Travel Brake',
      ),
    ];

    const status = checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL';

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'Clause 19.3 (Travel Brakes)',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'long-travel-brake',
      toolVersion: '1.0.0',
      status,
      inputsUsed: {
        requiredMotorKw: { value: requiredMotorKw, unit: 'kW' },
        deratingFactor: { value: deratingFactor, unit: '' },
        motorRpm: { value: motorRpm, unit: 'rpm' },
        selectedBrakeTorqueKgm: { value: selectedBrakeTorqueKgm, unit: 'kg-m' },
        selectedBrakeId: { value: selectedBrakeId, unit: '' },
      },
      derived: {},
      outputs: {
        requiredBrakeTorqueKgm: { value: requiredBrakeTorqueKgm, unit: 'kg-m', label: 'Required Brake Torque' },
        requiredBrakeTorqueNm: { value: requiredBrakeTorqueNm, unit: 'N-m', label: 'Required Brake Torque' },
        selectedBrakeTorqueKgm: { value: selectedBrakeTorqueKgm, unit: 'kg-m', label: 'Selected Brake Torque' },
      },
      checks,
      steps,
      assumptions: [
        'Bridge travel brake sized for stopping within standard deceleration limits without skidding',
        'Torque conversion 9.80665 N/kgf preserved from source sheet',
      ],
      warnings: [],
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'L.T.',
        cells: ['J38', 'J39', 'J40', 'F42', 'I42'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
