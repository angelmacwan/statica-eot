import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Project, ToolInstance } from '../types/project';
import { EngineeringReport } from '../types/report';
import { DEFAULT_MASTER_SPECIFICATIONS } from '../engine/master/masterSpecifications';
import { getToolDefinition } from '../engine/registry';

const ENGINE_VERSION = '0.1.0';

// Helper for localStorage fallback
const LOCAL_STORAGE_KEY = 'statica_eot_offline_projects';

function getLocalProjects(): Record<
  string,
  { project: Project; tools: Record<string, ToolInstance>; reports: Record<string, EngineeringReport> }
> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalProjects(data: any) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

export async function createProject(
  ownerUid: string,
  projectName: string,
  craneType: 'EOT' | 'Gantry' | 'Other' = 'EOT',
  description: string = '',
): Promise<Project> {
  const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const newProject: Project = {
    id: projectId,
    ownerUid,
    projectName,
    craneType,
    description,
    masterInputs: { ...DEFAULT_MASTER_SPECIFICATIONS },
    toolOrder: [],
    calculationEngineVersion: ENGINE_VERSION,
    schemaVersion: 1,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const projectRef = doc(db, 'projects', projectId);
    await setDoc(projectRef, newProject);
  } catch (err) {
    console.warn('Firestore createProject failed, using local storage cache:', err);
  }

  // Update local cache
  const local = getLocalProjects();
  local[projectId] = { project: newProject, tools: {}, reports: {} };
  saveLocalProjects(local);

  return newProject;
}

export async function getUserProjects(ownerUid: string): Promise<Project[]> {
  try {
    const q = query(collection(db, 'projects'), where('ownerUid', '==', ownerUid));
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    querySnapshot.forEach((d) => {
      projects.push(d.data() as Project);
    });
    // sort newest first
    projects.sort((a, b) => b.updatedAt - a.updatedAt);
    if (projects.length > 0) return projects;
  } catch (err) {
    console.warn('Firestore getUserProjects error, falling back to local storage:', err);
  }

  // Fallback to local storage
  const local = getLocalProjects();
  return Object.values(local)
    .map((item) => item.project)
    .filter((p) => p.ownerUid === ownerUid)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const snap = await getDoc(projectRef);
    if (snap.exists()) {
      return snap.data() as Project;
    }
  } catch (err) {
    console.warn('Firestore getProject error, checking local:', err);
  }

  const local = getLocalProjects();
  return local[projectId]?.project || null;
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
  const updatedData = { ...updates, updatedAt: Date.now() };

  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, updatedData);
  } catch (err) {
    console.warn('Firestore updateProject error:', err);
  }

  const local = getLocalProjects();
  if (local[projectId]) {
    local[projectId].project = { ...local[projectId].project, ...updatedData };
    saveLocalProjects(local);
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await deleteDoc(projectRef);
  } catch (err) {
    console.warn('Firestore deleteProject error:', err);
  }

  const local = getLocalProjects();
  delete local[projectId];
  saveLocalProjects(local);
}

