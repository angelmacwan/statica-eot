import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Project, ToolInstance } from '../types/project';
import { EngineeringReport } from '../types/report';
import { DEFAULT_MASTER_SPECIFICATIONS } from '../engine/master/masterSpecifications';
import { getToolDefinition } from '../engine/registry';

const ENGINE_VERSION = '0.1.0';
const MAX_BATCH_WRITES = 500;

/** Firestore is the only persistence layer for project data. */
export async function createProject(
  ownerUid: string,
  projectName: string,
  craneType: 'EOT' | 'Gantry' | 'Other' = 'EOT',
  description = '',
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

  await setDoc(doc(db, 'projects', projectId), newProject);
  return newProject;
}

export async function getUserProjects(ownerUid: string): Promise<Project[]> {
  const projectsQuery = query(collection(db, 'projects'), where('ownerUid', '==', ownerUid));
  const snapshot = await getDocs(projectsQuery);
  return snapshot.docs.map((item) => item.data() as Project).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(projectId: string): Promise<Project | null> {
  const snapshot = await getDoc(doc(db, 'projects', projectId));
  return snapshot.exists() ? (snapshot.data() as Project) : null;
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId), { ...updates, updatedAt: Date.now() });
}

async function deleteSubcollection(projectId: string, subcollection: 'toolInstances' | 'reports'): Promise<void> {
  const snapshot = await getDocs(collection(db, 'projects', projectId, subcollection));
  for (let start = 0; start < snapshot.docs.length; start += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    snapshot.docs.slice(start, start + MAX_BATCH_WRITES).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
}

export async function deleteProject(projectId: string): Promise<void> {
  // Firestore document deletes do not cascade into subcollections.
  await deleteSubcollection(projectId, 'toolInstances');
  await deleteSubcollection(projectId, 'reports');
  await deleteDoc(doc(db, 'projects', projectId));
}

export async function addToolInstance(
  projectId: string,
  toolId: string,
  initialInputs?: Record<string, any>,
): Promise<ToolInstance> {
  const toolDef = getToolDefinition(toolId);
  if (!toolDef) throw new Error(`Tool "${toolId}" not found in registry.`);

  const instanceId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = Date.now();
  const defaultInputs = Object.fromEntries(toolDef.inputs.map((input) => [input.key, input.defaultValue]));
  const mergedInputs = { ...defaultInputs, ...initialInputs };

  let calculationResult;
  let status: ToolInstance['calculationStatus'] = 'READY';
  try {
    calculationResult = toolDef.calculate(mergedInputs);
    status = calculationResult.status;
  } catch (error) {
    console.warn('Initial calculation error:', error);
    status = 'ERROR';
  }

  const newInstance: ToolInstance = {
    id: instanceId,
    toolId,
    toolVersion: toolDef.version,
    displayName: toolDef.name,
    order: now,
    inputs: mergedInputs,
    outputs: calculationResult
      ? Object.fromEntries(Object.entries(calculationResult.outputs).map(([key, value]) => [key, value.value]))
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

  const projectRef = doc(db, 'projects', projectId);
  const instanceRef = doc(db, 'projects', projectId, 'toolInstances', instanceId);
  await runTransaction(db, async (transaction) => {
    const project = await transaction.get(projectRef);
    if (!project.exists()) throw new Error('Project no longer exists.');
    const toolOrder = [...((project.data() as Project).toolOrder || []), instanceId];
    transaction.set(instanceRef, newInstance);
    transaction.update(projectRef, { toolOrder, updatedAt: Date.now() });
  });

  return newInstance;
}

export async function addToolInstancesBatch(
  projectId: string,
  newInstances: ToolInstance[],
): Promise<ToolInstance[]> {
  if (newInstances.length === 0) return [];
  const projectRef = doc(db, 'projects', projectId);
  await runTransaction(db, async (transaction) => {
    const project = await transaction.get(projectRef);
    if (!project.exists()) throw new Error('Project no longer exists.');
    const existingOrder = (project.data() as Project).toolOrder || [];
    const newOrder = [...existingOrder, ...newInstances.map((i) => i.id)];
    for (const inst of newInstances) {
      const instanceRef = doc(db, 'projects', projectId, 'toolInstances', inst.id);
      transaction.set(instanceRef, inst);
    }
    transaction.update(projectRef, { toolOrder: newOrder, updatedAt: Date.now() });
  });
  return newInstances;
}

export async function getToolInstances(projectId: string): Promise<ToolInstance[]> {
  const snapshot = await getDocs(collection(db, 'projects', projectId, 'toolInstances'));
  return snapshot.docs.map((item) => item.data() as ToolInstance);
}

export async function updateToolInstance(
  projectId: string,
  instanceId: string,
  updates: Partial<ToolInstance>,
): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId, 'toolInstances', instanceId), {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deleteToolInstance(projectId: string, instanceId: string): Promise<void> {
  const projectRef = doc(db, 'projects', projectId);
  const instanceRef = doc(db, 'projects', projectId, 'toolInstances', instanceId);
  await runTransaction(db, async (transaction) => {
    const project = await transaction.get(projectRef);
    if (!project.exists()) throw new Error('Project no longer exists.');
    transaction.delete(instanceRef);
    transaction.update(projectRef, {
      toolOrder: ((project.data() as Project).toolOrder || []).filter((id) => id !== instanceId),
      updatedAt: Date.now(),
    });
  });
}

export async function saveReport(projectId: string, report: Omit<EngineeringReport, 'id'>): Promise<EngineeringReport> {
  const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const savedReport: EngineeringReport = { ...report, id: reportId };
  await setDoc(doc(db, 'projects', projectId, 'reports', reportId), savedReport);
  return savedReport;
}

export async function getReports(projectId: string): Promise<EngineeringReport[]> {
  const snapshot = await getDocs(collection(db, 'projects', projectId, 'reports'));
  return snapshot.docs.map((item) => item.data() as EngineeringReport).sort((a, b) => b.generatedAt - a.generatedAt);
}

export async function getReport(projectId: string, reportId: string): Promise<EngineeringReport | null> {
  const snapshot = await getDoc(doc(db, 'projects', projectId, 'reports', reportId));
  return snapshot.exists() ? (snapshot.data() as EngineeringReport) : null;
}
