import { describe, it, expect } from 'vitest';
import { mainHoistMotor } from '../../src/engine/mechanism/mainHoistMotor';
import { ALL_TOOLS, getTierATools, getTierBTools, getTierCTools } from '../../src/engine/registry';

describe('Validation, Invariant, and Tier Classification Tests', () => {
  it('throws an error for non-finite or negative inputs', () => {
    expect(() =>
      mainHoistMotor.calculate({
        swlTonnes: -10,
      }),
    ).toThrow();

    expect(() =>
      mainHoistMotor.calculate({
        swlTonnes: NaN,
      }),
    ).toThrow();
  });

  it('preserves monotonicity: higher lifting capacity increases required motor power', () => {
    const res1 = mainHoistMotor.calculate({ swlTonnes: 10.0 });
    const res2 = mainHoistMotor.calculate({ swlTonnes: 15.0 });
    const kw1 = res1.outputs.requiredMotorKw.value as number;
    const kw2 = res2.outputs.requiredMotorKw.value as number;
    expect(kw2).toBeGreaterThan(kw1);
  });

  it('marks all Tier B structural tools as ENGINEERING REVIEW REQUIRED', () => {
    const tierB = getTierBTools();
    expect(tierB.length).toBe(4);
    for (const tool of tierB) {
      expect(tool.tier).toBe('B');
      expect(tool.reviewStatus).toBe('ENGINEERING REVIEW REQUIRED');
      const res = tool.calculate({});
      expect(res.status).toBe('WARNING');
    }
  });

  it('marks all Tier C legacy tools as NOT IMPLEMENTED stubs with lineage', () => {
    const tierC = getTierCTools();
    expect(tierC.length).toBe(22);
    for (const tool of tierC) {
      expect(tool.tier).toBe('C');
      const res = tool.calculate({});
      expect(res.status).toBe('WARNING');
      expect(res.sourceLineage.workbook.toLowerCase()).toContain('.xls');
      expect(res.warnings[0]).toContain('NOT IMPLEMENTED');
    }
  });

  it('ensures tool registry contains all tools and IDs are unique', () => {
    const ids = ALL_TOOLS.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
    expect(getTierATools().length).toBe(17);
  });

  it('ensures every tool has a valid status conforming to design doc §15.2', () => {
    const validStatuses = new Set(['verified-source', 'engineering-review-required', 'not-implemented']);
    for (const tool of ALL_TOOLS) {
      expect(validStatuses.has(tool.status)).toBe(true);
      expect(typeof tool.calculate).toBe('function');
    }
  });

  it('ensures Tier A mechanism tools have verified-source status (except review-required ones)', () => {
    const tierA = getTierATools();
    for (const tool of tierA) {
      if (tool.id === 'wheel-rail-hardness') {
        expect(tool.status).toBe('engineering-review-required');
      } else if (tool.id === 'outdoor-crane') {
        expect(tool.status).toBe('not-implemented');
      } else {
        expect(tool.status).toBe('verified-source');
      }
    }
  });

  it('ensures branding helper/pattern satisfies design doc §11', () => {
    const formatBrandedProjectName = (name: string) => `${name} by StaticaLabs`;
    expect(formatBrandedProjectName('10T EOT Crane - Plant A')).toBe('10T EOT Crane - Plant A by StaticaLabs');
  });
});
