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
import { DrawingPreview } from '../components/engineering/DrawingPreview';
import { getDrawingForToolInstance } from '../engine/drawing/registry';
import { DrawingResult } from '../engine/drawing/types';
import { downloadDxf } from '../engine/drawing/dxfBuilder';
import { exportProjectToExcel } from '../utils/excelExport';
import {
  Sliders,
  Plus,
  Trash2,
  Printer,
  FileSpreadsheet,
  RotateCw,
  Search,
  X,
  Check,
  Settings2,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cog,
  DraftingCompass,
  ArrowLeft,
  Download,
  FileCode,
  ChevronDown,
  Boxes,
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
  // Auto-save status and last updated timestamp
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | undefined>(undefined);
  const masterSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolSaveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Toast notification for auto-added dependencies
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Expanded inline parameter tuning in report
  const [expandedToolParams, setExpandedToolParams] = useState<Record<string, boolean>>({});

  // Recalculating state
  const [recalculatingAll, setRecalculatingAll] = useState(false);

  // View Mode: 'calculations' (Report view) vs 'design' (Design view)
  const [viewMode, setViewMode] = useState<'calculations' | 'design'>('calculations');
  const [selectedDesignId, setSelectedDesignId] = useState<string>('ALL');
  const [downloadAllMenuOpen, setDownloadAllMenuOpen] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  // Close download menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadAllMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const downloadSvg = (svgContent: string, filename: string): void => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const safeFilename = filename.endsWith('.svg') ? filename : `${filename}.svg`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async (format: 'dxf' | 'svg') => {
    if (instancesWithDrawings.length === 0 || downloadingAll) return;
    setDownloadAllMenuOpen(false);
    setDownloadingAll(true);

    try {
      for (let i = 0; i < instancesWithDrawings.length; i++) {
        const item = instancesWithDrawings[i];
        if (format === 'dxf') {
          downloadDxf(item.drawing.dxf, item.drawing.filename);
        } else {
          downloadSvg(item.drawing.svg, item.drawing.filename);
        }
        if (i < instancesWithDrawings.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
      showToast(`Downloaded all ${instancesWithDrawings.length} designs as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to download all designs:', err);
      showToast('Error downloading designs');
    } finally {
      setDownloadingAll(false);
    }
  };

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
      setLastUpdatedAt(proj.updatedAt || Date.now());

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
        const now = Date.now();
        setLastUpdatedAt(now);
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
        const now = Date.now();
        setLastUpdatedAt(now);
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
      const now = Date.now();
      setLastUpdatedAt(now);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to add tools:', err);
      setSaveStatus('error');
    }
  };

  /**
   * Remove Tool from calculations
   */
  const handleDeleteTool = async (instanceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!projectId) return;

    // Immediately remove from UI in 0ms
    const removedInst = toolInstances.find((i) => i.id === instanceId);
    const remaining = toolInstances.filter((i) => i.id !== instanceId);
    setToolInstances(remaining);
    setSaveStatus('saving');

    try {
      await deleteToolInstance(projectId, instanceId);
      const now = Date.now();
      setLastUpdatedAt(now);
      setSaveStatus('saved');
      if (removedInst) {
        showToast(`Removed ${removedInst.displayName} from calculations`);
      }
    } catch (err) {
      console.error('Failed to delete tool instance:', err);
      setSaveStatus('error');
    }
  };

  /**
   * Toggle Tool: if unused, add it in; if already added, remove it!
   */
  const handleToggleTool = (toolId: string) => {
    const existingInst = toolInstances.find((t) => t.toolId === toolId);
    if (existingInst) {
      handleDeleteTool(existingInst.id);
    } else {
      handleAddToolWithDependencies(toolId);
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
      const now = Date.now();
      setLastUpdatedAt(now);
      setSaveStatus('saved');
      showToast('All calculation modules refreshed');
    } catch (err) {
      console.error('Error recalculating all:', err);
      setSaveStatus('error');
    } finally {
      setRecalculatingAll(false);
    }
  };

  /**
   * Opens the dedicated clean engineering report in a new tab and triggers print/PDF
   */
  const handlePrintPdf = () => {
    if (!projectId) return;
    window.open(`/projects/${projectId}/report?print=true`, '_blank');
  };

  /**
   * Downloads the complete calculation suite as an Excel (.xlsx) workbook
   */
  const handleDownloadExcel = () => {
    if (!project) return;
    exportProjectToExcel(project, toolInstances);
    showToast('Calculation suite exported to Excel (.xlsx)');
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

  // Active calculation modules that produce engineering drawings
  const instancesWithDrawings = useMemo(() => {
    return toolInstances
      .map((inst) => ({
        instance: inst,
        drawing: getDrawingForToolInstance(inst),
      }))
      .filter(
        (item): item is { instance: ToolInstance; drawing: DrawingResult } =>
          item.drawing !== null
      );
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
        <Navbar
          currentProjectName={project.projectName}
          autoSaveStatus={saveStatus}
          lastUpdatedAt={lastUpdatedAt}
        />
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
          {viewMode === 'calculations' ? (
            <>
              {/* Master Specs & Design View Buttons */}
              <div className="p-3 border-b border-slate-200 bg-white/60 space-y-2">
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

                <button
                  onClick={() => {
                    setViewMode('design');
                    setSelectedDesignId('ALL');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition shadow-xs bg-white hover:bg-sky-50/70 text-slate-800 border-slate-200 hover:border-sky-300 group"
                  title="Switch to Design View"
                >
                  <div className="flex items-center gap-2">
                    <DraftingCompass className="w-4 h-4 text-sky-600 group-hover:rotate-12 transition-transform" />
                    <span>Design View</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      instancesWithDrawings.length > 0
                        ? 'bg-sky-100 text-sky-800 font-semibold'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {instancesWithDrawings.length > 0 ? `${instancesWithDrawings.length} CAD` : 'Open'}
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
                        onClick={() => handleToggleTool(tool.id)}
                        className={`group w-full h-10 px-2.5 rounded-lg border text-left transition flex items-center justify-between gap-2 cursor-pointer select-none ${
                          isAdded
                            ? 'bg-white border-slate-300 shadow-2xs hover:border-rose-300'
                            : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                        }`}
                      >
                        {/* Left: Icon + Tool Name */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isAdded ? (
                            <div
                              className="w-4 h-4 rounded-full bg-slate-900 group-hover:bg-rose-600 text-white flex items-center justify-center shrink-0 transition shadow-2xs"
                              title="Click to remove from calculations"
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3] group-hover:hidden" />
                              <span className="hidden group-hover:inline text-[9px] font-bold leading-none">✕</span>
                            </div>
                          ) : (
                            <div
                              className="w-4 h-4 rounded-full border border-slate-300 group-hover:border-slate-600 text-slate-400 group-hover:text-slate-800 flex items-center justify-center shrink-0 transition"
                              title="Click to add to calculations"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </div>
                          )}
                          <span
                            className={`text-xs truncate ${
                              isAdded
                                ? 'font-semibold text-slate-900 group-hover:text-rose-700'
                                : 'text-slate-700 group-hover:text-slate-900'
                            }`}
                            title={tool.name}
                          >
                            {tool.name}
                          </span>
                        </div>

                        {/* Right: Fixed height action / status slot */}
                        <div className="shrink-0 h-6 flex items-center justify-end">
                          {isAdded ? (
                            <>
                              <span className="hidden group-hover:inline-flex items-center px-2 py-0.5 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-[11px] font-medium shadow-2xs">
                                Remove
                              </span>
                              {addedInst?.calculationStatus && (
                                <span className="group-hover:hidden inline-flex items-center">
                                  <StatusBadge status={addedInst.calculationStatus} size="sm" showIcon={false} />
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {missingParents.length > 0 && (
                                <span
                                  className="group-hover:hidden text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-100/80 border border-slate-200/60"
                                  title={`Auto-adds ${missingParents.length} prerequisite modules (${missingParents.join(', ')})`}
                                >
                                  +{missingParents.length}
                                </span>
                              )}
                              <span className="hidden group-hover:inline-flex items-center px-2 py-0.5 rounded-md border border-slate-200 bg-white text-slate-700 text-[11px] font-medium shadow-2xs">
                                + Add
                              </span>
                            </>
                          )}
                        </div>
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
            </>
          ) : (
            /* --- DESIGN VIEW SIDEBAR --- */
            <>
              {/* Back to calculations & Master Specs Buttons */}
              <div className="p-3 border-b border-slate-200 bg-white/60 space-y-2">
                <button
                  onClick={() => setViewMode('calculations')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border-slate-200 transition shadow-xs group"
                >
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Calculation Tools</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 text-slate-600">
                    {toolInstances.length} Tools
                  </span>
                </button>

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

              {/* Design Titles Header */}
              <div className="p-3 border-b border-slate-200/80 bg-white/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <DraftingCompass className="w-3.5 h-3.5 text-sky-600" />
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Generated Designs
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                  {instancesWithDrawings.length}
                </span>
              </div>

              {/* Design Titles List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {instancesWithDrawings.length === 0 ? (
                  <div className="p-4 text-center space-y-2">
                    <DraftingCompass className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">
                      No designs generated yet. Add Box Girder, Rope Drum, Wheels, or Sheaves to view designs.
                    </p>
                    <div className="pt-2 flex flex-col gap-1.5">
                      <button
                        onClick={() => handleAddToolWithDependencies('box-beam-properties')}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium text-left flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-slate-400" />
                        <span>Add Box Girder</span>
                      </button>
                      <button
                        onClick={() => handleAddToolWithDependencies('rope-drum')}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium text-left flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-slate-400" />
                        <span>Add Rope Drum</span>
                      </button>
                      <button
                        onClick={() => handleAddToolWithDependencies('cross-travel-wheel')}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium text-left flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-slate-400" />
                        <span>Add Wheels</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* All Designs Button */}
                    <button
                      onClick={() => setSelectedDesignId('ALL')}
                      className={`w-full px-3 py-2.5 rounded-lg border text-left transition flex items-center justify-between gap-2 ${
                        selectedDesignId === 'ALL'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Boxes className={`w-3.5 h-3.5 shrink-0 ${selectedDesignId === 'ALL' ? 'text-sky-300' : 'text-slate-500'}`} />
                        <span className="text-xs truncate">All Generated Designs</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          selectedDesignId === 'ALL'
                            ? 'bg-slate-800 text-slate-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {instancesWithDrawings.length}
                      </span>
                    </button>

                    {/* Each Design Title */}
                    {instancesWithDrawings.map(({ instance: inst, drawing }) => {
                      const isSelected = selectedDesignId === inst.id;
                      return (
                        <button
                          key={inst.id}
                          onClick={() => setSelectedDesignId(inst.id)}
                          className={`w-full px-3 py-2.5 rounded-lg border text-left transition flex items-start justify-between gap-2 ${
                            isSelected
                              ? 'bg-white border-sky-500 text-slate-900 shadow-2xs ring-1 ring-sky-400/60'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <DraftingCompass
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? 'text-sky-600' : 'text-slate-400'
                                }`}
                              />
                              <span
                                className={`text-xs truncate ${
                                  isSelected
                                    ? 'font-bold text-sky-950'
                                    : 'font-medium text-slate-800'
                                }`}
                                title={drawing.title}
                              >
                                {drawing.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate mt-0.5 pl-5 font-mono">
                              {inst.displayName}
                            </span>
                          </div>
                          <span className="shrink-0 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold mt-0.5">
                            CAD
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Design View Sidebar Footer: Format specs */}
              <div className="p-2.5 border-t border-slate-200 bg-white/40 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>AutoCAD R12 DXF</span>
                  <span>Vector SVG</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Standard: IS 3177 / IS 807
                </div>
              </div>
            </>
          )}
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
          {viewMode === 'calculations' ? (
            <>
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
                    onClick={() => {
                      setViewMode('design');
                      setSelectedDesignId('ALL');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-semibold rounded-lg transition shadow-2xs group"
                    title="Switch to Design View to inspect generated CAD drawings and export DXF"
                  >
                    <DraftingCompass className="w-3.5 h-3.5 text-sky-600 group-hover:rotate-12 transition-transform" />
                    <span>Design View</span>
                    {instancesWithDrawings.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-200 text-sky-800 font-mono">
                        {instancesWithDrawings.length}
                      </span>
                    )}
                  </button>

              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium rounded-lg transition shadow-2xs"
                title="Download complete calculation suite in Excel format (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Excel</span>
              </button>

              <button
                onClick={handlePrintPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 text-xs font-medium rounded-lg transition shadow-xs"
                title="Open dedicated clean report in new tab and print / save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span>Print / PDF</span>
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
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold inline-flex items-center gap-1.5">
                      <Cog className="w-3 h-3 stroke-[2.2] text-slate-800" />
                      <span>Statica EOT</span>
                      <span className="font-normal text-[9px] text-slate-500 lowercase">by StaticaLabs</span>
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

            {/* Executive Compliance Status Section with Background Color */}
            <div
              className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
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
                      ? `All ${toolInstances.length} active calculation modules meet code-mandated safety factors and allowable stress/load criteria.`
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
                                onClick={(e) => handleDeleteTool(inst.id, e)}
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
                              onClick={(e) => handleDeleteTool(inst.id, e)}
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

                        {/* Code Compliance Checks with Status Background */}
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
                              <span
                                className={`text-[11px] font-bold uppercase tracking-wider ${
                                  inst.calculationStatus === 'PASS'
                                    ? 'text-emerald-950'
                                    : inst.calculationStatus === 'FAIL'
                                    ? 'text-rose-950'
                                    : 'text-amber-950'
                                }`}
                              >
                                IS 3177 / IS 807 Compliance Checks
                              </span>
                              <StatusBadge status={inst.calculationStatus} size="sm" />
                            </div>
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
                <span className="text-slate-800">
                  {project.projectName} · Statica EOT <span className="font-normal text-slate-400">by StaticaLabs</span>
                </span>
                <span>Deterministic IS 3177 / IS 807 Engine</span>
              </div>
              <p>
                Calculations are deterministically derived from verified engineering workbooks conforming to IS 3177:1999
                and IS 807:2006 by Statica EOT by StaticaLabs. All outputs and verification checks are saved and updated live.
              </p>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* DESIGN VIEW (Main View)                                                   */
        /* ========================================================================= */
        <div className="w-full max-w-5xl space-y-6">
          {/* Design View Top Toolbar */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-900 text-white flex items-center justify-center shadow-xs shrink-0">
                <DraftingCompass className="w-5 h-5 text-sky-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-slate-900">
                    Design View
                  </h1>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-semibold text-slate-700 truncate max-w-xs">
                    {project.projectName}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold border border-sky-200">
                    {instancesWithDrawings.length} {instancesWithDrawings.length === 1 ? 'Design' : 'Designs'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parametric 2D CAD cross-sections and elevations generated deterministically from calculation outputs.
                </p>
              </div>
            </div>

            {/* Actions: Download All (DXF / SVG) & View Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Download All Dropdown with user preference */}
              <div className="relative" ref={downloadMenuRef}>
                <button
                  onClick={() => setDownloadAllMenuOpen(!downloadAllMenuOpen)}
                  disabled={instancesWithDrawings.length === 0 || downloadingAll}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition shadow-xs"
                  title="Download all generated designs as DXF or SVG"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  <span>{downloadingAll ? 'Downloading...' : 'Download All'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      downloadAllMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {downloadAllMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Batch Export Preference
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Download all {instancesWithDrawings.length} designs as:
                      </span>
                    </div>

                    <button
                      onClick={() => handleDownloadAll('dxf')}
                      className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 flex items-start gap-2.5 transition"
                    >
                      <FileCode className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block text-slate-900">AutoCAD DXF (.dxf)</span>
                        <span className="text-[10px] text-slate-500 block">AutoCAD R12 ASCII DXF (millimeter units)</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleDownloadAll('svg')}
                      className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 flex items-start gap-2.5 transition"
                    >
                      <Download className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block text-slate-900">Vector SVG (.svg)</span>
                        <span className="text-[10px] text-slate-500 block">Scalable vector graphics drawings</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setViewMode('calculations')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium rounded-lg transition shadow-2xs"
                title="Switch back to Calculations Report"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Calculations</span>
              </button>
            </div>
          </div>

          {/* Designs Body */}
          {instancesWithDrawings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center mx-auto shadow-xs">
                <DraftingCompass className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No Engineering Designs Generated Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Parametric CAD drawings and DXF exports are automatically generated for Box Girder, Rope Drum, Wheels, and Sheaves based on calculation parameters. Add these modules to generate their designs:
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => handleAddToolWithDependencies('box-beam-properties')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Box Girder
                </button>
                <button
                  onClick={() => handleAddToolWithDependencies('rope-drum')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Rope Drum
                </button>
                <button
                  onClick={() => handleAddToolWithDependencies('cross-travel-wheel')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-medium rounded-lg transition shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Wheels
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {instancesWithDrawings
                .filter((item) => selectedDesignId === 'ALL' || item.instance.id === selectedDesignId)
                .map(({ instance: inst, drawing }, idx) => (
                  <div key={inst.id} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {idx + 1}. {drawing.title}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                          {inst.displayName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        IS 3177:1999 / IS 807:2006
                      </span>
                    </div>
                    <DrawingPreview
                      title={drawing.title}
                      filename={drawing.filename}
                      svg={drawing.svg}
                      dxf={drawing.dxf}
                      description={drawing.description}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </main>
  </div>
</div>
  );
};
