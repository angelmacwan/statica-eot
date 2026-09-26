import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProject,
  updateProject,
  getToolInstances,
  addToolInstancesBatch,
  deleteToolInstance,
  updateToolInstance,
} from '../firebase/firestoreService';
import { Project, ToolInstance } from '../types/project';
import { Navbar } from '../components/layout/Navbar';
import { StatusBadge } from '../components/engineering/StatusBadge';
import { NumericInput } from '../components/engineering/NumericInput';
import { CheckTable } from '../components/engineering/CheckTable';
import { CalculationTraceView } from '../components/engineering/CalculationTraceView';
import { MASTER_SPEC_INPUT_DEFINITIONS } from '../engine/master/masterSpecifications';
import { CORE_TOOLS, getToolDefinition } from '../engine/registry';
import { getMissingDependencies, buildToolInputs } from '../engine/dependencies';
import {
  Sliders,
  Plus,
  Trash2,
  Printer,
  RotateCw,
  Search,
  X,
  Check,
  Settings2,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [toolInstances, setToolInstances] = useState<ToolInstance[]>([]);
  const [loading, setLoading] = useState(true);

  // Master Specs side-by-side panel toggle
  const [showSpecsPanel, setShowSpecsPanel] = useState(false);

  // Tool library filter & search
  const [toolSearch, setToolSearch] = useState('');
  const [selectedSuite, setSelectedSuite] = useState<'ALL' | 'HOIST' | 'CROSS_TRAVEL' | 'LONG_TRAVEL' | 'STRUCTURAL'>('ALL');

  // Auto-save status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const masterSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolSaveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Toast notification for auto-added dependencies
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Expanded inline parameter tuning in report
  const [expandedToolParams, setExpandedToolParams] = useState<Record<string, boolean>>({});

  // Recalculating state
  const [recalculatingAll, setRecalculatingAll] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

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

  /**
   * Recalculate all tool instances locally and persist
   */
  const recalculateAllInstances = (
    currentInstances: ToolInstance[],
    currentMasterInputs: Record<string, any>,
  ): ToolInstance[] => {
    const updated: ToolInstance[] = [];

    for (const inst of currentInstances) {
      const toolDef = getToolDefinition(inst.toolId);
      if (!toolDef) {
        updated.push(inst);
        continue;
      }

      // Rebuild inputs with latest master and upstream tool values
      const mergedInputs = buildToolInputs(toolDef, currentMasterInputs, updated, inst.inputs);

      let calcResult;
      let status = inst.calculationStatus;
      try {
        calcResult = toolDef.calculate(mergedInputs);
        status = calcResult.status;
      } catch {
        status = 'ERROR';
      }

      const refreshed: ToolInstance = {
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
      updated.push(refreshed);
    }

    return updated;
  };

  /**
   * Master Specifications Change Handler
   * Saves immediately / debounced, cascades to calculations without save button
   */
  const handleMasterInputChange = (key: string, val: any) => {
    if (!project || !projectId) return;

    const updatedMaster = { ...project.masterInputs, [key]: val };
    const updatedProject = { ...project, masterInputs: updatedMaster };
    setProject(updatedProject);

    // Instant local recalculation for all dependent tools
    const refreshedInstances = recalculateAllInstances(toolInstances, updatedMaster);
    setToolInstances(refreshedInstances);

    // Auto-save to Firestore (debounced 400ms)
    setSaveStatus('saving');
    if (masterSaveTimerRef.current) clearTimeout(masterSaveTimerRef.current);

    masterSaveTimerRef.current = setTimeout(async () => {
      try {
        await updateProject(projectId, { masterInputs: updatedMaster });
        for (const inst of refreshedInstances) {
          await updateToolInstance(projectId, inst.id, {
            inputs: inst.inputs,
            outputs: inst.outputs,
            calculationResult: inst.calculationResult,
            calculationStatus: inst.calculationStatus,
            calculatedRevision: inst.calculatedRevision,
            isStale: false,
            calculatedAt: inst.calculatedAt,
          });
        }
        setSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('error');
      }
    }, 400);
  };

  /**
   * Tool Parameter Change Handler (inline in report)
   */
  const handleToolParamChange = (instanceId: string, paramKey: string, val: any) => {
    if (!projectId || !project) return;

    const targetIndex = toolInstances.findIndex((i) => i.id === instanceId);
    if (targetIndex === -1) return;

    const currentInst = toolInstances[targetIndex];
    const toolDef = getToolDefinition(currentInst.toolId);
    if (!toolDef) return;

    const newInputs = { ...currentInst.inputs, [paramKey]: val };

    let calcResult;
    let status = currentInst.calculationStatus;
    try {
      calcResult = toolDef.calculate(newInputs);
      status = calcResult.status;
    } catch {
      status = 'ERROR';
    }

    const updatedInst: ToolInstance = {
      ...currentInst,
      inputs: newInputs,
      outputs: calcResult
        ? Object.fromEntries(Object.entries(calcResult.outputs).map(([k, v]) => [k, (v as any).value]))
        : currentInst.outputs,
      calculationResult: calcResult,
      calculationStatus: status,
      inputRevision: currentInst.inputRevision + 1,
      calculatedRevision: currentInst.inputRevision + 1,
      isStale: false,
      calculatedAt: Date.now(),
    };

    const nextList = [...toolInstances];
    nextList[targetIndex] = updatedInst;

    // Recalculate downstream tools that may depend on this tool's outputs
    const fullRefreshed = recalculateAllInstances(nextList, project.masterInputs);
    setToolInstances(fullRefreshed);

    // Auto-save to Firestore (debounced 400ms)
    setSaveStatus('saving');
    if (toolSaveTimersRef.current[instanceId]) clearTimeout(toolSaveTimersRef.current[instanceId]);

    toolSaveTimersRef.current[instanceId] = setTimeout(async () => {
      try {
        for (const inst of fullRefreshed) {
          await updateToolInstance(projectId, inst.id, {
            inputs: inst.inputs,
            outputs: inst.outputs,
            calculationResult: inst.calculationResult,
            calculationStatus: inst.calculationStatus,
            calculatedRevision: inst.calculatedRevision,
            isStale: false,
            calculatedAt: inst.calculatedAt,
          });
        }
        setSaveStatus('saved');
      } catch (err) {
        console.error('Error auto-saving tool param:', err);
        setSaveStatus('error');
      }
    }, 400);
  };

  /**
   * Add Tool with Auto-dependency Resolution
   * If any tool is dependent on other tools for calculation, auto adds parent tools!
   */
  const handleAddToolWithDependencies = async (targetToolId: string) => {
    if (!projectId || !project) return;

    const existingToolIds = toolInstances.map((t) => t.toolId);
    if (existingToolIds.includes(targetToolId)) {
      // Scroll to tool in report
      const elem = document.getElementById(`report-tool-${targetToolId}`);
      if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Determine missing dependencies in topological order
    const missingParentIds = getMissingDependencies(targetToolId, existingToolIds);
    const toolsToCreateIds = [...missingParentIds, targetToolId];

    setSaveStatus('saving');

    try {
      const createdInstances: ToolInstance[] = [];
      const runningInstances = [...toolInstances];

      for (const toolId of toolsToCreateIds) {
        const toolDef = getToolDefinition(toolId);
        if (!toolDef) continue;

        const inputs = buildToolInputs(toolDef, project.masterInputs, runningInstances);

        let calcResult;
        let status: ToolInstance['calculationStatus'] = 'READY';
        try {
          calcResult = toolDef.calculate(inputs);
          status = calcResult.status;
        } catch {
          status = 'ERROR';
        }

        const now = Date.now();
        const newInst: ToolInstance = {
          id: `inst-${now}-${Math.random().toString(36).substring(2, 6)}`,
          toolId,
          toolVersion: toolDef.version,
          displayName: toolDef.name,
          order: now,
          inputs,
          outputs: calcResult
            ? Object.fromEntries(Object.entries(calcResult.outputs).map(([k, v]) => [k, (v as any).value]))
            : undefined,
          calculationResult: calcResult,
          calculationStatus: status,
          inputRevision: 1,
          calculatedRevision: 1,
          isStale: false,
          sourceWorkbook: toolDef.sourceWorkbook,
          sourceSheets: toolDef.sourceSheets,
          createdAt: now,
          updatedAt: now,
          calculatedAt: now,
        };

        createdInstances.push(newInst);
        runningInstances.push(newInst);
      }

      // 1. Immediately update local state in 0ms for instant UI reaction
      setToolInstances(runningInstances);

      // Inform user of auto-added dependencies
      const targetDef = getToolDefinition(targetToolId);
      if (missingParentIds.length > 0) {
        const parentNames = missingParentIds.map((id) => getToolDefinition(id)?.name || id).join(', ');
        showToast(`Added ${targetDef?.name || targetToolId} and auto-added prerequisite: ${parentNames}`);
      } else {
        showToast(`Added ${targetDef?.name || targetToolId} to calculations`);
      }

      // Smooth scroll to the newly added module
      setTimeout(() => {
        const elem = document.getElementById(`report-tool-${targetToolId}`);
        if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);

      // 2. Persist to Firestore in the background
      await addToolInstancesBatch(projectId, createdInstances);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add tools:', err);
      setSaveStatus('error');
    }
  };

  /**
   * Remove Tool from calculations
   */
  const handleDeleteTool = async (e: React.MouseEvent, instanceId: string) => {
    e.stopPropagation();
    if (!projectId) return;

    // Immediately remove from UI in 0ms
    const remaining = toolInstances.filter((i) => i.id !== instanceId);
    setToolInstances(remaining);
    setSaveStatus('saving');

    try {
      await deleteToolInstance(projectId, instanceId);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to delete tool instance:', err);
      setSaveStatus('error');
    }
  };

  /**
   * Recalculate All
   */
  const handleRecalculateAll = async () => {
    if (!projectId || !project) return;
    setRecalculatingAll(true);
    setSaveStatus('saving');
    try {
      const refreshed = recalculateAllInstances(toolInstances, project.masterInputs);
      setToolInstances(refreshed);

      for (const inst of refreshed) {
        await updateToolInstance(projectId, inst.id, {
          inputs: inst.inputs,
          outputs: inst.outputs,
          calculationResult: inst.calculationResult,
          calculationStatus: inst.calculationStatus,
          calculatedRevision: inst.calculatedRevision,
          isStale: false,
          calculatedAt: inst.calculatedAt,
        });
      }
      setSaveStatus('saved');
      showToast('All calculation modules refreshed');
    } catch (err) {
      console.error('Error recalculating all:', err);
      setSaveStatus('error');
    } finally {
      setRecalculatingAll(false);
    }
  };

  // Filter tools for the left sidebar list
  const filteredTools = useMemo(() => {
    return CORE_TOOLS.filter((t) => {
      // Filter out stubs or legacy XLS if tier C
      if (t.tier === 'C') return false;

      // Text search
      if (toolSearch.trim()) {
        const q = toolSearch.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesId = t.id.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesId) return false;
      }

      // Suite categorization
      if (selectedSuite === 'HOIST') {
        return (
          t.id.includes('hoist') ||
          t.id === 'wire-rope' ||
          t.id === 'rope-drum' ||
          t.id === 'sheaves'
        );
      }
      if (selectedSuite === 'CROSS_TRAVEL') {
        return t.id.includes('cross-travel');
      }
      if (selectedSuite === 'LONG_TRAVEL') {
        return t.id.includes('long-travel');
      }
      if (selectedSuite === 'STRUCTURAL') {
        return t.category === 'STRUCTURAL' || t.tier === 'B' || t.id.includes('bending') || t.id.includes('girder');
      }

      return true;
    });
  }, [toolSearch, selectedSuite]);

  // Set of added tool IDs
  const addedToolIdMap = useMemo(() => {
    return new Map(toolInstances.map((inst) => [inst.toolId, inst]));
  }, [toolInstances]);

  // Overall calculations status
  const overallStatus = useMemo(() => {
    if (toolInstances.length === 0) return 'READY';
    const hasFail = toolInstances.some((t) => t.calculationStatus === 'FAIL');
    if (hasFail) return 'FAIL';
    const hasWarning = toolInstances.some((t) => t.calculationStatus === 'WARNING' || t.isStale);
    if (hasWarning) return 'WARNING';
    return 'PASS';
  }, [toolInstances]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="h-screen max-h-screen w-full bg-[#fbfbfa] text-slate-900 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <div className="shrink-0 z-50 print:hidden">
        <Navbar currentProjectName={project.projectName} autoSaveStatus={saveStatus} />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 w-full flex overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Tools List & Master Spec Button                               */}
        {/* ========================================================================= */}
        <aside className="w-72 lg:w-80 shrink-0 bg-[#f7f6f3]/80 border-r border-slate-200 flex flex-col h-full min-h-0 overflow-hidden print:hidden">
          {/* Master Specs Button (Displayed above the list of tools) */}
          <div className="p-3 border-b border-slate-200 bg-white/60">
            <button
              onClick={() => setShowSpecsPanel(!showSpecsPanel)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition shadow-xs ${
                showSpecsPanel
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className={`w-4 h-4 ${showSpecsPanel ? 'text-white' : 'text-slate-700'}`} />
                <span>Master Specifications</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  showSpecsPanel ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {showSpecsPanel ? 'Panel Open' : 'Edit Specs'}
              </span>
            </button>
          </div>

          {/* Tools List Header & Search */}
          <div className="p-3 space-y-2.5 border-b border-slate-200/80 bg-white/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Calculation Tools
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {toolInstances.length} added
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Find calculation tool..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 shadow-2xs"
              />
              {toolSearch && (
                <button
                  onClick={() => setToolSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Suite Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
              {(
                [
                  { id: 'ALL', label: 'All' },
                  { id: 'HOIST', label: 'Hoist' },
                  { id: 'CROSS_TRAVEL', label: 'Cross Travel' },
                  { id: 'LONG_TRAVEL', label: 'Long Travel' },
                  { id: 'STRUCTURAL', label: 'Structural' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSuite(tab.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition ${
                    selectedSuite === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tools List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredTools.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No matching calculation tools found.
              </div>
            ) : (
              filteredTools.map((tool) => {
                const addedInst = addedToolIdMap.get(tool.id);
                const isAdded = Boolean(addedInst);
                const missingParents = isAdded
                  ? []
                  : getMissingDependencies(tool.id, toolInstances.map((t) => t.toolId));

                return (
                  <div
                    key={tool.id}
                    onClick={() => handleAddToolWithDependencies(tool.id)}
                    className={`group w-full p-2 rounded-lg border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                      isAdded
                        ? 'bg-white border-slate-300 shadow-2xs'
                        : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {isAdded ? (
                          <div className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 group-hover:border-slate-500 text-slate-400 group-hover:text-slate-700 flex items-center justify-center shrink-0 transition">
                            <Plus className="w-2.5 h-2.5" />
                          </div>
                        )}
                        <span
                          className={`text-xs truncate ${
                            isAdded ? 'font-semibold text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                          }`}
                        >
                          {tool.name}
                        </span>
                      </div>

                      {/* Dependency hint */}
                      {!isAdded && missingParents.length > 0 && (
                        <div className="text-[10px] text-slate-400 pl-5.5 truncate">
                          Auto-adds {missingParents.length} prerequisite{missingParents.length > 1 ? 's' : ''}
                        </div>
                      )}

                      {/* Added status output */}
                      {isAdded && addedInst?.calculationStatus && (
                        <div className="pl-5.5 flex items-center gap-1.5 mt-0.5">
                          <StatusBadge status={addedInst.calculationStatus} size="sm" showIcon={false} />
                        </div>
                      )}
                    </div>

                    {/* Quick remove action for added tool */}
                    {isAdded && addedInst && (
                      <button
                        onClick={(e) => handleDeleteTool(e, addedInst.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Remove from calculations"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Quick preset batch additions footer */}
          <div className="p-2.5 border-t border-slate-200 bg-white/40 text-[11px] text-slate-500">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Quick Suites
            </span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => handleAddToolWithDependencies('hoist-gearbox')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-700 transition"
              >
                + Hoist Suite
              </button>
              <button
                onClick={() => handleAddToolWithDependencies('cross-travel-gearbox')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-700 transition"
              >
                + Cross Travel
              </button>
              <button
                onClick={() => handleAddToolWithDependencies('long-travel-gearbox')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-700 transition"
              >
                + Long Travel
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MIDDLE COLUMN: Master Specs Panel (Pops open side-by-side with report)    */}
        {/* ========================================================================= */}
        {showSpecsPanel && (
          <aside className="w-96 lg:w-[420px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full min-h-0 overflow-hidden shadow-sm z-20 animate-in fade-in slide-in-from-left-2 duration-150 print:hidden">
            {/* Panel Header */}
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-slate-800" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Master Specifications
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Values propagate live to all dependent calculation tools.
                </p>
              </div>

              <button
                onClick={() => setShowSpecsPanel(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                title="Close side-by-side panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Categorized Master Specs Inputs */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Category 1: Capacity & Crane Geometry */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  1. Geometry & Classification
                </span>
                <div className="space-y-2">
                  {MASTER_SPEC_INPUT_DEFINITIONS.filter((d) =>
                    ['swlTonnes', 'spanM', 'hoistHeightM', 'dutyClass', 'hookApproachM'].includes(d.key),
                  ).map((def) => (
                    <NumericInput
                      key={def.key}
                      definition={def}
                      value={(project.masterInputs as any)[def.key]}
                      onChange={(val) => handleMasterInputChange(def.key, val)}
                    />
                  ))}
                </div>
              </div>

              {/* Category 2: Operating Speeds & Reeving */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  2. Speeds & Reeving System
                </span>
                <div className="space-y-2">
                  {MASTER_SPEC_INPUT_DEFINITIONS.filter((d) =>
                    ['hoistingSpeedMPerMin', 'crossTravelSpeedMPerMin', 'longTravelSpeedMPerMin', 'numberOfFalls'].includes(
                      d.key,
                    ),
                  ).map((def) => (
                    <NumericInput
                      key={def.key}
                      definition={def}
                      value={(project.masterInputs as any)[def.key]}
                      onChange={(val) => handleMasterInputChange(def.key, val)}
                    />
                  ))}
                </div>
              </div>

              {/* Category 3: Dead Weights */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  3. Structural & Machinery Weights
                </span>
                <div className="space-y-2">
                  {MASTER_SPEC_INPUT_DEFINITIONS.filter((d) =>
                    ['crabWeightTonnes', 'hookBlockWeightTonnes', 'craneDeadWeightTonnes'].includes(d.key),
                  ).map((def) => (
                    <NumericInput
                      key={def.key}
                      definition={def}
                      value={(project.masterInputs as any)[def.key]}
                      onChange={(val) => handleMasterInputChange(def.key, val)}
                    />
                  ))}
                </div>
              </div>

              {/* Category 4: Engineering & Service Factors */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  4. Standards & Environmental Factors
                </span>
                <div className="space-y-2">
                  {MASTER_SPEC_INPUT_DEFINITIONS.filter((d) =>
                    [
                      'ambientDeratingFactor',
                      'hoistDutyFactor',
                      'hoistServiceFactor',
                      'ctDutyFactor',
                      'ltDutyFactor',
                    ].includes(d.key),
                  ).map((def) => (
                    <NumericInput
                      key={def.key}
                      definition={def}
                      value={(project.masterInputs as any)[def.key]}
                      onChange={(val) => handleMasterInputChange(def.key, val)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Main Work Area - The Final Engineering Report               */}
        {/* ========================================================================= */}
        <main className="flex-1 min-h-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
          {/* Top Action & Toolbar */}
          <div className="w-full max-w-4xl flex items-center justify-between mb-4 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Final Engineering Report</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">{toolInstances.length} modules active</span>
            </div>

            <div className="flex items-center gap-2">
              {toolInstances.some((t) => t.isStale) && (
                <button
                  onClick={handleRecalculateAll}
                  disabled={recalculatingAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-medium rounded-lg transition shadow-xs"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${recalculatingAll ? 'animate-spin' : ''}`} />
                  Recalculate Stale
                </button>
              )}

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium rounded-lg transition shadow-xs"
                title="Print or export as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                Print / PDF
              </button>
            </div>
          </div>

          {/* THE NOTION-STYLE ENGINEERING REPORT DOCUMENT */}
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8">
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                      {project.craneType} Crane Platform
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">IS 3177:1999 / IS 807:2006</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {project.projectName}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    {project.description ||
                      'Comprehensive engineering design verification and mechanism calculation report.'}
                  </p>
                </div>

                <div className="text-right space-y-1.5 shrink-0">
                  <div className="flex items-center justify-end gap-1.5">
                    <StatusBadge status={overallStatus} size="sm" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Engine v{project.calculationEngineVersion} · {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Executive Master Crane Specifications */}
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Master Crane Specifications
                </h2>
                {!showSpecsPanel && (
                  <button
                    onClick={() => setShowSpecsPanel(true)}
                    className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 print:hidden"
                  >
                    Edit specs side-by-side <Sliders className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Rated Capacity (SWL)</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {project.masterInputs.swlTonnes} t
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Crane Span</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {project.masterInputs.spanM} m
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Lift Height</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {project.masterInputs.hoistHeightM} m
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Duty Class</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {project.masterInputs.dutyClass}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Hoisting Speed</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {project.masterInputs.hoistingSpeedMPerMin} m/min
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Cross Travel Speed</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {project.masterInputs.crossTravelSpeedMPerMin} m/min
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Long Travel Speed</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {project.masterInputs.longTravelSpeedMPerMin} m/min
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Rope Falls</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {project.masterInputs.numberOfFalls} Falls
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Summary Matrix of Active Calculation Tools */}
            {toolInstances.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  2. Summary Compliance Matrix ({toolInstances.length} Modules)
                </h2>

                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Module</th>
                        <th className="py-2 px-3">Primary Calculated Result</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-center print:hidden">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {toolInstances.map((inst) => {
                        const firstOutput = inst.outputs
                          ? Object.entries(inst.outputs)[0]
                          : null;

                        return (
                          <tr key={inst.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              <a
                                href={`#report-tool-${inst.toolId}`}
                                className="hover:underline flex items-center gap-1.5"
                              >
                                {inst.displayName}
                              </a>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {firstOutput ? (
                                <span>
                                  <strong className="text-slate-900">
                                    {typeof firstOutput[1] === 'number'
                                      ? firstOutput[1].toFixed(3)
                                      : String(firstOutput[1])}
                                  </strong>{' '}
                                  <span className="text-slate-500 font-sans text-[11px]">({firstOutput[0]})</span>
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <StatusBadge status={inst.calculationStatus} size="sm" />
                            </td>
                            <td className="py-2.5 px-3 text-center print:hidden">
                              <button
                                onClick={(e) => handleDeleteTool(e, inst.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                title="Remove module"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Section 3: Detailed Modules Output */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Detailed Mechanism & Structural Calculations
                </h2>
              </div>

              {toolInstances.length === 0 ? (
                /* Empty state */
                <div className="text-center py-16 px-4 bg-slate-50/70 border border-slate-200/90 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No Calculation Tools in Report</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                    Click any calculation tool from the left sidebar to add it to this report. If a tool depends on
                    upstream tools, all prerequisites will be automatically resolved and added.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => handleAddToolWithDependencies('hoist-gearbox')}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Hoist Mechanism Suite
                    </button>
                    <button
                      onClick={() => handleAddToolWithDependencies('cross-travel-gearbox')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium rounded-lg transition shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Cross Travel Suite
                    </button>
                    <button
                      onClick={() => handleAddToolWithDependencies('long-travel-gearbox')}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium rounded-lg transition shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Long Travel Suite
                    </button>
                  </div>
                </div>
              ) : (
                /* Active tool cards in report */
                <div className="space-y-6">
                  {toolInstances.map((inst, index) => {
                    const toolDef = getToolDefinition(inst.toolId);
                    const result = inst.calculationResult || (toolDef ? toolDef.calculate(inst.inputs) : null);
                    const isParamExpanded = Boolean(expandedToolParams[inst.id]);

                    return (
                      <div
                        id={`report-tool-${inst.toolId}`}
                        key={inst.id}
                        className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-4 break-inside-avoid scroll-mt-20"
                      >
                        {/* Tool Card Header */}
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900">
                                3.{index + 1} {inst.displayName}
                              </h3>
                              <StatusBadge status={inst.calculationStatus} size="sm" />
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                              <span>Source: {inst.sourceWorkbook || toolDef?.sourceWorkbook}</span>
                              <span>·</span>
                              <span>Standard: IS 3177:1999</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 print:hidden">
                            {toolDef && toolDef.inputs.length > 0 && (
                              <button
                                onClick={() =>
                                  setExpandedToolParams((prev) => ({
                                    ...prev,
                                    [inst.id]: !prev[inst.id],
                                  }))
                                }
                                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition border ${
                                  isParamExpanded
                                    ? 'bg-slate-100 text-slate-900 border-slate-300'
                                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                                }`}
                              >
                                <Settings2 className="w-3 h-3 text-slate-500" />
                                {isParamExpanded ? 'Hide Inputs' : 'Edit Inputs'}
                              </button>
                            )}

                            <button
                              onClick={(e) => handleDeleteTool(e, inst.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Remove from report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Tool Parameter Tuning (when toggled open) */}
                        {isParamExpanded && toolDef && (
                          <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2.5 print:hidden">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                Module Specific Inputs
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Edits auto-save & recalculate live
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {toolDef.inputs.map((inDef) => (
                                <NumericInput
                                  key={inDef.key}
                                  definition={inDef}
                                  value={inst.inputs[inDef.key]}
                                  onChange={(val) => handleToolParamChange(inst.id, inDef.key, val)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Calculated Outputs */}
                        {result && result.outputs && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                              Calculated Outputs
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs font-mono">
                              {Object.entries(result.outputs).map(([k, val]) => (
                                <div
                                  key={k}
                                  className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-lg"
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

                        {/* Code Compliance Checks */}
                        {result && result.checks && result.checks.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                              IS 3177 / IS 807 Compliance Checks
                            </span>
                            <CheckTable checks={result.checks} />
                          </div>
                        )}

                        {/* Step-by-step Formulas & Trace */}
                        {result && result.steps && result.steps.length > 0 && (
                          <div>
                            <CalculationTraceView
                              steps={result.steps}
                              sourceLineage={result.sourceLineage}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Document Footer */}
            <div className="border-t border-slate-200 pt-6 text-[10px] text-slate-500 space-y-1.5">
              <div className="flex justify-between items-center font-mono font-medium pb-2 border-b border-slate-100">
                <span className="text-slate-800">{project.projectName} · StaticaLabs EOT Crane Platform</span>
                <span>Deterministic IS 3177 Engine</span>
              </div>
              <p>
                Calculations are deterministically derived from verified engineering workbooks conforming to IS 3177:1999
                and IS 807:2006. All outputs and verification checks are saved and updated live.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
