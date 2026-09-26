/**
 * Crane Category Reference Lookup Tool
 * Source: 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx — CRANE CAT sheet
 * Tier A — reference lookup (IS 3177 Table 1/2 crane classification)
 */
import { CalculationToolDefinition } from '../types';

// IS 3177:1999 Crane Classification (Class I–IV / M1–M8)
const CRANE_CLASS_TABLE = [
  { class: 'Class I / M1-M2', dutyFactor: 1.0, description: 'Light duty, infrequent use (storage, erection)' },
  { class: 'Class II / M3-M5', dutyFactor: 1.25, description: 'Medium duty, regular but not continuous (workshops)' },
  { class: 'Class III / M6-M7', dutyFactor: 1.5, description: 'Heavy duty, continuous use (foundries, steel mills)' },
  { class: 'Class IV / M8', dutyFactor: 2.0, description: 'Very heavy duty, severe shock loading (teemers)' },
];

export const craneCategoryLookup: CalculationToolDefinition = {
  id: 'crane-category',
  version: '1.0.0',
  name: 'Crane Category (IS 3177 Classification)',
  category: 'MECHANISM',
  tier: 'A',
  status: 'verified-source',
  reviewStatus: 'TESTED',
  description:
    'Reference lookup for IS 3177:1999 crane duty classification (Class I–IV / M1–M8) and associated duty factors.',
  sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
  sourceSheets: ['CRANE CAT'],
  inputs: [
    {
      key: 'craneClass',
      label: 'Crane Class',
      unit: '',
      type: 'select',
      defaultValue: 'Class II / M3-M5',
      required: true,
      options: CRANE_CLASS_TABLE.map((c) => ({ label: `${c.class} — ${c.description}`, value: c.class })),
      description: 'IS 3177 crane classification',
    },
  ],
  outputs: [
    { key: 'craneClass', label: 'Crane Class', unit: '', description: 'Selected IS 3177 crane class' },
    { key: 'dutyFactor', label: 'Duty Factor', unit: '', description: 'Corresponding duty factor for selected class' },
    { key: 'description', label: 'Description', unit: '', description: 'Application description for selected class' },
  ],
  dependencies: [],
  calculate(inputs) {
    const selectedClass = String(inputs.craneClass ?? 'Class II / M3-M5');
    const entry = CRANE_CLASS_TABLE.find((c) => c.class === selectedClass) ?? CRANE_CLASS_TABLE[1];
    return {
      toolId: 'crane-category',
      toolVersion: '1.0.0',
      status: 'PASS',
      inputsUsed: { craneClass: { value: selectedClass, unit: '' } },
      derived: {},
      outputs: {
        craneClass: { value: entry.class, unit: '', label: 'Crane Class' },
        dutyFactor: { value: entry.dutyFactor, unit: '', label: 'Duty Factor' },
        description: { value: entry.description, unit: '', label: 'Application' },
      },
      checks: [
        {
          id: 'CHK-CRANE-CAT-REF',
          name: 'Crane Category Reference',
          status: 'PASS',
          actual: entry.class,
          criterion: 'IS 3177:1999 Table 1/2',
          message: `Crane classified as ${entry.class} with duty factor ${entry.dutyFactor}.`,
        },
      ],
      steps: [
        {
          id: 'step-crane-lookup',
          label: 'Crane Class Lookup (IS 3177:1999 Table 1)',
          formulaText: 'Lookup: IS 3177 Table 1 → class → duty factor',
          formulaMath: '\\text{IS 3177 Table 1: } class \\to K_{duty}',
          variables: { craneClass: { value: selectedClass, unit: '', label: 'Crane Class' } },
          substitutedExpression: `${selectedClass} → duty factor = ${entry.dutyFactor}`,
          result: { value: entry.dutyFactor, unit: '', label: 'Duty Factor' },
          dependsOn: ['craneClass'],
          sourceWorkbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
          sourceSheet: 'CRANE CAT',
          sourceCell: 'Table 1',
        },
      ],
      assumptions: ['IS 3177:1999 Table 1/2 classification. Duty factor applies to mechanism sizing.'],
      warnings: [],
      standardReferences: [
        {
          standard: 'IS 3177:1999',
          clause: 'Table 1 (Crane Classification)',
          sourceType: 'current-bis-reference',
          status: 'review-required',
        },
      ],
      sourceLineage: {
        workbook: '01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx',
        sheet: 'CRANE CAT',
        cells: ['Table 1'],
        status: 'SOURCE_VERIFIED_XLSX',
      },
    };
  },
};
