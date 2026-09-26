/**
 * Tool Dependency Resolver & Input Propagator
 * Handles topological resolution of calculation dependencies between tools.
 */

import { getToolDefinition } from './registry';
import { CalculationToolDefinition } from './types';
import { ToolInstance } from '../types/project';

/**
 * Get direct parent tool IDs required by a tool (excluding 'master').
 */
export function getDirectParentToolIds(toolId: string): string[] {
  const def = getToolDefinition(toolId);
  if (!def || !def.dependencies) return [];
  const parents: string[] = [];
  for (const dep of def.dependencies) {
    if (dep.sourceToolId && dep.sourceToolId !== 'master' && !parents.includes(dep.sourceToolId)) {
      parents.push(dep.sourceToolId);
    }
  }
  return parents;
}

/**
 * Returns all ancestor tool IDs for toolId in topological order
 * (parents before children, with no duplicates).
 */
export function getRecursiveParentToolIds(toolId: string): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function dfs(currentId: string) {
    if (visiting.has(currentId)) {
      // Cycle detection protection
      return;
    }
    if (visited.has(currentId)) return;

    visiting.add(currentId);
    const parents = getDirectParentToolIds(currentId);
    for (const parentId of parents) {
      dfs(parentId);
    }
    visiting.delete(currentId);
    visited.add(currentId);
    if (currentId !== toolId) {
      order.push(currentId);
    }
  }

  dfs(toolId);
  return order;
}

/**
 * Given a target tool ID and a list of tool IDs already present in calculations,
 * returns the list of missing parent tool IDs in topological order.
 */
export function getMissingDependencies(targetToolId: string, currentToolIds: string[]): string[] {
  const currentSet = new Set(currentToolIds);
  const allAncestors = getRecursiveParentToolIds(targetToolId);
  return allAncestors.filter((id) => !currentSet.has(id));
}

/**
 * Prepare initial inputs for a tool by combining:
 * 1. Default values from tool definition
 * 2. Master specifications inputs
 * 3. Parent tool outputs / inputs from existing tool instances
 */
export function buildToolInputs(
  toolDef: CalculationToolDefinition,
  masterInputs: Record<string, any>,
  existingInstances: ToolInstance[],
  overrides: Record<string, any> = {},
): Record<string, any> {
  const inputs: Record<string, any> = {};

  // 1. Tool definition defaults
  for (const inputDef of toolDef.inputs) {
    inputs[inputDef.key] = inputDef.defaultValue;
  }

  // 2. Map dependencies
  for (const dep of toolDef.dependencies) {
    if (dep.sourceToolId === 'master') {
      if (masterInputs && masterInputs[dep.sourceKey] !== undefined) {
        inputs[dep.targetKey] = masterInputs[dep.sourceKey];
      }
    } else {
      // Find matching instance from existing tool instances
      const parentInst = existingInstances.find((inst) => inst.toolId === dep.sourceToolId);
      if (parentInst) {
        // Look in outputs first, then calculationResult outputs, then inputs
        if (parentInst.outputs && parentInst.outputs[dep.sourceKey] !== undefined) {
          inputs[dep.targetKey] = parentInst.outputs[dep.sourceKey];
        } else if (
          parentInst.calculationResult?.outputs &&
          parentInst.calculationResult.outputs[dep.sourceKey] !== undefined
        ) {
          inputs[dep.targetKey] = parentInst.calculationResult.outputs[dep.sourceKey].value;
        } else if (parentInst.inputs && parentInst.inputs[dep.sourceKey] !== undefined) {
          inputs[dep.targetKey] = parentInst.inputs[dep.sourceKey];
        }
      }
    }
  }

  // 3. Apply custom overrides
  Object.assign(inputs, overrides);

  return inputs;
}
