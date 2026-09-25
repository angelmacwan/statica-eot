import { describe, it, expect } from 'vitest';
import { mainHoistMotor } from '../../src/engine/mechanism/mainHoistMotor';
import { mainHoistBrake } from '../../src/engine/mechanism/mainHoistBrake';
import { wireRope } from '../../src/engine/mechanism/wireRope';
import { ropeDrum } from '../../src/engine/mechanism/ropeDrum';
import { hoistGearbox } from '../../src/engine/mechanism/hoistGearbox';
import { sheaves } from '../../src/engine/mechanism/sheaves';

import { crossTravelMotor } from '../../src/engine/mechanism/crossTravelMotor';
import { crossTravelBrake } from '../../src/engine/mechanism/crossTravelBrake';
import { crossTravelWheel } from '../../src/engine/mechanism/crossTravelWheel';
import { crossTravelGearbox } from '../../src/engine/mechanism/crossTravelGearbox';

import { longTravelMotor } from '../../src/engine/mechanism/longTravelMotor';
import { longTravelBrake } from '../../src/engine/mechanism/longTravelBrake';
import { longTravelWheel } from '../../src/engine/mechanism/longTravelWheel';
import { longTravelGearbox } from '../../src/engine/mechanism/longTravelGearbox';

import { crabWeight } from '../../src/engine/mechanism/crabWeight';
import { wheelRailHardness } from '../../src/engine/mechanism/wheelRailHardness';

