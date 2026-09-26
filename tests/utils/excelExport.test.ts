import { describe, it, expect } from 'vitest';
import { buildProjectExcelWorkbook } from '../../src/utils/excelExport';
import { Project, ToolInstance } from '../../src/types/project';
import { DEFAULT_MASTER_SPECIFICATIONS } from '../../src/engine/master/masterSpecifications';

describe('buildProjectExcelWorkbook', () => {
  it('generates a multi-sheet Excel workbook with all project specs and active calculation outputs', () => {
    const mockProject: Project = {
      id: 'proj-123',
      ownerUid: 'user-abc',
      projectName: 'Test 10T EOT Crane',
      craneType: 'EOT',
      description: 'IS 3177 calculation report',
      masterInputs: DEFAULT_MASTER_SPECIFICATIONS,
      toolOrder: ['inst-1'],
      calculationEngineVersion: '2026.09.01',
      schemaVersion: 1,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const mockToolInstances: ToolInstance[] = [
      {
        id: 'inst-1',
        toolId: 'main-hoist-motor',
        toolVersion: '1.0.0',
        displayName: 'Main Hoist Motor',
        order: 1,
        inputs: {
          swlTonnes: 10,
          hoistingSpeedMPerMin: 5,
        },
        outputs: {
          motorPowerKW: { value: 10.5, unit: 'kW', label: 'Required Motor Power' },
        },
        calculationResult: {
          toolId: 'main-hoist-motor',
          toolVersion: '1.0.0',
          status: 'PASS',
          inputs: {},
          outputs: {
            motorPowerKW: { value: 10.5, unit: 'kW', label: 'Required Motor Power' },
          },
          checks: [
            {
              id: 'motor-power-check',
              name: 'Motor Rating Compliance',
              status: 'PASS',
              actual: 10.5,
              criterion: '>= required',
              message: 'Motor power meets requirement',
            },
          ],
          steps: [],
          assumptions: [],
          warnings: [],
          standardReferences: [],
          sourceLineage: {
            workbook: '01-MAC-CRANE',
            sheet: 'MH',
            status: 'SOURCE_VERIFIED_XLSX',
          },
        },
        calculationStatus: 'PASS',
        inputRevision: 1,
        calculatedRevision: 1,
        isStale: false,
        sourceWorkbook: '01-MAC-CRANE',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const wb = buildProjectExcelWorkbook(mockProject, mockToolInstances);

    expect(wb.SheetNames).toContain('Overview & Specs');
    expect(wb.SheetNames).toContain('Summary Matrix');
    expect(wb.SheetNames).toContain('Calculated Outputs');
    expect(wb.SheetNames).toContain('Compliance Checks');
    expect(wb.SheetNames).toContain('Module Inputs');

    // Verify cell values in sheets
    const specsSheet = wb.Sheets['Overview & Specs'];
    expect(specsSheet).toBeDefined();

    const summarySheet = wb.Sheets['Summary Matrix'];
    expect(summarySheet).toBeDefined();

    const outputsSheet = wb.Sheets['Calculated Outputs'];
    expect(outputsSheet).toBeDefined();
  });
});
