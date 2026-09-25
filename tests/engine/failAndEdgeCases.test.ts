import { describe, it, expect } from 'vitest';
import { mainHoistMotor } from '../../src/engine/mechanism/mainHoistMotor';
import { mainHoistBrake } from '../../src/engine/mechanism/mainHoistBrake';
import { wireRope } from '../../src/engine/mechanism/wireRope';
import { ropeDrum } from '../../src/engine/mechanism/ropeDrum';
import { sheaves } from '../../src/engine/mechanism/sheaves';
import { crossTravelBrake } from '../../src/engine/mechanism/crossTravelBrake';
import { longTravelBrake } from '../../src/engine/mechanism/longTravelBrake';
import { crossTravelMotor } from '../../src/engine/mechanism/crossTravelMotor';
import { craneCategoryLookup } from '../../src/engine/mechanism/craneCategoryLookup';

describe('FAIL-case and invalid-input regression tests (BKL-018, BKL-023)', () => {

  describe('Main Hoist Motor — FAIL case', () => {
    it('returns FAIL when selected motor is undersized', () => {
      const res = mainHoistMotor.calculate({
        swlTonnes: 10.0,
        hookBlockWeightTonnes: 0.30,
        hoistingSpeedMPerMin: 5.0,
        hoistServiceFactor: 0.67,
        hoistDutyFactor: 1.50,
        motorMultiplicityFactor: 1.0,
        numberOfGearboxStages: 3,
        numberOfFalls: 4,
        ambientDeratingFactor: 0.95,
        selectedMotorKw: 5.0,  // too small (required ~10.49 kW)
        selectedMotorRpm: 935,
      });
      expect(res.status).toBe('FAIL');
    });

    it('throws on invalid SWL (zero)', () => {
      expect(() => mainHoistMotor.calculate({
        swlTonnes: 0,
        hookBlockWeightTonnes: 0.3,
        hoistingSpeedMPerMin: 5,
        hoistServiceFactor: 0.67,
        hoistDutyFactor: 1.5,
        motorMultiplicityFactor: 1,
        numberOfGearboxStages: 3,
        numberOfFalls: 4,
        ambientDeratingFactor: 0.95,
        selectedMotorKw: 13,
        selectedMotorRpm: 935,
      })).toThrow();
    });

    it('throws on negative mass', () => {
      expect(() => mainHoistMotor.calculate({
        swlTonnes: -5,
        hookBlockWeightTonnes: 0.3,
        hoistingSpeedMPerMin: 5,
        hoistServiceFactor: 0.67,
        hoistDutyFactor: 1.5,
        motorMultiplicityFactor: 1,
        numberOfGearboxStages: 3,
        numberOfFalls: 4,
        ambientDeratingFactor: 0.95,
        selectedMotorKw: 13,
        selectedMotorRpm: 935,
      })).toThrow();
    });
  });

  describe('Main Hoist Brake — FAIL case', () => {
    it('returns FAIL when selected brake is undersized', () => {
      const res = mainHoistBrake.calculate({
        requiredMotorKw: 10.4879897176,
        ambientDeratingFactor: 0.95,
        hoistServiceFactor: 0.67,
        hoistDutyFactor: 1.50,
        motorRpm: 935,
        selectedBrakeTorqueKgm: 5.0,  // too small (required ~15.5 kg-m)
      });
      expect(res.status).toBe('FAIL');
    });
  });

  describe('Wire Rope — FAIL case', () => {
    it('returns FAIL when selected rope is undersized', () => {
      const res = wireRope.calculate({
        swlTonnes: 10.0,
        hookBlockWeightTonnes: 0.30,
        coefficientOfUtilization: 5.25,
        reevingDutyFactor: 1.0,
        numberOfFalls: 4,
        selectedBreakingForceKn: 50.0,  // too small (required ~132.6 kN)
      });
      expect(res.status).toBe('FAIL');
    });
  });

  describe('Rope Drum — FAIL case', () => {
    it('returns FAIL when selected drum is undersized', () => {
      const res = ropeDrum.calculate({
        ropeDiameterMm: 16.0,
        hoistDutyFactor: 1.50,
        drumDiameterFactor: 1.0,
        selectedDrumDiameterMm: 150.0,  // too small (required 288 mm)
        hoistingHeightM: 6.0,
        numberOfFalls: 4,
        deadTurnsPerSide: 5,
        selectedGrooveDepthMm: 5.5,
        selectedGroovePitchMm: 18.0,
        centerUngroovedLengthMm: 859.438,
        endFlangeAllowanceMm: 200.0,
      });
      expect(res.status).toBe('FAIL');
    });
  });

  describe('Sheaves — FAIL case', () => {
    it('returns FAIL when selected main sheave is undersized', () => {
      const res = sheaves.calculate({
        ropeDiameterMm: 16.0,
        hoistDutyFactor: 1.50,
        sheaveFactor1: 1.0,
        sheaveFactor2: 1.0,
        selectedMainSheaveMm: 100.0,  // too small (required 288 mm)
        selectedEqualizingSheaveMm: 200.0,
      });
      expect(res.status).toBe('FAIL');
    });
  });

  describe('CT Brake — FAIL case', () => {
    it('returns FAIL when selected CT brake is undersized', () => {
      const res = crossTravelBrake.calculate({
        requiredMotorKw: 0.5982255635,
        deratingFactor: 0.95,
        brakeFactor: 1.06,
        motorRpm: 860,
        selectedBrakeTorqueKgm: 0.1,  // far too small
      });
      expect(res.status).toBe('FAIL');
    });
  });

  describe('LT Brake — FAIL case', () => {
    it('returns FAIL when selected LT brake is undersized', () => {
      const res = longTravelBrake.calculate({
        requiredMotorKw: 0.5990938154,
        deratingFactor: 0.95,
        motorRpm: 860,
        selectedBrakeTorqueKgm: 0.1,  // far too small
      });
      expect(res.status).toBe('FAIL');
    });
  });

  describe('CT Motor — invalid input', () => {
    it('throws on zero CT speed', () => {
      expect(() => crossTravelMotor.calculate({
        swlTonnes: 10.0,
        crabWeightTonnes: 2.5,
        crossTravelSpeedMPerMin: 0,  // invalid
        ctServiceFactor: 0.67,
        ctDutyFactor: 1.25,
        ctMotorMultiplicity: 1.0,
        ambientDeratingFactor: 0.95,
        ctTorqueFactor: 1.2,
        ctFrictionFactor: 8.0,
        ctAccelerationResistance: 9.597477427,
        numberOfGearboxStages: 2,
        selectedMotorKw: 0.75,
        selectedMotorRpm: 860,
      })).toThrow();
    });
  });

  describe('Crane Category Lookup', () => {
    it('returns Class II duty factor 1.25 for default selection', () => {
      const res = craneCategoryLookup.calculate({ craneClass: 'Class II / M3-M5' });
      expect(res.status).toBe('PASS');
      expect(res.outputs.dutyFactor.value).toBe(1.25);
    });

    it('returns Class III duty factor 1.5', () => {
      const res = craneCategoryLookup.calculate({ craneClass: 'Class III / M6-M7' });
      expect(res.outputs.dutyFactor.value).toBe(1.5);
    });
  });
});
