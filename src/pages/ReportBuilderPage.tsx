import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject, getToolInstances } from '../firebase/firestoreService';
import { Project, ToolInstance } from '../types/project';
import { getToolDefinition } from '../engine/registry';
import { Navbar } from '../components/layout/Navbar';
import { StatusBadge } from '../components/engineering/StatusBadge';
import { CheckTable } from '../components/engineering/CheckTable';
import { ArrowLeft, Printer, CheckSquare, Square } from 'lucide-react';

export const ReportBuilderPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [toolInstances, setToolInstances] = useState<ToolInstance[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [projectId]);

  useEffect(() => {
    if (project?.projectName) {
      const prevTitle = document.title;
      document.title = `${project.projectName} by StaticaLabs`;
      return () => {
        document.title = prevTitle;
      };
    }
  }, [project?.projectName]);

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const proj = await getProject(projectId);
      if (!proj) return;
      setProject(proj);

      const instances = await getToolInstances(projectId);
      setToolInstances(instances);

      // default select all
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (!project) return null;

  const selectedInstances = toolInstances.filter((i) => selectedIds.has(i.id));

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col print:bg-white print:text-black">
      {/* Hide navbar when printing */}
      <div className="print:hidden">
        <Navbar currentProjectName={project.projectName} />
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 print:p-0 print:max-w-none">
        {/* Controls Bar - hidden on print */}
        <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Link
            to={`/projects/${projectId}`}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project Workspace
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {selectedIds.size} of {toolInstances.length} modules selected
            </span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Selection Tray - hidden on print */}
        <div className="print:hidden mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
            Select Calculations to Include in Final Report
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {toolInstances.map((inst) => (
              <div
                key={inst.id}
                onClick={() => toggleSelect(inst.id)}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                  selectedIds.has(inst.id)
                    ? 'bg-slate-50 border-slate-400 text-slate-900 font-medium'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {selectedIds.has(inst.id) ? (
                    <CheckSquare className="w-4 h-4 text-slate-900 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span className="truncate">{inst.displayName}</span>
                </div>
                <StatusBadge status={inst.calculationStatus} size="sm" showIcon={false} />
              </div>
            ))}
          </div>
        </div>

        {/* PRINTABLE ENGINEERING REPORT */}
        <div className="bg-white print:bg-white border border-slate-200 print:border-none rounded-xl print:rounded-none p-8 sm:p-12 print:p-8 space-y-8 shadow-sm print:shadow-none">
          {/* Header */}
          <div className="border-b-2 border-slate-900 print:border-black pb-5 flex items-start justify-between">
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-slate-500 font-semibold mb-1">
                ENGINEERING DESIGN CALCULATION REPORT
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 print:text-black">
                {project.projectName}
              </h1>
              <div className="text-xs text-slate-500 mt-1">
                by <strong className="text-slate-800 print:text-black">StaticaLabs EOT Crane Engineering Platform</strong> ·
                IS 3177 / IS 807
              </div>
            </div>

            <div className="text-right text-xs font-mono text-slate-500 space-y-1">
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div>Standard: IS 3177:1999 / IS 807</div>
              <div>Engine: v{project.calculationEngineVersion}</div>
            </div>
          </div>

          {/* Master Crane Specifications */}
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-200 pb-1.5">
              1. Master Crane Specifications
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Rated Capacity (SWL)</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.swlTonnes} Tonnes
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Crane Span</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.spanM} Meters
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Hoist Height</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.hoistHeightM} Meters
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Duty Class</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.dutyClass}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Hoisting Speed</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.hoistingSpeedMPerMin} m/min
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Cross Travel Speed</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.crossTravelSpeedMPerMin} m/min
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Long Travel Speed</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.longTravelSpeedMPerMin} m/min
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Rope Falls</span>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {project.masterInputs.numberOfFalls} Falls
                </div>
              </div>
            </div>
          </div>

          {/* Selected Calculations */}
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1.5">
              2. Detailed Mechanism & Structural Calculations
            </h2>

            {selectedInstances.map((inst, index) => {
              const toolDef = getToolDefinition(inst.toolId);
              const result = inst.calculationResult || (toolDef ? toolDef.calculate(inst.inputs) : null);

              return (
                <div
                  key={inst.id}
                  className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 break-inside-avoid shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        2.{index + 1} {inst.displayName}
                      </h3>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Source Workbook: {inst.sourceWorkbook || toolDef?.sourceWorkbook} · Standard: IS 3177
                      </div>
                    </div>
                    {result && <StatusBadge status={result.status} size="sm" />}
                  </div>

                  {/* Derived Outputs */}
                  {result && result.outputs && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Calculated Outputs
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                        {Object.entries(result.outputs).map(([k, val]) => (
                          <div
                            key={k}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                          >
                            <span className="text-[10px] text-slate-500 block truncate">{val.label || k}</span>
                            <span className="text-slate-900 font-bold text-xs mt-0.5 block">
                              {typeof val.value === 'number' ? val.value.toFixed(4) : String(val.value)}{' '}
                              {val.unit || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verification Checks */}
                  {result && result.checks && result.checks.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Compliance Checks
                      </h4>
                      <CheckTable checks={result.checks} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer & Disclaimer */}
          <div className="border-t border-slate-200 pt-5 text-[10px] text-slate-500 space-y-1.5">
            <div className="flex justify-between items-center font-mono font-medium pb-1.5 border-b border-slate-100">
              <span className="text-slate-800">{project.projectName} · StaticaLabs EOT Platform</span>
              <span>IS 3177 / IS 807</span>
            </div>
            <p>
              This calculation report was generated deterministically by the StaticaLabs EOT Crane Engineering Platform
              (Engine version {project.calculationEngineVersion}).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
