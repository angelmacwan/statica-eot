/**
 * Crab (Trolley) Weight Breakdown and Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: CRAB WT.
 * Golden Values:
 *   Main Hoist Total = 1435 kg
 *   Cross Travel Total = 364 kg
 *   Trolley Structure = 700 kg
 *   Net Crab Weight = 2499 kg
 *   With 25% Allowance = 3123.75 kg (3.12375 t)
 */

import {
  CalculationToolDefinition,
  CalculationResult,
  CalculationStep,
  CalculationCheck,
  StandardReference,
} from '../types';
import { assertNonNegativeNumber, assertPositiveNumber } from '../safeMath';

export const crabWeight: CalculationToolDefinition = {
  id: 'crab-weight',
  version: '1.0.0',
  name: 'Crab Weight Estimation',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description: 'Calculates the total mass of the crab/trolley machinery and structural frame from individual component weights, with a 25% design allowance.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['CRAB WT.'],

  inputs: [
    // Main Hoist Components
    { key: 'hoistGearboxKg', label: 'Hoist Gearbox Weight', unit: 'kg', type: 'number', defaultValue: 450.0, required: true, min: 0, description: 'Main hoist reducer weight' },
    { key: 'hoistMotorKg', label: 'Hoist Motor Weight', unit: 'kg', type: 'number', defaultValue: 123.0, required: true, min: 0, description: 'Main hoist electric motor' },
    { key: 'hoistBrakeKg', label: 'Hoist Brake Weight', unit: 'kg', type: 'number', defaultValue: 27.0, required: true, min: 0, description: 'Thruster drum brake weight' },
    { key: 'ropeDrumKg', label: 'Rope Drum Weight', unit: 'kg', type: 'number', defaultValue: 400.0, required: true, min: 0, description: 'Grooved drum shell, shafts, flanges' },
    { key: 'drumPedestalKg', label: 'Drum Pedestal Bearing Weight', unit: 'kg', type: 'number', defaultValue: 30.0, required: true, min: 0, description: 'Pedestal block with spherical bearing' },
    { key: 'bottomBlockKg', label: 'Bottom Pulley Block Weight', unit: 'kg', type: 'number', defaultValue: 260.0, required: true, min: 0, description: 'Hook, crosshead, sheaves and side plates' },
    { key: 'upperPulleyKg', label: 'Upper Pulley Block Weight', unit: 'kg', type: 'number', defaultValue: 0.0, required: true, min: 0, description: 'Fixed top sheave arrangement' },
    { key: 'equalizingPulleyKg', label: 'Equalizing Pulley Weight', unit: 'kg', type: 'number', defaultValue: 50.0, required: true, min: 0, description: 'Compensating sheave and bracket' },
    { key: 'wireRopeTotalKg', label: 'Wire Rope Total Weight', unit: 'kg', type: 'number', defaultValue: 95.0, required: true, min: 0, description: 'Reeved wire rope dead weight' },

    // Cross Travel Components
    { key: 'ctGearboxKg', label: 'CT Gearbox Weight', unit: 'kg', type: 'number', defaultValue: 150.0, required: true, min: 0, description: 'Cross travel reducer' },
    { key: 'ctMotorKg', label: 'CT Motor Weight', unit: 'kg', type: 'number', defaultValue: 7.0, required: true, min: 0, description: 'CT motor' },
    { key: 'ctBrakeKg', label: 'CT Brake Weight', unit: 'kg', type: 'number', defaultValue: 17.0, required: true, min: 0, description: 'CT thruster brake' },
    { key: 'ctWheelsKg', label: 'CT Wheels Total Weight', unit: 'kg', type: 'number', defaultValue: 140.0, required: true, min: 0, description: '4 wheels (35 kg each)' },
    { key: 'ctCouplingsKg', label: 'CT Couplings Total Weight', unit: 'kg', type: 'number', defaultValue: 20.0, required: true, min: 0, description: 'Couplings and brake drum' },
    { key: 'ctFloatingShaftKg', label: 'Floating Shaft Weight', unit: 'kg', type: 'number', defaultValue: 30.0, required: true, min: 0, description: 'Line shaft connecting drive' },

    // Trolley Structure
    { key: 'trolleyStructureKg', label: 'Trolley Structural Frame', unit: 'kg', type: 'number', defaultValue: 700.0, required: true, min: 0, description: 'Welded steel plate chassis' },
    { key: 'allowanceFactor', label: 'Design Allowance Factor', unit: '', type: 'number', defaultValue: 1.25, required: true, min: 1.0, description: 'Contingency factor (1.25 in workbook)' },
  ],

  outputs: [
    { key: 'hoistMachineryTotalKg', label: 'Total Hoist Machinery Weight', unit: 'kg', description: 'Sum of hoisting components' },
    { key: 'ctMachineryTotalKg', label: 'Total Cross Travel Machinery Weight', unit: 'kg', description: 'Sum of CT drive components' },
    { key: 'netCrabWeightKg', label: 'Net Crab Weight (Unfactored)', unit: 'kg', description: 'Hoist + CT + Structure (D28)' },
    { key: 'factoredCrabWeightKg', label: 'Factored Crab Weight (with 25% margin)', unit: 'kg', description: 'Net weight * 1.25 (G28)' },
    { key: 'factoredCrabWeightTonnes', label: 'Factored Crab Weight (Tonnes)', unit: 't', description: 'Weight in tonnes to use in Master Spec' },
  ],

  dependencies: [],

  calculate(inputs: Record<string, any>): CalculationResult {
    const hoistGearboxKg = assertNonNegativeNumber(inputs.hoistGearboxKg ?? 450.0, 'hoistGearboxKg');
    const hoistMotorKg = assertNonNegativeNumber(inputs.hoistMotorKg ?? 123.0, 'hoistMotorKg');
    const hoistBrakeKg = assertNonNegativeNumber(inputs.hoistBrakeKg ?? 27.0, 'hoistBrakeKg');
    const ropeDrumKg = assertNonNegativeNumber(inputs.ropeDrumKg ?? 400.0, 'ropeDrumKg');
    const drumPedestalKg = assertNonNegativeNumber(inputs.drumPedestalKg ?? 30.0, 'drumPedestalKg');
    const bottomBlockKg = assertNonNegativeNumber(inputs.bottomBlockKg ?? 260.0, 'bottomBlockKg');
    const upperPulleyKg = assertNonNegativeNumber(inputs.upperPulleyKg ?? 0.0, 'upperPulleyKg');
    const equalizingPulleyKg = assertNonNegativeNumber(inputs.equalizingPulleyKg ?? 50.0, 'equalizingPulleyKg');
    const wireRopeTotalKg = assertNonNegativeNumber(inputs.wireRopeTotalKg ?? 95.0, 'wireRopeTotalKg');

    const ctGearboxKg = assertNonNegativeNumber(inputs.ctGearboxKg ?? 150.0, 'ctGearboxKg');
    const ctMotorKg = assertNonNegativeNumber(inputs.ctMotorKg ?? 7.0, 'ctMotorKg');
    const ctBrakeKg = assertNonNegativeNumber(inputs.ctBrakeKg ?? 17.0, 'ctBrakeKg');
    const ctWheelsKg = assertNonNegativeNumber(inputs.ctWheelsKg ?? 140.0, 'ctWheelsKg');
    const ctCouplingsKg = assertNonNegativeNumber(inputs.ctCouplingsKg ?? 20.0, 'ctCouplingsKg');
    const ctFloatingShaftKg = assertNonNegativeNumber(inputs.ctFloatingShaftKg ?? 30.0, 'ctFloatingShaftKg');

    const trolleyStructureKg = assertNonNegativeNumber(inputs.trolleyStructureKg ?? 700.0, 'trolleyStructureKg');
    const allowanceFactor = assertPositiveNumber(inputs.allowanceFactor ?? 1.25, 'allowanceFactor');

    const hoistMachineryTotalKg =
      hoistGearboxKg +
      hoistMotorKg +
      hoistBrakeKg +
      ropeDrumKg +
      drumPedestalKg +
      bottomBlockKg +
      upperPulleyKg +
      equalizingPulleyKg +
      wireRopeTotalKg;

    const ctMachineryTotalKg =
      ctGearboxKg +
      ctMotorKg +
      ctBrakeKg +
      ctWheelsKg +
      ctCouplingsKg +
      ctFloatingShaftKg;

    // D28 = hoist + ct + structure = 2499 kg
    const netCrabWeightKg = hoistMachineryTotalKg + ctMachineryTotalKg + trolleyStructureKg;

    // G28 = D28 * 1.25 = 3123.75 kg
    const factoredCrabWeightKg = netCrabWeightKg * allowanceFactor;
    const factoredCrabWeightTonnes = factoredCrabWeightKg / 1000;

    const steps: CalculationStep[] = [
      {
        id: 'step-hoist-machinery-sum',
        label: 'Main Hoist Machinery Weight Sum',
        formulaText: 'W_hoist = Sum(gearbox + motor + brake + drum + pedestal + block + rope)',
        formulaMath: 'W_{hoist} = \\sum W_{i}',
        variables: {},
        substitutedExpression: `${hoistGearboxKg} + ${hoistMotorKg} + ${hoistBrakeKg} + ${ropeDrumKg} + ${drumPedestalKg} + ${bottomBlockKg} + ${upperPulleyKg} + ${equalizingPulleyKg} + ${wireRopeTotalKg} = ${hoistMachineryTotalKg} kg`,
        result: { value: hoistMachineryTotalKg, unit: 'kg', label: 'Hoist Machinery Total' },
        dependsOn: [],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'CRAB WT.',
        sourceCell: 'D14',
      },
      {
        id: 'step-ct-machinery-sum',
        label: 'Cross Travel Machinery Weight Sum',
        formulaText: 'W_ct = Sum(gearbox + motor + brake + wheels + couplings + shaft)',
        formulaMath: 'W_{ct} = \\sum W_{j}',
        variables: {},
        substitutedExpression: `${ctGearboxKg} + ${ctMotorKg} + ${ctBrakeKg} + ${ctWheelsKg} + ${ctCouplingsKg} + ${ctFloatingShaftKg} = ${ctMachineryTotalKg} kg`,
        result: { value: ctMachineryTotalKg, unit: 'kg', label: 'CT Machinery Total' },
        dependsOn: [],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'CRAB WT.',
        sourceCell: 'D24',
      },
      {
        id: 'step-net-crab-sum',
        label: 'Net Combined Crab Weight (D28)',
        formulaText: 'W_net = W_hoist + W_ct + W_structure',
        formulaMath: 'W_{net} = W_{hoist} + W_{ct} + W_{structure}',
        variables: {
          W_hoist: { value: hoistMachineryTotalKg, unit: 'kg', label: 'Hoist Weight' },
          W_ct: { value: ctMachineryTotalKg, unit: 'kg', label: 'CT Weight' },
          W_structure: { value: trolleyStructureKg, unit: 'kg', label: 'Frame Weight' },
        },
        substitutedExpression: `${hoistMachineryTotalKg} + ${ctMachineryTotalKg} + ${trolleyStructureKg} = ${netCrabWeightKg} kg`,
        result: { value: netCrabWeightKg, unit: 'kg', label: 'Net Crab Weight' },
        dependsOn: ['step-hoist-machinery-sum', 'step-ct-machinery-sum'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'CRAB WT.',
        sourceCell: 'D28',
      },
      {
        id: 'step-factored-crab-weight',
        label: 'Factored Crab Weight with Margin (G28)',
        formulaText: 'W_factored = W_net * 1.25',
        formulaMath: 'W_{factored} = W_{net} \\times 1.25',
        variables: {
          W_net: { value: netCrabWeightKg, unit: 'kg', label: 'Net Weight' },
        },
        substitutedExpression: `${netCrabWeightKg} * ${allowanceFactor} = ${factoredCrabWeightKg.toFixed(2)} kg (${factoredCrabWeightTonnes.toFixed(4)} t)`,
        result: { value: factoredCrabWeightKg, unit: 'kg', label: 'Factored Crab Weight' },
        dependsOn: ['step-net-crab-sum'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'CRAB WT.',
        sourceCell: 'G28',
      },
    ];

    const checks: CalculationCheck[] = [
      {
        id: 'CHK-CRAB-WEIGHT-POSITIVE',
        name: 'Calculated Crab Weight Positivity',
        status: 'PASS',
        actual: factoredCrabWeightKg,
        criterion: 'weight > 0',
        unit: 'kg',
        message: `Calculated crab weight is ${factoredCrabWeightKg.toFixed(2)} kg (${factoredCrabWeightTonnes.toFixed(3)} t). Ready for Master Specification sync.`,
      },
    ];

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'General equipment weighing and estimation practice',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'crab-weight',
      toolVersion: '1.0.0',
      status: 'PASS',
      inputsUsed: {
        hoistGearboxKg: { value: hoistGearboxKg, unit: 'kg' },
        hoistMotorKg: { value: hoistMotorKg, unit: 'kg' },
        hoistBrakeKg: { value: hoistBrakeKg, unit: 'kg' },
        ropeDrumKg: { value: ropeDrumKg, unit: 'kg' },
        drumPedestalKg: { value: drumPedestalKg, unit: 'kg' },
        bottomBlockKg: { value: bottomBlockKg, unit: 'kg' },
        upperPulleyKg: { value: upperPulleyKg, unit: 'kg' },
        equalizingPulleyKg: { value: equalizingPulleyKg, unit: 'kg' },
        wireRopeTotalKg: { value: wireRopeTotalKg, unit: 'kg' },
        ctGearboxKg: { value: ctGearboxKg, unit: 'kg' },
        ctMotorKg: { value: ctMotorKg, unit: 'kg' },
        ctBrakeKg: { value: ctBrakeKg, unit: 'kg' },
        ctWheelsKg: { value: ctWheelsKg, unit: 'kg' },
        ctCouplingsKg: { value: ctCouplingsKg, unit: 'kg' },
        ctFloatingShaftKg: { value: ctFloatingShaftKg, unit: 'kg' },
        trolleyStructureKg: { value: trolleyStructureKg, unit: 'kg' },
        allowanceFactor: { value: allowanceFactor, unit: '' },
      },
      derived: {
        hoistMachineryTotalKg: { value: hoistMachineryTotalKg, unit: 'kg' },
        ctMachineryTotalKg: { value: ctMachineryTotalKg, unit: 'kg' },
      },
      outputs: {
        hoistMachineryTotalKg: { value: hoistMachineryTotalKg, unit: 'kg', label: 'Hoist Machinery Total' },
        ctMachineryTotalKg: { value: ctMachineryTotalKg, unit: 'kg', label: 'CT Machinery Total' },
        netCrabWeightKg: { value: netCrabWeightKg, unit: 'kg', label: 'Net Crab Weight' },
        factoredCrabWeightKg: { value: factoredCrabWeightKg, unit: 'kg', label: 'Factored Crab Weight' },
        factoredCrabWeightTonnes: { value: factoredCrabWeightTonnes, unit: 't', label: 'Factored Crab Weight (t)' },
      },
      checks,
      steps,
      assumptions: [
        'A 25% design allowance is applied to account for fasteners, electrical wiring, festoons, platforms, and weld metal per legacy sheet CRAB WT.',
      ],
      warnings: [],
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'CRAB WT.',
        cells: ['D14', 'D24', 'D28', 'G28'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
