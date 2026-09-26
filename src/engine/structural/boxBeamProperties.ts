/**
 * Box Beam Properties Calculation Tool (Tier B - Engineering Review Gate)
 * Source: MAC-Box Beam-Properties.xlsx
 * Sheets: PROPERTIES
 */

import {
  CalculationToolDefinition,
  CalculationResult,
  CalculationStep,
  CalculationCheck,
  StandardReference,
} from '../types';
import { assertPositiveNumber } from '../safeMath';

export const boxBeamProperties: CalculationToolDefinition = {
  id: 'box-beam-properties',
  version: '0.1.0',
  name: 'Box Beam Properties',
  category: 'STRUCTURAL',
  tier: 'B',
  status: 'engineering-review-required',
  reviewStatus: 'ENGINEERING REVIEW REQUIRED',
  description:
    'Calculates cross-sectional area, neutral axis, section modulus (Zxx, Zyy), moments of inertia (Ixx, Iyy), and unit weight for welded crane box girders.',
  sourceWorkbook: 'MAC-Box Beam-Properties.xlsx',
  sourceSheets: ['PROPERTIES'],

  inputs: [
    {
      key: 'topFlangeWidthMm',
      label: 'Top Flange Width (b_tf)',
      unit: 'mm',
      type: 'number',
      defaultValue: 500.0,
      required: true,
      min: 100.0,
      description: 'Width of top compression plate',
    },
    {
      key: 'topFlangeThicknessMm',
      label: 'Top Flange Thickness (t_tf)',
      unit: 'mm',
      type: 'number',
      defaultValue: 12.0,
      required: true,
      min: 4.0,
      description: 'Thickness of top plate',
    },
    {
      key: 'webDepthMm',
      label: 'Web Depth (h_w)',
      unit: 'mm',
      type: 'number',
      defaultValue: 1200.0,
      required: true,
      min: 200.0,
      description: 'Clear distance between flanges',
    },
    {
      key: 'webThicknessMm',
      label: 'Web Plate Thickness (t_w)',
      unit: 'mm',
      type: 'number',
      defaultValue: 8.0,
      required: true,
      min: 4.0,
      description: 'Thickness of each web plate',
    },
    {
      key: 'webSpacingMm',
      label: 'Distance Between Webs',
      unit: 'mm',
      type: 'number',
      defaultValue: 350.0,
      required: true,
      min: 100.0,
      description: 'Clear distance between inner web faces',
    },
    {
      key: 'bottomFlangeWidthMm',
      label: 'Bottom Flange Width (b_bf)',
      unit: 'mm',
      type: 'number',
      defaultValue: 500.0,
      required: true,
      min: 100.0,
      description: 'Width of bottom tension plate',
    },
    {
      key: 'bottomFlangeThicknessMm',
      label: 'Bottom Flange Thickness (t_bf)',
      unit: 'mm',
      type: 'number',
      defaultValue: 12.0,
      required: true,
      min: 4.0,
      description: 'Thickness of bottom plate',
    },
    {
      key: 'steelDensityKgPerM3',
      label: 'Steel Density',
      unit: 'kg/m3',
      type: 'number',
      defaultValue: 7850.0,
      required: true,
      min: 7000.0,
      description: 'Material density',
    },
  ],

  outputs: [
    { key: 'totalAreaMm2', label: 'Total Cross-Sectional Area', unit: 'mm2', description: 'Composite section area' },
    {
      key: 'neutralAxisFromBottomMm',
      label: 'Neutral Axis from Bottom (y_b)',
      unit: 'mm',
      description: 'Tension flange centroid distance',
    },
    { key: 'ixxMm4', label: 'Moment of Inertia Ixx', unit: 'mm4', description: 'Major axis moment of inertia' },
    { key: 'iyyMm4', label: 'Moment of Inertia Iyy', unit: 'mm4', description: 'Minor axis moment of inertia' },
    { key: 'zxxTopMm3', label: 'Section Modulus Top (Zxx,top)', unit: 'mm3', description: 'Ixx / y_top' },
    { key: 'zxxBottomMm3', label: 'Section Modulus Bottom (Zxx,bot)', unit: 'mm3', description: 'Ixx / y_bot' },
    {
      key: 'weightKgPerM',
      label: 'Girder Unit Weight',
      unit: 'kg/m',
      description: 'Calculated self-weight per linear meter',
    },
  ],

  dependencies: [],

  calculate(inputs: Record<string, any>): CalculationResult {
    const b_tf = assertPositiveNumber(inputs.topFlangeWidthMm ?? 500.0, 'topFlangeWidthMm');
    const t_tf = assertPositiveNumber(inputs.topFlangeThicknessMm ?? 12.0, 'topFlangeThicknessMm');
    const h_w = assertPositiveNumber(inputs.webDepthMm ?? 1200.0, 'webDepthMm');
    const t_w = assertPositiveNumber(inputs.webThicknessMm ?? 8.0, 'webThicknessMm');
    const b_bf = assertPositiveNumber(inputs.bottomFlangeWidthMm ?? 500.0, 'bottomFlangeWidthMm');
    const t_bf = assertPositiveNumber(inputs.bottomFlangeThicknessMm ?? 12.0, 'bottomFlangeThicknessMm');
    const density = assertPositiveNumber(inputs.steelDensityKgPerM3 ?? 7850.0, 'steelDensityKgPerM3');

    // Areas
    const a_tf = b_tf * t_tf;
    const a_bf = b_bf * t_bf;
    const a_webs = 2 * h_w * t_w;
    const totalAreaMm2 = a_tf + a_bf + a_webs;

    // Centroid from bottom
    const y_bf = t_bf / 2;
    const y_webs = t_bf + h_w / 2;
    const y_tf = t_bf + h_w + t_tf / 2;
    const neutralAxisFromBottomMm = (a_bf * y_bf + a_webs * y_webs + a_tf * y_tf) / totalAreaMm2;

    const totalHeightMm = t_bf + h_w + t_tf;
    const neutralAxisFromTopMm = totalHeightMm - neutralAxisFromBottomMm;

    // Ixx by parallel axis theorem
    const ixx_tf = (b_tf * Math.pow(t_tf, 3)) / 12 + a_tf * Math.pow(y_tf - neutralAxisFromBottomMm, 2);
    const ixx_bf = (b_bf * Math.pow(t_bf, 3)) / 12 + a_bf * Math.pow(y_bf - neutralAxisFromBottomMm, 2);
    const ixx_webs = (2 * t_w * Math.pow(h_w, 3)) / 12 + a_webs * Math.pow(y_webs - neutralAxisFromBottomMm, 2);
    const ixxMm4 = ixx_tf + ixx_bf + ixx_webs;

    // Iyy
    const iyy_tf = (t_tf * Math.pow(b_tf, 3)) / 12;
    const iyy_bf = (t_bf * Math.pow(b_bf, 3)) / 12;
    const webCenterDist = assertPositiveNumber(inputs.webSpacingMm ?? 350.0, 'webSpacingMm') + t_w;
    const iyy_webs = (2 * (h_w * Math.pow(t_w, 3))) / 12 + a_webs * Math.pow(webCenterDist / 2, 2);
    const iyyMm4 = iyy_tf + iyy_bf + iyy_webs;

    const zxxTopMm3 = ixxMm4 / neutralAxisFromTopMm;
    const zxxBottomMm3 = ixxMm4 / neutralAxisFromBottomMm;

    const weightKgPerM = (totalAreaMm2 / 1e6) * density;

    const steps: CalculationStep[] = [
      {
        id: 'step-box-area',
        label: 'Total Cross-Sectional Area',
        formulaText: 'A = A_tf + A_bf + 2 * A_w',
        formulaMath: 'A = b_{tf} t_{tf} + b_{bf} t_{bf} + 2 h_w t_w',
        variables: {
          A_tf: { value: a_tf, unit: 'mm2', label: 'Top Flange Area' },
          A_bf: { value: a_bf, unit: 'mm2', label: 'Bottom Flange Area' },
          A_webs: { value: a_webs, unit: 'mm2', label: 'Webs Area' },
        },
        substitutedExpression: `${a_tf} + ${a_bf} + ${a_webs} = ${totalAreaMm2} mm2`,
        result: { value: totalAreaMm2, unit: 'mm2', label: 'Area' },
        dependsOn: ['topFlangeWidthMm', 'webDepthMm'],
        sourceWorkbook: 'MAC-Box Beam-Properties.xlsx',
        sourceSheet: 'PROPERTIES',
        sourceCell: 'S10',
      },
      {
        id: 'step-box-na',
        label: 'Neutral Axis Height from Bottom',
        formulaText: 'y_bar = Sum(A_i * y_i) / Total_Area',
        formulaMath: '\\bar{y} = \\frac{\\sum A_i y_i}{A}',
        variables: {},
        substitutedExpression: `(${a_bf} * ${y_bf} + ${a_webs} * ${y_webs} + ${a_tf} * ${y_tf}) / ${totalAreaMm2} = ${neutralAxisFromBottomMm.toFixed(2)} mm`,
        result: { value: neutralAxisFromBottomMm, unit: 'mm', label: 'Neutral Axis' },
        dependsOn: ['step-box-area'],
        sourceWorkbook: 'MAC-Box Beam-Properties.xlsx',
        sourceSheet: 'PROPERTIES',
        sourceCell: 'D14',
      },
    ];

    const checks: CalculationCheck[] = [
      {
        id: 'CHK-REVIEW-GATE',
        name: 'Structural Engineering Review Status',
        status: 'WARNING',
        actual: 'Under Review',
        criterion: 'Requires independent structural PE sign-off before manufacturing',
        message:
          'This structural calculation is marked as Tier B (Beta) and requires independent engineering review before use in crane girder fabrication.',
      },
    ];

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 800:2007 / IS 807:2006',
        clause: 'General steel construction and crane structural design',
        sourceType: 'current-bis-reference',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'box-beam-properties',
      toolVersion: '0.1.0',
      status: 'WARNING',
      inputsUsed: {
        topFlangeWidthMm: { value: b_tf, unit: 'mm' },
        topFlangeThicknessMm: { value: t_tf, unit: 'mm' },
        webDepthMm: { value: h_w, unit: 'mm' },
        webThicknessMm: { value: t_w, unit: 'mm' },
        bottomFlangeWidthMm: { value: b_bf, unit: 'mm' },
        bottomFlangeThicknessMm: { value: t_bf, unit: 'mm' },
        steelDensityKgPerM3: { value: density, unit: 'kg/m3' },
      },
      derived: {
        totalAreaMm2: { value: totalAreaMm2, unit: 'mm2' },
        neutralAxisFromBottomMm: { value: neutralAxisFromBottomMm, unit: 'mm' },
      },
      outputs: {
        totalAreaMm2: { value: totalAreaMm2, unit: 'mm2', label: 'Section Area' },
        neutralAxisFromBottomMm: { value: neutralAxisFromBottomMm, unit: 'mm', label: 'Neutral Axis (y_bot)' },
        ixxMm4: { value: ixxMm4, unit: 'mm4', label: 'Moment of Inertia Ixx' },
        iyyMm4: { value: iyyMm4, unit: 'mm4', label: 'Moment of Inertia Iyy' },
        zxxTopMm3: { value: zxxTopMm3, unit: 'mm3', label: 'Section Modulus Top' },
        zxxBottomMm3: { value: zxxBottomMm3, unit: 'mm3', label: 'Section Modulus Bottom' },
        weightKgPerM: { value: weightKgPerM, unit: 'kg/m', label: 'Unit Weight' },
      },
      checks,
      steps,
      assumptions: [
        'Symmetric rectangular box section with two continuous webs',
        'Corrosion allowance excluded from nominal plate thicknesses',
      ],
      warnings: ['ENGINEERING REVIEW REQUIRED: Structural design code verification pending.'],
      standardReferences,
      sourceLineage: {
        workbook: 'MAC-Box Beam-Properties.xlsx',
        sheet: 'PROPERTIES',
        cells: ['D13', 'D14', 'D16', 'D18', 'D20', 'D22'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