// Tool Instances
export async function addToolInstance(
  projectId: string,
  toolId: string,
  initialInputs?: Record<string, any>,
): Promise<ToolInstance> {
  const toolDef = getToolDefinition(toolId);
  if (!toolDef) {
    throw new Error(`Tool "${toolId}" not found in registry.`);
  }

  const instanceId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = Date.now();

  const defaultInputs: Record<string, any> = {};
  for (const input of toolDef.inputs) {
    defaultInputs[input.key] = input.defaultValue;
  }
  const mergedInputs = { ...defaultInputs, ...(initialInputs || {}) };

  // Calculate immediately if possible
  let calculationResult;
  let status: ToolInstance['calculationStatus'] = 'READY';
  try {
    calculationResult = toolDef.calculate(mergedInputs);
    status = calculationResult.status;
  } catch (err) {
    console.warn('Initial calculation error:', err);
    status = 'ERROR';
  }

  const newInstance: ToolInstance = {
    id: instanceId,
    toolId,
    toolVersion: toolDef.version,
    displayName: toolDef.name,
    order: Date.now(),
    inputs: mergedInputs,
    outputs: calculationResult
      ? Object.fromEntries(Object.entries(calculationResult.outputs).map(([k, v]) => [k, v.value]))
      : undefined,
    calculationResult,
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

  try {
    const instRef = doc(db, 'projects', projectId, 'toolInstances', instanceId);
    await setDoc(instRef, newInstance);

    // Also update project's toolOrder
    const proj = await getProject(projectId);
    if (proj) {
      const toolOrder = [...(proj.toolOrder || []), instanceId];
      await updateProject(projectId, { toolOrder });
    }
  } catch (err) {
    console.warn('Firestore addToolInstance error:', err);
  }

  // Local storage
  const local = getLocalProjects();
  if (local[projectId]) {
    local[projectId].tools[instanceId] = newInstance;
    if (!local[projectId].project.toolOrder.includes(instanceId)) {
      local[projectId].project.toolOrder.push(instanceId);
    }
    saveLocalProjects(local);
  }

  return newInstance;
}

export async function getToolInstances(projectId: string): Promise<ToolInstance[]> {
  try {
    const colRef = collection(db, 'projects', projectId, 'toolInstances');
    const snap = await getDocs(colRef);
    const instances: ToolInstance[] = [];
    snap.forEach((d) => {
      instances.push(d.data() as ToolInstance);
    });
    if (instances.length > 0) return instances;
  } catch (err) {
    console.warn('Firestore getToolInstances error, using local:', err);
  }

  const local = getLocalProjects();
  return Object.values(local[projectId]?.tools || {});
}

export async function updateToolInstance(
  projectId: string,
  instanceId: string,
  updates: Partial<ToolInstance>,
): Promise<void> {
  const updatedData = { ...updates, updatedAt: Date.now() };

  try {
    const instRef = doc(db, 'projects', projectId, 'toolInstances', instanceId);
    await updateDoc(instRef, updatedData);
  } catch (err) {
    console.warn('Firestore updateToolInstance error:', err);
  }

  const local = getLocalProjects();
  if (local[projectId]?.tools[instanceId]) {
    local[projectId].tools[instanceId] = {
      ...local[projectId].tools[instanceId],
      ...updatedData,
    };
    saveLocalProjects(local);
  }
}

export async function deleteToolInstance(projectId: string, instanceId: string): Promise<void> {
  try {
    const instRef = doc(db, 'projects', projectId, 'toolInstances', instanceId);
    await deleteDoc(instRef);

    const proj = await getProject(projectId);
    if (proj) {
      const toolOrder = (proj.toolOrder || []).filter((id) => id !== instanceId);
      await updateProject(projectId, { toolOrder });
    }
  } catch (err) {
    console.warn('Firestore deleteToolInstance error:', err);
  }

  const local = getLocalProjects();
  if (local[projectId]?.tools[instanceId]) {
    delete local[projectId].tools[instanceId];
    local[projectId].project.toolOrder = local[projectId].project.toolOrder.filter((id) => id !== instanceId);
    saveLocalProjects(local);
  }
}

// Reports
export async function saveReport(projectId: string, report: Omit<EngineeringReport, 'id'>): Promise<EngineeringReport> {
  const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const savedReport: EngineeringReport = {
    ...report,
    id: reportId,
  };

  try {
    const repRef = doc(db, 'projects', projectId, 'reports', reportId);
    await setDoc(repRef, savedReport);
  } catch (err) {
    console.warn('Firestore saveReport error:', err);
  }

  const local = getLocalProjects();
  if (local[projectId]) {
    local[projectId].reports[reportId] = savedReport;
    saveLocalProjects(local);
  }

  return savedReport;
}

export async function getReports(projectId: string): Promise<EngineeringReport[]> {
  try {
    const colRef = collection(db, 'projects', projectId, 'reports');
    const snap = await getDocs(colRef);
    const reports: EngineeringReport[] = [];
    snap.forEach((d) => {
      reports.push(d.data() as EngineeringReport);
    });
    reports.sort((a, b) => b.generatedAt - a.generatedAt);
    if (reports.length > 0) return reports;
  } catch (err) {
    console.warn('Firestore getReports error, using local:', err);
  }

  const local = getLocalProjects();
  return Object.values(local[projectId]?.reports || {}).sort((a, b) => b.generatedAt - a.generatedAt);
}

export async function getReport(projectId: string, reportId: string): Promise<EngineeringReport | null> {
  try {
    const repRef = doc(db, 'projects', projectId, 'reports', reportId);
    const snap = await getDoc(repRef);
    if (snap.exists()) {
      return snap.data() as EngineeringReport;
    }
  } catch (err) {
    console.warn('Firestore getReport error, checking local:', err);
  }

  const local = getLocalProjects();
  return local[projectId]?.reports[reportId] || null;
}
