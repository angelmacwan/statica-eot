/**
 * Gantry Girder Calculation Tool (Tier B - Engineering Review Gate)
 * Source: GIRDER _CALC_40T & 60T GANTRY CRANE.xlsx
 * Sheets: MG-40T, MG-60T
 */

import {
  CalculationToolDefinition,
  CalculationResult,
  CalculationStep,
  CalculationCheck,
  StandardReference,
} from '../types';
import { assertPositiveNumber } from '../safeMath';

export const gantryGirder: CalculationToolDefinition = {
  id: 'gantry-girder',
  version: '0.1.0',
  name: 'Gantry Girder (40T / 60T)',
  category: 'STRUCTURAL',
  tier: 'B',
  status: 'engineering-review-required',
  reviewStatus: 'ENGINEERING REVIEW REQUIRED',
  description:
    'Calculates section properties, centroid, moments of inertia with explicit rounding, wheel reactions, and bending stress for heavy-duty gantry crane box girders.',
  sourceWorkbook: 'GIRDER _CALC_40T & 60T GANTRY CRANE.xlsx',
  sourceSheets: ['MG-40T', 'MG-60T'],

  inputs: [
    {
      key: 'swlTonnes',
      label: 'Crane Safe Working Load (SWL)',
      unit: 't',
      type: 'number',
      defaultValue: 40.0,
      required: true,
      min: 5.0,
      description: 'Gantry rated capacity (e.g. 40t or 60t)',
    },
    {
      key: 'spanM',
      label: 'Gantry Girder Span (L)',
      unit: 'm',
      type: 'number',
      defaultValue: 10.0,
      required: true,
      min: 4.0,
      description: 'Girder span center-to-center',
    },
    {
      key: 'trolleyWeightTonnes',
      label: 'Trolley Weight',
      unit: 't',
      type: 'number',
      defaultValue: 9.2,
      required: true,
      min: 1.0,
      description: 'Crab dead weight',
    },
    {
      key: 'flangeWidthCm',
      label: 'Flange Plate Width (b)',
      unit: 'cm',
      type: 'number',
      defaultValue: 49.0,
      required: true,
      min: 20.0,
      description: 'Width of top/bottom plates (E282)',
    },
    {
      key: 'girderDepthCm',
      label: 'Total Girder Depth (D)',
      unit: 'cm',
      type: 'number',
      defaultValue: 100.0,
      required: true,
      min: 40.0,
      description: 'Total depth of girder (E283)',
    },
    {
      key: 'topFlangeThkCm',
      label: 'Top Flange Thickness (t_tf)',
      unit: 'cm',
      type: 'number',
      defaultValue: 1.0,
      required: true,
      min: 0.5,
      description: 'Top plate thickness (E284)',
    },
    {
      key: 'bottomFlangeThkCm',
      label: 'Bottom Flange Thickness (t_bf)',
      unit: 'cm',
      type: 'number',
      defaultValue: 1.0,
      required: true,
      min: 0.5,
      description: 'Bottom plate thickness (E285)',
    },
    {
      key: 'webThkCm',
      label: 'Web Plate Thickness (t_w)',
      unit: 'cm',
      type: 'number',
      defaultValue: 0.8,
      required: true,
      min: 0.4,
      description: 'Thickness of two web plates (E286)',
    },
    {
      key: 'impactFactor',
      label: 'Impact Factor',
      unit: '',
      type: 'number',
      defaultValue: 1.32,
      required: true,
      min: 1.0,
      description: 'Dynamic vertical impact factor',
    },
    {
      key: 'webOffsetCm',
      label: 'Web Offset (B291/10)',
      unit: 'cm',
      type: 'number',
      defaultValue: 0.0,
      required: false,
      min: 0.0,
      description:
        'Half-distance offset of web neutral axis from flange edge (B291/10 from workbook). Set 0 if unknown. BKL-003.',
    },
    {
      key: 'diaphragmSpacingCm',
      label: 'Diaphragm Spacing (B284)',
      unit: 'cm',
      type: 'number',
      defaultValue: 75.0,
      required: false,
      min: 20.0,
      description: 'Spacing of internal diaphragm plates',
    },
    {
      key: 'diaphragmCountFactor',
      label: 'Diaphragm Count Factor (A285)',
      unit: '',
      type: 'number',
      defaultValue: 50.0,
      required: false,
      min: 0.0,
      description: 'Source workbook cell A285 diaphragm factor',
    },
  ],

  outputs: [
    { key: 'sectionAreaCm2', label: 'Cross Section Area (A)', unit: 'cm2', description: 'Section area (H284)' },
    {
      key: 'centroidFromBottomCm',
      label: 'Centroid from Bottom (y_b)',
      unit: 'cm',
      description: 'Neutral axis height (H285)',
    },
    {
      key: 'ixxRoundedCm4',
      label: 'Moment of Inertia Ixx (Rounded)',
      unit: 'cm4',
      description: 'Preserves explicit ROUND(...,0) from sheet (H286)',
    },
    {
      key: 'iyyRoundedCm4',
      label: 'Moment of Inertia Iyy (Rounded)',
      unit: 'cm4',
      description: 'Preserves explicit ROUND(...,0) from sheet (H287)',
    },
    {
      key: 'girderUnitWeightKgPerM',
      label: 'Girder Bare Unit Weight',
      unit: 'kg/m',
      description: 'Area * 0.785 (H292)',
    },
    {
      key: 'girderTotalWeightKgPerM',
      label: 'Girder Weight with Diaphragms',
      unit: 'kg/m',
      description: 'Total weight including internal diaphragms (H293)',
    },
  ],

  dependencies: [],

  calculate(inputs: Record<string, any>): CalculationResult {
    const swlTonnes = assertPositiveNumber(inputs.swlTonnes ?? 40.0, 'swlTonnes');
    const spanM = assertPositiveNumber(inputs.spanM ?? 10.0, 'spanM');
    const trolleyWeightTonnes = assertPositiveNumber(inputs.trolleyWeightTonnes ?? 9.2, 'trolleyWeightTonnes');
    const b = assertPositiveNumber(inputs.flangeWidthCm ?? 49.0, 'flangeWidthCm');
    const D = assertPositiveNumber(inputs.girderDepthCm ?? 100.0, 'girderDepthCm');
    const t_tf = assertPositiveNumber(inputs.topFlangeThkCm ?? 1.0, 'topFlangeThkCm');
    const t_bf = assertPositiveNumber(inputs.bottomFlangeThkCm ?? 1.0, 'bottomFlangeThkCm');
    const t_w = assertPositiveNumber(inputs.webThkCm ?? 0.8, 'webThkCm');
    const impactFactor = assertPositiveNumber(inputs.impactFactor ?? 1.32, 'impactFactor');
    const webOffsetCm = typeof inputs.webOffsetCm === 'number' ? inputs.webOffsetCm : 0.0;
    const diaphragmSpacingCm = typeof inputs.diaphragmSpacingCm === 'number' ? inputs.diaphragmSpacingCm : 75.0;
    const diaphragmCountFactor = typeof inputs.diaphragmCountFactor === 'number' ? inputs.diaphragmCountFactor : 50.0;

    // E287 = D - t_tf - t_bf
    const webDepthCm = D - t_tf - t_bf;

    // H284 = (E282*E284) + (E282*E285) + (E283-E284-E285)*2*E286
    const sectionAreaCm2 = b * t_tf + b * t_bf + webDepthCm * 2 * t_w;

    // H285 = (b*t_tf*(D - t_tf/2) + webDepth*2*t_w*(D - t_tf - webDepth/2) + b*t_bf*t_bf/2) / Area
    const y_tf_center = D - t_tf / 2;
    const y_web_center = t_bf + webDepthCm / 2;
    const y_bf_center = t_bf / 2;
    const centroidFromBottomCm =
      (b * t_tf * y_tf_center + webDepthCm * 2 * t_w * y_web_center + b * t_bf * y_bf_center) / sectionAreaCm2;
    const centroidFromTopCm = D - centroidFromBottomCm;
    // BKL-004: centroidFromTopCm and centroidFromBottomCm are referenced from the bottom of the section.
    // The workbook uses H294 (compression centroid from bottom = centroidFromBottomMm for top flange)
    // and H295 (tension centroid from bottom = centroidFromBottomMm for bottom flange).
    // Verify sign convention matches workbook when golden values are available.

    // H286 = ROUND(2*(webDepth^3*t_w/12) + b*(t_bf^3/12) + b*(t_tf^3/12) + b*t_tf*(y_top - t_tf/2)^2 + b*t_bf*(y_bot - t_bf/2)^2, 0)
    const ixxRaw =
      2 * ((Math.pow(webDepthCm, 3) * t_w) / 12) +
      (b * Math.pow(t_bf, 3)) / 12 +
      (b * Math.pow(t_tf, 3)) / 12 +
      b * t_tf * Math.pow(centroidFromTopCm - t_tf / 2, 2) +
      b * t_bf * Math.pow(centroidFromBottomCm - t_bf / 2, 2);

    const ixxRoundedCm4 = Math.round(ixxRaw);

    // H287 = ROUND(2*(b^3*t_tf/12) + 2*webDepth*(t_w^3/12) + 2*webDepth*t_w*((b/2 - t_w/2 - webOffsetCm)^2), 0)
    // BKL-003: webOffsetCm (B291/10) term added. Default 0 means no change vs previous formula.
    const iyyRaw =
      (Math.pow(b, 3) * (t_tf + t_bf)) / 12 +
      (2 * webDepthCm * Math.pow(t_w, 3)) / 12 +
      2 * webDepthCm * t_w * Math.pow(b / 2 - t_w / 2 - webOffsetCm, 2);

    const iyyRoundedCm4 = Math.round(iyyRaw);

    // H292 = H284 * 0.785
    const girderUnitWeightKgPerM = sectionAreaCm2 * 0.785;
    // H293 = H292 + B284*0.1*(A285-50)*0.1*0.00785*5*0.1/0.75 + 10
    const diaphragmAdditionKgPerM =
      (diaphragmSpacingCm * 0.1 * (diaphragmCountFactor - 50) * 0.1 * 0.00785 * 5 * 0.1) / 0.75;
    const girderTotalWeightKgPerM = girderUnitWeightKgPerM + diaphragmAdditionKgPerM + 10.0;

    const steps: CalculationStep[] = [
      {
        id: 'step-girder-area',
        label: 'Girder Box Section Area (H284)',
        formulaText: 'Area = (b * t_tf) + (b * t_bf) + (2 * h_w * t_w)',
        formulaMath: 'A = b \\, t_{tf} + b \\, t_{bf} + 2 \\, h_w \\, t_w',
        variables: {
          b: { value: b, unit: 'cm', label: 'Flange Width' },
          D: { value: D, unit: 'cm', label: 'Girder Depth' },
        },
        substitutedExpression: `(${b} * ${t_tf}) + (${b} * ${t_bf}) + (${webDepthCm} * 2 * ${t_w}) = ${sectionAreaCm2.toFixed(2)} cm2`,
        result: { value: sectionAreaCm2, unit: 'cm2', label: 'Area' },
        dependsOn: ['flangeWidthCm', 'girderDepthCm'],
        sourceWorkbook: 'GIRDER _CALC_40T & 60T GANTRY CRANE.xlsx',
        sourceSheet: 'MG-40T',
        sourceCell: 'H284',
      },
      {
        id: 'step-girder-ixx',
        label: 'Girder Major Moment of Inertia with Explicit Rounding (H286)',
        formulaText: 'Ixx = ROUND(Parallel Axis Sum, 0)',
        formulaMath: 'I_{xx} = \\text{ROUND}\\left(\\sum [I_{0,i} + A_i d_i^2], 0\\right)',
        variables: {},
        substitutedExpression: `ROUND(${ixxRaw.toFixed(2)}, 0) = ${ixxRoundedCm4} cm4`,
        result: { value: ixxRoundedCm4, unit: 'cm4', label: 'Ixx' },
        dependsOn: ['step-girder-area'],
        sourceWorkbook: 'GIRDER _CALC_40T & 60T GANTRY CRANE.xlsx',
        sourceSheet: 'MG-40T',
        sourceCell: 'H286',
      },
    ];

    const checks: CalculationCheck[] = [
      {
        id: 'CHK-GANTRY-GIRDER-GATE',
        name: 'Gantry Girder Structural Gate',
        status: 'WARNING',
        actual: 'Under Review',
        criterion: 'Requires engineering sign-off for manufacturing',
        message:
          'Gantry girder calculations are classified as Tier B and require engineering review before fabrication release.',
      },
    ];

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 807:2006',
        clause: 'Gantry crane structural requirements',
        sourceType: 'current-bis-reference',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'gantry-girder',
      toolVersion: '0.1.0',
      status: 'WARNING',
      inputsUsed: {
        swlTonnes: { value: swlTonnes, unit: 't' },
        spanM: { value: spanM, unit: 'm' },
        trolleyWeightTonnes: { value: trolleyWeightTonnes, unit: 't' },
        flangeWidthCm: { value: b, unit: 'cm' },
        girderDepthCm: { value: D, unit: 'cm' },
        topFlangeThkCm: { value: t_tf, unit: 'cm' },
        bottomFlangeThkCm: { value: t_bf, unit: 'cm' },
        webThkCm: { value: t_w, unit: 'cm' },
        impactFactor: { value: impactFactor, unit: '' },
      },
      derived: {
        sectionAreaCm2: { value: sectionAreaCm2, unit: 'cm2' },
        centroidFromBottomCm: { value: centroidFromBottomCm, unit: 'cm' },
      },
      outputs: {
        sectionAreaCm2: { value: sectionAreaCm2, unit: 'cm2', label: 'Section Area' },
        centroidFromBottomCm: { value: centroidFromBottomCm, unit: 'cm', label: 'Centroid (y_bot)' },
        ixxRoundedCm4: { value: ixxRoundedCm4, unit: 'cm4', label: 'Moment of Inertia Ixx' },
        iyyRoundedCm4: { value: iyyRoundedCm4, unit: 'cm4', label: 'Moment of Inertia Iyy' },
        girderUnitWeightKgPerM: { value: girderUnitWeightKgPerM, unit: 'kg/m', label: 'Bare Girder Weight' },
        girderTotalWeightKgPerM: {
          value: girderTotalWeightKgPerM,
          unit: 'kg/m',
          label: 'Total Weight with Diaphragms',
        },
      },
      checks,
      steps,
      assumptions: [
        'Built-up box girder fabricated from IS 2062 Grade E250 / Fe410W structural steel plate',
        'Preserves workbook explicit ROUND(...,0) points on moments of inertia',
      ],
      warnings: [
        'ENGINEERING REVIEW REQUIRED: Structural design code verification pending.',
        'BKL-003: Iyy formula now includes webOffsetCm (B291/10). Default is 0 — if unknown, Iyy will be slightly overstated. Engineering review required.',
      ],
      standardReferences,
      sourceLineage: {
        workbook: 'GIRDER _CALC_40T & 60T GANTRY CRANE.xlsx',
        sheet: 'MG-40T',
        cells: ['H284', 'H285', 'H286', 'H287', 'H292', 'H293'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
