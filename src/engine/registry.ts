/**
 * Master Calculation Tool Registry
 * Section 18 of Product Design Specification
 */

import { CalculationToolDefinition } from './types';
import { mainHoistMotor } from './mechanism/mainHoistMotor';
import { mainHoistBrake } from './mechanism/mainHoistBrake';
import { wireRope } from './mechanism/wireRope';
import { ropeDrum } from './mechanism/ropeDrum';
import { hoistGearbox } from './mechanism/hoistGearbox';
import { sheaves } from './mechanism/sheaves';

import { crossTravelMotor } from './mechanism/crossTravelMotor';
import { crossTravelBrake } from './mechanism/crossTravelBrake';
import { crossTravelWheel } from './mechanism/crossTravelWheel';
import { crossTravelGearbox } from './mechanism/crossTravelGearbox';

import { longTravelMotor } from './mechanism/longTravelMotor';
import { longTravelBrake } from './mechanism/longTravelBrake';
import { longTravelWheel } from './mechanism/longTravelWheel';
import { longTravelGearbox } from './mechanism/longTravelGearbox';

import { crabWeight } from './mechanism/crabWeight';
import { wheelRailHardness } from './mechanism/wheelRailHardness';
import { outdoorCraneStub } from './mechanism/outdoorCraneStub';
import { craneCategoryLookup } from './mechanism/craneCategoryLookup';

import { boxBeamProperties } from './structural/boxBeamProperties';
import { bendingMoment } from './structural/bendingMoment';
import { gantryGirder } from './structural/gantryGirder';
import { gantryLeg } from './structural/gantryLeg';

import { LEGACY_XLS_INVENTORY, createLegacyToolDefinition } from './legacy/legacyInventory';

export const CORE_TOOLS: CalculationToolDefinition[] = [
  // Tier A: Mechanism Suite
  mainHoistMotor,
  mainHoistBrake,
  wireRope,
  ropeDrum,
  hoistGearbox,
  sheaves,

  crossTravelMotor,
  crossTravelBrake,
  crossTravelWheel,
  crossTravelGearbox,

  longTravelMotor,
  longTravelBrake,
  longTravelWheel,
  longTravelGearbox,

  crabWeight,
  wheelRailHardness,
  craneCategoryLookup,

  // Tier B: Structural Suite (Gated for Engineering Review)
  boxBeamProperties,
  bendingMoment,
  gantryGirder,
  gantryLeg,

  // Tier C: Stubs added to core registry (source available, not implemented)
  outdoorCraneStub,
];

// Tier C legacy tool definitions
export const LEGACY_TOOLS: CalculationToolDefinition[] = LEGACY_XLS_INVENTORY.map(createLegacyToolDefinition);

export const ALL_TOOLS: CalculationToolDefinition[] = [...CORE_TOOLS, ...LEGACY_TOOLS];

export const TOOL_REGISTRY: Record<string, CalculationToolDefinition> = Object.fromEntries(
  ALL_TOOLS.map((tool) => [tool.id, tool]),
);

export function getToolDefinition(toolId: string): CalculationToolDefinition | undefined {
  return TOOL_REGISTRY[toolId];
}

export function getTierATools(): CalculationToolDefinition[] {
  return CORE_TOOLS.filter((t) => t.tier === 'A');
}

export function getTierBTools(): CalculationToolDefinition[] {
  return CORE_TOOLS.filter((t) => t.tier === 'B');
}

export function getTierCTools(): CalculationToolDefinition[] {
  return LEGACY_TOOLS;
}
