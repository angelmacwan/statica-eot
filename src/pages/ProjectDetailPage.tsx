import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getProject,
  updateProject,
  getToolInstances,
  addToolInstance,
  deleteToolInstance,
  updateToolInstance,
} from '../firebase/firestoreService';
import { Project, ToolInstance } from '../types/project';
import { Navbar } from '../components/layout/Navbar';
import { StatusBadge } from '../components/engineering/StatusBadge';
import { NumericInput } from '../components/engineering/NumericInput';
import { MASTER_SPEC_INPUT_DEFINITIONS } from '../engine/master/masterSpecifications';
import { getTierATools, getTierBTools, getTierCTools, getToolDefinition } from '../engine/registry';
import {
  Sliders,
  Wrench,
  FileText,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  AlertCircle,
  HardHat,
  RotateCw,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [toolInstances, setToolInstances] = useState<ToolInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tools' | 'specs' | 'reports'>('tools');

  // Add Tool modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalTier, setModalTier] = useState<'A' | 'B' | 'C'>('A');

  // Recalculating state
  const [recalculatingAll, setRecalculatingAll] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const proj = await getProject(projectId);
      if (!proj) {
        navigate('/projects');
        return;
      }
      setProject(proj);

      const instances = await getToolInstances(projectId);
      // sort by order or toolOrder array
      const orderMap = new Map((proj.toolOrder || []).map((id, index) => [id, index]));
      instances.sort((a, b) => {
        const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : a.order;
        const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : b.order;
        return idxA - idxB;
      });
      setToolInstances(instances);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMasterInputChange = async (key: string, val: any) => {
    if (!project || !projectId) return;
    const updatedMaster = { ...project.masterInputs, [key]: val };
    setProject({ ...project, masterInputs: updatedMaster });

    // Mark all tool instances as stale
    const updatedInstances = toolInstances.map((inst) => ({
      ...inst,
      isStale: true,
      inputRevision: inst.inputRevision + 1,
    }));
    setToolInstances(updatedInstances);

    await updateProject(projectId, { masterInputs: updatedMaster });
    for (const inst of updatedInstances) {
      await updateToolInstance(projectId, inst.id, {
        isStale: true,
        inputRevision: inst.inputRevision,
      });
    }
  };

  const handleAddTool = async (toolId: string) => {
    if (!projectId || !project) return;
    try {
      const toolDef = getToolDefinition(toolId);
      if (!toolDef) return;

      // Extract matching initial inputs from master specifications if dependency exists
      const initialInputs: Record<string, any> = {};
      for (const dep of toolDef.dependencies) {
        if (dep.sourceToolId === 'master' && (project.masterInputs as any)[dep.sourceKey] !== undefined) {
          initialInputs[dep.targetKey] = (project.masterInputs as any)[dep.sourceKey];
        }
      }

      const newInst = await addToolInstance(projectId, toolId, initialInputs);
      setToolInstances((prev) => [...prev, newInst]);
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to add tool:', err);
    }
  };

  const handleDeleteTool = async (e: React.MouseEvent, instanceId: string) => {
    e.stopPropagation();
    if (!projectId || !confirm('Remove this calculation tool from the project?')) return;
    try {
      await deleteToolInstance(projectId, instanceId);
      setToolInstances((prev) => prev.filter((i) => i.id !== instanceId));
    } catch (err) {
      console.error('Failed to delete tool instance:', err);
    }
  };

  const handleMoveTool = async (index: number, direction: 'up' | 'down') => {
    if (!projectId || !project) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= toolInstances.length) return;

    const list = [...toolInstances];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    setToolInstances(list);
    const orderedIds = list.map((i) => i.id);
    await updateProject(projectId, { toolOrder: orderedIds });
  };

  const handleRecalculateAll = async () => {
    if (!projectId || !project) return;
    setRecalculatingAll(true);
    try {
      const updatedList: ToolInstance[] = [];
      for (const inst of toolInstances) {
        const toolDef = getToolDefinition(inst.toolId);
        if (!toolDef) {
          updatedList.push(inst);
          continue;
        }

        // Sync with master inputs where applicable
        const mergedInputs = { ...inst.inputs };
        for (const dep of toolDef.dependencies) {
          if (dep.sourceToolId === 'master' && (project.masterInputs as any)[dep.sourceKey] !== undefined) {
            mergedInputs[dep.targetKey] = (project.masterInputs as any)[dep.sourceKey];
          }
        }

        let calcResult;
        let status = inst.calculationStatus;
        try {
          calcResult = toolDef.calculate(mergedInputs);
          status = calcResult.status;
        } catch {
          status = 'ERROR';
        }

        const freshInst: ToolInstance = {
          ...inst,
          inputs: mergedInputs,
          outputs: calcResult
            ? Object.fromEntries(Object.entries(calcResult.outputs).map(([k, v]) => [k, (v as any).value]))
            : inst.outputs,
          calculationResult: calcResult,
          calculationStatus: status,
          calculatedRevision: inst.inputRevision,
          isStale: false,
          calculatedAt: Date.now(),
        };

        await updateToolInstance(projectId, inst.id, {
          inputs: freshInst.inputs,
          outputs: freshInst.outputs,
          calculationResult: freshInst.calculationResult,
          calculationStatus: freshInst.calculationStatus,
          calculatedRevision: freshInst.calculatedRevision,
          isStale: false,
          calculatedAt: freshInst.calculatedAt,
        });

        updatedList.push(freshInst);
      }

      setToolInstances(updatedList);
    } catch (err) {
      console.error('Error recalculating all:', err);
    } finally {
      setRecalculatingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!project) return null;

  const hasStaleTools = toolInstances.some((t) => t.isStale);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar currentProjectName={project.projectName} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Project Header Banner */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6 backdrop-blur">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/40 text-blue-400">
                  {project.craneType} Crane Platform
                </span>
                <span className="text-[10px] font-mono text-slate-400">IS 3177:1999 / IS 807:2006</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {project.projectName}
                <span className="text-xs font-normal text-slate-400 ml-2">by StaticaLabs</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {project.description || 'Master crane engineering configuration and mechanism calculation tree.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {hasStaleTools && (
                <button
                  onClick={handleRecalculateAll}
                  disabled={recalculatingAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-amber-600/20"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${recalculatingAll ? 'animate-spin' : ''}`} />
                  Recalculate All
                </button>
              )}

              <Link
                to={`/projects/${projectId}/report`}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Report Builder
              </Link>
            </div>
          </div>

          {/* Stale calculations warning */}
          {hasStaleTools && (
            <div className="mt-4 p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 flex items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Upstream specifications were modified. One or more calculation tools are marked stale and require
                  recalculation.
                </span>
              </div>
              <button onClick={handleRecalculateAll} className="underline font-semibold hover:text-white shrink-0">
                Refresh Now
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'tools'
                  ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Calculations ({toolInstances.length})
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'specs'
                  ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Master Specifications
            </button>
          </div>
        </div>

        {/* Tab 1: Calculation Tools */}
        {activeTab === 'tools' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Configured Calculation Tools
              </h2>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-blue-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Calculation Tool
              </button>
            </div>

            {toolInstances.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-xl border border-slate-800 p-8">
                <HardHat className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-300">No Calculation Tools Added</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Add crane mechanism tools (Main Hoist Motor, Brake, Wire Rope, Drum, Gearbox, etc.) to start
                  engineering calculations.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Tool
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {toolInstances.map((inst, idx) => {
                  return (
                    <div
                      key={inst.id}
                      onClick={() => navigate(`/projects/${projectId}/tools/${inst.id}`)}
                      className="group p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-0.5 pt-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveTool(idx, 'up');
                            }}
                            disabled={idx === 0}
                            className="p-0.5 text-slate-500 hover:text-slate-300 disabled:opacity-20"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveTool(idx, 'down');
                            }}
                            disabled={idx === toolInstances.length - 1}
                            className="p-0.5 text-slate-500 hover:text-slate-300 disabled:opacity-20"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-white group-hover:text-blue-300 transition">
                              {inst.displayName}
                            </span>
                            <StatusBadge status={inst.isStale ? 'WARNING' : inst.calculationStatus} size="sm" />
                            {inst.isStale && (
                              <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                                STALE
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                            {inst.outputs &&
                              Object.entries(inst.outputs)
                                .slice(0, 3)
                                .map(([k, v]) => (
                                  <span key={k} className="font-mono">
                                    <span className="text-slate-500">{k}:</span>{' '}
                                    {typeof v === 'number' ? v.toFixed(3) : String(v)}
                                  </span>
                                ))}
                            {inst.sourceWorkbook && (
                              <span className="text-[11px] text-slate-500 italic">Source: {inst.sourceWorkbook}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <button
                          onClick={(e) => handleDeleteTool(e, inst.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-400 rounded transition"
                          title="Remove Tool"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <span className="flex items-center gap-1 text-xs text-blue-400 font-medium group-hover:translate-x-1 transition">
                          Calculate <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Master Specifications */}
        {activeTab === 'specs' && (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white">Master Crane Specifications</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Parameters defined here propagate into all dependent mechanism calculation tools.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {MASTER_SPEC_INPUT_DEFINITIONS.map((def) => (
                <NumericInput
                  key={def.key}
                  definition={def}
                  value={(project.masterInputs as any)[def.key]}
                  onChange={(val) => handleMasterInputChange(def.key, val)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Modal: Add Tool */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Add Calculation Tool</h2>
                  <p className="text-xs text-slate-400">
                    Select an engineering calculation module to add to this crane project.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Tiers Filter Tabs */}
              <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setModalTier('A')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    modalTier === 'A'
                      ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tier A: Mechanism Suite ({getTierATools().length})
                </button>
                <button
                  onClick={() => setModalTier('B')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    modalTier === 'B'
                      ? 'bg-amber-600/20 border border-amber-500/40 text-amber-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tier B: Structural (Review Gate) ({getTierBTools().length})
                </button>
                <button
                  onClick={() => setModalTier('C')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    modalTier === 'C' ? 'bg-slate-800 text-slate-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tier C: Legacy XLS Inventory ({getTierCTools().length})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {(modalTier === 'A' ? getTierATools() : modalTier === 'B' ? getTierBTools() : getTierCTools()).map(
                  (tool) => (
                    <div
                      key={tool.id}
                      className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white">{tool.name}</span>
                          <StatusBadge status={tool.status || tool.reviewStatus} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">{tool.description}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono">
                          <span>Source: {tool.sourceWorkbook}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddTool(tool.id)}
                        disabled={tool.tier === 'C'}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition shrink-0"
                      >
                        {tool.tier === 'C' ? 'Disabled' : 'Add Tool'}
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
