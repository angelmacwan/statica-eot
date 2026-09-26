import { describe, it, expect } from 'vitest';
import {
  getDirectParentToolIds,
  getRecursiveParentToolIds,
  getMissingDependencies,
  buildToolInputs,
} from '../../src/engine/dependencies';
import { getToolDefinition } from '../../src/engine/registry';
import { DEFAULT_MASTER_SPECIFICATIONS } from '../../src/engine/master/masterSpecifications';

describe('Tool Dependency Resolver', () => {
  it('identifies direct parent dependencies correctly', () => {
    // main-hoist-brake depends on main-hoist-motor
    const brakeParents = getDirectParentToolIds('main-hoist-brake');
    expect(brakeParents).toContain('main-hoist-motor');

    // rope-drum depends on wire-rope
    const drumParents = getDirectParentToolIds('rope-drum');
    expect(drumParents).toContain('wire-rope');

    // hoist-gearbox depends on rope-drum, main-hoist-motor, main-hoist-brake
    const gearboxParents = getDirectParentToolIds('hoist-gearbox');
    expect(gearboxParents).toContain('rope-drum');
    expect(gearboxParents).toContain('main-hoist-motor');
    expect(gearboxParents).toContain('main-hoist-brake');
  });

  it('computes recursive ancestor dependencies in topological order', () => {
    const gearboxAncestors = getRecursiveParentToolIds('hoist-gearbox');
    // wire-rope must come before rope-drum
    const wireRopeIdx = gearboxAncestors.indexOf('wire-rope');
    const ropeDrumIdx = gearboxAncestors.indexOf('rope-drum');
    expect(wireRopeIdx).toBeGreaterThanOrEqual(0);
    expect(ropeDrumIdx).toBeGreaterThan(wireRopeIdx);

    // main-hoist-motor must come before main-hoist-brake
    const motorIdx = gearboxAncestors.indexOf('main-hoist-motor');
    const brakeIdx = gearboxAncestors.indexOf('main-hoist-brake');
    expect(motorIdx).toBeGreaterThanOrEqual(0);
    expect(brakeIdx).toBeGreaterThan(motorIdx);
  });

  it('determines missing dependencies when some tools are already added', () => {
    // If wire-rope and main-hoist-motor are already added:
    const current = ['wire-rope', 'main-hoist-motor'];
    const missing = getMissingDependencies('hoist-gearbox', current);

    // Should contain rope-drum and main-hoist-brake, but NOT wire-rope or main-hoist-motor
    expect(missing).toContain('rope-drum');
    expect(missing).toContain('main-hoist-brake');
    expect(missing).not.toContain('wire-rope');
    expect(missing).not.toContain('main-hoist-motor');
  });

  it('correctly maps master specs and parent outputs into inputs', () => {
    const motorDef = getToolDefinition('main-hoist-motor')!;
    const motorInputs = buildToolInputs(motorDef, DEFAULT_MASTER_SPECIFICATIONS, []);
    expect(motorInputs.swlTonnes).toBe(DEFAULT_MASTER_SPECIFICATIONS.swlTonnes);
    expect(motorInputs.hoistingSpeedMPerMin).toBe(DEFAULT_MASTER_SPECIFICATIONS.hoistingSpeedMPerMin);

    // Mock calculated motor instance
    const motorCalcResult = motorDef.calculate(motorInputs);
    const mockMotorInstance: any = {
      id: 'inst-motor',
      toolId: 'main-hoist-motor',
      inputs: motorInputs,
      outputs: {
        requiredMotorKw: 10.5,
        selectedMotorRpm: 935,
      },
      calculationResult: motorCalcResult,
    };

    // Calculate brake with parent motor passed
    const brakeDef = getToolDefinition('main-hoist-brake')!;
    const brakeInputs = buildToolInputs(brakeDef, DEFAULT_MASTER_SPECIFICATIONS, [mockMotorInstance]);
    expect(brakeInputs.requiredMotorKw).toBe(10.5);
    expect(brakeInputs.motorRpm).toBe(935);
  });
});
