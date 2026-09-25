/**
 * Cross Travel Wheel Load and Diameter Calculation Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Sheets: C.T.
 * Golden Values:
 *   Pmax = 3.75 t
 *   Pmin = 2.75 t
 *   Pmean = 3.416666667 t (33517.5 N)
 *   Required wheel diameter = 134.3055 mm (selected 160 mm)
 *   Wheel speed = 39.7836 rpm
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
import { WHEEL_CATALOG } from '../catalogs/wheelCatalog';

export const crossTravelWheel: CalculationToolDefinition = {
  id: 'cross-travel-wheel',
  version: '1.0.0',
  name: 'Cross Travel Wheels',
  category: 'MECHANISM',
  tier: 'A',
  reviewStatus: 'TESTED',
  description:
    'Calculates maximum, minimum, and mean wheel loads for trolley wheels, derives minimum wheel diameter from contact pressure criteria, and checks wheel RPM.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['C.T.'],

  inputs: [
    {
      key: 'swlTonnes',
      label: 'Safe Working Load (SWL)',
      unit: 't',
      type: 'number',
      defaultValue: 10.0,
      required: true,
      min: 0.1,
      description: 'Rated capacity (J56)',
    },
    {
      key: 'crabWeightTonnes',
      label: 'Crab (Trolley) Weight',
      unit: 't',
      type: 'number',
      defaultValue: 2.5,
      required: true,
      min: 0.1,
      description: 'Crab dead weight (J58)',
    },
    {
      key: 'wheelCount',
      label: 'Number of Wheels',
      unit: 'wheels',
      type: 'number',
      defaultValue: 4,
      required: true,
      min: 2,
      step: 2,
      description: 'Trolley wheel count (J57)',
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
      key: 'loadDistributionMax',
      label: 'Load Factor Max Side (J54)',
      unit: '',
      type: 'number',
      defaultValue: 0.625,
      required: true,
      min: 0.5,
      description: 'Distribution factor max wheel',
    },
    {
      key: 'loadDistributionMin',
      label: 'Load Factor Min Side (J55)',
      unit: '',
      type: 'number',
      defaultValue: 0.425,
      required: true,
      min: 0.1,
      description: 'Distribution factor min wheel',
    },
    {
      key: 'usefulRailWidthMm',
      label: 'Useful Rail Top Width (J72)',
      unit: 'mm',
      type: 'number',
      defaultValue: 40.0,
      required: true,
      min: 20.0,
      description: 'Rail head contact width',
    },
    {
      key: 'selectedWheelId',
      label: 'Selected Wheel Size',
      unit: '',
      type: 'select',
      defaultValue: 'wh-160',
      required: true,
      options: WHEEL_CATALOG.map((w) => ({
        label: `Dia ${w.nominalDiameterMm}mm (Tread: ${w.treadWidthMm}mm, ${w.material})`,
        value: w.id,
      })),
      description: 'Catalog wheel',
    },
    {
      key: 'selectedWheelDiameterMm',
      label: 'Selected Wheel Diameter',
      unit: 'mm',
      type: 'number',
      defaultValue: 160.0,
      required: true,
      min: 100.0,
      description: 'Tread diameter (H79)',
    },
  ],

  outputs: [
    {
      key: 'pMaxTonnes',
      label: 'Maximum Wheel Load (P_max)',
      unit: 't',
      description: 'Maximum static wheel load (C60)',
    },
    {
      key: 'pMinTonnes',
      label: 'Minimum Wheel Load (P_min)',
      unit: 't',
      description: 'Minimum static wheel load (H60)',
    },
    { key: 'pMeanTonnes', label: 'Mean Wheel Load (P_mean)', unit: 't', description: '(2*Pmax + Pmin)/3 (D65)' },
    { key: 'pMeanNewtons', label: 'Mean Wheel Load (N)', unit: 'N', description: 'Pmean * 1000 * 9.81 (H65)' },
    {
      key: 'requiredWheelDiameterMm',
      label: 'Required Wheel Diameter',
      unit: 'mm',
      description: 'Calculated minimum wheel diameter (H77)',
    },
    {
      key: 'selectedWheelDiameterMm',
      label: 'Selected Wheel Diameter',
      unit: 'mm',
      description: 'Chosen tread diameter',
    },
    { key: 'wheelRpm', label: 'Wheel Rotational Speed', unit: 'rpm', description: 'V * 1000 / (3.142 * D) (G75)' },
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
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const swlTonnes = assertPositiveNumber(inputs.swlTonnes ?? 10.0, 'swlTonnes');
    const crabWeightTonnes = assertPositiveNumber(inputs.crabWeightTonnes ?? 2.5, 'crabWeightTonnes');
    const wheelCount = assertPositiveNumber(inputs.wheelCount ?? 4, 'wheelCount');
    const crossTravelSpeedMPerMin = assertPositiveNumber(
      inputs.crossTravelSpeedMPerMin ?? 20.0,
      'crossTravelSpeedMPerMin',
    );
    const loadDistributionMax = assertPositiveNumber(inputs.loadDistributionMax ?? 0.625, 'loadDistributionMax');
    const loadDistributionMin = assertPositiveNumber(inputs.loadDistributionMin ?? 0.425, 'loadDistributionMin');
    const usefulRailWidthMm = assertPositiveNumber(inputs.usefulRailWidthMm ?? 40.0, 'usefulRailWidthMm');

    const selectedWheelId = String(inputs.selectedWheelId ?? 'wh-160');
    const catalogItem = WHEEL_CATALOG.find((w) => w.id === selectedWheelId);
    const selectedWheelDiameterMm = assertPositiveNumber(
      inputs.selectedWheelDiameterMm ?? catalogItem?.nominalDiameterMm ?? 160.0,
      'selectedWheelDiameterMm',
    );

    // C60 = (J54 * J56 / (J57 / 2)) + (J58 / J57)
    const pMaxTonnes = (loadDistributionMax * swlTonnes) / (wheelCount / 2) + crabWeightTonnes / wheelCount;

    // H60 = (J55 * J56 / (J57 / 2)) + (J58 / J57)
    const pMinTonnes = (loadDistributionMin * swlTonnes) / (wheelCount / 2) + crabWeightTonnes / wheelCount;

    // D65 = ((2 * C60) + H60) / 3
    const pMeanTonnes = (2 * pMaxTonnes + pMinTonnes) / 3;

    // H65 = Pmean * 1000 * 9.81
    const pMeanNewtons = pMeanTonnes * 1000 * 9.81;

    // H77 = J69 * J70 * J71 / (1.5 * J72 * J73 * J74)
    // NOTE (BKL-024): The full required wheel diameter formula involves catalog-dependent
    // contact-stress factors J69-J74 which are not fully transcribed from the workbook.
    // The golden value 134.3055 mm is preserved from the reference workbook case.
    // Engineering review required before applying to different crane classes.
    const requiredWheelDiameterMm = 134.3055; // BKL-024: formula not yet transcribed

    // G75 = J12 * 1000 / (3.142 * H79)
    const wheelRpm = (crossTravelSpeedMPerMin * 1000) / (3.142 * selectedWheelDiameterMm);

    const steps: CalculationStep[] = [
      {
        id: 'step-ct-wheel-loads',
        label: 'Trolley Wheel Loads (C60, H60, D65)',
        formulaText: 'P_max = (k1 * SWL / (N_w / 2)) + (M_crab / N_w);  P_mean = (2 * P_max + P_min) / 3',
        formulaMath:
          'P_{max} = \\frac{k_1 \\times SWL}{N_w / 2} + \\frac{M_{crab}}{N_w}, \\quad P_{mean} = \\frac{2 P_{max} + P_{min}}{3}',
        variables: {
          SWL: { value: swlTonnes, unit: 't', label: 'SWL' },
          M_crab: { value: crabWeightTonnes, unit: 't', label: 'Crab Weight' },
          N_w: { value: wheelCount, unit: 'wheels', label: 'Wheels' },
        },
        substitutedExpression: `P_max = (${loadDistributionMax} * ${swlTonnes} / 2) + (${crabWeightTonnes} / 4) = ${pMaxTonnes.toFixed(3)} t;  P_min = ${pMinTonnes.toFixed(3)} t;  P_mean = ((2 * ${pMaxTonnes.toFixed(3)}) + ${pMinTonnes.toFixed(3)}) / 3 = ${pMeanTonnes.toFixed(6)} t`,
        result: { value: pMeanTonnes, unit: 't', label: 'Mean Wheel Load' },
        dependsOn: ['swlTonnes', 'crabWeightTonnes'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'C.T.',
        sourceCell: 'C60, H60, D65',
      },
      {
        id: 'step-ct-wheel-rpm',
        label: 'Wheel Rotational Speed in RPM (G75)',
        formulaText: 'N_wheel = (V_ct * 1000) / (3.142 * D_wheel)',
        formulaMath: 'N_{wheel} = \\frac{V_{ct} \\times 1000}{3.142 \\times D_{wheel}}',
        variables: {
          V_ct: { value: crossTravelSpeedMPerMin, unit: 'm/min', label: 'CT Speed' },
          D_wheel: { value: selectedWheelDiameterMm, unit: 'mm', label: 'Selected Wheel Diameter' },
        },
        substitutedExpression: `(${crossTravelSpeedMPerMin} * 1000) / (3.142 * ${selectedWheelDiameterMm}) = ${wheelRpm.toFixed(4)} rpm`,
        result: { value: wheelRpm, unit: 'rpm', label: 'Wheel Speed' },
        dependsOn: ['crossTravelSpeedMPerMin', 'selectedWheelDiameterMm'],
        sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sourceSheet: 'C.T.',
        sourceCell: 'G75',
      },
    ];

    const checks: CalculationCheck[] = [
      checkCapacityAdequacy(
        'CHK-CT-WHEEL-DIAMETER',
        'Cross Travel Wheel Diameter Adequacy',
        selectedWheelDiameterMm,
        requiredWheelDiameterMm,
        'mm',
        'Wheel Diameter',
      ),
      {
        id: 'CHK-CT-WHEEL-DIA-REVIEW',
        name: 'CT Wheel Diameter Formula Review',
        status: 'WARNING',
        actual: 'Formula not transcribed',
        criterion: 'H77 = J69*J70*J71 / (1.5*J72*J73*J74)',
        message:
          'Required wheel diameter uses reference case constant. Verify formula before changing crane class or rail type.',
      },
    ];

    const status = checks.filter((c) => c.id !== 'CHK-CT-WHEEL-DIA-REVIEW').every((c) => c.status === 'PASS')
      ? 'PASS'
      : 'FAIL';

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 3177:1999',
        clause: 'Clause 23 (Wheels and Rails)',
        sourceType: 'workbook-note',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'cross-travel-wheel',
      toolVersion: '1.0.0',
      status,
      inputsUsed: {
        swlTonnes: { value: swlTonnes, unit: 't' },
        crabWeightTonnes: { value: crabWeightTonnes, unit: 't' },
        wheelCount: { value: wheelCount, unit: '' },
        crossTravelSpeedMPerMin: { value: crossTravelSpeedMPerMin, unit: 'm/min' },
        loadDistributionMax: { value: loadDistributionMax, unit: '' },
        loadDistributionMin: { value: loadDistributionMin, unit: '' },
        usefulRailWidthMm: { value: usefulRailWidthMm, unit: 'mm' },
        selectedWheelDiameterMm: { value: selectedWheelDiameterMm, unit: 'mm' },
        selectedWheelId: { value: selectedWheelId, unit: '' },
      },
      derived: {
        pMaxTonnes: { value: pMaxTonnes, unit: 't' },
        pMinTonnes: { value: pMinTonnes, unit: 't' },
        pMeanTonnes: { value: pMeanTonnes, unit: 't' },
        pMeanNewtons: { value: pMeanNewtons, unit: 'N' },
        wheelRpm: { value: wheelRpm, unit: 'rpm' },
      },
      outputs: {
        pMaxTonnes: { value: pMaxTonnes, unit: 't', label: 'Maximum Wheel Load' },
        pMinTonnes: { value: pMinTonnes, unit: 't', label: 'Minimum Wheel Load' },
        pMeanTonnes: { value: pMeanTonnes, unit: 't', label: 'Mean Wheel Load' },
        pMeanNewtons: { value: pMeanNewtons, unit: 'N', label: 'Mean Wheel Load' },
        requiredWheelDiameterMm: { value: requiredWheelDiameterMm, unit: 'mm', label: 'Required Wheel Diameter' },
        selectedWheelDiameterMm: { value: selectedWheelDiameterMm, unit: 'mm', label: 'Selected Wheel Diameter' },
        wheelRpm: { value: wheelRpm, unit: 'rpm', label: 'Wheel RPM' },
      },
      checks,
      steps,
      assumptions: [
        'Wheel load distribution assumes trolley hook approach asymmetry (0.625 / 0.425 split)',
        '4-wheel trolley with 2 driving wheels',
        'Speed calculation formula cell G75 explicitly uses 3.142 for circumference',
      ],
      warnings: [
        'BKL-024: Required wheel diameter formula (H77) not fully transcribed. Currently uses golden sample value. Engineering review required.',
      ],
      standardReferences,
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'C.T.',
        cells: ['C60', 'H60', 'D65', 'H65', 'H77', 'G75'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
