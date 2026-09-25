import { MasterCraneInputs } from '../engine/master/masterSpecifications';
import { CalculationStep, CalculationCheck, SourceLineage, StandardReference, CheckStatus } from '../engine/types';

export interface ReportToolSection {
  instanceId: string;
  toolId: string;
  toolName: string;
  toolVersion: string;
  category: string;
  reviewStatus: string;
  status: CheckStatus;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  steps: CalculationStep[];
  checks: CalculationCheck[];
  assumptions: string[];
  warnings: string[];
  sourceLineage: SourceLineage;
  standardReferences: StandardReference[];
}

export interface EngineeringReport {
  id: string;
  projectId: string;
  projectName: string;
  ownerUid: string;
  title: string;
  clientName?: string;
  projectReference?: string;
  engineerName?: string;
  checkedBy?: string;
  includedToolInstanceIds: string[];
  calculationEngineVersion: string;
  generatedAt: number;
  overallStatus: CheckStatus;
  masterInputs: MasterCraneInputs;
  sections: ReportToolSection[];
}
