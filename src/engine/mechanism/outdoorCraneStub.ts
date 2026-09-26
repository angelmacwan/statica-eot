/**
 * Outdoor CT/LT Wind Calculation — NOT IMPLEMENTED
 * Source: Mechanism Calculation-OUTDOOR CRANE-IS3177.xls
 * Status: SOURCE_PARTIAL_XLS — manual engineering transcription required
 * See: design-doc.md §43 and backlog BKL-015
 */
import { CalculationToolDefinition } from '../types';

export const outdoorCraneStub: CalculationToolDefinition = {
  id: 'outdoor-crane',
  version: '0.0.0',
  name: 'Outdoor CT/LT Wind Calculation (NOT IMPLEMENTED)',
  category: 'MECHANISM',
  tier: 'C',
  status: 'not-implemented',
  reviewStatus: 'NOT IMPLEMENTED',
  description:
    'Outdoor crane mechanism calculation including wind load components. Source is a legacy .xls file with partial extraction only. Manual engineering transcription required before implementation.',
  sourceWorkbook: 'Mechanism Calculation-OUTDOOR CRANE-IS3177.xls',
  sourceSheets: ['C.T.-OUTDOOR', 'L.T.-OUTDOOR'],
  inputs: [],
  outputs: [],
  dependencies: [],
  calculate(_inputs) {
    return {
      toolId: 'outdoor-crane',
      toolVersion: '0.0.0',
      status: 'ERROR',
      inputsUsed: {},
      derived: {},
      outputs: {},
      checks: [
        {
          id: 'CHK-NOT-IMPLEMENTED',
          name: 'Tool Not Implemented',
          status: 'WARNING',
          actual: 'NOT IMPLEMENTED',
          criterion: 'Manual engineering transcription from .xls source required',
          message:
            'This tool has not been implemented. The source workbook is a legacy .xls file. See backlog BKL-015.',
        },
      ],
      steps: [],
      assumptions: [],
      warnings: [
        'NOT IMPLEMENTED: Outdoor crane wind calculation requires manual engineering transcription from legacy .xls source.',
      ],
      standardReferences: [],
      sourceLineage: {
        workbook: 'Mechanism Calculation-OUTDOOR CRANE-IS3177.xls',
        sheet: 'C.T.-OUTDOOR',
        cells: [],
        status: 'SOURCE_PARTIAL_XLS',
      },
    };
  },
};
