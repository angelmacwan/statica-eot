/**
 * Drawing Generator Registry
 * Statica EOT Crane Engineering Platform
 *
 * Maps tool IDs to their corresponding drawing generator pure functions.
 * Follows the same registry pattern as `src/engine/registry.ts`.
 */

import { ToolInstance } from '../../types/project';
import { DrawingResult } from './types';
import { generateBoxGirderDrawing } from './boxGirderDrawing';
import { generateRopeDrumDrawing } from './ropeDrumDrawing';
import { generateWheelDrawing, generateSheaveDrawing } from './circularComponentDrawing';

export type DrawingGeneratorFn = (instance: ToolInstance) => DrawingResult | null;

/**
 * Combines instance inputs and calculated outputs into a flat dictionary
 * so drawing functions receive dimensions from both sources seamlessly.
 */
export function extractDrawingInputs(instance: ToolInstance): Record<string, any> {
  const merged: Record<string, any> = { ...(instance.inputs || {}) };

  if (instance.calculationResult?.outputs) {
    for (const [key, outputObj] of Object.entries(instance.calculationResult.outputs)) {
      if (merged[key] === undefined && outputObj && typeof outputObj === 'object' && 'value' in outputObj) {
        merged[key] = outputObj.value;
      }
    }
  }

  if (instance.outputs) {
    for (const [key, val] of Object.entries(instance.outputs)) {
      if (merged[key] === undefined) {
        merged[key] = val;
      }
    }
  }

  return merged;
}

export const DRAWING_REGISTRY: Record<string, DrawingGeneratorFn> = {
  'box-beam-properties': (instance: ToolInstance) => {
    const data = extractDrawingInputs(instance);
    return generateBoxGirderDrawing(data);
  },

  'rope-drum': (instance: ToolInstance) => {
    const data = extractDrawingInputs(instance);
    return generateRopeDrumDrawing(data);
  },

  'cross-travel-wheel': (instance: ToolInstance) => {
    const data = extractDrawingInputs(instance);
    return generateWheelDrawing(data, 'cross-travel');
  },

  'long-travel-wheel': (instance: ToolInstance) => {
    const data = extractDrawingInputs(instance);
    return generateWheelDrawing(data, 'long-travel');
  },

  'sheaves': (instance: ToolInstance) => {
    const data = extractDrawingInputs(instance);
    return generateSheaveDrawing(data, 'main');
  },
};

/**
 * Retrieves a drawing result for a given tool instance if a generator exists.
 */
export function getDrawingForToolInstance(instance: ToolInstance): DrawingResult | null {
  const generator = DRAWING_REGISTRY[instance.toolId];
  if (!generator) return null;
  try {
    return generator(instance);
  } catch (err) {
    console.error(`Failed to generate drawing for toolId "${instance.toolId}":`, err);
    return null;
  }
}

/**
 * Checks whether a given toolId has a supported drawing generator.
 */
export function hasDrawingGenerator(toolId: string): boolean {
  return Boolean(DRAWING_REGISTRY[toolId]);
}
