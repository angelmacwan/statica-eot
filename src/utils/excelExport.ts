import * as XLSX from 'xlsx';
import { Project, ToolInstance } from '../types/project';
import { getToolDefinition } from '../engine/registry';
import { CheckStatus } from '../engine/types';

/**
 * Derives overall project calculation status based on active tool instances.
 */
function getOverallStatus(toolInstances: ToolInstance[]): CheckStatus {
  if (toolInstances.length === 0) return 'PASS';

  let hasWarning = false;
  for (const inst of toolInstances) {
    const status = inst.calculationStatus;
    if (status === 'FAIL' || status === 'ERROR') return 'FAIL';
    if (status === 'WARNING') hasWarning = true;
  }
  return hasWarning ? 'WARNING' : 'PASS';
}

/**
 * Builds the complete engineering calculation suite as an Excel WorkBook instance.
 */
export function buildProjectExcelWorkbook(project: Project, toolInstances: ToolInstance[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const overallStatus = getOverallStatus(toolInstances);
  const formattedDate = new Date().toLocaleString();

  // =========================================================================
  // Sheet 1: Project Overview & Master Specifications
  // =========================================================================
  const master = project.masterInputs || ({} as any);
  const specsRows: (string | number)[][] = [
    ['STATICALABS EOT CRANE ENGINEERING PLATFORM'],
    ['Engineering Calculation Report & Specifications'],
    [],
    ['PROJECT METADATA'],
    ['Project Name', project.projectName],
    ['Description', project.description || 'N/A'],
    ['Crane Type', `${project.craneType || 'EOT'} Crane Platform`],
    ['Governing Standards', 'IS 3177:1999 / IS 807:2006'],
    ['Calculation Engine Version', `v${project.calculationEngineVersion}`],
    ['Export Date & Time', formattedDate],
    ['Active Calculation Modules', toolInstances.length],
    ['Overall Code Compliance Status', overallStatus],
    [],
    ['MASTER CRANE SPECIFICATIONS (IS 3177 / IS 807)'],
    ['Parameter', 'Value', 'Unit', 'Description / Code Reference'],
    ['Rated Capacity (SWL)', master.swlTonnes ?? '', 'Tonnes', 'Safe Working Load (Tonnes)'],
    ['Crane Span', master.spanM ?? '', 'Meters', 'Center-to-center distance between gantry rails'],
    ['Lift Height', master.hoistHeightM ?? '', 'Meters', 'Total vertical hook travel height'],
    ['Duty Class', master.dutyClass ?? '', '', 'Crane structural & mechanism duty classification (M1 to M8 / Class I to IV)'],
    ['Hoisting Speed', master.hoistingSpeedMPerMin ?? '', 'm/min', 'Main hoist vertical lifting speed'],
    ['Cross Travel Speed', master.crossTravelSpeedMPerMin ?? '', 'm/min', 'Crab/trolley horizontal travel speed'],
    ['Long Travel Speed', master.longTravelSpeedMPerMin ?? '', 'm/min', 'Bridge crane longitudinal travel speed'],
    ['Number of Falls', master.numberOfFalls ?? '', 'Falls', 'Number of rope falls supporting hook crosshead'],
  ];

  if (master.location) {
    specsRows.push(['Installation Environment', master.location, '', 'Indoor workshop or outdoor gantry']);
  }
  if (master.crabWeightTonnes) {
    specsRows.push(['Estimated Crab Weight', master.crabWeightTonnes, 'Tonnes', 'Estimated trolley / crab self-weight']);
  }
  if (master.craneDeadWeightTonnes) {
    specsRows.push(['Crane Dead Weight', master.craneDeadWeightTonnes, 'Tonnes', 'Estimated total crane dead weight']);
  }

  const wsSpecs = XLSX.utils.aoa_to_sheet(specsRows);
  wsSpecs['!cols'] = [
    { wch: 32 },
    { wch: 20 },
    { wch: 14 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSpecs, 'Overview & Specs');

  // =========================================================================
  // Sheet 2: Executive Summary Compliance Matrix
  // =========================================================================
  const summaryRows: (string | number)[][] = [
    ['EXECUTIVE SUMMARY COMPLIANCE MATRIX'],
    ['Project:', project.projectName, 'Date:', formattedDate],
    [],
    [
      '#',
      'Module Name',
      'Tool ID',
      'Source Workbook Reference',
      'Standard',
      'Primary Output Parameter',
      'Primary Value',
      'Unit',
      'Compliance Status',
      'Total Checks',
      'Passed',
      'Warning / Fail',
    ],
  ];

  toolInstances.forEach((inst, idx) => {
    const toolDef = getToolDefinition(inst.toolId);
    const result = inst.calculationResult || (toolDef ? toolDef.calculate(inst.inputs) : null);

    const firstOutput = result?.outputs ? Object.entries(result.outputs)[0] : null;
    const checks = result?.checks || [];
    const totalChecks = checks.length;
    const passedChecks = checks.filter((c) => c.status === 'PASS').length;
    const nonPassedChecks = totalChecks - passedChecks;

    summaryRows.push([
      idx + 1,
      inst.displayName,
      inst.toolId,
      inst.sourceWorkbook || toolDef?.sourceWorkbook || 'Verified Workbook',
      'IS 3177:1999',
      firstOutput ? (firstOutput[1].label || firstOutput[0]) : 'N/A',
      firstOutput
        ? typeof firstOutput[1].value === 'number'
          ? Number(firstOutput[1].value.toFixed(4))
          : String(firstOutput[1].value)
        : 'N/A',
      firstOutput?.[1].unit || '',
      inst.calculationStatus,
      totalChecks,
      passedChecks,
      nonPassedChecks,
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 24 },
    { wch: 26 },
    { wch: 14 },
    { wch: 28 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 10 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Matrix');

  // =========================================================================
  // Sheet 3: All Calculated Outputs
  // =========================================================================
  const outputRows: (string | number)[][] = [
    ['DETAILED CALCULATED OUTPUTS (ALL MODULES)'],
    ['Module Name', 'Parameter Name', 'Symbol / Key', 'Calculated Value', 'Unit', 'Description'],
  ];

  toolInstances.forEach((inst) => {
    const toolDef = getToolDefinition(inst.toolId);
    const result = inst.calculationResult || (toolDef ? toolDef.calculate(inst.inputs) : null);

    if (result?.outputs) {
      Object.entries(result.outputs).forEach(([key, val]) => {
        outputRows.push([
          inst.displayName,
          val.label || key,
          key,
          typeof val.value === 'number' ? Number(val.value.toFixed(4)) : String(val.value),
          val.unit || '',
          val.description || '',
        ]);
      });
    }
  });

  const wsOutputs = XLSX.utils.aoa_to_sheet(outputRows);
  wsOutputs['!cols'] = [
    { wch: 28 },
    { wch: 32 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOutputs, 'Calculated Outputs');

  // =========================================================================
  // Sheet 4: IS 3177 / IS 807 Code Compliance Checks
  // =========================================================================
  const checkRows: (string | number)[][] = [
    ['CODE COMPLIANCE & SAFETY VERIFICATION CHECKS (IS 3177 / IS 807)'],
    [
      'Module Name',
      'Check Name / Criterion',
      'Status',
      'Actual Calculated Value',
      'Permissible Limit / Requirement',
      'Unit',
      'Compliance Message / Note',
    ],
  ];

  toolInstances.forEach((inst) => {
    const toolDef = getToolDefinition(inst.toolId);
    const result = inst.calculationResult || (toolDef ? toolDef.calculate(inst.inputs) : null);

    if (result?.checks) {
      result.checks.forEach((chk) => {
        checkRows.push([
          inst.displayName,
          chk.name || chk.id,
          chk.status,
          typeof chk.actual === 'number' ? Number(chk.actual.toFixed(4)) : String(chk.actual),
          chk.required !== undefined ? String(chk.required) : chk.criterion || '',
          chk.unit || '',
          chk.message,
        ]);
      });
    }
  });

  const wsChecks = XLSX.utils.aoa_to_sheet(checkRows);
  wsChecks['!cols'] = [
    { wch: 28 },
    { wch: 34 },
    { wch: 12 },
    { wch: 22 },
    { wch: 26 },
    { wch: 10 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsChecks, 'Compliance Checks');

  // =========================================================================
  // Sheet 5: Module Input Parameters
  // =========================================================================
  const inputRows: (string | number)[][] = [
    ['MODULE CONFIGURATION INPUT PARAMETERS'],
    ['Module Name', 'Parameter Name', 'Input Key', 'Input Value', 'Unit', 'Source Type'],
  ];

  toolInstances.forEach((inst) => {
    const toolDef = getToolDefinition(inst.toolId);
    if (toolDef?.inputs) {
      toolDef.inputs.forEach((inDef) => {
        const val = inst.inputs[inDef.key];
        inputRows.push([
          inst.displayName,
          inDef.label,
          inDef.key,
          val !== undefined ? String(val) : 'Default',
          inDef.unit || '',
          inDef.source ? `Source: ${inDef.source}` : 'User Input / Master Spec',
        ]);
      });
    }
  });

  const wsInputs = XLSX.utils.aoa_to_sheet(inputRows);
  wsInputs['!cols'] = [
    { wch: 28 },
    { wch: 32 },
    { wch: 22 },
    { wch: 18 },
    { wch: 12 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInputs, 'Module Inputs');

  return wb;
}

/**
 * Exports the complete engineering calculation suite to an Excel (.xlsx) file and triggers download.
 */
export function exportProjectToExcel(project: Project, toolInstances: ToolInstance[]): void {
  const wb = buildProjectExcelWorkbook(project, toolInstances);
  const cleanName = project.projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanName}_Calculations_IS3177.xlsx`;
  XLSX.writeFile(wb, filename);
}

