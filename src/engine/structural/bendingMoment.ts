/**
 * Bending Moment Calculation Tool (Tier B - Engineering Review Gate)
 * Source: MAC-Box Beam-Properties.xlsx
 * Sheets: B.M.
 */

import {
  CalculationToolDefinition,
  CalculationResult,
  CalculationStep,
  CalculationCheck,
  StandardReference,
} from '../types';
import { assertPositiveNumber } from '../safeMath';

export const bendingMoment: CalculationToolDefinition = {
  id: 'bending-moment',
  version: '0.1.0',
  name: 'Bending Moment & Reaction',
  category: 'STRUCTURAL',
  tier: 'B',
  reviewStatus: 'ENGINEERING REVIEW REQUIRED',
  description:
    'Calculates end reactions, maximum bending moment from twin wheel loads and uniform girder self-weight, and bending stress for simply-supported crane girders.',
  sourceWorkbook: 'MAC-Box Beam-Properties.xlsx',
  sourceSheets: ['B.M.'],

  inputs: [
    {
      key: 'spanM',
      label: 'Girder Span (L)',
      unit: 'm',
      type: 'number',
      defaultValue: 10.0,
      required: true,
      min: 2.0,
      description: 'Center to center rail span',
    },
    {
      key: 'wheelLoad1Tonnes',
      label: 'Trolley Wheel Load 1 (P1)',
      unit: 't',
      type: 'number',
      defaultValue: 3.75,
      required: true,
      min: 0.1,
      description: 'Maximum wheel load 1',
    },
    {
      key: 'wheelLoad2Tonnes',
      label: 'Trolley Wheel Load 2 (P2)',
      unit: 't',
      type: 'number',
      defaultValue: 3.75,
      required: true,
      min: 0.1,
      description: 'Maximum wheel load 2',
    },
    {
      key: 'wheelBaseM',
      label: 'Trolley Wheelbase (b)',
      unit: 'm',
      type: 'number',
      defaultValue: 1.5,
      required: true,
      min: 0.5,
      description: 'Distance between trolley wheels',
    },
    {
      key: 'selfWeightKgPerM',
      label: 'Girder Self Weight',
      unit: 'kg/m',
      type: 'number',
      defaultValue: 250.0,
      required: true,
      min: 10.0,
      description: 'Uniform self weight of girder',
    },
    {
      key: 'impactFactor',
      label: 'Dynamic Impact Factor',
      unit: '',
      type: 'number',
      defaultValue: 1.25,
      required: true,
      min: 1.0,
      description: 'Vertical dynamic multiplier',
    },
    {
      key: 'sectionModulusZxxCm3',
      label: 'Section Modulus Zxx',
      unit: 'cm3',
      type: 'number',
      defaultValue: 8500.0,
      required: true,
      min: 100.0,
      description: 'Major axis elastic section modulus',
    },
  ],

  outputs: [
    {
      key: 'maxLiveBendingMomentKnm',
      label: 'Maximum Wheel Load Moment',
      unit: 'kN.m',
      description: 'Peak moment from trolley wheels',
    },
    { key: 'maxDeadBendingMomentKnm', label: 'Girder Dead Load Moment', unit: 'kN.m', description: 'w * L^2 / 8' },
    {
      key: 'totalDesignBendingMomentKnm',
      label: 'Total Design Bending Moment',
      unit: 'kN.m',
      description: 'Impact-adjusted total moment',
    },
    { key: 'calculatedBendingStressMpa', label: 'Calculated Bending Stress', unit: 'N/mm2', description: 'M / Zxx' },
    {
      key: 'leftReactionKn',
      label: 'Maximum End Reaction (Left)',
      unit: 'kN',
      description: 'Reaction at left support',
    },
    {
      key: 'rightReactionKn',
      label: 'Maximum End Reaction (Right)',
      unit: 'kN',
      description: 'Reaction at right support',
    },
  ],

  dependencies: [
    {
      sourceToolId: 'cross-travel-wheel',
      sourceKey: 'pMaxTonnes',
      targetKey: 'wheelLoad1Tonnes',
      label: 'Wheel Load 1',
    },
    {
      sourceToolId: 'cross-travel-wheel',
      sourceKey: 'pMaxTonnes',
      targetKey: 'wheelLoad2Tonnes',
      label: 'Wheel Load 2',
    },
    { sourceToolId: 'master', sourceKey: 'spanM', targetKey: 'spanM', label: 'Span' },
  ],

  calculate(inputs: Record<string, any>): CalculationResult {
    const spanM = assertPositiveNumber(inputs.spanM ?? 10.0, 'spanM');
    const p1Tonnes = assertPositiveNumber(inputs.wheelLoad1Tonnes ?? 3.75, 'wheelLoad1Tonnes');
    const p2Tonnes = assertPositiveNumber(inputs.wheelLoad2Tonnes ?? 3.75, 'wheelLoad2Tonnes');
    const wheelBaseM = assertPositiveNumber(inputs.wheelBaseM ?? 1.5, 'wheelBaseM');
    const selfWeightKgPerM = assertPositiveNumber(inputs.selfWeightKgPerM ?? 250.0, 'selfWeightKgPerM');
    const impactFactor = assertPositiveNumber(inputs.impactFactor ?? 1.25, 'impactFactor');
    const zxxCm3 = assertPositiveNumber(inputs.sectionModulusZxxCm3 ?? 8500.0, 'sectionModulusZxxCm3');

    // Convert tonnes to kN (using 9.81 m/s^2)
    const p1Kn = p1Tonnes * 9.81;
    const p2Kn = p2Tonnes * 9.81;
    const totalWheelLoadKn = p1Kn + p2Kn;

    // Resultant position from wheel 1: d_r = (P2 * b) / (P1 + P2)
    const resultantDistFromP1 = (p2Kn * wheelBaseM) / totalWheelLoadKn;

    // Maximum moment occurs under heavier wheel when mid-span bisects distance between that wheel and resultant:
    // x = (L / 2) - (resultantDistFromP1 / 2)
    const xP1 = spanM / 2 - resultantDistFromP1 / 2;
    const rLeft = (totalWheelLoadKn * (spanM - (xP1 + resultantDistFromP1))) / spanM;
    const maxLiveBendingMomentKnm = rLeft * xP1;

    // Dead load moment: M_dl = w * L^2 / 8
    const wDeadKnPerM = (selfWeightKgPerM * 9.81) / 1000;
    const maxDeadBendingMomentKnm = (wDeadKnPerM * Math.pow(spanM, 2)) / 8;

    // Total design moment = Impact * M_live + M_dead
    const totalDesignBendingMomentKnm = impactFactor * maxLiveBendingMomentKnm + maxDeadBendingMomentKnm;

    // Bending stress: M (N.mm) / Z (mm3)
    // M in kN.m = M * 1e6 N.mm; Z in cm3 = Z * 1e3 mm3
    const zxxMm3 = zxxCm3 * 1000;
    const calculatedBendingStressMpa = (totalDesignBendingMomentKnm * 1e6) / zxxMm3;

    const leftReactionKn = rLeft * impactFactor + (wDeadKnPerM * spanM) / 2;
    const rightReactionKn = (totalWheelLoadKn - rLeft) * impactFactor + (wDeadKnPerM * spanM) / 2;

    const steps: CalculationStep[] = [
      {
        id: 'step-live-moment',
        label: 'Maximum Live Load Bending Moment',
        formulaText: 'M_live = R_left * x_p1',
        formulaMath: 'M_{live} = R_{A} \\times x_{1}',
        variables: {
          P_total: { value: totalWheelLoadKn, unit: 'kN', label: 'Total Wheel Load' },
          Span: { value: spanM, unit: 'm', label: 'Span' },
        },
        substitutedExpression: `R_left = ${rLeft.toFixed(2)} kN;  M_live = ${rLeft.toFixed(2)} * ${xP1.toFixed(3)} = ${maxLiveBendingMomentKnm.toFixed(2)} kN.m`,
        result: { value: maxLiveBendingMomentKnm, unit: 'kN.m', label: 'Live Moment' },
        dependsOn: ['spanM', 'wheelLoad1Tonnes', 'wheelLoad2Tonnes', 'wheelBaseM'],
        sourceWorkbook: 'MAC-Box Beam-Properties.xlsx',
        sourceSheet: 'B.M.',
        sourceCell: 'M30',
      },
    ];

    const checks: CalculationCheck[] = [
      {
        id: 'CHK-BM-STRESS-REVIEW',
        name: 'Bending Stress Permissible Limit',
        status: 'WARNING',
        actual: calculatedBendingStressMpa,
        required: '<= 165 N/mm2 (IS 800/807)',
        criterion: 'sigma_b <= sigma_allowable',
        unit: 'N/mm2',
        message: `Calculated stress is ${calculatedBendingStressMpa.toFixed(2)} N/mm2. Marked for structural PE validation.`,
      },
    ];

    const standardReferences: StandardReference[] = [
      {
        standard: 'IS 800:2007 & IS 807:2006',
        clause: 'Crane Girder Flexure & Dynamic Load Combinations',
        sourceType: 'current-bis-reference',
        status: 'review-required',
      },
    ];

    return {
      toolId: 'bending-moment',
      toolVersion: '0.1.0',
      status: 'WARNING',
      inputsUsed: {
        spanM: { value: spanM, unit: 'm' },
        wheelLoad1Tonnes: { value: p1Tonnes, unit: 't' },
        wheelLoad2Tonnes: { value: p2Tonnes, unit: 't' },
        wheelBaseM: { value: wheelBaseM, unit: 'm' },
        selfWeightKgPerM: { value: selfWeightKgPerM, unit: 'kg/m' },
        impactFactor: { value: impactFactor, unit: '' },
        sectionModulusZxxCm3: { value: zxxCm3, unit: 'cm3' },
      },
      derived: {
        totalWheelLoadKn: { value: totalWheelLoadKn, unit: 'kN' },
        maxLiveBendingMomentKnm: { value: maxLiveBendingMomentKnm, unit: 'kN.m' },
        maxDeadBendingMomentKnm: { value: maxDeadBendingMomentKnm, unit: 'kN.m' },
      },
      outputs: {
        maxLiveBendingMomentKnm: { value: maxLiveBendingMomentKnm, unit: 'kN.m', label: 'Max Live Load Moment' },
        maxDeadBendingMomentKnm: { value: maxDeadBendingMomentKnm, unit: 'kN.m', label: 'Dead Load Moment' },
        totalDesignBendingMomentKnm: { value: totalDesignBendingMomentKnm, unit: 'kN.m', label: 'Design Moment' },
        calculatedBendingStressMpa: { value: calculatedBendingStressMpa, unit: 'N/mm2', label: 'Bending Stress' },
        leftReactionKn: { value: leftReactionKn, unit: 'kN', label: 'Left Reaction' },
        rightReactionKn: { value: rightReactionKn, unit: 'kN', label: 'Right Reaction' },
      },
      checks,
      steps,
      assumptions: [
        'Simply supported girder with vertical twin-axle crane trolley wheel loads',
        'Dynamic vertical impact multiplier applied to live wheel load moment',
      ],
      warnings: ['ENGINEERING REVIEW REQUIRED: Structural code safety verification pending.'],
      standardReferences,
      sourceLineage: {
        workbook: 'MAC-Box Beam-Properties.xlsx',
        sheet: 'B.M.',
        cells: ['H20', 'H24', 'M30', 'R24', 'R26'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
