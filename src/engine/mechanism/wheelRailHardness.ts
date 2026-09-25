/**
 * Wheel and Rail Hardness Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: HARDNESS-BHw,BHr
 * Golden Values:
 *   Calculated Wheel Hardness = 284.913 BHN
 *   Recommended Range = 300 to 350 BHN
 *   Status = WARNING (Engineering Review Required discrepancy explicitly surfaced)
 */

import {
  CalculationToolDefinition,
  CalculationResult,
  CalculationStep,
  CalculationCheck,
  StandardReference,
} from '../types';
import { assertPositiveNumber } from '../safeMath';

export const wheelRailHardness: CalculationToolDefinition = {
  id: 'wheel-rail-hardness',
  version: '1.0.0',
  name: 'Wheel / Rail Hardness Check',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'ENGINEERING REVIEW REQUIRED',
  description: 'Calculates the required wheel tread Brinell hardness (BHN) relative to runway rail hardness, surfacing the legacy calculation discrepancy for review.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['HARDNESS-BHw,BHr'],

  inputs: [
    { key: 'railHardnessBhn', label: 'Rail Hardness (BH_r / J10)', unit: 'BHN', type: 'number', defaultValue: 200.0, required: true, min: 100.0, description: 'Brinell hardness of rail material' },
    { key: 'loadDistributionFactor', label: 'Load Factor (J11)', unit: '', type: 'number', defaultValue: 1.29, required: true, min: 0.5, description: 'Distribution factor from workbook' },
    { key: 'wheelGeometryFactor', label: 'Geometry Factor (J13)', unit: '', type: 'number', defaultValue: 1.08, required: true, min: 0.5, description: 'Wheel profile factor' },
    { key: 'coefficientFactor', label: 'Hardness Factor (J15)', unit: '', type: 'number', defaultValue: 1.09, required: true, min: 0.5, description: 'Material property coefficient' },
    { key: 'minRecommendedHardnessBhn', label: 'Minimum Specified Hardness', unit: 'BHN', type: 'number', defaultValue: 300.0, required: true, min: 150.0, description: 'Specified minimum hardness range threshold' },
  ],

  outputs: [
    { key: 'calculatedWheelHardnessBhn', label: 'Calculated Wheel Hardness', unit: 'BHN', description: 'Theoretical calculated hardness (BH_w)' },
    { key: 'minRecommendedHardnessBhn', label: 'Minimum Recommended Hardness', unit: 'BHN', description: 'Recommended lower limit from workbook notes' },
  ],

  dependencies: [],

  calculate(inputs: Record<string, any>): CalculationResult {
    const railHardnessBhn = assertPositiveNumber(inputs.railHardnessBhn ?? 200.0, 'railHardnessBhn');
    const loadDistributionFactor = assertPositiveNumber(inputs.loadDistributionFactor ?? 1.29, 'loadDistributionFactor');
    const wheelGeometryFactor = assertPositiveNumber(inputs.wheelGeometryFactor ?? 1.08, 'wheelGeometryFactor');
    const coefficientFactor = assertPositiveNumber(inputs.coefficientFactor ?? 1.09, 'coefficientFactor');
    const minRecommendedHardnessBhn = assertPositiveNumber(inputs.minRecommendedHardnessBhn ?? 300.0, 'minRecommendedHardnessBhn');

    // BH_w = (1.3 * J10 * J11) / (J13 * J15)
    const numerator = 1.3 * railHardnessBhn * loadDistributionFactor;
    const denominator = wheelGeometryFactor * coefficientFactor;
    const calculatedWheelHardnessBhn = numerator / denominator;

    const steps: CalculationStep[] = [
      {
        id: 'step-wheel-hardness',
        label: 'Wheel Hardness Formula (BH_w)',
        formulaText: 'BH_w = (1.3 * BH_r * K_load) / (K_geom * K_coef)',
        formulaMath: 'BH_w = \\frac{1.3 \\times BH_r \\times K_{load}}{K_{geom} \\times K_{coef}}',
        variables: {
          BH_r: { value: railHardnessBhn, unit: 'BHN', label: 'Rail Hardness' },
          K_load: { value: loadDistributionFactor, unit: '', label: 'Load Factor' },
          K_geom: { value: wheelGeometryFactor, unit: '', label: 'Geometry Factor' },
          K_coef: { value: coefficientFactor, unit: '', label: 'Hardness Factor' },
        },
        substitutedExpression: `(1.3 * ${railHardnessBhn} * ${loadDistributionFactor}) / (${wheelGeometryFactor} * ${coefficientFactor}) = ${calculatedWheelHardnessBhn.toFixed(3)} BHN`,
        result: { value: calculatedWheelHardnessBhn, unit: 'BHN', label: 'Calculated Hardness' },
        dependsOn: ['railHardnessBhn', 'loadDistributionFactor', 'wheelGeometryFactor', 'coefficientFactor'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'HARDNESS-BHw,BHr',
        sourceCell: 'Formula BH_w',
      },
    ];

    // Engineering review discrepancy check
    const meetsRecommendation = calculatedWheelHardnessBhn >= minRecommendedHardnessBhn;
    const checks: CalculationCheck[] = [
      {
        id: 'CHK-HARDNESS-RECOMMENDATION',
        name: 'Wheel Tread Hardness Recommendation',
        status: meetsRecommendation ? 'PASS' : 'WARNING',
        actual: calculatedWheelHardnessBhn,
        required: `>= ${minRecommendedHardnessBhn} BHN`,
        criterion: `calculated >= ${minRecommendedHardnessBhn}`,
        unit: 'BHN',
        message: meetsRecommendation
          ? `Calculated hardness ${calculatedWheelHardnessBhn.toFixed(1)} BHN satisfies the recommended minimum of ${minRecommendedHardnessBhn} BHN.`
          : `Calculated hardness (${calculatedWheelHardnessBhn.toFixed(2)} BHN) is below the recommended minimum range (300-350 BHN) stated in the source workbook text notes. Engineering review required.`,
      },
    ];

    const warnings: string[] = [];
    if (!meetsRecommendation) {
      warnings.push(
        `Engineering Review Required: Formula produces ${calculatedWheelHardnessBhn.toFixed(2)} BHN, but source notes recommend 300–350 BHN for rim-quenched forged wheels to prevent premature pitting and wear on 200 BHN rails.`,
      );
    }

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'Clause 23.3 (Wheel Tread Hardness)',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'wheel-rail-hardness',
      toolVersion: '1.0.0',
      status: meetsRecommendation ? 'PASS' : 'WARNING',
      inputsUsed: {
        railHardnessBhn: { value: railHardnessBhn, unit: 'BHN' },
        loadDistributionFactor: { value: loadDistributionFactor, unit: '' },
        wheelGeometryFactor: { value: wheelGeometryFactor, unit: '' },
        coefficientFactor: { value: coefficientFactor, unit: '' },
        minRecommendedHardnessBhn: { value: minRecommendedHardnessBhn, unit: 'BHN' },
      },
      derived: {},
      outputs: {
        calculatedWheelHardnessBhn: { value: calculatedWheelHardnessBhn, unit: 'BHN', label: 'Calculated Wheel Hardness' },
        minRecommendedHardnessBhn: { value: minRecommendedHardnessBhn, unit: 'BHN', label: 'Recommended Minimum Hardness' },
      },
      checks,
      steps,
      assumptions: [
        'Formula preserves the exact legacy spreadsheet arithmetic: 1.3 * 200 * 1.29 / (1.08 * 1.09) = 284.913 BHN',
        'Discrepancy with the 300-350 BHN note is surfaced without forcing an artificial pass',
      ],
      warnings,
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'HARDNESS-BHw,BHr',
        cells: ['J10', 'J11', 'J13', 'J15'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
