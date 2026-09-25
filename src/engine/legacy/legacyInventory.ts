/**
 * Legacy XLS Source Workbook Inventory (Tier C)
 * Explicitly cataloged per Section 65 and Section 148 of design-doc.md.
 *
 * Mandatory Rule: DO NOT GUESS FORMULAS FOR THESE FILES.
 * They are preserved in the system catalog as NOT IMPLEMENTED / ENGINEERING REVIEW REQUIRED
 * until manual engineering transcription is performed from validated engineering archives.
 */

import { CalculationToolDefinition, CalculationResult } from '../types';

export interface LegacyWorkbookEntry {
  filename: string;
  toolId: string;
  name: string;
  inferredFunction: string;
  sourceStatus: 'SOURCE_PARTIAL_XLS' | 'SOURCE_NOT_AVAILABLE';
  missingRequirements: string;
}

export const LEGACY_XLS_INVENTORY: LegacyWorkbookEntry[] = [
  { filename: 'CAL_AXLE.xls', toolId: 'legacy-cal-axle', name: 'Axle Calculation', inferredFunction: 'Axle sizing and shear/bending stress', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Binary formulas unrecoverable. Requires manual engineering transcription of axle load cases and allowable stresses.' },
  { filename: 'CAL_AXLE1.xls', toolId: 'legacy-cal-axle1', name: 'Axle Calculation (Variant 1)', inferredFunction: 'Axle sizing variant', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Binary formulas unrecoverable. Requires manual transcription.' },
  { filename: 'CAL_BOLT.xls', toolId: 'legacy-cal-bolt', name: 'Bolt Sizing Calculation', inferredFunction: 'Fastener shear and tension capacity', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Fastener grade and pre-tension formulas require manual verification.' },
  { filename: 'CAL_BUFFER.xls', toolId: 'legacy-cal-buffer', name: 'Buffer Selection Calculation', inferredFunction: 'Kinetic energy absorption (0.5*M*V^2) for LT/CT buffers', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Spring/hydraulic buffer catalog data and exact deceleration formula missing.' },
  { filename: 'CAL_Cradle(1331).xls', toolId: 'legacy-cal-cradle', name: 'Cradle Calculation', inferredFunction: 'Cradle structural sizing', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Design geometry and stress formulas require manual transcription.' },
  { filename: 'CAL_CROSS HEAD.XLS', toolId: 'legacy-cal-cross-head', name: 'Crosshead Calculation', inferredFunction: 'Hook suspension crosshead pin and bending', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Bearing contact stress and bending formulas require manual transcription.' },
  { filename: 'Cal_Gear Box.xls', toolId: 'legacy-cal-gearbox', name: 'Gearbox Sizing (Legacy)', inferredFunction: 'Detailed tooth contact and root bending stress', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'AGMA / IS 4460 gear rating parameters not extractable from binary sheet.' },
  { filename: 'CAL_PIN.xls', toolId: 'legacy-cal-pin', name: 'Pin Calculation', inferredFunction: 'Shear and bearing stress on mechanism pins', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Allowable bearing pressure tables require verification.' },
  { filename: 'CAL_PLATE.xls', toolId: 'legacy-cal-plate', name: 'Plate Calculation', inferredFunction: 'IS 2062 plate tensile and bearing capacity', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Plate dimensions and boundary conditions require transcription.' },
  { filename: 'CAL_PLATE1.xls', toolId: 'legacy-cal-plate1', name: 'Plate Calculation (Variant 1)', inferredFunction: 'Plate sizing variant', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Manual transcription required.' },
  { filename: 'CAL_PULLEY BEARING.xls', toolId: 'legacy-cal-pulley-bearing', name: 'Pulley Bearing Life', inferredFunction: 'L10h bearing life calculation for sheaves', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Dynamic capacity equations and bearing ratings require manual verification.' },
  { filename: 'CAL_ROPE DRUM THK.xls', toolId: 'legacy-cal-rope-drum-thk', name: 'Rope Drum Thickness (Legacy)', inferredFunction: 'Drum shell crush and bending thickness', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Corroborates .xlsx drum tool; exact formulas require verification.' },
  { filename: 'CAL_SHACKLE PLATE.xls', toolId: 'legacy-cal-shackle-plate', name: 'Shackle Plate Calculation', inferredFunction: 'Shackle plate tension and tear-out shear', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Geometry and eye-hole tearout formulas require transcription.' },
  { filename: 'CAL_Trolley Structure.xls', toolId: 'legacy-cal-trolley-structure', name: 'Trolley Structure (Legacy)', inferredFunction: 'Structural analysis of trolley frame members', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Beam member profiles and section moments require transcription.' },
  { filename: 'CAL_WHEEL BEARING LIFE.xls', toolId: 'legacy-cal-wheel-bearing', name: 'Wheel Bearing Life', inferredFunction: 'L10h life for spherical/taper roller wheel bearings', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Radial/thrust load factors and bearing catalog numbers require verification.' },
  { filename: 'Crane Mechanism.xls', toolId: 'legacy-crane-mechanism', name: 'Older Crane Mechanism', inferredFunction: 'Pre-standard crane mechanism calculations', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Superseded by validated 01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx.' },
  { filename: 'Gear PCD & OD.xls', toolId: 'legacy-gear-pcd-od', name: 'Gear PCD & OD Geometry', inferredFunction: 'Module, teeth, helix, pitch and outside diameter', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Tooth addendum/dedendum rules and correction coefficients require transcription.' },
  { filename: 'Mechanism Calculation-OUTDOOR CRANE-IS3177.xls', toolId: 'legacy-outdoor-mechanism', name: 'Outdoor Crane Mechanism', inferredFunction: 'Wind force effects on cross-travel and bridge drive power', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Rw, V, and storm wind resistance coefficients require engineering review.' },
  { filename: 'NUTRAL AXIS_CAL.xls', toolId: 'legacy-neutral-axis', name: 'Neutral Axis Calculation', inferredFunction: 'Complex composite beam centroid derivation', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Geometry inputs require manual transcription.' },
  { filename: 'ROPE-RATIO.xls', toolId: 'legacy-rope-ratio', name: 'Rope Ratio Tool', inferredFunction: 'Reeving efficiency and fall geometry ratios', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Lookup tables require manual extraction.' },
  { filename: 'STD CALULATION.xls', toolId: 'legacy-std-calculation', name: 'Standard Calculations', inferredFunction: 'Assorted mechanical engineering formulas', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Manual inventory review required.' },
  { filename: 'WEIGHT.xls', toolId: 'legacy-weight', name: 'Weight Calculation', inferredFunction: 'Component weight tables', sourceStatus: 'SOURCE_PARTIAL_XLS', missingRequirements: 'Corroborates CRAB WT sheet.' },
];

/**
 * Creates disabled Tier C stub tools for legacy files
 */
export function createLegacyToolDefinition(entry: LegacyWorkbookEntry): CalculationToolDefinition {
  return {
    id: entry.toolId,
    version: '0.0.0',
    name: entry.name,
    category: 'LEGACY_INVENTORY',
    tier: 'C',
    reviewStatus: 'ENGINEERING REVIEW REQUIRED',
    description: `[NOT IMPLEMENTED] ${entry.inferredFunction}. Requires manual engineering transcription from source: ${entry.filename}.`,
    sourceWorkbook: entry.filename,
    sourceSheets: ['RAW_XLS'],
    inputs: [],
    outputs: [],
    dependencies: [],
    calculate: (_inputs: Record<string, any>): CalculationResult => {
      return {
        toolId: entry.toolId,
        toolVersion: '0.0.0',
        status: 'WARNING',
        inputsUsed: {},
        derived: {},
        outputs: {},
        checks: [
          {
            id: `CHK-${entry.toolId}-GATED`,
            name: 'Formula Transcription Gate',
            status: 'WARNING',
            actual: 'Not Transcribed',
            criterion: 'Manual engineering review and formula transcription required',
            message: `This tool is disabled. Source workbook "${entry.filename}" cannot be safely transcribed without independent engineering review. ${entry.missingRequirements}`,
          },
        ],
        steps: [],
        assumptions: ['Tool is gated; no calculation was executed.'],
        warnings: [
          `NOT IMPLEMENTED: Source workbook "${entry.filename}" requires manual engineering review.`,
          entry.missingRequirements,
        ],
        standardReferences: [],
        sourceLineage: {
          workbook: entry.filename,
          sheet: 'ALL',
          status: entry.sourceStatus,
          notes: entry.missingRequirements,
        },
      };
    },
  };
}
