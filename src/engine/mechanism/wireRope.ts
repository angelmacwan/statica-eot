/**
 * Wire Rope Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: M.H., WIRE ROPE
 * Golden Value: Required breaking load ≈ 13.51875 t (132.6189375 kN)
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
import { ROPE_CATALOG } from '../catalogs/ropeCatalog';

export const wireRope: CalculationToolDefinition = {
  id: 'wire-rope',
  version: '1.0.0',
  name: 'Wire Rope',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description:
    'Calculates the required wire rope breaking strength based on lifted mass, reeving falls, and coefficient of utilization.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['M.H.', 'WIRE ROPE'],

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
      description: 'Bottom block mass',
    },
    {
      key: 'coefficientOfUtilization',
      label: 'Factor of Safety / Utilization (C25)',
      unit: '',
      type: 'number',
      defaultValue: 5.25,
      required: true,
      min: 3.0,
      description: 'IS 3177 rope utilization factor',
    },
    {
      key: 'reevingDutyFactor',
      label: 'Rope Duty Factor (J53)',
      unit: '',
      type: 'number',
      defaultValue: 1.0,
      required: true,
      min: 0.5,
      description: 'Rope condition factor',
    },
    {
      key: 'numberOfFalls',
      label: 'Number of Falls (C18)',
      unit: 'falls',
      type: 'number',
      defaultValue: 4,
      required: true,
      min: 1,
      step: 1,
      description: 'Rope falls carrying load',
    },
    {
      key: 'selectedRopeId',
      label: 'Selected Wire Rope',
      unit: '',
      type: 'select',
      defaultValue: 'rope-16-6x36-1770',
      required: true,
      options: ROPE_CATALOG.map((r) => ({
        label: `Dia ${r.diameterMm}mm (${r.construction}, Grade ${r.tensileGradeNmm2}, Break: ${r.breakingForceKn} kN)`,
        value: r.id,
      })),
      description: 'Catalog rope',
    },
    {
      key: 'selectedBreakingForceKn',
      label: 'Selected Breaking Force',
      unit: 'kN',
      type: 'number',
      defaultValue: 149.0,
      required: true,
      min: 1.0,
      description: 'Catalog breaking strength in kN',
    },
    {
      key: 'selectedRopeDiameterMm',
      label: 'Selected Rope Diameter',
      unit: 'mm',
      type: 'number',
      defaultValue: 16.0,
      required: true,
      min: 6.0,
      description: 'Nominal diameter in mm',
    },
  ],

  outputs: [
    { key: 'totalLiftedMassTonnes', label: 'Total Lifted Mass (J51)', unit: 't', description: 'SWL + Hook block mass' },
    {
      key: 'requiredBreakingLoadTonnes',
      label: 'Required Breaking Load (t)',
      unit: 't',
      description: 'Minimum breaking load in tonnes (H56)',
    },
    {
      key: 'requiredBreakingForceKn',
      label: 'Required Breaking Force (kN)',
      unit: 'kN',
      description: 'Minimum breaking load in kN (H57)',
    },
    {
      key: 'selectedBreakingForceKn',
      label: 'Selected Breaking Force (kN)',
      unit: 'kN',
      description: 'Rated strength of selected rope',
    },
    {
      key: 'selectedRopeDiameterMm',
      label: 'Selected Rope Diameter',
      unit: 'mm',
      description: 'Nominal rope diameter',
    },
  ],

  dependencies: [
    { sourceToolId: 'master', sourceKey: 'swlTonnes', targetKey: 'swlTonnes', label: 'SWL' },
    {
      sourceToolId: 'master',
      sourceKey: 'hookBlockWeightTonnes',
      targetKey: 'hookBlockWeightTonnes',
      label: 'Hook Block Weight',
    },
    {
      sourceToolId: 'master',
      sourceKey: 'coefficientOfUtilization',
      targetKey: 'coefficientOfUtilization',
      label: 'Utilization Factor',
    },
    { sourceToolId: 'master', sourceKey: 'numberOfFalls', targetKey: 'numberOfFalls', label: 'Number of Falls' },
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const swlTonnes = assertPositiveNumber(inputs.swlTonnes ?? 10.0, 'swlTonnes');
    const hookBlockWeightTonnes = assertPositiveNumber(inputs.hookBlockWeightTonnes ?? 0.3, 'hookBlockWeightTonnes');
    const coefficientOfUtilization = assertPositiveNumber(
      inputs.coefficientOfUtilization ?? 5.25,
      'coefficientOfUtilization',
    );
    const reevingDutyFactor = assertPositiveNumber(inputs.reevingDutyFactor ?? 1.0, 'reevingDutyFactor');
    const numberOfFalls = assertPositiveNumber(inputs.numberOfFalls ?? 4, 'numberOfFalls');

    const selectedRopeId = String(inputs.selectedRopeId ?? 'rope-16-6x36-1770');
    const catalogItem = ROPE_CATALOG.find((r) => r.id === selectedRopeId);
    const selectedBreakingForceKn = assertPositiveNumber(
      inputs.selectedBreakingForceKn ?? catalogItem?.breakingForceKn ?? 149.0,
      'selectedBreakingForceKn',
    );
    const selectedRopeDiameterMm = assertPositiveNumber(
      inputs.selectedRopeDiameterMm ?? catalogItem?.diameterMm ?? 16.0,
      'selectedRopeDiameterMm',
    );

    // J51 = J9 (total mass)
    const totalLiftedMassTonnes = swlTonnes + hookBlockWeightTonnes;

    // H56 = J51 * J52 * J53 / J54
    const requiredBreakingLoadTonnes =
      (totalLiftedMassTonnes * coefficientOfUtilization * reevingDutyFactor) / numberOfFalls;

    // H57 = H56 * 9.81
    const requiredBreakingForceKn = requiredBreakingLoadTonnes * 9.81;

    const steps: CalculationStep[] = [
      {
        id: 'step-rope-breaking-tonnes',
        label: 'Minimum Rope Breaking Force in Tonnes (H56)',
        formulaText: 'F_break(t) = (M_lift * Z_p * K_duty) / Falls',
        formulaMath: 'F_{break}(t) = \\frac{M_{lift} \\times Z_p \\times K_{duty}}{Falls}',
        variables: {
          M_lift: { value: totalLiftedMassTonnes, unit: 't', label: 'Total Lifted Mass' },
          Z_p: { value: coefficientOfUtilization, unit: '', label: 'Coefficient of Utilization' },
          K_duty: { value: reevingDutyFactor, unit: '', label: 'Rope Factor' },
          Falls: { value: numberOfFalls, unit: 'falls', label: 'Number of Falls' },
        },
        substitutedExpression: `(${totalLiftedMassTonnes} * ${coefficientOfUtilization} * ${reevingDutyFactor}) / ${numberOfFalls} = ${requiredBreakingLoadTonnes.toFixed(5)} t`,
        result: { value: requiredBreakingLoadTonnes, unit: 't', label: 'Breaking Load (t)' },
        dependsOn: ['swlTonnes', 'hookBlockWeightTonnes', 'coefficientOfUtilization', 'numberOfFalls'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'H56',
      },
      {
        id: 'step-rope-breaking-kn',
        label: 'Minimum Rope Breaking Force in kN (H57)',
        formulaText: 'F_break(kN) = F_break(t) * 9.81',
        formulaMath: 'F_{break}(kN) = F_{break}(t) \\times 9.81',
        variables: {
          F_t: { value: requiredBreakingLoadTonnes, unit: 't', label: 'Breaking Load (t)' },
        },
        substitutedExpression: `${requiredBreakingLoadTonnes.toFixed(5)} * 9.81 = ${requiredBreakingForceKn.toFixed(4)} kN`,
        result: { value: requiredBreakingForceKn, unit: 'kN', label: 'Breaking Force (kN)' },
        dependsOn: ['step-rope-breaking-tonnes'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'M.H.',
        sourceCell: 'H57',
      },
    ];

    const checks: CalculationCheck[] = [
      checkCapacityAdequacy(
        'CHK-ROPE-BREAKING-STRENGTH',
        'Wire Rope Breaking Strength Adequacy',
        selectedBreakingForceKn,
        requiredBreakingForceKn,
        'kN',
        'Wire Rope',
      ),
    ];

    const status = checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL';

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'Clause 20 (Ropes and Reeving)',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
      {
        standard: 'IS 2266',
        clause: 'Steel wire ropes for cranes',
        sourceType: 'current-bis-reference',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'wire-rope',
      toolVersion: '1.0.0',
      status,
      inputsUsed: {
        swlTonnes: { value: swlTonnes, unit: 't' },
        hookBlockWeightTonnes: { value: hookBlockWeightTonnes, unit: 't' },
        coefficientOfUtilization: { value: coefficientOfUtilization, unit: '' },
        reevingDutyFactor: { value: reevingDutyFactor, unit: '' },
        numberOfFalls: { value: numberOfFalls, unit: '' },
        selectedBreakingForceKn: { value: selectedBreakingForceKn, unit: 'kN' },
        selectedRopeDiameterMm: { value: selectedRopeDiameterMm, unit: 'mm' },
        selectedRopeId: { value: selectedRopeId, unit: '' },
      },
      derived: {
        totalLiftedMassTonnes: { value: totalLiftedMassTonnes, unit: 't' },
      },
      outputs: {
        totalLiftedMassTonnes: { value: totalLiftedMassTonnes, unit: 't', label: 'Total Lifted Mass' },
        requiredBreakingLoadTonnes: { value: requiredBreakingLoadTonnes, unit: 't', label: 'Required Breaking Load' },
        requiredBreakingForceKn: { value: requiredBreakingForceKn, unit: 'kN', label: 'Required Breaking Force' },
        selectedBreakingForceKn: { value: selectedBreakingForceKn, unit: 'kN', label: 'Selected Breaking Force' },
        selectedRopeDiameterMm: { value: selectedRopeDiameterMm, unit: 'mm', label: 'Selected Rope Diameter' },
      },
      checks,
      steps,
      assumptions: [
        'Coefficient of utilization 5.25 for M5 / Class II duty per IS 3177 Table 6',
        'Standard gravitational acceleration g = 9.81 m/s^2 used for kN conversion per sheet cell H57',
      ],
      warnings: [],
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'M.H.',
        cells: ['J51', 'J52', 'J53', 'J54', 'H56', 'H57'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
