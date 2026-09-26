import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getProject, getToolInstances } from '../firebase/firestoreService';
import { Project, ToolInstance } from '../types/project';
import { getToolDefinition } from '../engine/registry';
import { StatusBadge } from '../components/engineering/StatusBadge';
import { CheckTable } from '../components/engineering/CheckTable';
import { exportProjectToExcel } from '../utils/excelExport';
import {
  ArrowLeft,
  Printer,
  FileSpreadsheet,
  CheckSquare,
  Square,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cog,
} from 'lucide-react';
import { CheckStatus } from '../engine/types';

export const ReportBuilderPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('print') === 'true';

  const [project, setProject] = useState<Project | null>(null);
  const [toolInstances, setToolInstances] = useState<ToolInstance[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showFilterTray, setShowFilterTray] = useState(false);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const hasAutoPrintedRef = useRef(false);

  useEffect(() => {
    loadData();
  }, [projectId]);

  useEffect(() => {
    if (project?.projectName) {
      const prevTitle = document.title;
      document.title = `${project.projectName} - Statica EOT by StaticaLabs`;
      return () => {
        document.title = prevTitle;
      };
    }
  }, [project?.projectName]);

  // Handle auto-print if opened with ?print=true
  useEffect(() => {
    if (!loading && project && autoPrint && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, project, autoPrint]);

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const proj = await getProject(projectId);
      if (!proj) return;
      setProject(proj);

      const instances = await getToolInstances(projectId);
      setToolInstances(instances);

      // Default select all active tool instances
      setSelectedIds(new Set(instances.map((i) => i.id)));
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    setSelectedIds(new Set(toolInstances.map((i) => i.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    if (!project) return;
    const selected = toolInstances.filter((i) => selectedIds.has(i.id));
    exportProjectToExcel(project, selected);
    setDownloadToast('Excel calculation report downloaded');
    setTimeout(() => setDownloadToast(null), 3500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent" />
        <p className="text-xs font-medium text-slate-500">Preparing engineering calculation report...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-semibold text-slate-800">Project Not Found</p>
        <Link to="/projects" className="mt-4 text-xs text-blue-600 underline">
          Return to Projects
        </Link>
      </div>
    );
  }

  const selectedInstances = toolInstances.filter((i) => selectedIds.has(i.id));

  // Determine overall status
  const overallStatus: CheckStatus = (() => {
    if (selectedInstances.length === 0) return 'PASS';
    let hasWarning = false;
    for (const inst of selectedInstances) {
      if (inst.calculationStatus === 'FAIL' || inst.calculationStatus === 'ERROR') return 'FAIL';
      if (inst.calculationStatus === 'WARNING') hasWarning = true;
    }
    return hasWarning ? 'WARNING' : 'PASS';
  })();

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col print:bg-white print:text-black">
      {/* Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 print:hidden animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Top Floating Control Bar (Hidden when printing/PDF)                       */}
      {/* ========================================================================= */}
      <header className="print:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              to={`/projects/${projectId}`}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition px-2.5 py-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Workspace</span>
            </Link>

            <span className="text-slate-300">|</span>

            <span className="text-xs font-semibold text-slate-900 truncate max-w-xs sm:max-w-sm">
              {project.projectName}
            </span>

            <StatusBadge status={overallStatus} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterTray(!showFilterTray)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                showFilterTray
                  ? 'bg-slate-100 text-slate-900 border-slate-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Customize which calculation modules are included"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter Modules ({selectedIds.size}/{toolInstances.length})</span>
            </button>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium rounded-lg transition shadow-2xs"
              title="Download full calculation suite in Excel format (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition shadow-xs"
              title="Print or export as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Optional Filter Tray */}
        {showFilterTray && (
          <div className="max-w-5xl mx-auto mt-3 pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                Select Modules for Final Report ({selectedIds.size} included)
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={selectAll}
                  className="text-slate-600 hover:text-slate-900 underline text-[11px]"
                >
                  Select All
                </button>
                <span className="text-slate-300">·</span>
                <button
                  onClick={deselectAll}
                  className="text-slate-600 hover:text-slate-900 underline text-[11px]"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {toolInstances.map((inst) => {
                const isSelected = selectedIds.has(inst.id);
                return (
                  <div
                    key={inst.id}
                    onClick={() => toggleSelect(inst.id)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-slate-50 border-slate-400 text-slate-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-slate-900 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      )}
                      <span className="truncate">{inst.displayName}</span>
                    </div>
                    <StatusBadge status={inst.calculationStatus} size="sm" showIcon={false} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* THE PRINTABLE REPORT CONTAINER                                            */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:px-6 print:p-0 print:max-w-none">
        <div className="bg-white print:bg-white border border-slate-200 print:border-none rounded-2xl print:rounded-none p-8 sm:p-12 print:p-6 space-y-8 shadow-xs print:shadow-none">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1.5">
                    <Cog className="w-3 h-3 stroke-[2.2] text-slate-800" />
                    <span>Statica EOT</span>
                    <span className="font-normal text-[9px] text-slate-500 lowercase">by StaticaLabs</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">IS 3177:1999 / IS 807:2006</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 print:text-black">
                  {project.projectName}
                </h1>
                <p className="text-xs text-slate-600 print:text-slate-700 mt-1 max-w-2xl">
                  {project.description ||
                    'Comprehensive engineering design verification and mechanism calculation report.'}
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1.5 shrink-0">
                <div className="flex items-center sm:justify-end gap-1.5">
                  <StatusBadge status={overallStatus} size="md" />
                </div>
                <div className="text-[11px] font-mono text-slate-500 space-y-0.5">
                  <div>Date: {new Date().toLocaleDateString()}</div>
                  <div>Engine: v{project.calculationEngineVersion}</div>
                  <div>Standard: IS 3177 / IS 807</div>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Compliance Status Section with Background Color */}
          <div
            className={`p-4 rounded-xl border transition break-inside-avoid flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              overallStatus === 'PASS'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-2xs'
                : overallStatus === 'WARNING'
                ? 'bg-amber-50/90 border-amber-200 text-amber-950 shadow-2xs'
                : 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                  overallStatus === 'PASS'
                    ? 'bg-emerald-600 text-white'
                    : overallStatus === 'WARNING'
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {overallStatus === 'PASS' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : overallStatus === 'WARNING' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {overallStatus === 'PASS'
                      ? 'Compliance Status: Fully Compliant (PASS)'
                      : overallStatus === 'WARNING'
                      ? 'Compliance Status: Engineering Review Required (WARNING)'
                      : 'Compliance Status: Safety Criterion Failed (FAIL)'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/60 font-semibold text-slate-700">
                    IS 3177 / IS 807
                  </span>
                </div>
                <p className="text-xs opacity-90 mt-0.5">
                  {overallStatus === 'PASS'
                    ? `All ${selectedInstances.length} active calculation modules meet code-mandated safety factors and allowable stress/load criteria.`
                    : overallStatus === 'WARNING'
                    ? 'One or more modules operate near permissible thresholds. Verify catalog selections and service factors.'
                    : 'Critical design or safety criteria failed. Inspect highlighted modules below and increase component ratings.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <StatusBadge status={overallStatus} size="md" />
            </div>
          </div>

          {/* Section 1: Master Crane Specifications */}
          <section className="space-y-3 break-inside-avoid">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
              1. Master Crane Specifications
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Rated Capacity (SWL)</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.swlTonnes} Tonnes
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Crane Span</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.spanM} Meters
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Lift Height</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.hoistHeightM} Meters
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Duty Class</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.dutyClass}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Hoisting Speed</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.hoistingSpeedMPerMin} m/min
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Cross Travel Speed</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.crossTravelSpeedMPerMin} m/min
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Long Travel Speed</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.longTravelSpeedMPerMin} m/min
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Number of Falls</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.numberOfFalls} Falls
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Summary Matrix of Modules */}
          {selectedInstances.length > 0 && (
            <section className="space-y-3 break-inside-avoid">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                2. Summary Compliance Matrix ({selectedInstances.length} Active Modules)
              </h2>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Module Name</th>
                      <th className="py-2.5 px-3">Primary Output</th>
                      <th className="py-2.5 px-3 text-center">Code Compliance</th>
                      <th className="py-2.5 px-3 text-right">Checks Passed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInstances.map((inst, idx) => {
                      const toolDef = getToolDefinition(inst.toolId);
                      const result = inst.calculationResult || (toolDef ? toolDef.calculate(inst.inputs) : null);
                      const firstOutput = result?.outputs ? Object.entries(result.outputs)[0] : null;
                      const checks = result?.checks || [];
                      const passedChecks = checks.filter((c) => c.status === 'PASS').length;

                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{inst.displayName}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {firstOutput ? (
                              <span>
                                <strong className="text-slate-900">
                                  {typeof firstOutput[1].value === 'number'
                                    ? firstOutput[1].value.toFixed(3)
                                    : String(firstOutput[1].value)}
                                </strong>{' '}
                                <span className="text-slate-500 font-sans text-[11px]">
                                  {firstOutput[1].unit || ''} ({firstOutput[1].label || firstOutput[0]})
                                </span>
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <StatusBadge status={inst.calculationStatus} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {checks.length > 0 ? `${passedChecks} / ${checks.length}` : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section 3: Detailed Mechanism & Structural Calculations */}
          <section className="space-y-6">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
              3. Detailed Mechanism & Structural Calculations
            </h2>

            {selectedInstances.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No calculation modules currently selected for this report.
              </div>
            ) : (
              selectedInstances.map((inst, index) => {
                const toolDef = getToolDefinition(inst.toolId);
                const result = inst.calculationResult || (toolDef ? toolDef.calculate(inst.inputs) : null);

                return (
                  <div
                    key={inst.id}
                    className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 break-inside-avoid shadow-2xs"
                  >
                    {/* Module Title Header */}
                    <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            3.{index + 1} {inst.displayName}
                          </h3>
                          <StatusBadge status={inst.calculationStatus} size="sm" />
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>Source: {inst.sourceWorkbook || toolDef?.sourceWorkbook || 'Verified Workbook'}</span>
                          <span>·</span>
                          <span>Standard: IS 3177:1999</span>
                        </div>
                      </div>
                    </div>

                    {/* Calculated Outputs */}
                    {result && result.outputs && (
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Calculated Outputs
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs font-mono">
                          {Object.entries(result.outputs).map(([k, val]) => (
                            <div
                              key={k}
                              className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                            >
                              <span className="text-[10px] text-slate-500 block truncate font-sans">
                                {val.label || k}
                              </span>
                              <span className="text-slate-900 font-bold text-xs mt-0.5 block truncate">
                                {typeof val.value === 'number' ? val.value.toFixed(4) : String(val.value)}{' '}
                                <span className="font-normal text-slate-600 text-[10px]">{val.unit || ''}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Verification Checks with Status Background */}
                    {result && result.checks && result.checks.length > 0 && (
                      <div
                        className={`p-4 rounded-xl border space-y-2.5 transition ${
                          inst.calculationStatus === 'PASS'
                            ? 'bg-emerald-50/40 border-emerald-200/80'
                            : inst.calculationStatus === 'FAIL'
                            ? 'bg-rose-50/60 border-rose-300'
                            : 'bg-amber-50/50 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-[11px] font-bold uppercase tracking-wider ${
                              inst.calculationStatus === 'PASS'
                                ? 'text-emerald-950'
                                : inst.calculationStatus === 'FAIL'
                                ? 'text-rose-950'
                                : 'text-amber-950'
                            }`}
                          >
                            IS 3177 / IS 807 Compliance Checks
                          </h4>
                          <StatusBadge status={inst.calculationStatus} size="sm" />
                        </div>
                        <CheckTable checks={result.checks} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </section>

          {/* Section 4: Engineering Sign-off & Signatures Box */}
          <section className="break-inside-avoid border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Engineering Sign-Off & Approvals
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-3 text-xs">
              <div className="border-t border-slate-300 pt-2">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Prepared By</span>
                <span className="text-slate-900 font-semibold block mt-1">
                  Statica EOT <span className="font-normal text-[11px] text-slate-400">by StaticaLabs</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Deterministic Engine v{project.calculationEngineVersion}</span>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Checked By (Engineer)</span>
                <div className="h-6 border-b border-dashed border-slate-300 mt-2"></div>
                <span className="text-[10px] text-slate-400 mt-1 block">Date & Signature</span>
              </div>
              <div className="border-t border-slate-300 pt-2">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Approved By (Chief Engineer)</span>
                <div className="h-6 border-b border-dashed border-slate-300 mt-2"></div>
                <span className="text-[10px] text-slate-400 mt-1 block">Date & Signature</span>
              </div>
            </div>
          </section>

          {/* Document Footer & Disclaimer */}
          <footer className="border-t border-slate-200 pt-5 text-[10px] text-slate-500 space-y-1.5 break-inside-avoid">
            <div className="flex justify-between items-center font-mono font-medium pb-1.5 border-b border-slate-100">
              <span className="text-slate-800">
                {project.projectName} · Statica EOT <span className="font-normal text-slate-400">by StaticaLabs</span>
              </span>
              <span>IS 3177:1999 / IS 807:2006</span>
            </div>
            <p>
              This calculation report was generated deterministically by Statica EOT by StaticaLabs
              (Engine version {project.calculationEngineVersion}). All calculations conform to IS 3177:1999 and IS 807:2006
              specifications.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};
