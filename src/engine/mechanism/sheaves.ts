/**
 * Main Hoist Sheaves Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: M.H.
 * Golden Values:
 *   Required main sheave diameter = 288 mm (selected 320 mm)
 *   Required equalizing sheave diameter = 192 mm (selected 200 mm)
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

export const sheaves: CalculationToolDefinition = {
  id: 'sheaves',
  version: '1.0.0',
  name: 'Main Hoist Sheaves',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description: 'Calculates the required pitch circle diameter for main load sheaves and equalizing/compensating sheaves per IS 3177.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['M.H.'],

  inputs: [
    { key: 'ropeDiameterMm', label: 'Rope Diameter', unit: 'mm', type: 'number', defaultValue: 16.0, required: true, min: 6.0, description: 'Wire rope nominal diameter (D61 / J137)' },
    { key: 'hoistDutyFactor', label: 'Duty Factor (J138)', unit: '', type: 'number', defaultValue: 1.50, required: true, min: 0.5, description: 'Class duty factor' },
    { key: 'sheaveFactor1', label: 'Sheave Factor K1 (J139)', unit: '', type: 'number', defaultValue: 1.0, required: true, min: 0.5, description: 'Base sizing factor' },
    { key: 'sheaveFactor2', label: 'Sheave Factor K2 (J140)', unit: '', type: 'number', defaultValue: 1.0, required: true, min: 0.5, description: 'Application coefficient' },
    { key: 'selectedMainSheaveMm', label: 'Selected Main Sheave PCD', unit: 'mm', type: 'number', defaultValue: 320.0, required: true, min: 100.0, description: 'Pitch circle diameter of load sheaves' },
    { key: 'selectedEqualizingSheaveMm', label: 'Selected Equalizer Sheave PCD', unit: 'mm', type: 'number', defaultValue: 200.0, required: true, min: 50.0, description: 'Pitch diameter of equalizing sheave' },
  ],

  outputs: [
    { key: 'requiredMainSheaveMm', label: 'Required Main Sheave Diameter', unit: 'mm', description: 'Calculated minimum load sheave PCD (H142)' },
    { key: 'selectedMainSheaveMm', label: 'Selected Main Sheave Diameter', unit: 'mm', description: 'Catalog/drawing load sheave diameter' },
    { key: 'requiredEqualizingSheaveMm', label: 'Required Equalizing Sheave Diameter', unit: 'mm', description: 'Calculated minimum equalizer sheave PCD (H145)' },
    { key: 'selectedEqualizingSheaveMm', label: 'Selected Equalizer Sheave Diameter', unit: 'mm', description: 'Catalog/drawing equalizer sheave diameter' },
  ],

  dependencies: [
    { sourceToolId: 'wire-rope', sourceKey: 'selectedRopeDiameterMm', targetKey: 'ropeDiameterMm', label: 'Rope Diameter' },
    { sourceToolId: 'master', sourceKey: 'hoistDutyFactor', targetKey: 'hoistDutyFactor', label: 'Duty Factor' },
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const ropeDiameterMm = assertPositiveNumber(inputs.ropeDiameterMm ?? 16.0, 'ropeDiameterMm');
    const hoistDutyFactor = assertPositiveNumber(inputs.hoistDutyFactor ?? 1.50, 'hoistDutyFactor');
    const sheaveFactor1 = assertPositiveNumber(inputs.sheaveFactor1 ?? 1.0, 'sheaveFactor1');
    const sheaveFactor2 = assertPositiveNumber(inputs.sheaveFactor2 ?? 1.0, 'sheaveFactor2');

    const selectedMainSheaveMm = assertPositiveNumber(inputs.selectedMainSheaveMm ?? 320.0, 'selectedMainSheaveMm');
    const selectedEqualizingSheaveMm = assertPositiveNumber(inputs.selectedEqualizingSheaveMm ?? 200.0, 'selectedEqualizingSheaveMm');

    // H142 = 12 * J137 * J138 * J139 * J140
    const requiredMainSheaveMm = 12 * ropeDiameterMm * hoistDutyFactor * sheaveFactor1 * sheaveFactor2;

    // H145 = 8 * J137 * J138 * J139
    const requiredEqualizingSheaveMm = 8 * ropeDiameterMm * hoistDutyFactor * sheaveFactor1;

    const steps: CalculationStep[] = [
      {
        id: 'step-req-main-sheave',
        label: 'Required Main Sheave Diameter (H142)',
        formulaText: 'D_sheave,req = 12 * d_rope * K_duty * K1 * K2',
        formulaMath: 'D_{sheave,req} = 12 \\times d_{rope} \\times K_{duty} \\times K_1 \\times K_2',
        variables: {
          d_rope: { value: ropeDiameterMm, unit: 'mm', label: 'Rope Diameter' },
          K_duty: { value: hoistDutyFactor, unit: '', label: 'Duty Factor' },
        },
        substitutedExpression: `12 * ${ropeDiameterMm} * ${hoistDutyFactor} * ${sheaveFactor1} * ${sheaveFactor2} = ${requiredMainSheaveMm.toFixed(2)} mm`,
        result: { value: requiredMainSheaveMm, unit: 'mm', label: 'Required Main Sheave PCD' },
        dependsOn: ['ropeDiameterMm', 'hoistDutyFactor'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'H142',
      },
      {
        id: 'step-req-equalizer-sheave',
        label: 'Required Equalizing Sheave Diameter (H145)',
        formulaText: 'D_eq,req = 8 * d_rope * K_duty * K1',
        formulaMath: 'D_{eq,req} = 8 \\times d_{rope} \\times K_{duty} \\times K_1',
        variables: {
          d_rope: { value: ropeDiameterMm, unit: 'mm', label: 'Rope Diameter' },
          K_duty: { value: hoistDutyFactor, unit: '', label: 'Duty Factor' },
        },
        substitutedExpression: `8 * ${ropeDiameterMm} * ${hoistDutyFactor} * ${sheaveFactor1} = ${requiredEqualizingSheaveMm.toFixed(2)} mm`,
        result: { value: requiredEqualizingSheaveMm, unit: 'mm', label: 'Required Equalizer PCD' },
        dependsOn: ['ropeDiameterMm', 'hoistDutyFactor'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'H145',
      },
    ];

    const checks: CalculationCheck[] = [
      checkCapacityAdequacy(
        'CHK-MAIN-SHEAVE-PCD',
        'Main Load Sheave Diameter Adequacy',
        selectedMainSheaveMm,
        requiredMainSheaveMm,
        'mm',
        'Main Load Sheave',
      ),
      checkCapacityAdequacy(
        'CHK-EQUALIZING-SHEAVE-PCD',
        'Equalizing Sheave Diameter Adequacy',
        selectedEqualizingSheaveMm,
        requiredEqualizingSheaveMm,
        'mm',
        'Equalizing Sheave',
      ),
    ];

    const status = checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL';

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'Clause 21.2 (Sheaves)',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'sheaves',
      toolVersion: '1.0.0',
      status,
      inputsUsed: {
        ropeDiameterMm: { value: ropeDiameterMm, unit: 'mm' },
        hoistDutyFactor: { value: hoistDutyFactor, unit: '' },
        sheaveFactor1: { value: sheaveFactor1, unit: '' },
        sheaveFactor2: { value: sheaveFactor2, unit: '' },
        selectedMainSheaveMm: { value: selectedMainSheaveMm, unit: 'mm' },
        selectedEqualizingSheaveMm: { value: selectedEqualizingSheaveMm, unit: 'mm' },
      },
      derived: {},
      outputs: {
        requiredMainSheaveMm: { value: requiredMainSheaveMm, unit: 'mm', label: 'Required Main Sheave Diameter' },
        selectedMainSheaveMm: { value: selectedMainSheaveMm, unit: 'mm', label: 'Selected Main Sheave Diameter' },
        requiredEqualizingSheaveMm: { value: requiredEqualizingSheaveMm, unit: 'mm', label: 'Required Equalizer Diameter' },
        selectedEqualizingSheaveMm: { value: selectedEqualizingSheaveMm, unit: 'mm', label: 'Selected Equalizer Diameter' },
      },
      checks,
      steps,
      assumptions: [
        'Ratio of sheave diameter to rope diameter follows IS 3177 Class II/M5 recommendation',
        'Equalizing sheave diameter factor is 8 times rope diameter times duty factor',
      ],
      warnings: [],
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'M.H.',
        cells: ['H142', 'H145'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
