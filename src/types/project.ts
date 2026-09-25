import { MasterCraneInputs } from '../engine/master/masterSpecifications';
import { CalculationResult, CheckStatus } from '../engine/types';

export interface Project {
  id: string;
  ownerUid: string;
  projectName: string;
  craneType: 'EOT' | 'Gantry' | 'Other';
  description?: string;
  masterInputs: MasterCraneInputs;
  toolOrder: string[]; // Ordered toolInstance IDs
  calculationEngineVersion: string;
  schemaVersion: number;
  status: 'draft' | 'review' | 'complete';
  createdAt: number;
  updatedAt: number;
}

export interface ToolInstance {
  id: string;
  toolId: string;
  toolVersion: string;
  displayName: string;
  order: number;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  calculationResult?: CalculationResult;
  calculationStatus: CheckStatus | 'NOT_CONFIGURED' | 'READY';
  inputRevision: number;
  calculatedRevision: number;
  isStale: boolean;
  sourceWorkbook?: string;
  sourceSheets?: string[];
  createdAt: number;
  updatedAt: number;
  calculatedAt?: number;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: number;
  lastLoginAt: number;
  schemaVersion: number;
}
