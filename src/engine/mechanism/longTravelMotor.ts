/**
 * Long Travel Motor Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: L.T., MOTOR
 * Golden Values:
 *   Required LT power = 0.5990938154 kW
 *   Equivalent HP = 0.8033848064 HP
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

export const longTravelMotor: CalculationToolDefinition = {
  id: 'long-travel-motor',
  version: '1.0.0',
  name: 'Long Travel Motor',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description: 'Calculates the required bridge long travel motor power based on crane dead weight, capacity, track rolling friction, and bridge acceleration.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['L.T.'],

  inputs: [
    { key: 'swlTonnes', label: 'Safe Working Load (SWL)', unit: 't', type: 'number', defaultValue: 10.0, required: true, min: 0.1, description: 'Crane capacity' },
    { key: 'craneDeadWeightTonnes', label: 'Crane Dead Weight', unit: 't', type: 'number', defaultValue: 7.5, required: true, min: 0.1, description: 'Bridge structural dead weight (J10)' },
    { key: 'longTravelSpeedMPerMin', label: 'Long Travel Speed', unit: 'm/min', type: 'number', defaultValue: 20.0, required: true, min: 1.0, description: 'Bridge travel speed (J12)' },
    { key: 'ltServiceFactor', label: 'LT Service Factor (J13)', unit: '', type: 'number', defaultValue: 0.67, required: true, min: 0.1, description: 'Service factor' },
    { key: 'ltDutyFactor', label: 'LT Duty Factor (J14)', unit: '', type: 'number', defaultValue: 1.25, required: true, min: 0.1, description: 'Duty factor' },
    { key: 'ltMotorMultiplicity', label: 'Motor Multiplicity (J15)', unit: '', type: 'number', defaultValue: 1.0, required: true, min: 0.1, description: 'Drive distribution' },
    { key: 'ambientDeratingFactor', label: 'Derating Factor (J16)', unit: '', type: 'number', defaultValue: 0.95, required: true, min: 0.5, max: 1.0, description: 'Ambient derating' },
    { key: 'ltTorqueFactor', label: 'LT Torque Factor (J17)', unit: '', type: 'number', defaultValue: 1.2, required: true, min: 0.5, description: 'Torque factor' },
    { key: 'ltFrictionFactor', label: 'Friction Resistance (J18)', unit: 'kg/t', type: 'number', defaultValue: 10.0, required: true, min: 1.0, description: 'Long travel rail friction' },
    { key: 'ltAccelerationResistance', label: 'Acceleration Factor (J19)', unit: '', type: 'number', defaultValue: 3.422540622, required: true, min: 0.1, description: 'Bridge inertia factor' },
    { key: 'numberOfGearboxStages', label: 'Gearbox Stages (J21)', unit: '', type: 'number', defaultValue: 2, required: true, min: 1, step: 1, description: 'Reduction stages' },
    { key: 'selectedMotorKw', label: 'Selected Motor Power', unit: 'kW', type: 'number', defaultValue: 1.5, required: true, min: 0.1, description: 'Selected motor rating' },
    { key: 'selectedMotorRpm', label: 'Selected Motor Speed', unit: 'rpm', type: 'number', defaultValue: 860, required: true, min: 100, description: 'Selected motor speed' },
  ],

  outputs: [
    { key: 'totalMovingMassTonnes', label: 'Total Moving Mass (J11)', unit: 't', description: 'SWL + Crane Dead Weight' },
    { key: 'driveEfficiency', label: 'Gearbox Efficiency (J20)', unit: '', description: '0.95^stages' },
    { key: 'requiredMotorKw', label: 'Required LT Motor Power', unit: 'kW', description: 'Calculated motor power in kW (H23)' },
    { key: 'requiredMotorHp', label: 'Required LT Motor Power (HP)', unit: 'HP', description: 'Calculated motor power in HP (H24)' },
    { key: 'selectedMotorKw', label: 'Selected Motor Power', unit: 'kW', description: 'Rated power of selected motor' },
  ],

  dependencies: [
    { sourceToolId: 'master', sourceKey: 'swlTonnes', targetKey: 'swlTonnes', label: 'SWL' },
    { sourceToolId: 'master', sourceKey: 'craneDeadWeightTonnes', targetKey: 'craneDeadWeightTonnes', label: 'Crane Weight' },
    { sourceToolId: 'master', sourceKey: 'longTravelSpeedMPerMin', targetKey: 'longTravelSpeedMPerMin', label: 'LT Speed' },
    { sourceToolId: 'master', sourceKey: 'ltServiceFactor', targetKey: 'ltServiceFactor', label: 'LT Service Factor' },
    { sourceToolId: 'master', sourceKey: 'ltDutyFactor', targetKey: 'ltDutyFactor', label: 'LT Duty Factor' },
    { sourceToolId: 'master', sourceKey: 'ambientDeratingFactor', targetKey: 'ambientDeratingFactor', label: 'Ambient Derating' },
    { sourceToolId: 'master', sourceKey: 'ltTorqueFactor', targetKey: 'ltTorqueFactor', label: 'LT Torque Factor' },
    { sourceToolId: 'master', sourceKey: 'ltFrictionFactor', targetKey: 'ltFrictionFactor', label: 'LT Friction Factor' },
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const swlTonnes = assertPositiveNumber(inputs.swlTonnes ?? 10.0, 'swlTonnes');
    const craneDeadWeightTonnes = assertPositiveNumber(inputs.craneDeadWeightTonnes ?? 7.5, 'craneDeadWeightTonnes');
    const longTravelSpeedMPerMin = assertPositiveNumber(inputs.longTravelSpeedMPerMin ?? 20.0, 'longTravelSpeedMPerMin');
    const ltServiceFactor = assertPositiveNumber(inputs.ltServiceFactor ?? 0.67, 'ltServiceFactor');
    const ltDutyFactor = assertPositiveNumber(inputs.ltDutyFactor ?? 1.25, 'ltDutyFactor');
    const ltMotorMultiplicity = assertPositiveNumber(inputs.ltMotorMultiplicity ?? 1.0, 'ltMotorMultiplicity');
    const ambientDeratingFactor = assertPositiveNumber(inputs.ambientDeratingFactor ?? 0.95, 'ambientDeratingFactor');
    const ltTorqueFactor = assertPositiveNumber(inputs.ltTorqueFactor ?? 1.2, 'ltTorqueFactor');
    const ltFrictionFactor = assertPositiveNumber(inputs.ltFrictionFactor ?? 10.0, 'ltFrictionFactor');
    const ltAccelerationResistance = assertPositiveNumber(inputs.ltAccelerationResistance ?? 3.4225406215836034, 'ltAccelerationResistance');
    const numberOfGearboxStages = assertPositiveNumber(inputs.numberOfGearboxStages ?? 2, 'numberOfGearboxStages');

    const selectedMotorKw = assertPositiveNumber(inputs.selectedMotorKw ?? 1.5, 'selectedMotorKw');
    const selectedMotorRpm = assertPositiveNumber(inputs.selectedMotorRpm ?? 860, 'selectedMotorRpm');

    // J11 = capacity + crane weight
    const totalMovingMassTonnes = swlTonnes + craneDeadWeightTonnes;

    // J20 = (0.95)^J21
    const driveEfficiency = Math.pow(0.95, numberOfGearboxStages);

    // H23 = ((J11 * J12 * J13 * J14 * J15)/(6117 * J17 * J16)) * (J18 + (1100 * J19 / (981 * J20)))
    const term1 = (totalMovingMassTonnes * longTravelSpeedMPerMin * ltServiceFactor * ltDutyFactor * ltMotorMultiplicity) / (6117 * ltTorqueFactor * ambientDeratingFactor);
    const accelTerm = (1100 * ltAccelerationResistance) / (981 * driveEfficiency);
    const term2 = ltFrictionFactor + accelTerm;
    const requiredMotorKw = term1 * term2;

    // H24 = H23 * 1.341
    const requiredMotorHp = requiredMotorKw * 1.341;

    const steps: CalculationStep[] = [
      {
        id: 'step-total-lt-mass',
        label: 'Total Moving Long-Travel Mass (J11)',
        formulaText: 'M_total = SWL + M_crane',
        formulaMath: 'M_{total} = SWL + M_{crane}',
        variables: {
          SWL: { value: swlTonnes, unit: 't', label: 'SWL' },
          M_crane: { value: craneDeadWeightTonnes, unit: 't', label: 'Crane Dead Weight' },
        },
        substitutedExpression: `${swlTonnes} + ${craneDeadWeightTonnes} = ${totalMovingMassTonnes} t`,
        result: { value: totalMovingMassTonnes, unit: 't', label: 'Total Moving Mass' },
        dependsOn: ['swlTonnes', 'craneDeadWeightTonnes'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'L.T.',
        sourceCell: 'J11',
      },
      {
        id: 'step-lt-power-kw',
        label: 'Required Long Travel Motor Power in kW (H23)',
        formulaText: 'P_req = [ (M * V * K_s * K_d * K_m) / (6117 * K_t * K_amb) ] * [ w_f + (1100 * a) / (981 * eta) ]',
        formulaMath: 'P_{req} = \\left[ \\frac{M \\times V \\times K_s \\times K_d \\times K_m}{6117 \\times K_t \\times K_{amb}} \\right] \\times \\left[ w_f + \\frac{1100 \\times a}{981 \\times \\eta} \\right]',
        variables: {
          M: { value: totalMovingMassTonnes, unit: 't', label: 'Total Mass' },
          V: { value: longTravelSpeedMPerMin, unit: 'm/min', label: 'LT Speed' },
          w_f: { value: ltFrictionFactor, unit: 'kg/t', label: 'Friction' },
          eta: { value: driveEfficiency, unit: '', label: 'Efficiency' },
        },
        substitutedExpression: `[ (${totalMovingMassTonnes} * ${longTravelSpeedMPerMin} * ${ltServiceFactor} * ${ltDutyFactor} * ${ltMotorMultiplicity}) / (6117 * ${ltTorqueFactor} * ${ambientDeratingFactor}) ] * [ ${ltFrictionFactor} + (1100 * ${ltAccelerationResistance.toFixed(4)}) / (981 * ${driveEfficiency.toFixed(4)}) ] = ${requiredMotorKw.toFixed(5)} kW`,
        result: { value: requiredMotorKw, unit: 'kW', label: 'Required LT Power' },
        dependsOn: ['step-total-lt-mass', 'longTravelSpeedMPerMin'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'L.T.',
        sourceCell: 'H23',
      },
      {
        id: 'step-lt-power-hp',
        label: 'Required Long Travel Motor Power in HP (H24)',
        formulaText: 'P_req(HP) = P_req(kW) * 1.341',
        formulaMath: 'P_{HP} = P_{kW} \\times 1.341',
        variables: {
          P_kW: { value: requiredMotorKw, unit: 'kW', label: 'Required kW' },
        },
        substitutedExpression: `${requiredMotorKw.toFixed(5)} * 1.341 = ${requiredMotorHp.toFixed(5)} HP`,
        result: { value: requiredMotorHp, unit: 'HP', label: 'Required LT Horsepower' },
        dependsOn: ['step-lt-power-kw'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'L.T.',
        sourceCell: 'H24',
      },
    ];

    const checks: CalculationCheck[] = [
      checkCapacityAdequacy(
        'CHK-LT-MOTOR-RATING',
        'Long Travel Motor Rating Adequacy',
        selectedMotorKw,
        requiredMotorKw,
        'kW',
        'Long Travel Motor',
      ),
    ];

    const status = checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL';

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'Clause 18 (Long Travel Drives)',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'long-travel-motor',
      toolVersion: '1.0.0',
      status,
      inputsUsed: {
        swlTonnes: { value: swlTonnes, unit: 't' },
        craneDeadWeightTonnes: { value: craneDeadWeightTonnes, unit: 't' },
        longTravelSpeedMPerMin: { value: longTravelSpeedMPerMin, unit: 'm/min' },
        ltServiceFactor: { value: ltServiceFactor, unit: '' },
        ltDutyFactor: { value: ltDutyFactor, unit: '' },
        ltMotorMultiplicity: { value: ltMotorMultiplicity, unit: '' },
        ambientDeratingFactor: { value: ambientDeratingFactor, unit: '' },
        ltTorqueFactor: { value: ltTorqueFactor, unit: '' },
        ltFrictionFactor: { value: ltFrictionFactor, unit: 'kg/t' },
        ltAccelerationResistance: { value: ltAccelerationResistance, unit: '' },
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
        requiredMotorKw: { value: requiredMotorKw, unit: 'kW', label: 'Required LT Power' },
        requiredMotorHp: { value: requiredMotorHp, unit: 'HP', label: 'Required LT Horsepower' },
        selectedMotorKw: { value: selectedMotorKw, unit: 'kW', label: 'Selected Motor Power' },
        selectedMotorRpm: { value: selectedMotorRpm, unit: 'rpm', label: 'Selected Motor Speed' },
      },
      checks,
      steps,
      assumptions: [
        'Total moving mass includes bridge girders, end carriages, and rated payload',
        'Standard friction coefficient 10.0 kg/tonne for runway track',
        'Horsepower conversion uses workbook legacy factor 1.341',
      ],
      warnings: [],
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'L.T.',
        cells: ['J10', 'J11', 'J12', 'J13', 'J14', 'J15', 'J16', 'J17', 'J18', 'J19', 'J20', 'H23', 'H24'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
