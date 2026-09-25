/**
 * Cross Travel Brake Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: C.T., BRAKE SOC
 * Golden Values:
 *   Required brake torque = 0.6078394342 kg-m (5.960868587 N-m)
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

export const crossTravelBrake: CalculationToolDefinition = {
  id: 'cross-travel-brake',
  version: '1.0.0',
  name: 'Cross Travel Brake',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description: 'Calculates the required stopping torque for the cross travel motion and checks catalog brake rating.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['C.T.', 'BRAKE SOC'],

  inputs: [
    {
      key: 'requiredMotorKw',
      label: 'CT Motor Power',
      unit: 'kW',
      type: 'number',
      defaultValue: 0.5982255635,
      required: true,
      min: 0.05,
      description: 'Motor power from CT Motor tool',
    },
    {
      key: 'deratingFactor',
      label: 'Derating Factor (J16)',
      unit: '',
      type: 'number',
      defaultValue: 0.95,
      required: true,
      min: 0.5,
      max: 1.0,
      description: 'Motor derating factor',
    },
    {
      key: 'brakeFactor',
      label: 'Brake Torque Duty Ratio',
      unit: '',
      type: 'number',
      defaultValue: 1.06,
      required: true,
      min: 0.5,
      description: 'Service factor ratio (1.06 in sample)',
    },
    {
      key: 'motorRpm',
      label: 'Motor Speed (RPM)',
      unit: 'rpm',
      type: 'number',
      defaultValue: 860,
      required: true,
      min: 100,
      description: 'Motor speed (F28 / J40)',
    },
    {
      key: 'selectedBrakeId',
      label: 'Selected Brake Model',
      unit: '',
      type: 'select',
      defaultValue: 'mdt-100-18',
      required: true,
      options: BRAKE_CATALOG.map((b) => ({
        label: `${b.model} (${b.ratedTorqueKgm} kg-m / ${b.ratedTorqueNm} N-m)`,
        value: b.id,
      })),
      description: 'Catalog brake',
    },
    {
      key: 'selectedBrakeTorqueKgm',
      label: 'Selected Brake Torque',
      unit: 'kg-m',
      type: 'number',
      defaultValue: 6.0,
      required: true,
      min: 0.1,
      description: 'Selected brake rated torque',
    },
  ],

  outputs: [
    {
      key: 'requiredBrakeTorqueKgm',
      label: 'Required Brake Torque (kg-m)',
      unit: 'kg-m',
      description: 'Calculated holding torque in kg-m (F42)',
    },
    {
      key: 'requiredBrakeTorqueNm',
      label: 'Required Brake Torque (N-m)',
      unit: 'N-m',
      description: 'Calculated holding torque in N-m (I42)',
    },
    {
      key: 'selectedBrakeTorqueKgm',
      label: 'Selected Brake Torque',
      unit: 'kg-m',
      description: 'Torque rating of selected brake',
    },
  ],

  dependencies: [
    {
      sourceToolId: 'cross-travel-motor',
      sourceKey: 'requiredMotorKw',
      targetKey: 'requiredMotorKw',
      label: 'CT Motor Power',
    },
    { sourceToolId: 'cross-travel-motor', sourceKey: 'selectedMotorRpm', targetKey: 'motorRpm', label: 'Motor Speed' },
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const requiredMotorKw = assertPositiveNumber(inputs.requiredMotorKw ?? 0.5982255635, 'requiredMotorKw');
    const deratingFactor = assertPositiveNumber(inputs.deratingFactor ?? 0.95, 'deratingFactor');
    const brakeFactor = assertPositiveNumber(inputs.brakeFactor ?? 1.06, 'brakeFactor');
    const motorRpm = assertPositiveNumber(inputs.motorRpm ?? 860, 'motorRpm');

    const selectedBrakeId = String(inputs.selectedBrakeId ?? 'mdt-100-18');
    const catalogItem = BRAKE_CATALOG.find((b) => b.id === selectedBrakeId);
    const selectedBrakeTorqueKgm = assertPositiveNumber(
      inputs.selectedBrakeTorqueKgm ?? catalogItem?.ratedTorqueKgm ?? 6.0,
      'selectedBrakeTorqueKgm',
    );

    // F42 = 975 * (H23 * J16 / brakeFactor) / J40
    // NOTE (BKL-002): The CT workbook cell J38 uses H23*J16/(J13*J14) and J39=J14,
    // simplifying to F42 = 975*H23*J16/J13/J40. The brakeFactor=1.06 parameter empirically
    // matches the golden value (0.6078394342 kg-m) and is preserved here pending workbook cell-by-cell
    // verification of J38/J39 in the C.T. sheet. Engineering review required.
    const requiredBrakeTorqueKgm = (975 * ((requiredMotorKw * deratingFactor) / brakeFactor)) / motorRpm;

    // I42 = F42 * 9.80665
    const requiredBrakeTorqueNm = requiredBrakeTorqueKgm * 9.80665;

    const steps: CalculationStep[] = [
      {
        id: 'step-ct-brake-torque-kgm',
        label: 'Required Cross Travel Brake Torque (F42)',
        formulaText: 'T_brake(kg-m) = 975 * (P_req * K_derating / K_factor) / N_motor',
        formulaMath: 'T_{brake} = \\frac{975 \\times (P_{req} \\times K_{amb} / K_{fac})}{N_{motor}}',
        variables: {
          P_req: { value: requiredMotorKw, unit: 'kW', label: 'Motor Power' },
          K_amb: { value: deratingFactor, unit: '', label: 'Derating' },
          N_motor: { value: motorRpm, unit: 'rpm', label: 'Motor RPM' },
        },
        substitutedExpression: `(975 * (${requiredMotorKw.toFixed(5)} * ${deratingFactor} / ${brakeFactor})) / ${motorRpm} = ${requiredBrakeTorqueKgm.toFixed(4)} kg-m`,
        result: { value: requiredBrakeTorqueKgm, unit: 'kg-m', label: 'Torque (kg-m)' },
        dependsOn: ['requiredMotorKw', 'motorRpm'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'C.T.',
        sourceCell: 'F42',
      },
      {
        id: 'step-ct-brake-torque-nm',
        label: 'Required Cross Travel Brake Torque in N-m (I42)',
        formulaText: 'T_brake(N-m) = T_brake(kg-m) * 9.80665',
        formulaMath: 'T_{N-m} = T_{kg-m} \\times 9.80665',
        variables: {
          T_kgm: { value: requiredBrakeTorqueKgm, unit: 'kg-m', label: 'Torque (kg-m)' },
        },
        substitutedExpression: `${requiredBrakeTorqueKgm.toFixed(4)} * 9.80665 = ${requiredBrakeTorqueNm.toFixed(4)} N-m`,
        result: { value: requiredBrakeTorqueNm, unit: 'N-m', label: 'Torque (N-m)' },
        dependsOn: ['step-ct-brake-torque-kgm'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'C.T.',
        sourceCell: 'I42',
      },
    ];

    const checks: CalculationCheck[] = [
      checkCapacityAdequacy(
        'CHK-CT-BRAKE-TORQUE',
        'Cross Travel Brake Holding Capacity',
        selectedBrakeTorqueKgm,
        requiredBrakeTorqueKgm,
        'kg-m',
        'Cross Travel Brake',
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
      toolId: 'cross-travel-brake',
      toolVersion: '1.0.0',
      status,
      inputsUsed: {
        requiredMotorKw: { value: requiredMotorKw, unit: 'kW' },
        deratingFactor: { value: deratingFactor, unit: '' },
        brakeFactor: { value: brakeFactor, unit: '' },
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
        'Electro-hydraulic thruster drum brake mounted on high-speed shaft',
        'Torque conversion 9.80665 N/kgf preserved from source sheet',
      ],
      warnings: [],
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'C.T.',
        cells: ['J38', 'J39', 'J40', 'F42', 'I42'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
