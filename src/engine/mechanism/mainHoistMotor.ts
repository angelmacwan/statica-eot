/**
 * Main Hoist Motor Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: SPECIFICATIONS, M.H., MOTOR
 * Golden Value: Required power ≈ 10.4879897176 kW, HP ≈ 14.0643942112 HP
 */

import {
  CalculationToolDefinition,
  CalculationResult,
  CalculationStep,
  CalculationCheck,
  StandardReference,
} from '../types';
import { assertPositiveNumber, assertFiniteNumber } from '../safeMath';
import { checkCapacityAdequacy } from '../comparisons';

export const mainHoistMotor: CalculationToolDefinition = {
  id: 'main-hoist-motor',
  version: '1.0.0',
  name: 'Main Hoist Motor',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description:
    'Calculates the required hoisting motor power and validates selected motor rating according to IS 3177 / IS 807.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['SPECIFICATIONS', 'M.H.', 'MOTOR'],

  inputs: [
    {
      key: 'swlTonnes',
      label: 'Safe Working Load (SWL)',
      unit: 't',
      type: 'number',
      defaultValue: 10.0,
      required: true,
      min: 0.1,
      description: 'Rated capacity',
    },
    {
      key: 'hookBlockWeightTonnes',
      label: 'Hook Block Weight',
      unit: 't',
      type: 'number',
      defaultValue: 0.3,
      required: true,
      min: 0.0,
      description: 'Dead weight of bottom pulley hook block',
    },
    {
      key: 'hoistingSpeedMPerMin',
      label: 'Hoisting Speed',
      unit: 'm/min',
      type: 'number',
      defaultValue: 5.0,
      required: true,
      min: 0.1,
      description: 'Vertical lifting speed',
    },
    {
      key: 'hoistServiceFactor',
      label: 'Service Factor (K_s)',
      unit: '',
      type: 'number',
      defaultValue: 0.67,
      required: true,
      min: 0.1,
      description: 'Mechanism service factor (C21 / J11)',
    },
    {
      key: 'hoistDutyFactor',
      label: 'Duty Factor (K_d)',
      unit: '',
      type: 'number',
      defaultValue: 1.5,
      required: true,
      min: 0.1,
      description: 'Class duty factor (C20 / J12)',
    },
    {
      key: 'motorMultiplicityFactor',
      label: 'Motor Multiplicity Factor',
      unit: '',
      type: 'number',
      defaultValue: 1.0,
      required: true,
      min: 0.1,
      description: 'Motor drive distribution factor (C23 / J13)',
    },
    {
      key: 'numberOfGearboxStages',
      label: 'Gearbox Reduction Stages',
      unit: 'stages',
      type: 'number',
      defaultValue: 3,
      required: true,
      min: 1,
      step: 1,
      description: 'Pairs of gear reductions (C24 / J15)',
    },
    {
      key: 'numberOfFalls',
      label: 'Number of Rope Falls',
      unit: 'falls',
      type: 'number',
      defaultValue: 4,
      required: true,
      min: 1,
      step: 1,
      description: 'Total falls supporting the hook',
    },
    {
      key: 'ambientDeratingFactor',
      label: 'Ambient Derating Factor',
      unit: '',
      type: 'number',
      defaultValue: 0.95,
      required: true,
      min: 0.5,
      max: 1.0,
      description: 'Motor ambient temperature factor (C9 / J18)',
    },
    {
      key: 'selectedMotorKw',
      label: 'Selected Motor Power',
      unit: 'kW',
      type: 'number',
      defaultValue: 13.0,
      required: true,
      min: 0.1,
      description: 'Rated motor output power',
    },
    {
      key: 'selectedMotorRpm',
      label: 'Selected Motor Speed',
      unit: 'rpm',
      type: 'number',
      defaultValue: 935,
      required: true,
      min: 100,
      description: 'Full-load motor speed',
    },
    {
      key: 'selectedMotorModel',
      label: 'Selected Motor Model',
      unit: '',
      type: 'string',
      defaultValue: 'BBL Crane Duty Squirrel Cage 160L',
      required: false,
      description: 'Catalog designation',
    },
  ],

  outputs: [
    { key: 'totalLiftedMassTonnes', label: 'Total Lifted Mass', unit: 't', description: 'SWL + Hook block mass (J9)' },
    {
      key: 'overallEfficiency',
      label: 'Overall Drive Efficiency',
      unit: '',
      description: 'Gearbox & sheave efficiency product (J14)',
    },
    {
      key: 'requiredMotorKw',
      label: 'Required Motor Power (kW)',
      unit: 'kW',
      description: 'Calculated motor power in kW (H20)',
    },
    {
      key: 'requiredMotorHp',
      label: 'Required Motor Power (HP)',
      unit: 'HP',
      description: 'Calculated motor power in HP (H21)',
    },
    {
      key: 'selectedMotorKw',
      label: 'Selected Motor Power',
      unit: 'kW',
      description: 'Catalog rating of selected motor',
    },
  ],

  dependencies: [
    { sourceToolId: 'master', sourceKey: 'swlTonnes', targetKey: 'swlTonnes', label: 'Safe Working Load' },
    {
      sourceToolId: 'master',
      sourceKey: 'hookBlockWeightTonnes',
      targetKey: 'hookBlockWeightTonnes',
      label: 'Hook Block Weight',
    },
    {
      sourceToolId: 'master',
      sourceKey: 'hoistingSpeedMPerMin',
      targetKey: 'hoistingSpeedMPerMin',
      label: 'Hoisting Speed',
    },
    { sourceToolId: 'master', sourceKey: 'numberOfFalls', targetKey: 'numberOfFalls', label: 'Number of Falls' },
    {
      sourceToolId: 'master',
      sourceKey: 'hoistServiceFactor',
      targetKey: 'hoistServiceFactor',
      label: 'Service Factor',
    },
    { sourceToolId: 'master', sourceKey: 'hoistDutyFactor', targetKey: 'hoistDutyFactor', label: 'Duty Factor' },
    {
      sourceToolId: 'master',
      sourceKey: 'ambientDeratingFactor',
      targetKey: 'ambientDeratingFactor',
      label: 'Ambient Derating',
    },
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const swlTonnes = assertPositiveNumber(inputs.swlTonnes ?? 10.0, 'swlTonnes');
    const hookBlockWeightTonnes = assertFiniteNumber(inputs.hookBlockWeightTonnes ?? 0.3, 'hookBlockWeightTonnes');
    const hoistingSpeedMPerMin = assertPositiveNumber(inputs.hoistingSpeedMPerMin ?? 5.0, 'hoistingSpeedMPerMin');
    const hoistServiceFactor = assertPositiveNumber(inputs.hoistServiceFactor ?? 0.67, 'hoistServiceFactor');
    const hoistDutyFactor = assertPositiveNumber(inputs.hoistDutyFactor ?? 1.5, 'hoistDutyFactor');
    const motorMultiplicityFactor = assertPositiveNumber(
      inputs.motorMultiplicityFactor ?? 1.0,
      'motorMultiplicityFactor',
    );
    const numberOfGearboxStages = assertPositiveNumber(inputs.numberOfGearboxStages ?? 3, 'numberOfGearboxStages');
    const numberOfFalls = assertPositiveNumber(inputs.numberOfFalls ?? 4, 'numberOfFalls');
    const ambientDeratingFactor = assertPositiveNumber(inputs.ambientDeratingFactor ?? 0.95, 'ambientDeratingFactor');

    const selectedMotorKw = assertPositiveNumber(inputs.selectedMotorKw ?? 13.0, 'selectedMotorKw');
    const selectedMotorRpm = assertPositiveNumber(inputs.selectedMotorRpm ?? 935, 'selectedMotorRpm');
    const selectedMotorModel = String(inputs.selectedMotorModel ?? 'BBL Crane Duty 160L');

    // Intermediate variables matching workbook
    // J9 = SPECIFICATIONS!C15 + SPECIFICATIONS!C19
    const totalLiftedMassTonnes = swlTonnes + hookBlockWeightTonnes;

    // J15 = SPECIFICATIONS!C24 (number of stages = 3)
    // J16 = SPECIFICATIONS!C18/2 - 1 (sheave reduction stages = falls/2 - 1 = 4/2 - 1 = 1)
    const sheaveReductionStages = numberOfFalls / 2 - 1;

    // J14 = (0.95)^J15 * (0.99)^J16
    const overallEfficiency = Math.pow(0.95, numberOfGearboxStages) * Math.pow(0.99, sheaveReductionStages);

    // H20 = (J9 * J10 * J11 * J12 * J13) / (6.12 * J14 * J18)
    const numerator =
      totalLiftedMassTonnes * hoistingSpeedMPerMin * hoistServiceFactor * hoistDutyFactor * motorMultiplicityFactor;
    const denominator = 6.12 * overallEfficiency * ambientDeratingFactor;
    const requiredMotorKw = numerator / denominator;

    // H21 = H20 * 1.341
    const requiredMotorHp = requiredMotorKw * 1.341;

    // Calculation Steps for Traceability
    const steps: CalculationStep[] = [
      {
        id: 'step-effective-mass',
        label: 'Effective Lifted Mass (J9)',
        formulaText: 'M_lift = SWL + M_hook',
        formulaMath: 'M_{lift} = SWL + M_{hook}',
        variables: {
          SWL: { value: swlTonnes, unit: 't', label: 'Safe Working Load' },
          M_hook: { value: hookBlockWeightTonnes, unit: 't', label: 'Hook Block Weight' },
        },
        substitutedExpression: `${swlTonnes} + ${hookBlockWeightTonnes} = ${totalLiftedMassTonnes} t`,
        result: { value: totalLiftedMassTonnes, unit: 't', label: 'Effective Lifted Mass' },
        dependsOn: ['swlTonnes', 'hookBlockWeightTonnes'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'J9',
      },
      {
        id: 'step-sheave-factor',
        label: 'Sheave Reduction Stages (J16)',
        formulaText: 'N_sheaves = (Falls / 2) - 1',
        formulaMath: 'N_{sheaves} = \\frac{Falls}{2} - 1',
        variables: {
          Falls: { value: numberOfFalls, unit: 'falls', label: 'Number of Falls' },
        },
        substitutedExpression: `(${numberOfFalls} / 2) - 1 = ${sheaveReductionStages}`,
        result: { value: sheaveReductionStages, unit: '', label: 'Sheave stages' },
        dependsOn: ['numberOfFalls'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'J16',
      },
      {
        id: 'step-overall-efficiency',
        label: 'Overall Transmission Efficiency (J14)',
        formulaText: 'eta_total = (0.95)^stages * (0.99)^sheave_stages',
        formulaMath: '\\eta_{total} = 0.95^{N_{stages}} \\times 0.99^{N_{sheaves}}',
        variables: {
          stages: { value: numberOfGearboxStages, unit: '', label: 'Gearbox Stages' },
          sheave_stages: { value: sheaveReductionStages, unit: '', label: 'Sheave Stages' },
        },
        substitutedExpression: `(0.95)^${numberOfGearboxStages} * (0.99)^${sheaveReductionStages} = ${overallEfficiency.toFixed(6)}`,
        result: { value: overallEfficiency, unit: '', label: 'Total Transmission Efficiency' },
        dependsOn: ['numberOfGearboxStages', 'step-sheave-factor'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'J14',
      },
      {
        id: 'step-motor-power-kw',
        label: 'Required Hoist Motor Power (H20)',
        formulaText: 'P_req(kW) = (M_lift * V_hoist * K_s * K_d * K_m) / (6.12 * eta_total * K_amb)',
        formulaMath:
          'P_{req} = \\frac{M_{lift} \\times V_{hoist} \\times K_s \\times K_d \\times K_m}{6.12 \\times \\eta_{total} \\times K_{amb}}',
        variables: {
          M_lift: { value: totalLiftedMassTonnes, unit: 't', label: 'Total Lifted Mass' },
          V_hoist: { value: hoistingSpeedMPerMin, unit: 'm/min', label: 'Hoisting Speed' },
          K_s: { value: hoistServiceFactor, unit: '', label: 'Service Factor' },
          K_d: { value: hoistDutyFactor, unit: '', label: 'Duty Factor' },
          K_m: { value: motorMultiplicityFactor, unit: '', label: 'Multiplicity Factor' },
          eta_total: { value: overallEfficiency, unit: '', label: 'Efficiency' },
          K_amb: { value: ambientDeratingFactor, unit: '', label: 'Ambient Derating' },
        },
        substitutedExpression: `(${totalLiftedMassTonnes} * ${hoistingSpeedMPerMin} * ${hoistServiceFactor} * ${hoistDutyFactor} * ${motorMultiplicityFactor}) / (6.12 * ${overallEfficiency.toFixed(6)} * ${ambientDeratingFactor}) = ${requiredMotorKw.toFixed(4)} kW`,
        result: { value: requiredMotorKw, unit: 'kW', label: 'Required Power' },
        dependsOn: ['step-effective-mass', 'hoistingSpeedMPerMin', 'step-overall-efficiency'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'H20',
      },
      {
        id: 'step-motor-power-hp',
        label: 'Required Hoist Motor Horsepower (H21)',
        formulaText: 'P_req(HP) = P_req(kW) * 1.341',
        formulaMath: 'P_{HP} = P_{kW} \\times 1.341',
        variables: {
          P_kW: { value: requiredMotorKw, unit: 'kW', label: 'Required kW' },
        },
        substitutedExpression: `${requiredMotorKw.toFixed(4)} * 1.341 = ${requiredMotorHp.toFixed(4)} HP`,
        result: { value: requiredMotorHp, unit: 'HP', label: 'Required Horsepower' },
        dependsOn: ['step-motor-power-kw'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'H21',
      },
    ];

    // Checks
    const checks: CalculationCheck[] = [
      checkCapacityAdequacy(
        'CHK-MH-MOTOR-RATING',
        'Selected Motor Rating Adequacy',
        selectedMotorKw,
        requiredMotorKw,
        'kW',
        'Main Hoist Motor',
      ),
    ];

    const allPassed = checks.every((c) => c.status === 'PASS');
    const hasFail = checks.some((c) => c.status === 'FAIL');
    const status = hasFail ? 'FAIL' : allPassed ? 'PASS' : 'WARNING';

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'Clause 18 (Mechanism Design)',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
      {
        standard: 'IS 807:2006',
        clause: 'General structural and mechanism safety',
        sourceType: 'current-bis-reference',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'main-hoist-motor',
      toolVersion: '1.0.0',
      status,
      inputsUsed: {
        swlTonnes: { value: swlTonnes, unit: 't' },
        hookBlockWeightTonnes: { value: hookBlockWeightTonnes, unit: 't' },
        hoistingSpeedMPerMin: { value: hoistingSpeedMPerMin, unit: 'm/min' },
        hoistServiceFactor: { value: hoistServiceFactor, unit: '' },
        hoistDutyFactor: { value: hoistDutyFactor, unit: '' },
        motorMultiplicityFactor: { value: motorMultiplicityFactor, unit: '' },
        numberOfGearboxStages: { value: numberOfGearboxStages, unit: '' },
        numberOfFalls: { value: numberOfFalls, unit: '' },
        ambientDeratingFactor: { value: ambientDeratingFactor, unit: '' },
        selectedMotorKw: { value: selectedMotorKw, unit: 'kW' },
        selectedMotorRpm: { value: selectedMotorRpm, unit: 'rpm' },
        selectedMotorModel: { value: selectedMotorModel, unit: '' },
      },
      derived: {
        totalLiftedMassTonnes: { value: totalLiftedMassTonnes, unit: 't' },
        overallEfficiency: { value: overallEfficiency, unit: '' },
      },
      outputs: {
        requiredMotorKw: { value: requiredMotorKw, unit: 'kW', label: 'Required Motor Power' },
        requiredMotorHp: { value: requiredMotorHp, unit: 'HP', label: 'Required Motor Horsepower' },
        selectedMotorKw: { value: selectedMotorKw, unit: 'kW', label: 'Selected Motor Power' },
        selectedMotorRpm: { value: selectedMotorRpm, unit: 'rpm', label: 'Selected Motor Speed' },
      },
      checks,
      steps,
      assumptions: [
        'Single motor drive (multiplicity factor 1.0)',
        'Three-stage spur/helical reduction with 0.95 efficiency per reduction stage',
        'Roller bearing sheave efficiency 0.99 per sheave pair',
        'Horsepower conversion uses workbook legacy factor 1.341',
      ],
      warnings: [],
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'M.H.',
        cells: ['J9', 'J10', 'J11', 'J12', 'J13', 'J14', 'J15', 'J16', 'J18', 'H20', 'H21'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
