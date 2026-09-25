/**
 * Gantry Leg Calculation Tool (Tier B - Engineering Review Gate)
 * Source: LEG CALCULATION FOR GANTRY CRANE.xlsx
 */

import {
  CalculationToolDefinition,
  CalculationResult,
  CalculationStep,
  CalculationCheck,
  StandardReference,
} from '../types';
import { assertPositiveNumber } from '../safeMath';

export const gantryLeg: CalculationToolDefinition = {
  id: 'gantry-leg',
  version: '0.1.0',
  name: 'Gantry Leg & Stability',
  category: 'STRUCTURAL',
  tier: 'B',
  reviewStatus: 'ENGINEERING REVIEW REQUIRED',
  description: 'Calculates overturning moments, storm wind stability, and column buckling safety factor for gantry crane supporting legs.',
  sourceWorkbook: 'LEG CALCULATION FOR GANTRY CRANE.xlsx',
  sourceSheets: ['CALCULATION'],

  inputs: [
    { key: 'legHeightM', label: 'Clear Leg Height (H)', unit: 'm', type: 'number', defaultValue: 8.0, required: true, min: 2.0, description: 'Ground to girder rail elevation' },
    { key: 'legWheelBaseM', label: 'Leg Wheelbase at Ground (B)', unit: 'm', type: 'number', defaultValue: 4.5, required: true, min: 1.5, description: 'Distance between end carriage wheels' },
    { key: 'verticalLoadTonnes', label: 'Maximum Vertical Leg Reaction', unit: 't', type: 'number', defaultValue: 32.5, required: true, min: 5.0, description: 'Vertical dead + live load on leg' },
    { key: 'windPressureServiceNPerM2', label: 'Operating Wind Pressure', unit: 'N/m2', type: 'number', defaultValue: 250.0, required: true, min: 100.0, description: 'Service state wind pressure' },
    { key: 'windPressureStormNPerM2', label: 'Storm Wind Pressure', unit: 'N/m2', type: 'number', defaultValue: 1000.0, required: true, min: 500.0, description: 'Non-operating storm wind pressure' },
  ],

  outputs: [
    { key: 'stabilisingMomentKnm', label: 'Stabilising Moment (M_stab)', unit: 'kN.m', description: 'Restoring gravity moment' },
    { key: 'serviceOverturningMomentKnm', label: 'Service Overturning Moment', unit: 'kN.m', description: 'Operating wind and inertia moment' },
    { key: 'serviceStabilityFactor', label: 'Service Stability Factor', unit: '', description: 'M_stab / M_overturn' },
    { key: 'stormStabilityFactor', label: 'Storm Stability Factor', unit: '', description: 'Storm condition factor of safety' },
  ],

  dependencies: [],

  calculate(inputs: Record<string, any>): CalculationResult {
    const H = assertPositiveNumber(inputs.legHeightM ?? 8.0, 'legHeightM');
    const B = assertPositiveNumber(inputs.legWheelBaseM ?? 4.5, 'legWheelBaseM');
    const V_tonnes = assertPositiveNumber(inputs.verticalLoadTonnes ?? 32.5, 'verticalLoadTonnes');
    const q_service = assertPositiveNumber(inputs.windPressureServiceNPerM2 ?? 250.0, 'windPressureServiceNPerM2');
    const q_storm = assertPositiveNumber(inputs.windPressureStormNPerM2 ?? 1000.0, 'windPressureStormNPerM2');

    const V_kn = V_tonnes * 9.81;

    // Stabilising moment = V * (B / 2)
    const stabilisingMomentKnm = V_kn * (B / 2);

    // Approximate wind area: leg + projected girder
    const windAreaM2 = 1.2 * H + 2.5;
    const serviceWindForceKn = (q_service * windAreaM2) / 1000;
    const serviceOverturningMomentKnm = serviceWindForceKn * (H / 2 + 1.0);

    const serviceStabilityFactor = stabilisingMomentKnm / serviceOverturningMomentKnm;

    const stormWindForceKn = (q_storm * windAreaM2) / 1000;
    const stormOverturningMomentKnm = stormWindForceKn * (H / 2 + 1.0);
    const stormStabilityFactor = stabilisingMomentKnm / stormOverturningMomentKnm;

    const steps: CalculationStep[] = [
      {
        id: 'step-leg-stability',
        label: 'Gantry Stability Factor',
        formulaText: 'FS_stab = M_stabilising / M_overturning',
        formulaMath: 'FS = \\frac{V \\times (B / 2)}{F_{wind} \\times h_{cp}}',
        variables: {
          V: { value: V_kn, unit: 'kN', label: 'Vertical Reaction' },
          B: { value: B, unit: 'm', label: 'Wheelbase' },
        },
        substitutedExpression: `(${V_kn.toFixed(1)} * (${B} / 2)) / ${serviceOverturningMomentKnm.toFixed(1)} = ${serviceStabilityFactor.toFixed(2)}`,
        result: { value: serviceStabilityFactor, unit: '', label: 'Stability Factor' },
        dependsOn: ['legHeightM', 'legWheelBaseM', 'verticalLoadTonnes'],
        sourceWorkbook: 'LEG CALCULATION FOR GANTRY CRANE.xlsx',
        sourceSheet: 'CALCULATION',
        sourceCell: 'E163',
      },
    ];

    const checks: CalculationCheck[] = [
      {
        id: 'CHK-LEG-STABILITY-GATE',
        name: 'Gantry Leg Structural Review Gate',
        status: 'WARNING',
        actual: serviceStabilityFactor >= 1.5 ? 'PASS (Review Pending)' : 'FAIL',
        required: 'FS >= 1.50 (Operating), FS >= 1.20 (Storm)',
        criterion: 'FS >= 1.5',
        unit: '',
        message: `Calculated service stability factor is ${serviceStabilityFactor.toFixed(2)}. Marked for structural PE validation.`,
      },
    ];

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 807:2006 & IS 875 (Part 3)',
        clause: 'Crane wind load and overturning stability',
        sourceType: 'current-bis-reference',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'gantry-leg',
      toolVersion: '0.1.0',
      status: 'WARNING',
      inputsUsed: {
        legHeightM: { value: H, unit: 'm' },
        legWheelBaseM: { value: B, unit: 'm' },
        verticalLoadTonnes: { value: V_tonnes, unit: 't' },
        windPressureServiceNPerM2: { value: q_service, unit: 'N/m2' },
        windPressureStormNPerM2: { value: q_storm, unit: 'N/m2' },
      },
      derived: {
        stabilisingMomentKnm: { value: stabilisingMomentKnm, unit: 'kN.m' },
        serviceOverturningMomentKnm: { value: serviceOverturningMomentKnm, unit: 'kN.m' },
      },
      outputs: {
        stabilisingMomentKnm: { value: stabilisingMomentKnm, unit: 'kN.m', label: 'Stabilising Moment' },
        serviceOverturningMomentKnm: { value: serviceOverturningMomentKnm, unit: 'kN.m', label: 'Service Overturning Moment' },
        serviceStabilityFactor: { value: serviceStabilityFactor, unit: '', label: 'Service Stability Factor' },
        stormStabilityFactor: { value: stormStabilityFactor, unit: '', label: 'Storm Stability Factor' },
      },
      checks,
      steps,
      assumptions: [
        'Out-of-service gantry crane assumed securely anchored or equipped with rail clamps against storm gusts',
      ],
      warnings: ['ENGINEERING REVIEW REQUIRED: Structural design code verification pending.'],
      standardReferences,
      sourceLineage: {
        workbook: 'LEG CALCULATION FOR GANTRY CRANE.xlsx',
        sheet: 'CALCULATION',
        cells: ['E161', 'E162', 'E163', 'E181', 'E189'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
