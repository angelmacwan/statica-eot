/**
 * Cross Travel Motor Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: C.T., C.T.-INDOOR, MOTOR
 * Golden Values:
 *   Required motor power = 0.5982255635 kW
 *   Equivalent HP = 0.8022204806 HP
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

export const crossTravelMotor: CalculationToolDefinition = {
  id: 'cross-travel-motor',
  version: '1.0.0',
  name: 'Cross Travel Motor',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description:
    'Calculates the required cross-travel motor power taking into account rolling friction, rotational inertia, acceleration resistance, and gearbox efficiency.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['C.T.', 'C.T.-INDOOR'],

  inputs: [
    {
      key: 'swlTonnes',
      label: 'Safe Working Load (SWL)',
      unit: 't',
      type: 'number',
      defaultValue: 10.0,
      required: true,
      min: 0.1,
      description: 'Crane capacity',
    },
    {
      key: 'crabWeightTonnes',
      label: 'Crab (Trolley) Weight',
      unit: 't',
      type: 'number',
      defaultValue: 2.5,
      required: true,
      min: 0.1,
      description: 'Crab weight (J10)',
    },
    {
      key: 'crossTravelSpeedMPerMin',
      label: 'Cross Travel Speed',
      unit: 'm/min',
      type: 'number',
      defaultValue: 20.0,
      required: true,
      min: 1.0,
      description: 'CT speed (J12)',
    },
    {
      key: 'ctServiceFactor',
      label: 'CT Service Factor (J13)',
      unit: '',
      type: 'number',
      defaultValue: 0.67,
      required: true,
      min: 0.1,
      description: 'Service factor',
    },
    {
      key: 'ctDutyFactor',
      label: 'CT Duty Factor (J14)',
      unit: '',
      type: 'number',
      defaultValue: 1.25,
      required: true,
      min: 0.1,
      description: 'Duty factor',
    },
    {
      key: 'ctMotorMultiplicity',
      label: 'Motor Multiplicity (J15)',
      unit: '',
      type: 'number',
      defaultValue: 1.0,
      required: true,
      min: 0.1,
      description: 'Multiplicity',
    },
    {
      key: 'ambientDeratingFactor',
      label: 'Derating Factor (J16)',
      unit: '',
      type: 'number',
      defaultValue: 0.95,
      required: true,
      min: 0.5,
      max: 1.0,
      description: 'Ambient derating',
    },
    {
      key: 'ctTorqueFactor',
      label: 'CT Torque Factor (J17)',
      unit: '',
      type: 'number',
      defaultValue: 1.2,
      required: true,
      min: 0.5,
      description: 'Torque factor',
    },
    {
      key: 'ctFrictionFactor',
      label: 'Friction Resistance (J18)',
      unit: 'kg/t',
      type: 'number',
      defaultValue: 8.0,
      required: true,
      min: 1.0,
      description: 'Tread friction and flange friction',
    },
    {
      key: 'ctAccelerationResistance',
      label: 'Acceleration Factor (J19)',
      unit: '',
      type: 'number',
      defaultValue: 9.597477427,
      required: true,
      min: 0.1,
      description: 'Inertia acceleration term',
    },
    {
      key: 'numberOfGearboxStages',
      label: 'Gearbox Stages (J21)',
      unit: '',
      type: 'number',
      defaultValue: 2,
      required: true,
      min: 1,
      step: 1,
      description: 'Reduction stages',
    },
    {
      key: 'selectedMotorKw',
      label: 'Selected Motor Power',
      unit: 'kW',
      type: 'number',
      defaultValue: 0.75,
      required: true,
      min: 0.1,
      description: 'Selected motor rating',
    },
    {
      key: 'selectedMotorRpm',
      label: 'Selected Motor Speed',
      unit: 'rpm',
      type: 'number',
      defaultValue: 860,
      required: true,
      min: 100,
      description: 'Selected motor speed',
    },
  ],

  outputs: [
    { key: 'totalMovingMassTonnes', label: 'Total Moving Mass (J11)', unit: 't', description: 'SWL + Crab Weight' },
    { key: 'driveEfficiency', label: 'Gearbox Efficiency (J20)', unit: '', description: '0.95^stages' },
    {
      key: 'requiredMotorKw',
      label: 'Required CT Motor Power',
      unit: 'kW',
      description: 'Calculated motor power in kW (H23)',
    },
    {
      key: 'requiredMotorHp',
      label: 'Required CT Motor Power (HP)',
      unit: 'HP',
      description: 'Calculated motor power in HP (H24)',
    },
    { key: 'selectedMotorKw', label: 'Selected Motor Power', unit: 'kW', description: 'Rated power of selected motor' },
  ],

  dependencies: [
    { sourceToolId: 'master', sourceKey: 'swlTonnes', targetKey: 'swlTonnes', label: 'SWL' },
    { sourceToolId: 'master', sourceKey: 'crabWeightTonnes', targetKey: 'crabWeightTonnes', label: 'Crab Weight' },
    {
      sourceToolId: 'master',
      sourceKey: 'crossTravelSpeedMPerMin',
      targetKey: 'crossTravelSpeedMPerMin',
      label: 'CT Speed',
    },
    { sourceToolId: 'master', sourceKey: 'ctServiceFactor', targetKey: 'ctServiceFactor', label: 'CT Service Factor' },
    { sourceToolId: 'master', sourceKey: 'ctDutyFactor', targetKey: 'ctDutyFactor', label: 'CT Duty Factor' },
    {
      sourceToolId: 'master',
      sourceKey: 'ambientDeratingFactor',
      targetKey: 'ambientDeratingFactor',
      label: 'Ambient Derating',
    },
    { sourceToolId: 'master', sourceKey: 'ctTorqueFactor', targetKey: 'ctTorqueFactor', label: 'CT Torque Factor' },
    {
      sourceToolId: 'master',
      sourceKey: 'ctFrictionFactor',
      targetKey: 'ctFrictionFactor',
      label: 'CT Friction Factor',
    },
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const swlTonnes = assertPositiveNumber(inputs.swlTonnes ?? 10.0, 'swlTonnes');
    const crabWeightTonnes = assertPositiveNumber(inputs.crabWeightTonnes ?? 2.5, 'crabWeightTonnes');
    const crossTravelSpeedMPerMin = assertPositiveNumber(
      inputs.crossTravelSpeedMPerMin ?? 20.0,
      'crossTravelSpeedMPerMin',
    );
    const ctServiceFactor = assertPositiveNumber(inputs.ctServiceFactor ?? 0.67, 'ctServiceFactor');
    const ctDutyFactor = assertPositiveNumber(inputs.ctDutyFactor ?? 1.25, 'ctDutyFactor');
    const ctMotorMultiplicity = assertPositiveNumber(inputs.ctMotorMultiplicity ?? 1.0, 'ctMotorMultiplicity');
    const ambientDeratingFactor = assertPositiveNumber(inputs.ambientDeratingFactor ?? 0.95, 'ambientDeratingFactor');
    const ctTorqueFactor = assertPositiveNumber(inputs.ctTorqueFactor ?? 1.2, 'ctTorqueFactor');
    const ctFrictionFactor = assertPositiveNumber(inputs.ctFrictionFactor ?? 8.0, 'ctFrictionFactor');
    const ctAccelerationResistance = assertPositiveNumber(
      inputs.ctAccelerationResistance ?? 9.597477426966066,
      'ctAccelerationResistance',
    );
    const numberOfGearboxStages = assertPositiveNumber(inputs.numberOfGearboxStages ?? 2, 'numberOfGearboxStages');

    const selectedMotorKw = assertPositiveNumber(inputs.selectedMotorKw ?? 0.75, 'selectedMotorKw');
    const selectedMotorRpm = assertPositiveNumber(inputs.selectedMotorRpm ?? 860, 'selectedMotorRpm');

    // J11 = crane capacity + crab weight
    const totalMovingMassTonnes = swlTonnes + crabWeightTonnes;

    // J20 = (0.95)^J21
    const driveEfficiency = Math.pow(0.95, numberOfGearboxStages);

    // H23 = ((J11 * J12 * J13 * J14 * J15)/(6117 * J17 * J16)) * (J18 + (1100 * J19 / (981 * J20)))
    const term1 =
      (totalMovingMassTonnes * crossTravelSpeedMPerMin * ctServiceFactor * ctDutyFactor * ctMotorMultiplicity) /
      (6117 * ctTorqueFactor * ambientDeratingFactor);
    const accelTerm = (1100 * ctAccelerationResistance) / (981 * driveEfficiency);
    const term2 = ctFrictionFactor + accelTerm;
    const requiredMotorKw = term1 * term2;

    // H24 = H23 * 1.341
    const requiredMotorHp = requiredMotorKw * 1.341;

    const steps: CalculationStep[] = [
      {
        id: 'step-total-ct-mass',
        label: 'Total Moving Cross-Travel Mass (J11)',
        formulaText: 'M_total = SWL + M_crab',
        formulaMath: 'M_{total} = SWL + M_{crab}',
        variables: {
          SWL: { value: swlTonnes, unit: 't', label: 'SWL' },
          M_crab: { value: crabWeightTonnes, unit: 't', label: 'Crab Mass' },
        },
        substitutedExpression: `${swlTonnes} + ${crabWeightTonnes} = ${totalMovingMassTonnes} t`,
        result: { value: totalMovingMassTonnes, unit: 't', label: 'Total Moving Mass' },
        dependsOn: ['swlTonnes', 'crabWeightTonnes'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'C.T.',
        sourceCell: 'J11',
      },
      {
        id: 'step-ct-power-kw',
        label: 'Required Cross Travel Motor Power in kW (H23)',
        formulaText:
          'P_req = [ (M * V * K_s * K_d * K_m) / (6117 * K_t * K_amb) ] * [ w_f + (1100 * a) / (981 * eta) ]',
        formulaMath:
          'P_{req} = \\left[ \\frac{M \\times V \\times K_s \\times K_d \\times K_m}{6117 \\times K_t \\times K_{amb}} \\right] \\times \\left[ w_f + \\frac{1100 \\times a}{981 \\times \\eta} \\right]',
        variables: {
          M: { value: totalMovingMassTonnes, unit: 't', label: 'Total Mass' },
          V: { value: crossTravelSpeedMPerMin, unit: 'm/min', label: 'CT Speed' },
          w_f: { value: ctFrictionFactor, unit: 'kg/t', label: 'Friction' },
          eta: { value: driveEfficiency, unit: '', label: 'Efficiency' },
        },
        substitutedExpression: `[ (${totalMovingMassTonnes} * ${crossTravelSpeedMPerMin} * ${ctServiceFactor} * ${ctDutyFactor} * ${ctMotorMultiplicity}) / (6117 * ${ctTorqueFactor} * ${ambientDeratingFactor}) ] * [ ${ctFrictionFactor} + (1100 * ${ctAccelerationResistance.toFixed(4)}) / (981 * ${driveEfficiency.toFixed(4)}) ] = ${requiredMotorKw.toFixed(5)} kW`,
        result: { value: requiredMotorKw, unit: 'kW', label: 'Required CT Power' },
        dependsOn: ['step-total-ct-mass', 'crossTravelSpeedMPerMin'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'C.T.',
        sourceCell: 'H23',
      },
      {
        id: 'step-ct-power-hp',
        label: 'Required Cross Travel Motor Power in HP (H24)',
        formulaText: 'P_req(HP) = P_req(kW) * 1.341',
        formulaMath: 'P_{HP} = P_{kW} \\times 1.341',
        variables: {
          P_kW: { value: requiredMotorKw, unit: 'kW', label: 'Required kW' },
        },
        substitutedExpression: `${requiredMotorKw.toFixed(5)} * 1.341 = ${requiredMotorHp.toFixed(5)} HP`,
        result: { value: requiredMotorHp, unit: 'HP', label: 'Required CT Horsepower' },
        dependsOn: ['step-ct-power-kw'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'C.T.',
        sourceCell: 'H24',
      },
    ];

    const checks: CalculationCheck[] = [
      checkCapacityAdequacy(
        'CHK-CT-MOTOR-RATING',
        'Cross Travel Motor Rating Adequacy',
        selectedMotorKw,
        requiredMotorKw,
        'kW',
        'Cross Travel Motor',
      ),
    ];

    const status = checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL';

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'Clause 18 (Cross Travel Drives)',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'cross-travel-motor',
      toolVersion: '1.0.0',
      status,
      inputsUsed: {
        swlTonnes: { value: swlTonnes, unit: 't' },
        crabWeightTonnes: { value: crabWeightTonnes, unit: 't' },
        crossTravelSpeedMPerMin: { value: crossTravelSpeedMPerMin, unit: 'm/min' },
        ctServiceFactor: { value: ctServiceFactor, unit: '' },
        ctDutyFactor: { value: ctDutyFactor, unit: '' },
        ctMotorMultiplicity: { value: ctMotorMultiplicity, unit: '' },
        ambientDeratingFactor: { value: ambientDeratingFactor, unit: '' },
        ctTorqueFactor: { value: ctTorqueFactor, unit: '' },
        ctFrictionFactor: { value: ctFrictionFactor, unit: 'kg/t' },
        ctAccelerationResistance: { value: ctAccelerationResistance, unit: '' },
        numberOfGearboxStages: { value: numberOfGearboxStages, unit: '' },
        selectedMotorKw: { value: selectedMotorKw, unit: 'kW' },
        selectedMotorRpm: { value: selectedMotorRpm, unit: 'rpm' },
      },
      derived: {
        totalMovingMassTonnes: { value: totalMovingMassTonnes, unit: 't' },
        driveEfficiency: { value: driveEfficiency, unit: '' },
      },
      outputs: {
        totalMovingMassTonnes: { value: totalMovingMassTonnes, unit: 't', label: 'Total Moving Mass' },
        requiredMotorKw: { value: requiredMotorKw, unit: 'kW', label: 'Required CT Power' },
        requiredMotorHp: { value: requiredMotorHp, unit: 'HP', label: 'Required CT Horsepower' },
        selectedMotorKw: { value: selectedMotorKw, unit: 'kW', label: 'Selected Motor Power' },
        selectedMotorRpm: { value: selectedMotorRpm, unit: 'rpm', label: 'Selected Motor Speed' },
      },
      checks,
      steps,
      assumptions: [
        'Single motor drive with 2-stage helical gear reduction (0.95^2 = 0.9025 efficiency)',
        'Friction resistance 8.0 kg/tonne on machined rails',
        'Horsepower conversion uses workbook legacy factor 1.341',
      ],
      warnings: [],
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'C.T.',
        cells: ['J10', 'J11', 'J12', 'J13', 'J14', 'J15', 'J16', 'J17', 'J18', 'J19', 'J20', 'H23', 'H24'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
