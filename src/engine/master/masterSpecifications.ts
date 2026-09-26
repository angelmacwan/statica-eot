/**
 * Master Crane Specifications Model & Defaults
 * Source: SPECIFICATIONS sheet from 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
 * Version: 2026.09.01
 */

import { InputDefinition } from '../types';

export interface MasterCraneInputs {
  // Crane identification
  craneType: 'EOT' | 'Gantry' | 'Other';
  designStandard: string;
  dutyClass: string;
  location: 'INDOOR' | 'OUTDOOR';

  // Geometry
  spanM: number;
  hookApproachM: number;
  hoistHeightM: number;

  // Loads
  swlTonnes: number;
  crabWeightTonnes: number;
  craneDeadWeightTonnes: number;
  hookBlockWeightTonnes: number;

  // Speeds
  hoistingSpeedMPerMin: number;
  crossTravelSpeedMPerMin: number;
  longTravelSpeedMPerMin: number;

  // Reeving
  numberOfFalls: number;

  // Factors from workbook SPECIFICATIONS sheet
  ambientDeratingFactor: number; // C9 in MH (0.95)
  structuralImpactFactor: number;
  hoistDutyFactor: number; // C20 (1.5)
  hoistServiceFactor: number; // C21 (0.67)
  motorMultiplicityFactor: number; // C23 (1.0)
  numberOfGearboxStages: number; // C24 (3)
  coefficientOfUtilization: number; // C25 (5.25)
  drumDiameterFactor: number; // C26 (1.0)

  // Cross Travel Factors
  ctDutyFactor: number;
  ctServiceFactor: number;
  ctTorqueFactor: number; // 1.2
  ctFrictionFactor: number; // 8.0 kg/t
  ctAcceleration: number; // 0.15 m/s^2
  ctMotorMultiplicity: number; // 1.0

  // Long Travel Factors
  ltDutyFactor: number;
  ltServiceFactor: number;
  ltTorqueFactor: number; // 1.2
  ltFrictionFactor: number; // 10.0 kg/t
  ltAcceleration: number; // 0.15 m/s^2
  ltMotorMultiplicity: number; // 1.0

  // Wheels and Rail
  wheelCount: number;
  ctWheelCount: number;
  railHeadWidthMm: number;
}

export const DEFAULT_MASTER_SPECIFICATIONS: MasterCraneInputs = {
  craneType: 'EOT',
  designStandard: 'IS 3177:1999 & IS 807',
  dutyClass: 'Class II / M5',
  location: 'INDOOR',

  // Geometry
  spanM: 10.0,
  hookApproachM: 0.9,
  hoistHeightM: 6.0,

  // Loads
  swlTonnes: 10.0,
  crabWeightTonnes: 2.5,
  craneDeadWeightTonnes: 7.5,
  hookBlockWeightTonnes: 0.3,

  // Speeds
  hoistingSpeedMPerMin: 5.0,
  crossTravelSpeedMPerMin: 20.0,
  longTravelSpeedMPerMin: 20.0,

  // Reeving
  numberOfFalls: 4,

  // Hoist Factors (Golden workbook values)
  ambientDeratingFactor: 0.95,
  structuralImpactFactor: 1.25,
  hoistDutyFactor: 1.5,
  hoistServiceFactor: 0.67,
  motorMultiplicityFactor: 1.0,
  numberOfGearboxStages: 3,
  coefficientOfUtilization: 5.25,
  drumDiameterFactor: 1.0,

  // CT Factors
  ctDutyFactor: 1.25,
  ctServiceFactor: 0.67,
  ctTorqueFactor: 1.2,
  ctFrictionFactor: 8.0,
  ctAcceleration: 0.15,
  ctMotorMultiplicity: 1.0,

  // LT Factors
  ltDutyFactor: 1.25,
  ltServiceFactor: 0.67,
  ltTorqueFactor: 1.2,
  ltFrictionFactor: 10.0,
  ltAcceleration: 0.15,
  ltMotorMultiplicity: 1.0,

  // Wheels
  wheelCount: 4,
  ctWheelCount: 4,
  railHeadWidthMm: 50.0,
};

