/**
 * Main Hoist Brake Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: M.H., BRAKE SOC
 * Golden Value: Required torque ≈ 15.5072240017 kg-m (152.073918257 N-m)
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

export const mainHoistBrake: CalculationToolDefinition = {
  id: 'main-hoist-brake',
  version: '1.0.0',
  name: 'Main Hoist Brake',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description: 'Calculates the required hoisting brake torque and verifies selected electro-hydraulic thruster/shoe brake capacity.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['M.H.', 'BRAKE SOC'],

  inputs: [
    { key: 'requiredMotorKw', label: 'Hoist Motor Power (H20)', unit: 'kW', type: 'number', defaultValue: 10.488, required: true, min: 0.1, description: 'Required motor power from Hoist Motor tool' },
    { key: 'ambientDeratingFactor', label: 'Ambient Derating Factor (J18)', unit: '', type: 'number', defaultValue: 0.95, required: true, min: 0.5, max: 1.0, description: 'Ambient factor' },
    { key: 'hoistServiceFactor', label: 'Service Factor (J11)', unit: '', type: 'number', defaultValue: 0.67, required: true, min: 0.1, description: 'Service factor' },
    { key: 'hoistDutyFactor', label: 'Duty Factor (J12)', unit: '', type: 'number', defaultValue: 1.50, required: true, min: 0.1, description: 'Brake torque safety factor' },
    { key: 'motorRpm', label: 'Motor Speed (RPM)', unit: 'rpm', type: 'number', defaultValue: 935, required: true, min: 100, description: 'Motor full-load speed' },
    { key: 'selectedBrakeId', label: 'Selected Brake Model', unit: '', type: 'select', defaultValue: 'mdt-200-18', required: true, options: BRAKE_CATALOG.map(b => ({ label: `${b.model} (${b.ratedTorqueKgm} kg-m / ${b.ratedTorqueNm} N-m)`, value: b.id })), description: 'Catalog brake' },
    { key: 'selectedBrakeTorqueKgm', label: 'Selected Brake Torque', unit: 'kg-m', type: 'number', defaultValue: 20.0, required: true, min: 0.1, description: 'Selected brake rated torque' },
  ],

  outputs: [
    { key: 'mechanicalPowerKw', label: 'Net Mechanical Hoist Power (J35)', unit: 'kW', description: 'Power without service/duty multiplying factors' },
    { key: 'requiredBrakeTorqueKgm', label: 'Required Brake Torque (kg-m)', unit: 'kg-m', description: 'Calculated holding torque in kg-m (F39)' },
    { key: 'requiredBrakeTorqueNm', label: 'Required Brake Torque (N-m)', unit: 'N-m', description: 'Calculated holding torque in N-m (I39)' },
    { key: 'selectedBrakeTorqueKgm', label: 'Selected Brake Torque', unit: 'kg-m', description: 'Torque rating of selected brake' },
  ],

  dependencies: [
    { sourceToolId: 'main-hoist-motor', sourceKey: 'requiredMotorKw', targetKey: 'requiredMotorKw', label: 'Motor Power' },
    { sourceToolId: 'main-hoist-motor', sourceKey: 'selectedMotorRpm', targetKey: 'motorRpm', label: 'Motor Speed' },
    { sourceToolId: 'master', sourceKey: 'ambientDeratingFactor', targetKey: 'ambientDeratingFactor', label: 'Ambient Derating' },
    { sourceToolId: 'master', sourceKey: 'hoistServiceFactor', targetKey: 'hoistServiceFactor', label: 'Service Factor' },
    { sourceToolId: 'master', sourceKey: 'hoistDutyFactor', targetKey: 'hoistDutyFactor', label: 'Duty Factor' },
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const requiredMotorKw = assertPositiveNumber(inputs.requiredMotorKw ?? 10.4879897176, 'requiredMotorKw');
    const ambientDeratingFactor = assertPositiveNumber(inputs.ambientDeratingFactor ?? 0.95, 'ambientDeratingFactor');
    const hoistServiceFactor = assertPositiveNumber(inputs.hoistServiceFactor ?? 0.67, 'hoistServiceFactor');
    const hoistDutyFactor = assertPositiveNumber(inputs.hoistDutyFactor ?? 1.50, 'hoistDutyFactor');
    const motorRpm = assertPositiveNumber(inputs.motorRpm ?? 935, 'motorRpm');

    // If selectedBrakeId is passed, lookup or use selectedBrakeTorqueKgm
    const selectedBrakeId = String(inputs.selectedBrakeId ?? 'mdt-200-18');
    const catalogItem = BRAKE_CATALOG.find((b) => b.id === selectedBrakeId);
    const selectedBrakeTorqueKgm = assertPositiveNumber(
      inputs.selectedBrakeTorqueKgm ?? catalogItem?.ratedTorqueKgm ?? 20.0,
      'selectedBrakeTorqueKgm',
    );

    // J35 = H20 * J18 / (J11 * J12)
    const mechanicalPowerKw = (requiredMotorKw * ambientDeratingFactor) / (hoistServiceFactor * hoistDutyFactor);

    // J36 = J12 (duty factor = 1.50)
    const brakeSafetyFactor = hoistDutyFactor;

    // F39 = 975 * J35 * J36 / J37
    const requiredBrakeTorqueKgm = (975 * mechanicalPowerKw * brakeSafetyFactor) / motorRpm;

    // I39 = F39 * 9.80665
    const requiredBrakeTorqueNm = requiredBrakeTorqueKgm * 9.80665;

    const steps: CalculationStep[] = [
      {
        id: 'step-mechanical-power',
        label: 'Net Mechanical Power at Drum (J35)',
        formulaText: 'P_mech = (P_req * K_amb) / (K_s * K_d)',
        formulaMath: 'P_{mech} = \\frac{P_{req} \\times K_{amb}}{K_s \\times K_d}',
        variables: {
          P_req: { value: requiredMotorKw, unit: 'kW', label: 'Motor Power' },
          K_amb: { value: ambientDeratingFactor, unit: '', label: 'Ambient Factor' },
          K_s: { value: hoistServiceFactor, unit: '', label: 'Service Factor' },
          K_d: { value: hoistDutyFactor, unit: '', label: 'Duty Factor' },
        },
        substitutedExpression: `(${requiredMotorKw.toFixed(4)} * ${ambientDeratingFactor}) / (${hoistServiceFactor} * ${hoistDutyFactor}) = ${mechanicalPowerKw.toFixed(4)} kW`,
        result: { value: mechanicalPowerKw, unit: 'kW', label: 'Mechanical Power' },
        dependsOn: ['requiredMotorKw', 'ambientDeratingFactor', 'hoistServiceFactor', 'hoistDutyFactor'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'J35',
      },
      {
        id: 'step-brake-torque-kgm',
        label: 'Required Brake Torque in kg-m (F39)',
        formulaText: 'T_brake(kg-m) = 975 * P_mech * K_duty / RPM',
        formulaMath: 'T_{brake} = \\frac{975 \\times P_{mech} \\times K_{duty}}{N_{motor}}',
        variables: {
          P_mech: { value: mechanicalPowerKw, unit: 'kW', label: 'Mechanical Power' },
          K_duty: { value: brakeSafetyFactor, unit: '', label: 'Brake Torque Factor' },
          N_motor: { value: motorRpm, unit: 'rpm', label: 'Motor RPM' },
        },
        substitutedExpression: `(975 * ${mechanicalPowerKw.toFixed(4)} * ${brakeSafetyFactor}) / ${motorRpm} = ${requiredBrakeTorqueKgm.toFixed(4)} kg-m`,
        result: { value: requiredBrakeTorqueKgm, unit: 'kg-m', label: 'Torque (kg-m)' },
        dependsOn: ['step-mechanical-power', 'motorRpm'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'F39',
      },
      {
        id: 'step-brake-torque-nm',
        label: 'Required Brake Torque in N-m (I39)',
        formulaText: 'T_brake(N-m) = T_brake(kg-m) * 9.80665',
        formulaMath: 'T_{N-m} = T_{kg-m} \\times 9.80665',
        variables: {
          T_kgm: { value: requiredBrakeTorqueKgm, unit: 'kg-m', label: 'Brake Torque' },
        },
        substitutedExpression: `${requiredBrakeTorqueKgm.toFixed(4)} * 9.80665 = ${requiredBrakeTorqueNm.toFixed(4)} N-m`,
        result: { value: requiredBrakeTorqueNm, unit: 'N-m', label: 'Torque (N-m)' },
        dependsOn: ['step-brake-torque-kgm'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'I39',
      },
    ];

    const checks: CalculationCheck[] = [
      checkCapacityAdequacy(
        'CHK-MH-BRAKE-TORQUE',
        'Hoist Brake Holding Capacity',
        selectedBrakeTorqueKgm,
        requiredBrakeTorqueKgm,
        'kg-m',
        'Main Hoist Brake',
      ),
    ];

    const status = checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL';

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'Clause 19 (Brakes and Braking)',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'main-hoist-brake',
      toolVersion: '1.0.0',
      status,
      inputsUsed: {
        requiredMotorKw: { value: requiredMotorKw, unit: 'kW' },
        ambientDeratingFactor: { value: ambientDeratingFactor, unit: '' },
        hoistServiceFactor: { value: hoistServiceFactor, unit: '' },
        hoistDutyFactor: { value: hoistDutyFactor, unit: '' },
        motorRpm: { value: motorRpm, unit: 'rpm' },
        selectedBrakeTorqueKgm: { value: selectedBrakeTorqueKgm, unit: 'kg-m' },
        selectedBrakeId: { value: selectedBrakeId, unit: '' },
      },
      derived: {
        mechanicalPowerKw: { value: mechanicalPowerKw, unit: 'kW' },
      },
      outputs: {
        mechanicalPowerKw: { value: mechanicalPowerKw, unit: 'kW', label: 'Net Mechanical Power' },
        requiredBrakeTorqueKgm: { value: requiredBrakeTorqueKgm, unit: 'kg-m', label: 'Required Brake Torque' },
        requiredBrakeTorqueNm: { value: requiredBrakeTorqueNm, unit: 'N-m', label: 'Required Brake Torque' },
        selectedBrakeTorqueKgm: { value: selectedBrakeTorqueKgm, unit: 'kg-m', label: 'Selected Brake Torque' },
      },
      checks,
      steps,
      assumptions: [
        'Brake torque factor equals duty factor 1.50 per IS 3177 Class II requirement',
        'Gravitational conversion 9.80665 N/kgf preserved from source sheet',
      ],
      warnings: [],
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'M.H.',
        cells: ['J35', 'J36', 'J37', 'F39', 'I39'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