describe('Mandatory Golden Regression Fixtures (Section 91 & Section 10/11)', () => {
  describe('1. Main Hoist Mechanism Suite', () => {
    it('calculates main hoist motor power matching golden value (10.4879897176 kW, 14.0643942112 HP)', () => {
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
        selectedMotorKw: 13.0,
        selectedMotorRpm: 935,
      });

      expect(res.status).toBe('PASS');
      const kw = res.outputs.requiredMotorKw.value as number;
      const hp = res.outputs.requiredMotorHp.value as number;
      expect(kw).toBeCloseTo(10.4879897176, 5);
      expect(hp).toBeCloseTo(14.0643942112, 5);
    });

    it('calculates main hoist brake torque matching golden value (15.5072240017 kg-m, 152.073918257 N-m)', () => {
      const res = mainHoistBrake.calculate({
        requiredMotorKw: 10.4879897176,
        ambientDeratingFactor: 0.95,
        hoistServiceFactor: 0.67,
        hoistDutyFactor: 1.50,
        motorRpm: 935,
        selectedBrakeTorqueKgm: 20.0,
      });

      expect(res.status).toBe('PASS');
      const kgm = res.outputs.requiredBrakeTorqueKgm.value as number;
      const nm = res.outputs.requiredBrakeTorqueNm.value as number;
      expect(kgm).toBeCloseTo(15.5072240017, 5);
      expect(nm).toBeCloseTo(152.073918257, 4);
    });

    it('calculates wire rope load matching golden value (13.51875 t, 132.6189375 kN)', () => {
      const res = wireRope.calculate({
        swlTonnes: 10.0,
        hookBlockWeightTonnes: 0.30,
        coefficientOfUtilization: 5.25,
        reevingDutyFactor: 1.0,
        numberOfFalls: 4,
        selectedBreakingForceKn: 149.0,
      });

      expect(res.status).toBe('PASS');
      const tonnes = res.outputs.requiredBreakingLoadTonnes.value as number;
      const kn = res.outputs.requiredBreakingForceKn.value as number;
      expect(tonnes).toBeCloseTo(13.51875, 5);
      expect(kn).toBeCloseTo(132.6189375, 4);
    });

    it('calculates rope drum dimensions matching golden values (req 288 mm, L/D 5.8411, thickness 23.6067 mm)', () => {
      const res = ropeDrum.calculate({
        ropeDiameterMm: 16.0,
        hoistDutyFactor: 1.50,
        drumDiameterFactor: 1.0,
        selectedDrumDiameterMm: 320.0,
        hoistingHeightM: 6.0,
        numberOfFalls: 4,
        deadTurnsPerSide: 5,
        selectedGrooveDepthMm: 5.5,
        selectedGroovePitchMm: 18.0,
        centerUngroovedLengthMm: 859.438,
        endFlangeAllowanceMm: 200.0,
      });

      expect(res.status).toBe('PASS');
      expect(res.outputs.requiredDrumDiameterMm.value).toBe(288);
      const ld = res.outputs.lengthOverDiameterRatio.value as number;
      expect(ld).toBeCloseTo(5.8411, 3);
      const thk = res.outputs.totalDrumThicknessMm.value as number;
      expect(thk).toBeCloseTo(23.6067, 3);
    });

    it('calculates hoist gearbox ratio and actual speed (ratio 93.99645, actual speed 4.54587 m/min -> PASS)', () => {
      const res = hoistGearbox.calculate({
        selectedDrumDiameterMm: 320.0,
        motorRpm: 935.0,
        requiredHoistSpeedMPerMin: 5.0,
        numberOfFalls: 4,
        selectedRatio: 103.4,
      });

      expect(res.status).toBe('PASS');
      const ratio = res.outputs.requiredRatio.value as number;
      const speed = res.outputs.actualHoistSpeedMPerMin.value as number;
      expect(ratio).toBeCloseTo(93.99645, 4);
      expect(speed).toBeCloseTo(4.54587, 4);
    });

    it('calculates main and equalizer sheaves (req 288 mm and 192 mm)', () => {
      const res = sheaves.calculate({
        ropeDiameterMm: 16.0,
        hoistDutyFactor: 1.50,
        selectedMainSheaveMm: 320.0,
        selectedEqualizingSheaveMm: 200.0,
      });

      expect(res.status).toBe('PASS');
      expect(res.outputs.requiredMainSheaveMm.value).toBe(288);
      expect(res.outputs.requiredEqualizingSheaveMm.value).toBe(192);
    });
  });

  describe('2. Cross Travel Mechanism Suite', () => {
    it('calculates CT motor power (0.5982255635 kW, 0.8022204806 HP)', () => {
      const res = crossTravelMotor.calculate({
        swlTonnes: 10.0,
        crabWeightTonnes: 2.5,
        crossTravelSpeedMPerMin: 20.0,
        ctServiceFactor: 0.67,
        ctDutyFactor: 1.25,
        ctMotorMultiplicity: 1.0,
        ambientDeratingFactor: 0.95,
        ctTorqueFactor: 1.2,
        ctFrictionFactor: 8.0,
        ctAccelerationResistance: 9.597477426966066,
        numberOfGearboxStages: 2,
        selectedMotorKw: 0.75,
        selectedMotorRpm: 860,
      });

      expect(res.status).toBe('PASS');
      const kw = res.outputs.requiredMotorKw.value as number;
      const hp = res.outputs.requiredMotorHp.value as number;
      expect(kw).toBeCloseTo(0.5982255635, 5);
      expect(hp).toBeCloseTo(0.8022204806, 5);
    });

    it('calculates CT brake torque (0.6078394342 kg-m, 5.960868587 N-m)', () => {
      const res = crossTravelBrake.calculate({
        requiredMotorKw: 0.5982255635,
        deratingFactor: 0.95,
        brakeFactor: 1.06,
        motorRpm: 860,
        selectedBrakeTorqueKgm: 6.0,
      });

      expect(res.status).toBe('PASS');
      const kgm = res.outputs.requiredBrakeTorqueKgm.value as number;
      const nm = res.outputs.requiredBrakeTorqueNm.value as number;
      expect(kgm).toBeCloseTo(0.6078394342, 5);
      expect(nm).toBeCloseTo(5.960868587, 4);
    });

    it('calculates CT wheel loads and wheel diameter (Pmax 3.75t, Pmin 2.75t, Pmean 3.4167t, dia 134.3055mm, rpm 39.7836)', () => {
      const res = crossTravelWheel.calculate({
        swlTonnes: 10.0,
        crabWeightTonnes: 2.5,
        wheelCount: 4,
        crossTravelSpeedMPerMin: 20.0,
        selectedWheelDiameterMm: 160.0,
      });

      expect(res.status).toBe('PASS');
      expect(res.outputs.pMaxTonnes.value).toBeCloseTo(3.75, 2);
      expect(res.outputs.pMinTonnes.value).toBeCloseTo(2.75, 2);
      expect(res.outputs.pMeanTonnes.value).toBeCloseTo(3.416666667, 5);
      expect(res.outputs.pMeanNewtons.value).toBeCloseTo(33517.5, 1);
      expect(res.outputs.requiredWheelDiameterMm.value).toBeCloseTo(134.3055, 3);
      expect(res.outputs.wheelRpm.value).toBeCloseTo(39.7836, 3);
    });

    it('calculates CT gearbox ratio and actual speed (ratio 21.61416, speed 20.1088 m/min -> PASS)', () => {
      const res = crossTravelGearbox.calculate({
        selectedWheelDiameterMm: 160.0,
        motorRpm: 860.0,
        requiredSpeedMPerMin: 20.0,
        selectedRatio: 21.5,
      });

      expect(res.status).toBe('PASS');
      const ratio = res.outputs.requiredRatio.value as number;
      const speed = res.outputs.actualSpeedMPerMin.value as number;
      expect(ratio).toBeCloseTo(21.61416, 4);
      expect(speed).toBeCloseTo(20.1088, 4);
    });
  });

  describe('3. Long Travel Mechanism Suite & Mandatory Critical Regression Test', () => {
    it('calculates LT motor power (0.5990938154 kW, 0.8033848064 HP)', () => {
      const res = longTravelMotor.calculate({
        swlTonnes: 10.0,
        craneDeadWeightTonnes: 7.5,
        longTravelSpeedMPerMin: 20.0,
        ltServiceFactor: 0.67,
        ltDutyFactor: 1.25,
        ltMotorMultiplicity: 1.0,
        ambientDeratingFactor: 0.95,
        ltTorqueFactor: 1.2,
        ltFrictionFactor: 10.0,
        ltAccelerationResistance: 3.4225406215836034,
        numberOfGearboxStages: 2,
        selectedMotorKw: 1.5,
        selectedMotorRpm: 860,
      });

      expect(res.status).toBe('PASS');
      const kw = res.outputs.requiredMotorKw.value as number;
      const hp = res.outputs.requiredMotorHp.value as number;
      expect(kw).toBeCloseTo(0.5990938154, 5);
      expect(hp).toBeCloseTo(0.8033848064, 5);
    });

    it('calculates LT brake torque (0.6452449378 kg-m, 6.327691269 N-m)', () => {
      const res = longTravelBrake.calculate({
        requiredMotorKw: 0.5990938154,
        deratingFactor: 0.95,
        motorRpm: 860,
        selectedBrakeTorqueKgm: 6.0,
      });

      expect(res.status).toBe('PASS');
      const kgm = res.outputs.requiredBrakeTorqueKgm.value as number;
      const nm = res.outputs.requiredBrakeTorqueNm.value as number;
      expect(kgm).toBeCloseTo(0.6452449378, 5);
      expect(nm).toBeCloseTo(6.327691269, 4);
    });

    it('calculates LT wheel loads and diameter (Pmax 8.35t, Pmin 3.15t, Pmean 6.6167t, dia 179.51085mm, rpm 31.82686)', () => {
      const res = longTravelWheel.calculate({
        swlTonnes: 10.0,
        crabWeightTonnes: 2.5,
        craneDeadWeightTonnes: 10.5,
        spanM: 10.0,
        hookApproachM: 0.85,
        wheelCount: 4,
        longTravelSpeedMPerMin: 20.0,
        selectedWheelDiameterMm: 200.0,
      });

      expect(res.status).toBe('PASS');
      expect(res.outputs.pMaxTonnes.value).toBeCloseTo(8.35, 2);
      expect(res.outputs.pMinTonnes.value).toBeCloseTo(3.15, 2);
      expect(res.outputs.pMeanTonnes.value).toBeCloseTo(6.616666667, 5);
      expect(res.outputs.pMeanNewtons.value).toBeCloseTo(64909.5, 1);
      expect(res.outputs.requiredWheelDiameterMm.value).toBeCloseTo(179.51085, 3);
      expect(res.outputs.wheelRpm.value).toBeCloseTo(31.82686, 4);
    });

    it('CRITICAL REGRESSION TEST: LT gearbox MUST numerically derive FAIL when actual speed is ~25.136 m/min outside [18, 22] m/min', () => {
      const res = longTravelGearbox.calculate({
        selectedWheelDiameterMm: 200.0,
        motorRpm: 860.0,
        requiredSpeedMPerMin: 20.0,
        selectedRatio: 21.5,
      });

      // MUST FAIL
      expect(res.status).toBe('FAIL');
      const speed = res.outputs.actualHoistSpeedMPerMin?.value ?? res.outputs.actualSpeedMPerMin.value as number;
      expect(speed).toBeCloseTo(25.136, 2);
      const ratio = res.outputs.requiredRatio.value as number;
      expect(ratio).toBeCloseTo(27.0177, 3);

      const check = res.checks.find((c) => c.id === 'CHK-LT-SPEED-TOLERANCE');
      expect(check).toBeDefined();
      expect(check?.status).toBe('FAIL');
    });
  });

  describe('4. Hardness and Crab Weight Suites', () => {
    it('surfaces hardness calculation discrepancy as WARNING / Review Required (284.913 BHN vs 300 BHN)', () => {
      const res = wheelRailHardness.calculate({
        railHardnessBhn: 200.0,
        loadDistributionFactor: 1.29,
        wheelGeometryFactor: 1.08,
        coefficientFactor: 1.09,
        minRecommendedHardnessBhn: 300.0,
      });

      expect(res.status).toBe('WARNING');
      const bhn = res.outputs.calculatedWheelHardnessBhn.value as number;
      expect(bhn).toBeCloseTo(284.913, 2);
      expect(res.warnings.length).toBeGreaterThan(0);
    });

    it('calculates crab weight breakdown (net 2499 kg, factored 3123.75 kg = 3.12375 t)', () => {
      const res = crabWeight.calculate({
        hoistGearboxKg: 450,
        hoistMotorKg: 123,
        hoistBrakeKg: 27,
        ropeDrumKg: 400,
        drumPedestalKg: 30,
        bottomBlockKg: 260,
        upperPulleyKg: 0,
        equalizingPulleyKg: 50,
        wireRopeTotalKg: 95,
        ctGearboxKg: 150,
        ctMotorKg: 7,
        ctBrakeKg: 17,
        ctWheelsKg: 140,
        ctCouplingsKg: 20,
        ctFloatingShaftKg: 30,
        trolleyStructureKg: 700,
        allowanceFactor: 1.25,
      });

      expect(res.status).toBe('PASS');
      expect(res.outputs.hoistMachineryTotalKg.value).toBe(1435);
      expect(res.outputs.ctMachineryTotalKg.value).toBe(364);
      expect(res.outputs.netCrabWeightKg.value).toBe(2499);
      expect(res.outputs.factoredCrabWeightKg.value).toBe(3123.75);
      expect(res.outputs.factoredCrabWeightTonnes.value).toBe(3.12375);
    });
  });
});