export const MASTER_SPEC_INPUT_DEFINITIONS: InputDefinition[] = [
  {
    key: 'swlTonnes',
    label: 'Safe Working Load (SWL)',
    unit: 't',
    type: 'number',
    defaultValue: 10.0,
    required: true,
    min: 0.1,
    step: 0.5,
    description: 'Rated capacity of the crane',
  },
  {
    key: 'spanM',
    label: 'Crane Span',
    unit: 'm',
    type: 'number',
    defaultValue: 10.0,
    required: true,
    min: 1.0,
    step: 0.5,
    description: 'Center-to-center distance of runway rails',
  },
  {
    key: 'hoistHeightM',
    label: 'Hoisting Height',
    unit: 'm',
    type: 'number',
    defaultValue: 6.0,
    required: true,
    min: 1.0,
    step: 0.5,
    description: 'Maximum lift height of hook',
  },
  {
    key: 'hoistingSpeedMPerMin',
    label: 'Hoisting Speed',
    unit: 'm/min',
    type: 'number',
    defaultValue: 5.0,
    required: true,
    min: 0.5,
    step: 0.5,
    description: 'Rated vertical lifting speed',
  },
  {
    key: 'crossTravelSpeedMPerMin',
    label: 'Cross Travel Speed',
    unit: 'm/min',
    type: 'number',
    defaultValue: 20.0,
    required: true,
    min: 1.0,
    step: 1.0,
    description: 'Trolley cross travel speed',
  },
  {
    key: 'longTravelSpeedMPerMin',
    label: 'Long Travel Speed',
    unit: 'm/min',
    type: 'number',
    defaultValue: 20.0,
    required: true,
    min: 1.0,
    step: 1.0,
    description: 'Crane long travel speed',
  },
  {
    key: 'numberOfFalls',
    label: 'Number of Falls',
    unit: 'falls',
    type: 'number',
    defaultValue: 4,
    required: true,
    min: 1,
    step: 1,
    description: 'Total rope falls supporting the bottom block',
  },
  {
    key: 'hookBlockWeightTonnes',
    label: 'Hook Block Weight',
    unit: 't',
    type: 'number',
    defaultValue: 0.3,
    required: true,
    min: 0.01,
    step: 0.05,
    description: 'Dead weight of bottom pulley hook block',
  },
  {
    key: 'crabWeightTonnes',
    label: 'Crab (Trolley) Weight',
    unit: 't',
    type: 'number',
    defaultValue: 2.5,
    required: true,
    min: 0.1,
    step: 0.1,
    description: 'Weight of the cross-travel crab structure and machinery',
  },
  {
    key: 'craneDeadWeightTonnes',
    label: 'Crane Dead Weight',
    unit: 't',
    type: 'number',
    defaultValue: 7.5,
    required: true,
    min: 0.5,
    step: 0.5,
    description: 'Total dead weight of bridge and components excluding crab',
  },
  {
    key: 'hookApproachM',
    label: 'Hook Approach',
    unit: 'm',
    type: 'number',
    defaultValue: 0.9,
    required: true,
    min: 0.1,
    step: 0.05,
    description: 'Minimum hook distance from end rail center',
  },
  {
    key: 'dutyClass',
    label: 'Crane Duty Classification',
    unit: '',
    type: 'select',
    defaultValue: 'Class II / M5',
    required: true,
    options: [
      { label: 'Class I (Light / M3)', value: 'Class I / M3' },
      { label: 'Class II (Medium / M5)', value: 'Class II / M5' },
      { label: 'Class III (Heavy / M7)', value: 'Class III / M7' },
      { label: 'Class IV (Extra Heavy / M8)', value: 'Class IV / M8' },
    ],
    description: 'Operating duty classification per IS 3177 / IS 807',
  },
  {
    key: 'ambientDeratingFactor',
    label: 'Ambient Derating Factor',
    unit: '',
    type: 'number',
    defaultValue: 0.95,
    required: true,
    min: 0.5,
    max: 1.0,
    step: 0.01,
    description: 'Motor ambient derating factor (default 0.95 for 40°C)',
  },
  {
    key: 'hoistDutyFactor',
    label: 'Hoist Duty Factor',
    unit: '',
    type: 'number',
    defaultValue: 1.5,
    required: true,
    min: 1.0,
    max: 3.0,
    step: 0.05,
    description: 'Safety factor for hoisting mechanism per IS 3177',
  },
  {
    key: 'hoistServiceFactor',
    label: 'Hoist Service Factor',
    unit: '',
    type: 'number',
    defaultValue: 0.67,
    required: true,
    min: 0.1,
    max: 2.0,
    step: 0.01,
    description: 'Service duty multiplying factor',
  },
  {
    key: 'ctDutyFactor',
    label: 'Cross Travel Duty Factor',
    unit: '',
    type: 'number',
    defaultValue: 1.25,
    required: true,
    min: 1.0,
    max: 2.5,
    step: 0.05,
    description: 'Cross travel mechanism duty factor',
  },
  {
    key: 'ltDutyFactor',
    label: 'Long Travel Duty Factor',
    unit: '',
    type: 'number',
    defaultValue: 1.25,
    required: true,
    min: 1.0,
    max: 2.5,
    step: 0.05,
    description: 'Long travel mechanism duty factor',
  },
];
