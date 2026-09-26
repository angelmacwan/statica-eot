export type StandardSourceType = 'workbook-note' | 'engineering-reviewed' | 'current-bis-reference';

export type StandardReviewStatus = 'legacy-source' | 'review-required' | 'validated';

export interface StandardReference {
  standard: string;
  version?: string;
  clause?: string;
  sourceType: StandardSourceType;
  status: StandardReviewStatus;
}

export interface CalculationValue {
  value: number | string | boolean | null;
  unit?: string;
  label?: string;
  description?: string;
}

export type CheckStatus = 'PASS' | 'WARNING' | 'FAIL' | 'ERROR';

export interface CalculationCheck {
  id: string;
  name: string;
  status: CheckStatus;
  actual: number | string;
  criterion: string;
  required?: number | string;
  unit?: string;
  message: string;
}

export interface CalculationStep {
  id: string;
  label: string;
  formulaText: string;
  formulaMath?: string;
  variables: Record<string, CalculationValue>;
  substitutedExpression: string;
  result: CalculationValue;
  dependsOn: string[];
  sourceWorkbook?: string;
  sourceSheet?: string;
  sourceCell?: string;
}

export type SourceReliabilityStatus = 'SOURCE_VERIFIED_XLSX' | 'SOURCE_PARTIAL_XLS' | 'SOURCE_NOT_AVAILABLE';

export interface SourceLineage {
  workbook: string;
  sheet: string;
  cells?: string[];
  status: SourceReliabilityStatus;
  notes?: string;
}

export interface CalculationResult {
  toolId: string;
  toolVersion: string;
  status: CheckStatus;
  inputsUsed: Record<string, CalculationValue>;
  derived: Record<string, CalculationValue>;
  outputs: Record<string, CalculationValue>;
  checks: CalculationCheck[];
  steps: CalculationStep[];
  assumptions: string[];
  warnings: string[];
  standardReferences: StandardReference[];
  sourceLineage: SourceLineage;
}

export interface InputOption {
  label: string;
  value: string | number;
}

export interface InputDefinition {
  key: string;
  label: string;
  unit: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  options?: InputOption[];
  defaultValue: number | string | boolean;
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  description?: string;
  source?: string;
  category?: string;
}

export interface OutputDefinition {
  key: string;
  label: string;
  unit: string;
  description?: string;
}

export interface ToolDependency {
  sourceToolId: string; // e.g. "master" or "main-hoist-motor"
  sourceKey: string; // e.g. "swl" or "requiredMotorKW"
  targetKey: string; // e.g. "swl" or "motorPowerKW"
  label: string;
}

export type ToolCategory = 'MECHANISM' | 'STRUCTURAL' | 'CATALOG' | 'LEGACY_INVENTORY';

export type ToolTier = 'A' | 'B' | 'C';

export type CalculationToolStatus =
  | 'verified-source'
  | 'engineering-review-required'
  | 'not-implemented';

export type EngineeringReviewStatus =
  | 'SOURCE ONLY'
  | 'TRANSCRIBED'
  | 'TESTED'
  | 'ENGINEERING REVIEW REQUIRED'
  | 'ENGINEERING REVIEWED'
  | 'PRODUCTION'
  | 'NOT IMPLEMENTED';

export interface CalculationContext {
  [key: string]: any;
}

export interface CalculationToolDefinition {
  id: string;
  version: string;
  name: string;
  category: ToolCategory;
  tier: ToolTier;
  status: CalculationToolStatus;
  reviewStatus: EngineeringReviewStatus;
  description: string;
  sourceWorkbook: string;
  sourceSheets: string[];
  inputs: InputDefinition[];
  outputs: OutputDefinition[];
  dependencies: ToolDependency[];
  calculate(context: CalculationContext): CalculationResult;
}
