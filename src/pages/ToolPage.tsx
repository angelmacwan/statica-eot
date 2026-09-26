import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProject, updateProject, getToolInstances, updateToolInstance } from '../firebase/firestoreService';
import { Project, ToolInstance } from '../types/project';
import { getToolDefinition } from '../engine/registry';
import { CalculationResult } from '../engine/types';
import { Navbar } from '../components/layout/Navbar';
import { NumericInput } from '../components/engineering/NumericInput';
import { StatusBadge } from '../components/engineering/StatusBadge';
import { CheckTable } from '../components/engineering/CheckTable';
import { CalculationTraceView } from '../components/engineering/CalculationTraceView';
import { DrawingPreview } from '../components/engineering/DrawingPreview';
import { getDrawingForToolInstance } from '../engine/drawing/registry';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';

export const ToolPage: React.FC = () => {
  const { projectId, toolInstanceId } = useParams<{ projectId: string; toolInstanceId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [instance, setInstance] = useState<ToolInstance | null>(null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId, toolInstanceId]);

  const loadData = async () => {
    if (!projectId || !toolInstanceId) return;
    setLoading(true);
    try {
      const proj = await getProject(projectId);
      if (!proj) {
        navigate('/projects');
        return;
      }
      setProject(proj);

      const instances = await getToolInstances(projectId);
      const targetInst = instances.find((i) => i.id === toolInstanceId);
      if (!targetInst) {
        navigate(`/projects/${projectId}`);
        return;
      }

      setInstance(targetInst);
      setInputs(targetInst.inputs || {});

      // Perform fresh deterministic calculation
      const toolDef = getToolDefinition(targetInst.toolId);
      if (toolDef) {
        try {
          const freshResult = toolDef.calculate(targetInst.inputs || {});
          setResult(freshResult);
        } catch (err) {
          console.warn('Calculation execution error:', err);
        }
      }
    } catch (err) {
      console.error('Failed to load tool instance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    const updatedInputs = { ...inputs, [key]: value };
    setInputs(updatedInputs);

    // Instant local recalculation
    if (instance) {
      const toolDef = getToolDefinition(instance.toolId);
      if (toolDef) {
        try {
          const freshResult = toolDef.calculate(updatedInputs);
          setResult(freshResult);

          // Auto-save to Firestore (debounced 400ms, no save button required)
          setSaveStatus('saving');
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

          autoSaveTimerRef.current = setTimeout(async () => {
            try {
              const outputs = Object.fromEntries(
                Object.entries(freshResult.outputs).map(([k, v]) => [k, v.value]),
              );

              await updateToolInstance(projectId!, toolInstanceId!, {
                inputs: updatedInputs,
                outputs,
                calculationResult: freshResult,
                calculationStatus: freshResult.status,
                calculatedRevision: (instance.inputRevision || 1) + 1,
                inputRevision: (instance.inputRevision || 1) + 1,
                isStale: false,
                calculatedAt: Date.now(),
              });
              setSaveStatus('saved');
            } catch (err) {
              console.error('Auto-save error in ToolPage:', err);
              setSaveStatus('error');
            }
          }, 400);
        } catch {
          // keep previous result
        }
      }
    }
  };

  // Explicit sync for Crab Weight tool into Master Specifications
  const handleSyncCrabWeightToMaster = async () => {
    if (!project || !projectId || !result) return;
    const tonnes = result.outputs.factoredCrabWeightTonnes?.value as number;
    if (tonnes && isFinite(tonnes)) {
      const updatedMaster = { ...project.masterInputs, crabWeightTonnes: Number(tonnes.toFixed(3)) };
      await updateProject(projectId, { masterInputs: updatedMaster });
      setProject({ ...project, masterInputs: updatedMaster });
      setSyncSuccess(`Synchronized ${tonnes.toFixed(3)} tonnes to Master Specifications!`);
      setTimeout(() => setSyncSuccess(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (!project || !instance) return null;

  const toolDef = getToolDefinition(instance.toolId);
  if (!toolDef) return null;

  const drawingResult = getDrawingForToolInstance({
    ...instance,
    inputs,
    calculationResult: result || undefined,
  });

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col">
      <Navbar currentProjectName={project.projectName} autoSaveStatus={saveStatus} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project Workspace
          </Link>
        </div>

        {/* Tool Header Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                  {toolDef.category}
                </span>
                <StatusBadge status={toolDef.status || toolDef.reviewStatus} size="sm" />
                <span className="text-[10px] font-mono text-slate-400">Version {toolDef.version}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                {toolDef.name}
                {result && <StatusBadge status={result.status} size="md" />}
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">{toolDef.description}</p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-[11px] font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                {toolDef.sourceWorkbook}
              </span>
              <span className="text-[10px] text-slate-400">Sheets: {toolDef.sourceSheets.join(', ')}</span>
            </div>
          </div>

          {/* Sync notification if Crab weight */}
          {toolDef.id === 'crab-weight' && result && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900">
              <span>
                Calculated factored crab mass:{' '}
                <strong>
                  {typeof result.outputs.factoredCrabWeightTonnes?.value === 'number'
                    ? result.outputs.factoredCrabWeightTonnes.value.toFixed(3)
                    : result.outputs.factoredCrabWeightTonnes?.value}{' '}
                  tonnes
                </strong>
                . Synchronize this into Master Specifications?
              </span>
              <button
                onClick={handleSyncCrabWeightToMaster}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded text-xs transition shrink-0"
              >
                Sync to Master Specs
              </button>
            </div>
          )}

          {syncSuccess && <div className="mt-2 text-xs text-emerald-600 font-medium">✓ {syncSuccess}</div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Editable Inputs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Engineering Inputs ({toolDef.inputs.length})
                </h2>
                <span className="text-[10px] text-slate-400">Auto-saved on change</span>
              </div>

              <div className="space-y-3">
                {toolDef.inputs.map((def) => (
                  <NumericInput
                    key={def.key}
                    definition={def}
                    value={inputs[def.key]}
                    onChange={(val) => handleInputChange(def.key, val)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Calculated Outputs, Checks, and Traces */}
          <div className="lg:col-span-7 space-y-6">
            {/* Primary Outputs Card */}
            {result && (
              <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Derived Engineering Outputs
                  </h2>
                  <StatusBadge status={result.status} size="sm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(result.outputs).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl flex flex-col justify-between"
                    >
                      <span className="text-[11px] font-medium text-slate-500">{val.label || key}</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-lg font-mono font-bold text-slate-900 tracking-tight">
                          {typeof val.value === 'number' ? val.value.toFixed(4) : String(val.value)}
                        </span>
                        {val.unit && <span className="text-xs font-mono text-slate-600">{val.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Checks Table */}
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Engineering Checks & Standards Criteria
                  </h3>
                  <CheckTable checks={result.checks} />
                </div>

                {/* Warnings / Discrepancy Alert */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                      <span>⚠️ Engineering Review Notice</span>
                    </div>
                    {result.warnings.map((w, i) => (
                      <p key={i} className="leading-relaxed">
                        {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* Calculation Trace View */}
                <CalculationTraceView steps={result.steps} sourceLineage={result.sourceLineage} />
              </div>
            )}

            {/* Engineering Drawing / CAD Preview */}
            {drawingResult && (
              <DrawingPreview
                title={drawingResult.title}
                filename={drawingResult.filename}
                svg={drawingResult.svg}
                dxf={drawingResult.dxf}
                description={drawingResult.description}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
