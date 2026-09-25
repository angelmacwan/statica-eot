# EOT Crane Engineering Platform MVP

## Product + Technical Design Specification

### StaticaLabs | `eot.staticalabs.com`

**Document version:** 0.1.0  
**Date:** 2026-09-25  
**Status:** Engineering design specification for implementation and review  
**Intended consumer:** AI coding model, software engineer, engineering reviewer  
**Primary source material:** `MAC_CALCULATIONS.zip` and the Excel workbooks contained in it

---

# 1. Executive Summary

This document specifies the MVP for a browser-based engineering calculation platform for EOT cranes, gantry cranes, and related mechanical/structural calculations.

The product is a React application built with Vite and hosted on Cloudflare Pages at:

`https://eot.staticalabs.com`

Authentication is Google-only using Firebase Authentication. Project data, tool inputs, saved calculation snapshots, and report metadata are stored in Cloud Firestore.

The engineering calculation engine is intentionally client-side and hardcoded in the React application for the MVP. There is no calculation backend. Every calculation is deterministic and must be reproducible from:

1. tool version,
2. input values,
3. catalog/reference data version,
4. formula definitions,
5. source workbook lineage,
6. standard/reference metadata.

The application is organized around **Projects** and **Calculation Tools**.

A user creates a project such as:

> `10T EOT Crane - ABC Factory`

The project can contain multiple calculation tools:

- Main Hoisting Motor
- Main Hoisting Brake
- Wire Rope
- Rope Drum
- Hoisting Gearbox
- Sheave
- Cross Travel Motor
- Cross Travel Brake
- Cross Travel Wheels
- Cross Travel Gearbox
- Long Travel Motor
- Long Travel Brake
- Long Travel Wheels
- Long Travel Gearbox
- Crab Weight
- Wheel/Rail Hardness
- Box Beam Properties
- Bending Moment
- Gantry Girder
- Gantry Leg

The user enters engineering inputs, edits them at any time, and sees recalculated outputs. Tool instances are saved inside the project.

A report builder allows the user to choose which tool results appear in a detailed engineering report. The report must include not only final answers but the calculation chain:

- inputs,
- units,
- assumptions,
- formula,
- substituted formula,
- intermediate values,
- selected component,
- required value,
- actual value,
- checks,
- PASS/WARNING/FAIL status,
- workbook source reference,
- standard reference,
- calculation engine version.

A future optional feature can generate a preliminary design representation from the calculation results. This must initially be treated as a design-assist feature and not as a certified fabrication drawing generator.

## Critical safety principle

The Excel files are the legacy source implementation, not proof of correctness.

The application must never silently "improve" or invent missing engineering formulas.

Where a legacy `.xls` file cannot be reliably extracted and validated, the corresponding tool must remain disabled until the formula has been manually transcribed and independently engineering-reviewed.

The system must calculate PASS/FAIL from actual numeric checks. It must never copy narrative cells such as "OK" from the spreadsheets and display them as authoritative.

A critical example discovered during workbook inspection:

- Long-travel gearbox sample selected ratio: 21.5
- Calculated actual LT speed: approximately 25.136 m/min
- Required speed: 20 m/min
- Allowed range in workbook: 18 to 22 m/min
- Result: numerically outside the stated range

Therefore the product's validation engine must derive the failure itself.

Another example:

- Hardness workbook formula gives approximately 284.91 BHN for the sample values.
- The workbook text describes a minimum range around 300 to 350 BHN.
- This discrepancy must be surfaced for engineering review rather than hidden.

---

# 2. Product Goals

## 2.1 MVP goals

The MVP must let an engineer:

1. Sign in with Google.
2. Create a project.
3. Define master crane specifications.
4. Add multiple calculation tools to the project.
5. Enter and edit inputs for every tool.
6. Recalculate tools deterministically.
7. See calculations and intermediate steps.
8. See component selections and checks.
9. See dependency warnings when upstream inputs change.
10. Generate a detailed report from selected tool outputs.
11. Print/save the report as PDF using the browser print workflow.
12. Reopen the project later with the same inputs and calculation history metadata.
13. Clearly identify legacy formulas versus validated formulas.
14. Prevent calculations with invalid, missing, non-finite, or physically impossible inputs.
15. Preserve tool and calculation engine version information.

## 2.2 Non-goals for MVP

Do not implement these as production engineering features in MVP unless an engineering reviewer explicitly enables them:

- automatic CAD fabrication drawings,
- automatic DXF generation,
- manufacturing drawings,
- certified compliance claims,
- automatic standard-version migration,
- AI-generated engineering formulas,
- automatic selection of components when the workbook does not define a deterministic selection rule,
- automatic structural optimization,
- collaborative multi-user editing,
- public sharing of projects,
- organization/team permissions,
- subscription billing,
- server-side calculation execution.

---

# 3. Source Workbook Audit

## 3.1 Files inspected

The uploaded ZIP contained 29 files.

### `.xlsx` files with reliably extractable formulas and values

1. `01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx`
2. `MAC-CRANE MECHANISM CALCULATION-IS3177.xlsx`
3. `GIRDER _CALC_40T & 60T GANTRY CRANE.xlsx`
4. `LEG CALCULATION FOR GANTRY CRANE.xlsx`
5. `MAC-Box Beam-Properties.xlsx`

### Legacy `.xls` files

1. `CAL_AXLE.xls`
2. `CAL_AXLE1.xls`
3. `CAL_BOLT.xls`
4. `CAL_BUFFER.xls`
5. `CAL_Cradle(1331).xls`
6. `CAL_CROSS HEAD.XLS`
7. `Cal_Gear Box.xls`
8. `CAL_PIN.xls`
9. `CAL_PLATE.xls`
10. `CAL_PLATE1.xls`
11. `CAL_PULLEY BEARING.xls`
12. `CAL_ROPE DRUM THK.xls`
13. `CAL_SHACKLE PLATE.xls`
14. `CAL_Trolley Structure.xls`
15. `CAL_WHEEL BEARING LIFE.xls`
16. `Crane Mechanism.xls`
17. `Gear PCD & OD.xls`
18. `Mechanism Calculation-OUTDOOR CRANE-IS3177.xls`
19. `NUTRAL AXIS_CAL.xls`
20. `ROPE-RATIO.xls`
21. `STD CALULATION.xls`
22. `WEIGHT.xls`

### Temporary Excel lock file

`~$01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx`

This is a temporary Excel lock file and must not be treated as a source workbook.

---

# 4. Source Reliability Policy

There are three source states.

## SOURCE_VERIFIED_XLSX

Used where the workbook's XML formulas and cached values were directly extractable.

These formulas can be transcribed into code, but they are still legacy engineering formulas and require engineering review before production use.

## SOURCE_PARTIAL_XLS

Used where only workbook text, labels, or strings could be extracted reliably.

No production formula is to be implemented from this state without manual transcription and verification.

## SOURCE_NOT_AVAILABLE

Used where the calculation content could not be sufficiently reconstructed.

The UI must not pretend that a calculation exists simply because a legacy workbook exists.

---

# 5. Engineering Standard Migration Gate

The mechanism workbooks explicitly cite legacy standards, including text such as:

- `IS : 3177 -1999-2006 & IS : 807`
- `IS3177:1999`
- `IS 807`
- older `IS 800` references in structural workbooks

Current BIS records need to be treated separately from workbook lineage.

As of the document date:

- BIS lists `IS 3177:2020` as the third revision for electric overhead travelling and gantry cranes, reviewed in 2025.
- BIS lists `IS 807:2006` as the second revision for design, erection and testing of the structural portion of cranes and hoists, reviewed in 2026.
- BIS lists `IS 800:2007` for general construction in steel, reviewed in 2022.

The MVP must therefore distinguish:

`source standard reference`

from

`current standard status`

and must never display:

> "Complies with IS 3177:2020"

merely because a legacy workbook says:

> `IS3177:1999`.

## Required metadata on every formula

```ts
type StandardReference = {
	standard: string;
	version?: string;
	clause?: string;
	sourceType:
		| 'workbook-note'
		| 'engineering-reviewed'
		| 'current-bis-reference';
	status: 'legacy-source' | 'review-required' | 'validated';
};
```

Until an engineer completes the standard crosswalk, every formula inherited from the workbook must be marked:

`status = "review-required"`

---

# 6. High-Level Product Architecture

```text
Browser
  |
  +-- React + Vite
  |
  +-- Auth Context
  |      |
  |      +-- Firebase Authentication
  |              |
  |              +-- Google only
  |
  +-- Project State
  |
  +-- Calculation Engine
  |      |
  |      +-- Hardcoded deterministic tools
  |      +-- Catalogs
  |      +-- Unit helpers
  |      +-- Validation
  |      +-- Calculation traces
  |
  +-- Report Builder
  |
  +-- Firestore Adapter
         |
         +-- Firebase Cloud Firestore

Hosting:
Cloudflare Pages
  |
  +-- Vite build
  +-- static assets
```

No Node server is required for the calculation engine.

---

# 7. Technology Stack

## Required

- React
- Vite
- TypeScript
- Firebase Authentication
- Firebase Cloud Firestore
- React Router
- CSS framework or component styling system suitable for a professional engineering application
- Vitest
- React Testing Library
- ESLint
- Prettier

## Recommended UI dependencies

Use a restrained set of dependencies:

- `react-router-dom`
- `firebase`
- `react-hook-form`
- `zod`
- `lucide-react`

A utility CSS solution such as Tailwind is acceptable.

Do not use:

- Next.js
- Create React App
- server-rendered React
- backend calculation services
- spreadsheet formula parsers at runtime
- Excel files as runtime dependencies

---

# 8. Firebase Authentication

## Login requirement

Google login only.

No:

- email/password,
- magic links,
- phone auth,
- anonymous auth.

Firebase's web SDK supports Google authentication through `GoogleAuthProvider`, with popup or redirect flows.

Desktop:

```ts
signInWithPopup(auth, provider);
```

Mobile:

```ts
signInWithRedirect(auth, provider);
```

## Auth flow

```text
App starts
  |
  v
initialize Firebase
  |
  v
onAuthStateChanged
  |
  +-- signed out --> Login page
  |
  +-- signed in --> Load user profile --> Projects
```

## User document

Path:

`users/{uid}`

Example:

```json
{
	"uid": "firebase-auth-uid",
	"displayName": "Engineer Name",
	"email": "engineer@example.com",
	"photoURL": "https://...",
	"createdAt": "timestamp",
	"updatedAt": "timestamp",
	"lastLoginAt": "timestamp",
	"schemaVersion": 1
}
```

Do not store the Google access token in Firestore.

---

# 9. Firestore Data Model

Recommended structure:

```text
users/{uid}

projects/{projectId}

projects/{projectId}/toolInstances/{toolInstanceId}

projects/{projectId}/reports/{reportId}
```

## Project

```ts
type Project = {
	id: string;
	ownerUid: string;

	projectName: string;
	craneType: 'EOT' | 'Gantry' | 'Other';
	description?: string;

	masterInputs: MasterCraneInputs;

	toolOrder: string[];

	calculationEngineVersion: string;
	schemaVersion: number;

	status: 'draft' | 'review' | 'complete';

	createdAt: Timestamp;
	updatedAt: Timestamp;
};
```

## Tool Instance

```ts
type ToolInstance = {
	id: string;
	toolId: string;
	toolVersion: string;

	displayName: string;
	order: number;

	inputs: Record<string, number | string | boolean | null>;

	outputs?: Record<string, CalculationValue>;
	checks?: CalculationCheck[];

	calculationStatus:
		| 'NOT_CONFIGURED'
		| 'READY'
		| 'PASS'
		| 'WARNING'
		| 'FAIL'
		| 'ERROR';

	inputRevision: number;
	calculatedRevision?: number;

	sourceWorkbook?: string;
	sourceSheets?: string[];

	createdAt: Timestamp;
	updatedAt: Timestamp;
	calculatedAt?: Timestamp;
};
```

## Why store both inputs and outputs?

Inputs are the source of truth.

Outputs are persisted as a convenient snapshot.

On load:

1. read current input values,
2. compare tool version and engine version,
3. recalculate locally,
4. derive current status,
5. update the saved snapshot if appropriate.

Never trust an old saved output if its calculation version differs.

---

# 10. Firestore Security Requirements

Every project is private to its owner in MVP.

Rules concept:

```text
authenticated user
  AND
project.ownerUid == request.auth.uid
```

For project creation:

```text
request.resource.data.ownerUid == request.auth.uid
```

For updates:

```text
resource.data.ownerUid == request.auth.uid
AND
request.resource.data.ownerUid == resource.data.ownerUid
```

The owner UID must never be editable through normal client updates.

For subcollection tool instances and reports, verify the parent project's owner using a Firestore `get()` in the security rule.

Never use:

```text
allow read, write: if true;
```

Never ship permissive rules.

Add Firebase App Check during production hardening.

---

# 11. Project Model

A project is the central object.

Example:

```text
10T EOT Crane - Plant A
```

The project contains:

```text
MASTER SPECIFICATIONS
    |
    +-- Main Hoist calculations
    +-- Cross Travel calculations
    +-- Long Travel calculations
    +-- Crab Weight
    +-- Wheel/Rail Hardness
    +-- Structural calculations
    +-- Report
```

## Project identity

Branding must be:

```text
{project_name} by StaticaLabs
```

Example:

```text
10T EOT Crane - Plant A
by StaticaLabs
```

Use this exact branding pattern in:

- project header,
- browser report title,
- printed report header/footer.

---

# 12. Master Specification Input Model

The main mechanism workbook has a central `SPECIFICATIONS` sheet. These values feed most mechanism tools.

UI should replace spreadsheet coordinates with meaningful labels.

## Inputs

### Crane identification

- Crane type
- Design standard reference
- Duty class
- Indoor/outdoor

### Geometry

- Span, m
- Hook approach, m where applicable
- Hoisting height, m

### Loads

- Safe Working Load / rated capacity, tonnes
- Crab/trolley weight, tonnes
- Crane dead weight, tonnes
- Hook block weight, tonnes

### Speeds

- Main hoist speed, m/min
- Cross-travel speed, m/min
- Long-travel speed, m/min

### Reeving

- Number of falls

### Factors

- Ambient/derating factor
- Structural impact factor
- Hoist duty factor
- CT duty factor
- LT duty factor
- Hoist service factor
- CT service factor
- LT service factor
- Motor multiplicity factor
- Number of gearbox stages/pairs
- Coefficient of utilization
- Wire rope construction factor
- Rope reeving factor
- CT torque factor
- LT torque factor
- CT friction factor
- LT friction factor
- CT average acceleration
- LT average acceleration
- Wheel count
- Wheel material safety factor
- CT speed coefficient
- LT speed coefficient
- CT hardness factor
- LT hardness factor

### Rail

- CT rail size
- LT rail size
- useful rail top width

### Outdoor wind

- Service wind load
- Storm wind load where applicable

---

# 13. Input Validation Principles

Every input must define:

```ts
type NumericInputDefinition = {
	key: string;
	label: string;
	unit: string;
	required: boolean;
	min?: number;
	max?: number;
	step?: number;
	decimals?: number;
	description: string;
	source: string;
};
```

Examples:

```text
Capacity:
  unit = t
  required = true
  min = >0

Span:
  unit = m
  required = true
  min = >0

Number of falls:
  unit = count
  required = true
  min = 1
  integer = true
```

## Physical sanity rules

Reject:

- NaN
- Infinity
- empty required values
- negative mass
- negative speed
- zero gearbox ratio
- zero wheel diameter
- zero rope diameter
- zero divisor values
- negative section thickness
- impossible geometry

Do not silently clamp bad inputs.

---

# 14. Units

The source workbooks use mixed engineering units.

The software must preserve source formulas exactly while making units explicit.

## Common conversions

```text
1 tonne = 1000 kg

1 kgf.m = 9.80665 N.m

1 tonne used in force conversion:
  1 tonne * 1000 kg * 9.81 m/s^2
  = 9810 N
```

Note that the spreadsheets use both `9.81` and `9.80665`.

Do not replace one with the other globally.

## Horsepower

The workbook explicitly uses:

```text
HP = kW * 1.341
```

Use the workbook's exact coefficient in legacy compatibility calculations.

Do not silently replace it with another constant.

---

# 15. Calculation Engine Design

## 15.1 Core principle

The calculation engine must be pure.

Given:

```text
tool ID
tool version
inputs
catalog data
```

it returns the same output.

No network calls.

No Firestore access inside calculation functions.

No React state access.

No random numbers.

## 15.2 Tool definition

```ts
interface CalculationToolDefinition {
	id: string;
	version: string;
	name: string;
	category: string;

	status:
		| 'verified-source'
		| 'engineering-review-required'
		| 'not-implemented';

	inputs: InputDefinition[];
	outputs: OutputDefinition[];

	dependencies: ToolDependency[];

	calculate(context: CalculationContext): CalculationResult;
}
```

## 15.3 Calculation result

```ts
type CalculationResult = {
	toolId: string;
	toolVersion: string;

	status: 'PASS' | 'WARNING' | 'FAIL' | 'ERROR';

	inputsUsed: Record<string, CalculationValue>;

	derived: Record<string, CalculationValue>;

	outputs: Record<string, CalculationValue>;

	checks: CalculationCheck[];

	steps: CalculationStep[];

	assumptions: string[];

	warnings: string[];

	standardReferences: StandardReference[];

	sourceLineage: SourceLineage;
};
```

## 15.4 Calculation step

```ts
type CalculationStep = {
	id: string;
	label: string;

	formulaText: string;
	formulaMath?: string;

	variables: Record<string, CalculationValue>;

	substitutedExpression: string;

	result: CalculationValue;

	dependsOn: string[];
};
```

The report engine uses these steps directly.

---

# 16. Formula Safety Rules

The AI coding model must follow these rules:

1. Never translate an Excel formula into a single opaque expression if doing so makes the calculation trace impossible.
2. Break important equations into named intermediate quantities.
3. Preserve constants exactly.
4. Preserve explicit source rounding.
5. Do not prematurely round intermediate results.
6. Use stable named variables.
7. Add tests for every formula.
8. Add at least one known workbook regression case for every tool.
9. Never invent missing formulas.
10. Never change a formula because it looks mathematically "better" without an engineering review.
11. Every PASS/FAIL condition must be code-generated from numeric comparison.
12. Narrative spreadsheet cells must be treated as notes, not validation logic.

---

# 17. Recommended Source Code Structure

```text
src/
  app/
    App.tsx
    routes.tsx

  auth/
    AuthProvider.tsx
    authService.ts

  firebase/
    firebase.ts
    firestore.ts

  projects/
    ProjectListPage.tsx
    ProjectPage.tsx
    ProjectHeader.tsx

  tools/
    ToolLibraryPage.tsx
    ToolPage.tsx
    ToolCard.tsx
    ToolStatusBadge.tsx

  reports/
    ReportBuilderPage.tsx
    ReportPreview.tsx
    PrintReport.tsx

  engine/
    types.ts
    registry.ts
    units.ts
    safeMath.ts
    comparisons.ts

    common/
      calculationResult.ts
      calculationStep.ts

    master/
      masterSpecifications.ts

    mechanism/
      mainHoistMotor.ts
      mainHoistBrake.ts
      wireRope.ts
      ropeDrum.ts
      hoistGearbox.ts
      sheaves.ts

      crossTravelMotor.ts
      crossTravelBrake.ts
      crossTravelWheel.ts
      crossTravelGearbox.ts

      longTravelMotor.ts
      longTravelBrake.ts
      longTravelWheel.ts
      longTravelGearbox.ts

      crabWeight.ts
      wheelRailHardness.ts

    structural/
      boxBeamProperties.ts
      bendingMoment.ts
      gantryGirder.ts
      gantryLeg.ts

    catalogs/
      motors.ts
      brakes.ts
      craneCatalog.ts
      ropeCatalog.ts
      railCatalog.ts
      hardnessTables.ts
      gearboxCatalog.ts
      wheelCatalog.ts

    fixtures/
      mainHoistFixture.ts
      crossTravelFixture.ts
      longTravelFixture.ts
      girder40tFixture.ts
      girder60tFixture.ts
      legFixture.ts

  components/
    engineering/
      NumericInput.tsx
      SelectInput.tsx
      ResultCard.tsx
      FormulaBlock.tsx
      CalculationTrace.tsx
      CheckTable.tsx
      DependencyBadge.tsx

  styles/
    ...

tests/
  engine/
  reports/
  firestore/
```

---

# 18. Tool Registry

Central registry:

```ts
export const TOOL_REGISTRY = {
	MAIN_HOIST_MOTOR: mainHoistMotor,
	MAIN_HOIST_BRAKE: mainHoistBrake,
	WIRE_ROPE: wireRope,
	ROPE_DRUM: ropeDrum,
	HOIST_GEARBOX: hoistGearbox,
	SHEAVES: sheaves,

	CT_MOTOR: ctMotor,
	CT_BRAKE: ctBrake,
	CT_WHEEL: ctWheel,
	CT_GEARBOX: ctGearbox,

	LT_MOTOR: ltMotor,
	LT_BRAKE: ltBrake,
	LT_WHEEL: ltWheel,
	LT_GEARBOX: ltGearbox,

	CRAB_WEIGHT: crabWeight,
	WHEEL_RAIL_HARDNESS: wheelRailHardness,

	BOX_BEAM_PROPERTIES: boxBeamProperties,
	BENDING_MOMENT: bendingMoment,

	GANTRY_GIRDER: gantryGirder,
	GANTRY_LEG: gantryLeg,
};
```

Tool metadata must allow an MVP tool to be disabled until reviewed.

---

# 19. Dependency Graph

## Main mechanism family

```text
MASTER SPECIFICATIONS
       |
       +-------------------+
       |                   |
       v                   v
 MAIN HOIST            CROSS TRAVEL
       |                   |
       +-------+           +---------+
       |       |                     |
       v       v                     v
   Motor     Brake                 Wheel
       |                           |
       v                           v
   Gearbox                       Gearbox

 MAIN HOIST
       |
       +--> Wire Rope
       +--> Rope Drum
       +--> Sheaves
       +--> Brake
       +--> Gearbox

 CRAB WEIGHT
       |
       +--> calculated trolley/crab mass
       |
       +--> explicit engineer sync into master input
```

## Structural family

```text
BOX BEAM PROPERTIES
       |
       v
BENDING MOMENT
       |
       v
GANTRY GIRDER

PROPB
       |
       v
GANTRY LEG
```

## Important data ownership rule

The workbook has both:

- a master `Crab Weight` input,
- a `CRAB WT.` sheet that calculates a crab weight.

The MVP must not automatically overwrite the master specification behind the user's back.

Instead:

```text
Calculated crab weight: 2499 kg
Adjusted/allowance crab weight: 3123.75 kg

[Use 3123.75 kg in Master Specifications]
```

The user explicitly chooses when to sync.

---

# 20. MAIN HOIST CALCULATION SUITE

Source workbook sheets:

`SPECIFICATIONS`, `M.H.`, `WIRE ROPE`, `GROOVING`, `BRAKE SOC`, `MOTOR`, `TABLES`, `CRANE CAT`, `CRAB WT.`

---

## 20.1 Main Hoist Motor Power

### Inputs

- Safe Working Load, t
- Hook block weight, t
- Hoisting speed, m/min
- service/duty factors
- number of falls
- multiplicity factor
- derating factor
- hoist service factor
- other source parameters

### Source workbook formulas

```text
J9 = SPECIFICATIONS!C15 + SPECIFICATIONS!C19

J10 = SPECIFICATIONS!C17

J11 = SPECIFICATIONS!C21

J12 = SPECIFICATIONS!C20

J13 = SPECIFICATIONS!C23

J14 = (0.95)^J15 * (0.99)^J16

J15 = SPECIFICATIONS!C24

J16 = SPECIFICATIONS!C18/2 - 1

J18 = SPECIFICATIONS!C9
```

Motor power:

```text
P_motor(kW)
=
(J9 * J10 * J11 * J12 * J13)
/
(6.12 * J14 * J18)
```

Equivalent source formula:

```text
H20=(J9*J10*J11*J12*J13)/(6.12*J14*J18)
```

Horsepower:

```text
P_motor(HP) = P_motor(kW) * 1.341
```

Source:

```text
H21=H20*1.341
```

### Selected motor in sample

- Manufacturer/code family: BBL
- Type: Squirrel cage
- Rated power: 13 kW
- Speed: 935 rpm
- poles: 6
- CDF: 0.4
- starts/hour: 150
- quantity: 1
- IP55

### Required checks

```text
selectedMotorKW >= requiredMotorKW
```

Also display:

```text
required HP
selected motor HP if available
motor RPM
quantity
CDF
starts/hour
```

Do not infer an unprovided rating.

### Sample regression output

```text
Required power = 10.4879897176 kW
Equivalent HP = 14.0643942112 HP
```

---

# 21. Main Hoist Brake

## Inputs

Depends on main hoist mechanical power and selected motor RPM.

Source formulas:

```text
J35 = H20 * J18 / (J11 * J12)

J36 = J12

J37 = F25

F39 = 975 * J35 * J36 / J37

I39 = F39 * 9.80665
```

### Required brake torque

```text
T_brake_kgm
=
975 * P_mechanical * CDF / RPM
```

where the source workbook's intermediate definitions must be preserved.

N.m:

```text
T_brake_Nm = T_brake_kgm * 9.80665
```

### Sample output

```text
Required brake torque = 15.5072240017 kg-m
Required brake torque = 152.073918257 N-m
```

### Catalog selection check

Selected brake torque must satisfy:

```text
selectedBrakeTorque >= requiredBrakeTorque
```

Sample selected brake:

```text
MDT-200-18
drum size = 200
rated torque = 20 kg-m
```

---

# 22. Wire Rope Calculation

Source formulas:

```text
J51 = J9
J52 = SPECIFICATIONS!C25
J53 = J12
J54 = SPECIFICATIONS!C18

H56 = J51 * J52 * J53 / J54

H57 = H56 * 9.81
```

Required minimum braking load:

```text
F_rope_required(t)
=
SWL_related_mass
* utilization factor
* duty/reeving factors
/
falls or rope-related factor
```

The application must expose the exact variable mapping and substituted expression rather than displaying only a final answer.

N conversion:

```text
F_rope_required(kN)
=
H56 * 9.81
```

### Sample

```text
Minimum braking load = 13.51875 t
Minimum braking load = 132.6189375 kN
```

### Sample selected rope

```text
Supplier: Usha Martin
Diameter: 16 mm
Construction: 6 x 36
Grade: 1770 N/mm2
Breaking strength: 149 kN
Core: fibre core
```

### Selection check

```text
selectedBreakingStrength >= requiredBreakingStrength
```

A diameter or construction rule must only be added if explicitly validated from the source standard/table.

---

# 23. Rope Drum Calculation

### Required drum diameter

Source:

```text
J71 = D61
J72 = J12
J73 = SPECIFICATIONS!C26

H75 = 12 * J71 * J72 * J73
```

The workbook uses the resulting value as a drum diameter requirement.

Sample:

```text
Required drum diameter = 288 mm
Selected = 320 mm
```

### Groove depth

```text
H78 = 0.3 * D61
```

Sample:

```text
Required groove depth = 4.8 mm
Selected = 5.5 mm
```

### Groove pitch

```text
H79 = 1.08 * D61
```

Sample:

```text
Required pitch = 17.28 mm
Selected = 18 mm
```

### Number of active grooves per side

```text
J81
=
(J80 * J54 * 1000)
/
(PI() * H76 * 2)
```

Additional grooves:

```text
J82 = 5
```

Total grooves:

```text
J83 = J81 + J82
```

### Drum length

Source:

```text
H90 = (2 * J83 * J79) + J87 + (2 * J88)
```

Sample:

```text
Drum length = 1869.155 mm
```

### L/D check

```text
L_over_D = drumLength / drumDiameter
```

Source:

```text
H91 = H90 / H76
```

Required:

```text
L_over_D <= 6
```

Sample:

```text
L/D = 5.8411
```

### Drum wall thickness below groove

Source:

```text
I100
=
(J94 * 1000 * J98)
/
(J95 * J96 * J97)
```

Sample:

```text
minimum thickness below groove = 15.1067 mm
```

Machining allowance:

```text
E102 = 3 mm
```

Total drum thickness:

```text
I106 = I100 + J78 + E102
```

Sample:

```text
total drum thickness = 23.6067 mm
```

---

# 24. Main Hoist Gearbox

Required gear ratio:

```text
J119
=
(PI() * J114 * J115)
/
J116
/
(J117 / 2)
```

Definitions:

```text
J114 = drum diameter / 1000
J115 = motor RPM
J116 = required hoist speed
J117 = falls
```

### Rating

Source:

```text
G121 = J35
I121 = G121 * 1.341
```

The tool must display:

- required mechanical power,
- HP,
- required ratio,
- selected gearbox ratio,
- selected gearbox model.

### Actual speed

Source:

```text
H128
=
(F25 / D125)
*
(3.142 * H76 / 1000)
/
(J117 / 2)
```

Allowed band:

```text
lower = requiredSpeed * 0.9
upper = requiredSpeed * 1.1
```

### Sample

```text
Required ratio = 93.99645
Selected ratio = 103.4

Actual hoist speed = 4.54587 m/min
Allowed range = 4.5 to 5.5 m/min
Result = PASS
```

Do not fail a gearbox merely because selected ratio differs from calculated ratio if the actual mechanism speed and all validated rating checks are acceptable.

---

# 25. Main Hoist Sheaves

Required sheave diameter:

```text
H142
=
12 * J137 * J138 * J139 * J140
```

Required equalizing sheave diameter:

```text
H145
=
8 * J137 * J138 * J139
```

Sample:

```text
Required main sheave = 288 mm
Selected = 320 mm

Required equalizing sheave = 192 mm
Selected = 200 mm
```

---

# 26. CROSS TRAVEL CALCULATION SUITE

Source sheet:

`C.T.` / `C.T.-INDOOR`

## 26.1 CT motor

Definitions:

```text
J10 = crab weight
J11 = crane capacity + crab weight
J12 = CT speed
J13 = CT service factor
J14 = CT duty factor
J15 = CT motor quantity factor
J16 = derating
J17 = CT torque factor
J18 = friction
J19 = acceleration
J20 = (0.95)^J21
J21 = ambient/duty factor
```

Motor power:

```text
H23
=
(
  (J11 * J12 * J13 * J14 * J15)
  /
  (6117 * J17 * J16)
)
*
(
  J18
  +
  (1100 * J19 / (981 * J20))
)
```

Horsepower:

```text
H24 = H23 * 1.341
```

Sample:

```text
Required CT power = 0.5982255635 kW
Equivalent HP = 0.8022204806 HP
```

Selected motor:

```text
0.75 kW
860 rpm
6 pole
CDF 0.4
150 starts/hour
quantity 1
```

---

# 27. CT Brake

Source:

```text
J38 = H23 * J16 / (J13 * J14)
J39 = J14
J40 = F28
F42 = 975 * J38 * J39 / J40
I42 = F42 * 9.80665
```

Sample:

```text
Required brake = 0.6078394342 kg-m
= 5.960868587 N-m
```

Selected:

```text
MDT-100-18
6 kg-m
```

Check:

```text
selected torque >= required torque
```

---

# 28. CT Wheel Load

Inputs:

```text
K1 = 0.6
K2 = 0.4

J56 = SWL
J57 = wheel count
J58 = crab weight
```

Maximum wheel load:

```text
C60
=
(J54 * J56 / (J57 / 2))
+
(J58 / J57)
```

Minimum:

```text
H60
=
(J55 * J56 / (J57 / 2))
+
(J58 / J57)
```

Force conversions:

```text
C61 = C60 * 1000 * 9.81
H61 = H60 * 1000 * 9.81
```

Mean wheel load:

```text
D65 = ((2 * C60) + H60) / 3

H65 = ((2 * C61) + H61) / 3
```

Sample:

```text
Pmax = 3.75 t
Pmin = 2.75 t
Pmean = 3.416666667 t
Pmean = 33517.5 N
```

---

# 29. CT Wheel Diameter

Required wheel diameter:

```text
H77
=
J69 * J70 * J71
/
(1.5 * J72 * J73 * J74)
```

Sample:

```text
Required wheel diameter = 134.3055 mm
Selected = 160 mm
```

Wheel RPM:

```text
G75 = J12 * 1000 / (3.142 * H79)
```

Sample:

```text
39.7836 rpm
```

---

# 30. CT Gearbox

Required ratio:

```text
J91
=
PI() * J87 * J88
/
(J89 * 1000)
```

Rating:

```text
G93 = J38
I93 = G93 * 1.341
```

Actual speed:

```text
H100
=
(J88 / D97)
*
(3.142 * H79 / 1000)
```

Allowed:

```text
0.9 * requiredSpeed <= actualSpeed <= 1.1 * requiredSpeed
```

Sample:

```text
Required ratio = 21.61416
Selected ratio = 21.5
Actual speed = 20.1088 m/min
Allowed = 18 to 22
Result = PASS
```

---

# 31. LONG TRAVEL CALCULATION SUITE

The long-travel suite is structurally very similar to CT but uses LT inputs.

## 31.1 LT motor

Definitions:

```text
J10 = crane weight
J11 = capacity + crane weight
J12 = LT speed
J13 = LT service factor
J14 = LT duty factor
J15 = LT motor multiplicity
J16 = derating
J17 = LT torque factor
J18 = LT friction
J19 = acceleration
J20 = (0.95)^J21
J21 = source duty factor
```

Motor power:

```text
H23
=
(
  (J11 * J12 * J13 * J14 * J15)
  /
  (6117 * J17 * J16)
)
*
(
  J18
  +
  (1100 * J19 / (981 * J20))
)
```

HP:

```text
H24 = H23 * 1.341
```

Sample:

```text
Required LT power = 0.5990938154 kW
Equivalent HP = 0.8033848064 HP
```

---

# 32. LT Brake

Source:

```text
J38 = H23 * J16 / (J13 * J14)
J39 = J14
J40 = F28
F42 = 975 * J38 * J39 / J40
I42 = F42 * 9.80665
```

Sample:

```text
Required brake = 0.6452449378 kg-m
= 6.327691269 N-m
```

---

# 33. LT Wheel Load

Inputs include:

```text
span
hook approach
SWL
wheel count
crab weight
crane weight
```

Maximum:

```text
C61
=
((J54 - J55) * (J58 + J56))
/
(J54 * J57 / 2)
+
(J59 - J58) / J57
```

Minimum:

```text
H61
=
J55 * (J58 + J56)
/
(J54 * J57 / 2)
+
(J59 - J58) / J57
```

Force:

```text
C62 = C61 * 1000 * 9.81
H62 = H61 * 1000 * 9.81
```

Mean:

```text
D66 = ((2 * C61) + H61) / 3
H66 = ((2 * C62) + H62) / 3
```

Sample:

```text
Pmax = 8.35 t
Pmin = 3.15 t
Pmean = 6.616666667 t
Pmean = 64909.5 N
```

---

# 34. LT Wheel Diameter

Source:

```text
H78
=
J70 * J71 * J72
/
(1.5 * J73 * J74 * J75)
```

Sample:

```text
Required = 179.51085 mm
Selected = 200 mm
```

Wheel RPM:

```text
G76 = J12 * 1000 / (3.142 * H80)
```

Sample:

```text
31.82686 rpm
```

---

# 35. LT Gearbox and Critical Regression Test

Required ratio:

```text
J92
=
PI() * J88 * J89
/
(J90 * 1000)
```

Actual:

```text
H101
=
(J89 / D98)
*
(3.142 * H80 / 1000)
```

Allowed:

```text
lower = requiredSpeed * 0.9
upper = requiredSpeed * 1.1
```

Known workbook sample:

```text
Required LT speed = 20 m/min
Allowed range = 18 to 22 m/min

Selected ratio = 21.5

Calculated actual speed = approximately 25.136 m/min

Result = FAIL
```

This is a mandatory automated regression test.

The UI must show:

```text
LT speed check
Required: 20.00 m/min
Allowed: 18.00 - 22.00 m/min
Actual: 25.136 m/min
Status: FAIL
```

Do not display "OK" because the source workbook may have narrative or manual-selection cells that disagree with the numerical result.

---

# 36. HARDNESS / WHEEL-RAIL CHECK

The `HARDNESS-BHw,BHr` sheet contains lookup tables and a formula for wheel hardness.

Source formula:

```text
BH_w
=
1.3 * J10 * J11
/
(J13 * J15)
```

Where the sheet's values represent:

- rail Brinell hardness,
- load/distribution factor,
- wheel geometry factor,
- other hardness-related coefficient.

The product must retain the exact workbook variable mapping in the trace.

Known sample arithmetic:

```text
1.3 * 200 * 1.29 / (1.08 * 1.09)
= approximately 284.913 BHN
```

The workbook notes indicate a minimum hardness range around 300 to 350 BHN.

Therefore this case must be surfaced as a review issue.

The system must never silently change 284.91 to a passing value.

---

# 37. STATIC REFERENCE CATALOGS

Some sheets are not calculators. They are data tables.

## Motor catalog

The workbook contains:

### 2 pole

```text
60 Hz rated RPM ~3450
50 Hz rated RPM ~2850
synchronous 3600/3000
```

### 4 pole

```text
60 Hz rated RPM ~1725
50 Hz rated RPM ~1425
synchronous 1800/1500
```

### 6 pole

```text
60 Hz rated RPM ~1140
50 Hz rated RPM ~950
synchronous 1200/1000
```

### 8 pole

```text
60 Hz rated RPM ~850
50 Hz rated RPM ~700
synchronous 900/750
```

Do not infer manufacturer performance from these lookup rows beyond what the source specifies.

## Brake catalog

Verified sample catalog entries:

```text
MDT-100-18   100 mm   6 kg-m    60 N-m    17 kg
MDT-150-18   150 mm   9 kg-m    90 N-m    20 kg
MDT-160-18   160 mm   9 kg-m    90 N-m    20 kg
MDT-200-18   200 mm   20 kg-m   200 N-m   27 kg
MDT-250-18   250 mm   35 kg-m   350 N-m   30 kg
MDT-250-34   250 mm   42 kg-m   420 N-m   30 kg
MDT-300-34   300 mm   62 kg-m   620 N-m   70 kg
MDT-400-46   400 mm   90 kg-m   900 N-m   85 kg
MDT-400-68   400 mm   110 kg-m  1100 N-m  88 kg
MDT-500-46   500 mm   190 kg-m  1900 N-m  125 kg
MDT-500-68   500 mm   290 kg-m  2900 N-m  125 kg
MDT-500-114  500 mm   485 kg-m  4850 N-m  125 kg
MDT-600-68   600 mm   350 kg-m  3500 N-m  190 kg
MDT-600-114  600 mm   580 kg-m  5800 N-m  190 kg
```

Catalog values must be stored as versioned data.

---

# 38. CRAB WEIGHT CALCULATION

The `CRAB WT.` sheet includes individual component weights.

Sample:

### Main hoist

```text
Gearbox HR500+150       450 kg
Motor 160L              123 kg
Brake MDT-200-18         27 kg
Rope drum phi320        400 kg
Pedestal 22218           30 kg
Bottom pulley block     260 kg
Upper pulley block        0 kg
Equalizing pulley        50 kg
Wire rope                 95 kg
-----------------------------
Main hoist total       1435 kg
```

### Cross travel

```text
Gearbox                  150 kg
Motor                      7 kg
Brake                     17 kg
4 wheels x 35 kg         140 kg
2 couplings x 10 kg       20 kg
Floating shaft            30 kg
-----------------------------
CT total                 364 kg
```

Trolley structure:

```text
700 kg
```

Calculated combined:

```text
D28 = main hoist + CT + trolley structure
    = 2499 kg
```

Allowance:

```text
G28 = D28 * 1.25
    = 3123.75 kg
```

The 25% allowance must be identified as workbook logic, not asserted to be a current standard requirement.

---

# 39. SPEED TOOL

The `SPEED` sheet contains speed and ratio bounds.

Core logic:

```text
lower = required * 0.9
upper = required * 1.1
```

This 10% band is used in mechanism selection checks.

Use a shared helper:

```ts
function withinSpeedTolerance(
	actual: number,
	required: number,
	tolerance = 0.1,
): CheckResult;
```

---

# 40. CRANE CATEGORY LOOKUP

The `CRANE CAT` sheet is a lookup table.

It contains rows for different crane configurations and includes values such as:

- capacity,
- span,
- headroom,
- wheelbase,
- hook approaches,
- end clearances,
- approximate wheel load,
- total weight.

This should be implemented as a searchable reference table, not as an equation.

UI:

```text
Crane category reference
--------------------------------
Capacity | Span | Headroom | ...
```

This tool can optionally be used to prefill project assumptions, but it must never silently overwrite user inputs.

---

# 41. WIRE ROPE / GROOVING REFERENCE DATA

`WIRE ROPE` and `GROOVING` sheets contain reference information without significant formula logic.

They should be stored as versioned catalog data.

Possible UI:

```text
Wire Rope Reference
Construction
Diameter
Grade
Breaking Load
Core
Standard/reference
```

---

# 42. MAIN MECHANISM WORKBOOK DUPLICATE HANDLING

The following two files represent substantially the same mechanism calculation family:

```text
01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx
MAC-CRANE MECHANISM CALCULATION-IS3177.xlsx
```

They have similar formula sets, but sheet ordering differs.

Do not create duplicate application tools.

Use one canonical implementation:

```text
mechanism.engine
```

with source lineage supporting both workbooks.

The indoor version is the preferred primary source for the indoor MVP.

---

# 43. OUTDOOR CRANE CALCULATION

The following source exists:

`Mechanism Calculation-OUTDOOR CRANE-IS3177.xls`

The `.xlsx` mechanism workbook also contains a `C.T.-OUTDOOR` sheet.

The outdoor sheet includes formula text referencing an additional wind-load term involving variables such as:

- `Rw`
- `V`
- `T`

However, the workbook does not provide a sufficiently reliable populated output/formula model for production transcription from the available extraction.

Therefore:

```text
OUTDOOR_C_T
status = ENGINEERING_REVIEW_REQUIRED
```

Do not implement the outdoor wind calculation by guessing the missing formula.

---

# 44. GANTRY GIRDER CALCULATION

Workbook:

`GIRDER _CALC_40T & 60T GANTRY CRANE.xlsx`

Sheets:

```text
MG-40T
MG-60T
```

The two sheets use essentially the same algorithm with different parameter values.

This should be implemented as one parametrized tool with fixture configurations.

---

# 45. Gantry Girder Inputs

Common parameters include:

- SWL
- span
- class
- duty factor
- impact factor
- horizontal force factor
- one-girder dead weight
- trolley weight
- platform weight
- electrical weight
- LT machinery weight
- minimum hook approach
- girder dimensions
- flange thickness
- web thickness
- section width
- section depth
- diaphragm parameters
- steel grade/material allowable stress parameters
- deflection criteria
- fatigue inputs

## MG-40T sample inputs

```text
Capacity = 40 t
Span = 10 m
Class = M5
Duty factor = 0.9
Impact factor = 1.32
Horizontal force factor = 0.05
Trolley = 9.2 t
Platform = 1 t
Electricals = 2 t
Hook approach = 1.2 m
```

Main section sample:

```text
Width = 49 cm
Depth = 100 cm
Top flange thickness = 1 cm
Bottom flange thickness = 1 cm
Web thickness = 0.8 cm
```

## MG-60T sample

```text
Capacity = 60 t
Span = 10 m
Class = M5
Duty factor = 0.9
Impact factor = 1.32
Horizontal force factor = 0.05
Trolley = 11.5 t
Platform = 1 t
Electricals = 2 t
Hook approach = 1.2 m
```

Main section sample:

```text
Width = 49 cm
Depth = 125 cm
Top flange thickness = 1.2 cm
Bottom flange thickness = 1.2 cm
Web thickness = 0.8 cm
```

---

# 46. Gantry Girder Section Properties

For a built-up box/girder section:

### Area

Source:

```text
A
=
(flangeWidth * topFlangeThickness)
+
(flangeWidth * bottomFlangeThickness)
+
2 * (depth - topFlangeThickness - bottomFlangeThickness) * webThickness
```

Workbook form:

```text
H284
=
(E282*E284)
+
(E282*E285)
+
(E283-E284-E285)*2*E286
```

### Centroid

Workbook:

```text
H285
=
(
  E282*E284*(E283-E284/2)
  +
  E287*2*E286*(E283-E284-E287/2)
  +
  E282*E285*E285/2
)
/
H284
```

### Ixx

Workbook uses parallel-axis contributions:

```text
H286 = ROUND(
  2*(E287^3*E286/12)
  +
  E282*(E285^3/12)
  +
  E282*(E284^3/12)
  +
  E282*E284*((H294-E284/2)^2)
  +
  E282*E285*((H295-E285/2)^2),
  0
)
```

Important:

`ROUND(..., 0)` is explicit in the source.

The implementation must reproduce that explicit rounding point.

### Iyy

```text
H287 = ROUND(
  2*(E282^3*E284/12)
  +
  2*E287*(E286^3/12)
  +
  2*E287*E286*(
    ((E282/2)-(E286/2)-B291/10)^2
  ),
  0
)
```

### Section moduli

```text
Z_tension = Ixx / tensionCentroid
Z_compression = Ixx / compressionCentroid
```

Source:

```text
H288 = H286 / H295
H289 = H286 / H294
```

### Zyy

```text
H290 = H287 / (E282 / 2)
```

### Radius of gyration

```text
r_yy = SQRT(Iyy / Area)
```

Source:

```text
H291 = SQRT(H287/H284)
```

### Girder weight

```text
weight_kg_per_m = Area * 0.785
```

Source:

```text
H292 = H284 * 0.785
```

### Girder weight with diaphragms/attachments

The source uses:

```text
H293
=
H292
+
B284*0.1*(A285-50)*0.1*0.00785*5*0.1/0.75
+
10
```

This formula must be transcribed exactly until engineering review.

---

# 47. Gantry Girder Loading Calculations

The source includes point loads, dead load, horizontal loads, reactions, bending moments, torsion, stresses, deflection and fatigue.

## Wheel loads

Source example:

```text
G43 = G39*(H23/C24)*(F18/E32)
G48 = corresponding opposite wheel calculation
```

Impact versions:

```text
G53
G58
```

using the impact-adjusted force input.

## Support reaction

Source:

```text
D81
=
(
  D68*(G75+D71)
  +
  G68*(G75+D71-E69)
)
/
(C75+G75)
```

## Bending moment

```text
D85
=
D81 * (C75/1000 - D71/1000)
```

## No-load and alternative loading cases

The source repeats the loading chain for other positions.

The application should model them as named load cases rather than creating hidden spreadsheet-like cells.

Example:

```text
Load Case A: Loaded trolley
Load Case B: Unloaded trolley
Load Case C: Dead load
Load Case D: Horizontal force
```

Then derive governing results.

---

# 48. Horizontal and Torsional Loads

Horizontal bending:

```text
E182 = I9 * D91
C193 = I9 * C161
E198 = E182 + C193
```

Torsion due electricals:

```text
D265 = (E248/1000) * I13
```

Torsion due trolley horizontal effects:

```text
D270
=
(G43+G48)
*
I9
*
(B252/1000)
```

Total torsional moment:

```text
D276 = D265 + D270
```

All of these must be represented in the calculation trace.

---

# 49. Gantry Girder Allowable Stress Logic

The workbook contains a stability/allowable stress chain.

Example:

```text
L = 0.7 * span * 100
```

Slenderness uses:

```text
L / r_y
```

A stability stress parameter:

```text
Y = 26.5e5 / (L/r_y)^2
```

The workbook contains:

```text
D428
=
E398
*
SQRT(
  1
  +
  (1/20)
  *
  (
    (D383*E284)/(F392*E283)
  )^2
)
```

Then:

```text
D430 = K1 * (D428 + K2 * E398)
```

A nonlinear allowable stress expression:

```text
D434
=
0.66 * (D430*250)
/
(
  (D430^1.4 + 250^1.4)^(1/1.4)
)
```

Conversion:

```text
D438 = D434 * 100 / 9.81
```

Duty adjustment:

```text
D440 = D438 * I7
```

Allowable tension:

```text
C448 = (0.66 * 250 * I7) * 100 / 9.81
```

Allowable shear:

```text
D455 = (0.45 * 250 * I7) * 100 / 9.81
```

Important source inconsistency:

A note in the workbook references a value that appears inconsistent with the formula actually used for allowable shear.

The code must reproduce the formula and flag the source note discrepancy for review.

---

# 50. Gantry Girder Stress Calculations

Compression:

```text
compressionStress
=
compressionMoment * 1e5
/
Z_compression
```

Tension:

```text
tensionStress
=
tensionMoment * 1e5
/
Z_tension
```

Horizontal stress:

```text
horizontalStress
=
horizontalMoment * 1e5
/
torsional/bending section parameter
```

Principal/combined:

```text
totalTension
=
tensionStress
+
horizontalStress
```

No-load:

```text
noLoadBendingStress
=
noLoadMoment * 1e5
/
Z_tension
```

Neck/web shear:

```text
neckShear
=
reaction * 1000
/
shearArea
```

Torsional shear:

```text
torsionStress
=
torsionalMoment * 1e5
/
torsionalSectionParameter
```

Combined shear:

```text
totalShear
=
neckShear
+
torsionalStress
```

Each result must have a separate limit check.

---

# 51. Gantry Girder Deflection

The workbook computes point-load contributions and combines them.

The source uses a point-load beam deflection equation for point loads.

The final maximum deflection:

```text
G597 = (B593 + H595) * 10
```

Allowable:

```text
allowableDeflection = span / 900
```

Source:

```text
D602 = span / 900
```

Camber reference:

```text
maximum camber = span / 1000
```

The application must show:

```text
Calculated deflection
Allowable deflection
Deflection ratio
Status
```

Do not display only a generic "OK".

---

# 52. Gantry Girder Fatigue

Source:

```text
fmin = no-load stress
fmax = combined maximum stress
```

Stress ratio:

```text
ratio = fmin / fmax
```

Source:

```text
C639 = C633 / C635
```

The workbook includes a fatigue allowable value around:

```text
110.12 MPa
```

and multiplies by:

```text
10.2
```

in the source chain.

Because this section is safety-critical, all fatigue equations must be independently reviewed before production enablement.

---

# 53. GANTRY LEG CALCULATION

Workbook:

`LEG CALCULATION FOR GANTRY CRANE.xlsx`

Sheets:

```text
Input Sheets
input
Leg Calculations
propB
```

This is a cross-sheet dependency model.

`propB` supplies equivalent structural-section properties to `Leg Calculations`.

---

# 54. Gantry Leg Inputs

The workbook includes inputs such as:

- SWL = 40,000 kg
- span = 10,000 mm
- wheel base = 6,200 mm
- hook approach = 1,200 mm
- operating wind = 25 kg/m2
- storm wind = 80 kg/m2
- CT speed = 10 m/min
- LT speed = 20 m/min
- impact = 1.5
- trolley weight = 8 t
- crane weight = 35 t
- cabin weight
- UDL = 16 t
- leg weight = 12,000 kg
- girder Ixx
- girder depth = 1000 mm
- rail height = 150 mm
- material modulus = 2.05e6 kg/cm2
- leg geometry and section plate dimensions

---

# 55. Gantry Leg Section Properties

Equivalent section parameters use `propB`.

The source performs calculations for:

- top box section
- bottom box section
- equivalent combined section
- area
- weight
- centroid
- Izz
- Iyy
- section moduli
- radius of gyration
- torsion parameters.

The source uses a composite section approach.

Implementation rule:

```text
propB must be a reusable section-property engine
```

Do not duplicate the same geometry math inside `gantryLeg.ts`.

---

# 56. Gantry Leg Bending

Distribution:

```text
E76 = (E7 - E9) / E7
```

Live load with impact:

```text
E77 = ((E6*E14/1000) + E18) * E76
```

Live load without impact:

```text
E79 = (E6/1000 + E18) * E76
```

Live-load bending moment with impact:

```text
E81
=
(3 * E77 * E7 / 1000)
/
(8 * E72)
```

No-impact:

```text
E84
=
(3 * E79 * E7 / 1000)
/
(8 * E72)
```

UDL bending:

```text
E87
=
(E21 * E7 / 1000)
/
(4 * E72)
```

CT start/stop:

```text
E90
=
E16
*
(E6/1000 + E18)
*
E39/1000
```

Transverse:

```text
E92
=
((E6/1000)+E19)
*
E17
*
(E39/1000)
```

Combined with impact:

```text
E94
=
0.5*E81
+
0.5*E87
+
0.25*E90
+
0.25*E92
```

Combined without:

```text
E96
=
0.5*E84
+
0.5*E87
+
0.25*E90
+
0.25*E92
```

---

# 57. Gantry Leg Deflection

Source live-load deflection:

```text
E99
=
(E84*1000*100*(E40/10)^2)
/
(3*E30*E64*2)
```

All-moment deflection:

```text
E101
=
(E96*1000*100*(E40/10)^2)
/
(3*E30*E64)
```

These equations must be retained exactly until independent engineering validation.

---

# 58. Gantry Leg Stress

With impact:

```text
E106 = E94*1000*100/E49
```

Without:

```text
E107 = E96*1000*100/E49
```

---

# 59. Gantry Leg Axial Compression

Inclined leg length:

```text
E111 = 9.2 m
```

Horizontal moments:

```text
E112
=
((E6*E14)+25000+E18*1000)
*
0.1
*
(E39/1000)
```

Distance between legs:

```text
E113 = 7 m
```

UDL reaction:

```text
E114 = 0.5 * E21 * 1000
```

Live reaction with impact:

```text
E116 = E6*E14 + E18*1000
```

Total vertical reaction:

```text
E117 = E116/2 + E114/2 + E112/E113
```

Compressive load:

```text
E118
=
E117
*
(E111 / (E40/1000))
```

Axial stress:

```text
E119 = E118 / E65
```

No-impact chain:

```text
E121
E122
E123
E124
```

Combined:

```text
E126 = E106 + E119
E127 = E107 + E124
```

---

# 60. Gantry Leg Stability

The workbook includes inertia and wind-load calculations.

Examples:

```text
E133
=
E15
*
(E6/1000 + E19)
*
((E39+E26+E27)/1000)
```

Wind area:

```text
E135 = E28 + E6/1000
```

Wind moment:

```text
E136 = E135 * (E10/1000) * H133
```

UDL inertia:

```text
E140
=
E15
*
E21
*
((E39 + E26/2)/1000)
```

Girder wind area:

```text
E142
=
((E26+12+10)/1000)
*
(E7/1000)
*
1.6
+
0.2*((E26+12+10)/1000)*(E7/1000)
```

Girder wind moment:

```text
E143
=
(E10/1000 * E142)
*
I142
```

Cabin wind and inertia and leg wind area/moment are also included.

Total overturning:

```text
E161 = sum of applicable overturning components
```

Stabilising:

```text
E162
=
E160
*
0.5
*
(E40/(2*1000))
```

Stability factor:

```text
E163 = E162 / E161
```

Storm equivalent:

```text
E178 = storm wind total
E180 = storm stabilising moment
E181 = E180 / E178
```

---

# 61. Gantry Leg Column Stability

Minimum radius:

```text
E184 = E66
```

Slenderness:

```text
E185 = 1.5 * E111 * 100 / E184
```

Critical stress:

```text
E187 = PI()^2 * 205000 / E185^2
```

Allowable compressive stress:

```text
E189
=
6 * E187 * 250
/
(
  (E187^1.4 + 250^1.4)^(1/1.4)
)
```

Again, these equations are legacy-source equations and must not be presented as current-code compliance until reviewed.

---

# 62. BOX BEAM PROPERTIES

Workbook:

`MAC-Box Beam-Properties.xlsx`

Sheets:

```text
PROPERTIES
B.M.
Sheet2
```

`Sheet2` is effectively empty and should not create a tool.

---

# 63. Box Beam Inputs

Inputs include:

- top plate width
- top plate thickness
- web depth
- web thickness
- bottom plate width
- bottom plate thickness
- distance between webs
- material density

Source formulas compute:

- component areas,
- centroids,
- total weight,
- Ixx,
- Iyy,
- Zxx,
- shear area.

### Composite centroid

The workbook uses:

```text
D13
=
(
  S6*S11
  +
  S7*S12
  +
  S8*S13
  +
  S9*S14
)
/
(S6+S7+S8+S9)
```

and analogous centroid calculation in D14.

### Weight

```text
D16
=
(
  (S6+S7+S8+S9) / 1000000
)
*
7850
```

### Ixx

```text
D18 = W6 + W7 + W8 + W9
```

### Iyy

```text
D20 = W11 + W12 + W13 + W14
```

### Section modulus

```text
D22 = D18 / D14
```

### Shear area

```text
E24
=
((J10*P11)+(N10*P11))/100
```

The confusing source cell references must be hidden from users and mapped to named variables in code.

---

# 64. BENDING MOMENT TOOL

The `B.M.` sheet is a general beam reaction/bending calculator.

Inputs include:

- point-load magnitudes,
- spacing between loads,
- total span/geometry,
- self-weight.

Reaction:

```text
H24
=
(
  E5*(M14-D11)
  +
  G5*(M14-D11-F11)
  +
  ...
  +
  W5*X11
)
/
M14
```

The implementation should convert this into a named point-load model:

```ts
type PointLoad = {
	name: string;
	load: number;
	position: number;
};
```

Then compute reactions from the point positions.

Self-weight:

```text
H20 = H17 * M14 / 2
H21 = H20
```

The sheet computes bending moments at multiple stations.

Maximum:

```text
M30 = MAX(M19:M26) + M28
```

Bending stress:

```text
R24 = M30 / Q21
```

Shear:

```text
R26 = W17 / V19
```

The workbook also compares against limits such as:

```text
bending limit around 1568
shear limit around 1000
```

These limits must be treated as source data requiring engineering review.

---

# 65. LEGACY `.XLS` FILE INVENTORY

The following workbooks were inspected at the content/text level where possible, but their binary formula structure was not reliable enough for automatic formula transcription.

## CAL_AXLE.xls

Likely axle calculation.

Status:

```text
SOURCE_PARTIAL_XLS
IMPLEMENTATION = manual engineering transcription required
```

## CAL_AXLE1.xls

Axle calculation variant.

Status:

```text
SOURCE_PARTIAL_XLS
```

## CAL_BOLT.xls

Bolt calculation.

Status:

```text
SOURCE_PARTIAL_XLS
```

## CAL_BUFFER.xls

Contains a `BUFFER SELECTION` calculation.

Visible source logic includes:

```text
K.E. = 1/2 * M * V^2
```

The sheet contains separate LT and CT mass/speed concepts and selection of spring buffer catalog items.

Text indicates LT speed is taken at approximately 50% of LT speed and CT speed similarly.

Because the exact binary formulas and catalog data could not be reliably reconstructed:

```text
Do not implement from extracted text alone.
```

## CAL_Cradle(1331).xls

Cradle-related calculation and drawing information.

Status:

```text
manual engineering transcription required
```

## CAL_CROSS HEAD.XLS

Cross-head calculation.

Status:

```text
manual engineering transcription required
```

## Cal_Gear Box.xls

Gearbox calculation.

Status:

```text
manual engineering transcription required
```

## CAL_PIN.xls

Pin calculation.

Status:

```text
manual engineering transcription required
```

## CAL_PLATE.xls

Plate calculation.

Visible text indicates source assumptions/limits including Fe410W / IS 2062 references and stresses around:

```text
allowable shear = 0.4 fy
allowable bearing = 0.4 fy
```

Exact formulas were not reliably extracted.

Do not implement until verified.

## CAL_PLATE1.xls

Plate calculation variant.

Same restriction.

## CAL_PULLEY BEARING.xls

Bearing life calculation.

Visible terminology includes:

- basic durability in operating hours,
- L10h,
- revolution speed,
- n,
- L10km for axle-related application.

Likely bearing-life computation, but exact equations must be manually transcribed and checked.

## CAL_ROPE DRUM THK.xls

Rope-drum thickness calculation.

This overlaps with the verified rope-drum calculations in the `.xlsx` mechanism workbook.

Use the verified `.xlsx` as the initial source and treat this `.xls` as corroborating material only.

## CAL_SHACKLE PLATE.xls

Shackle plate calculation.

Manual transcription required.

## CAL_Trolley Structure.xls

Trolley structure calculation.

Manual transcription required.

## CAL_WHEEL BEARING LIFE.xls

Wheel bearing life calculation.

Manual transcription required.

## Crane Mechanism.xls

Older crane mechanism calculation.

Manual transcription required.

## Gear PCD & OD.xls

Contains gear geometry terms including:

- number of teeth,
- module,
- helix angle,
- outside diameter,
- LT/CT gears and pinions,
- hoisting gear/pinion.

No safe formula transcription from the binary workbook was completed.

## Mechanism Calculation-OUTDOOR CRANE-IS3177.xls

Outdoor crane mechanism calculation.

Manual transcription required.

## NUTRAL AXIS_CAL.xls

Neutral axis calculation.

Manual transcription required.

## ROPE-RATIO.xls

Rope reeving/ratio calculation or reference.

Manual transcription required.

## STD CALULATION.xls

Generic/standard engineering calculations.

Manual transcription required.

## WEIGHT.xls

Weight calculation.

Manual transcription required.

---

# 66. MVP RELEASE CLASSIFICATION

## Tier A: Implement in first functional MVP

These are supported by relatively complete `.xlsx` sources:

1. Master Crane Specifications
2. Main Hoist Motor
3. Main Hoist Brake
4. Wire Rope
5. Rope Drum
6. Main Hoist Gearbox
7. Main Hoist Sheaves
8. Cross Travel Motor
9. Cross Travel Brake
10. Cross Travel Wheel
11. Cross Travel Gearbox
12. Long Travel Motor
13. Long Travel Brake
14. Long Travel Wheel
15. Long Travel Gearbox
16. Crab Weight
17. Wheel/Rail Hardness reference and calculation
18. Crane Category lookup
19. Motor catalog
20. Brake catalog
21. Wire rope reference
22. Speed validation

## Tier B: Include in codebase, disabled until engineering review

1. Box Beam Properties
2. Bending Moment
3. Gantry Girder 40T
4. Gantry Girder 60T
5. Gantry Leg
6. `propB`
7. Outdoor CT/wind calculation

## Tier C: Source inventory only, do not implement until manual transcription

All legacy `.xls` calculations listed in section 65.

---

# 67. Tool Status UX

Every tool card should show a clear status.

```text
READY
Calculation inputs are complete.

PASS
All enabled numerical checks pass.

WARNING
The calculation completed, but engineering review is required.

FAIL
One or more numerical checks failed.

ERROR
The calculation could not be completed.

ENGINEERING REVIEW REQUIRED
The source formula has not been independently validated.

NOT IMPLEMENTED
The source workbook has not been safely transcribed.
```

Never use color alone to communicate status.

---

# 68. Tool Page UX

Example:

```text
-----------------------------------------------------
Main Hoisting Motor
10T EOT Crane - Plant A
-----------------------------------------------------

Inputs
-----------------------------------------------------
Capacity                [ 10.00 ] t
Hook Block Weight       [  0.30 ] t
Hoisting Speed          [  5.00 ] m/min
Duty Factor             [  1.50 ]
Service Factor          [  0.67 ]
No. of Falls            [  4 ]
...

                    [ Recalculate ]

Result
-----------------------------------------------------
Required Motor Power
10.488 kW

14.064 HP

Selected Motor
13 kW
935 RPM
6 pole

Check
Selected rating: 13.00 kW
Required rating: 10.49 kW
PASS

Calculation trace
-----------------------------------------------------
Step 1
J9 = SWL + Hook Block Weight

10 + 0.30 = 10.30 t

Step 2
...

[ Show formula ]
[ Show source ]
-----------------------------------------------------
```

---

# 69. Editable Inputs

Users must be able to edit inputs at any time.

When an input changes:

```text
input changed
  |
  v
mark current calculation stale
  |
  v
recalculate automatically or on save
  |
  v
update dependent tool statuses
```

Use a visible stale state:

```text
Inputs changed
Calculation needs refresh
[Recalculate]
```

For fast tools, automatic recalculation is acceptable.

For large structural tools, use an explicit recalculate button.

---

# 70. Dependency Change Handling

Every tool declares dependencies.

Example:

```ts
{
  toolId: "main-hoist-brake",
  dependsOn: [
    "master.hoistingSpeed",
    "master.numberOfFalls",
    "main-hoist-motor.requiredPower",
    "main-hoist-motor.selectedMotorRPM"
  ]
}
```

If an upstream value changes:

```text
Main Hoist Motor = stale
Main Hoist Brake = stale
Hoist Gearbox = stale
```

The UI shows this.

Do not let a report silently combine:

```text
new inputs
+
old outputs
```

---

# 71. Save Semantics

Use three states:

```text
Saving...
Saved
Unsaved changes
```

Use debounced Firestore updates.

Suggested debounce:

```text
500 to 1000 ms after input stabilizes
```

Do not make every keystroke a Firestore write.

For large forms:

```text
local React state
      |
      v
validation
      |
      v
debounced Firestore save
```

---

# 72. Calculation Revision Semantics

Each tool instance has:

```text
inputRevision
calculatedRevision
```

Example:

```text
inputRevision = 8
calculatedRevision = 8
```

means current.

If:

```text
inputRevision = 9
calculatedRevision = 8
```

then the tool is stale.

This is more reliable than timestamps alone.

---

# 73. Report Builder

Route:

```text
/projects/:projectId/report
```

UI:

```text
Generate Engineering Report

Project
10T EOT Crane - Plant A

Select content

[x] Main Hoist Motor
[x] Main Hoist Brake
[x] Wire Rope
[x] Rope Drum
[x] Hoist Gearbox
[x] Sheaves
[x] CT Motor
[x] CT Brake
[x] CT Wheels
[x] CT Gearbox
[x] LT Motor
[x] LT Brake
[x] LT Wheels
[x] LT Gearbox
[x] Crab Weight
[ ] Gantry Girder
[ ] Gantry Leg

Order
Use drag and drop.

[Preview Report]
[Print / Save PDF]
```

---

# 74. Report Contents

The report must contain:

## Cover

```text
{project_name}
by StaticaLabs

Engineering Calculation Report

Crane Type
Design Standard Reference
Duty Class
Capacity
Span
Date
Calculation Engine Version
Project Revision
```

## Project summary

A clean table of master inputs.

## Calculation summary

One row per included tool:

```text
Tool
Result
Status
Engine Version
```

## Detailed calculation sections

For every selected tool:

### A. Purpose

What the calculation determines.

### B. Inputs

| Input | Value | Unit | Source |
| ----- | ----: | ---- | ------ |

### C. Assumptions

List all assumptions.

### D. Formula

Show the mathematical equation in readable notation.

### E. Substitution

Example:

```text
P = (10.30 * 5 * ... ) / (...)
```

### F. Intermediate calculations

Every important intermediate.

### G. Final result

Large highlighted result.

### H. Component selection

If applicable:

```text
Required
Selected
Margin
Check
```

### I. Validation checks

| Check | Required | Actual | Status |
| ----- | -------: | -----: | ------ |

### J. Source lineage

```text
Source workbook
Source sheet
Source cell/formula
Source standard note
Tool version
```

### K. Engineering review status

```text
Legacy formula
Requires engineering review
```

---

# 75. Report Generation Architecture

The report should be generated from a canonical report model.

```ts
type ReportModel = {
	project: ProjectSnapshot;
	includedTools: ToolReportSection[];
	generatedAt: string;
	engineVersion: string;
};
```

Every `ToolReportSection` comes from the calculation engine.

Do not generate reports by reading values directly from React DOM.

---

# 76. PDF Strategy

MVP:

1. Render print-friendly HTML report.
2. Use CSS `@media print`.
3. Call `window.print()`.
4. User can choose "Save as PDF" in the browser.

Advantages:

- no PDF server,
- works on Cloudflare Pages,
- report layout is visible before printing,
- fewer infrastructure dependencies.

Future:

- native PDF generation,
- archived report snapshots,
- digital signatures,
- revision locking.

---

# 77. Report Revision Rule

A report must show:

```text
Generated:
2026-09-25 20:30

Calculation Engine:
0.1.0

Tool versions:
Main Hoist Motor 1.0.0
...
```

If inputs change after report generation:

```text
Report snapshot is no longer current.
```

Display:

```text
REPORT OUT OF DATE
```

Do not silently present an old report as current.

---

# 78. Report Auditability

Every final number must be traceable.

Example:

```text
Required Drum Diameter = 288 mm
    |
    +-- Formula: 12 * D_rope * falls * C
    |
    +-- Input:
          rope diameter = 16 mm
          falls = 4
          factor = 0.375
    |
    +-- Source:
          Workbook: 01-MAC-...
          Sheet: M.H.
          Source cell: H75
```

This traceability is a core product feature.

---

# 79. Optional DESIGN GENERATION FEATURE

Status:

```text
MAYBE / FUTURE
```

The first implementation should not attempt real CAD.

Instead generate a structured design specification.

Example:

```json
{
	"crane": {
		"capacity_t": 10,
		"span_m": 10,
		"lift_m": 18
	},
	"hoist": {
		"drumDiameter_mm": 320,
		"drumLength_mm": 1869.155,
		"ropeDiameter_mm": 16,
		"sheaveDiameter_mm": 320
	},
	"travel": {
		"ctWheelDiameter_mm": 160,
		"ltWheelDiameter_mm": 200
	}
}
```

Then render a simple schematic:

```text
     <------------- SPAN ------------->

     ====================================
     |                                  |
     |              GIRDER              |
     |         +--------------+         |
     |         |     CRAB     |         |
     |         +--------------+         |
     |                                  |
     ====================================

       O                              O
```

This feature must be labeled:

```text
PRELIMINARY DESIGN VISUALIZATION
NOT A FABRICATION DRAWING
```

Do not generate manufacturing tolerances, weld dimensions, bolt grades, or fabrication geometry unless those calculations have been separately validated.

---

# 80. React UI Structure

## Routes

```text
/
  -> redirect to /projects if authenticated

/login

/projects
/projects/new

/projects/:projectId
/projects/:projectId/specifications
/projects/:projectId/tools
/projects/:projectId/tools/:toolInstanceId
/projects/:projectId/report
```

Optional later:

```text
/tools
/settings
```

---

# 81. Main Application Layout

Desktop:

```text
+--------------------------------------------------------+
| StaticaLabs | Project Name                User         |
+----------------+-------------------------------------+
|                |                                     |
| Projects       |                                     |
| Specifications|       Main content                  |
| Tools          |                                     |
| Report         |                                     |
|                |                                     |
|                |                                     |
+----------------+-------------------------------------+
```

Project workspace:

```text
Sidebar
  Project overview
  Specifications
  Hoisting
  Cross Travel
  Long Travel
  Structural
  Reports
```

---

# 82. Engineering UI Design Principles

Use:

- strong hierarchy,
- spacious forms,
- consistent units,
- readable formulas,
- clear engineering terminology,
- compact but detailed tables,
- obvious stale-state indicators,
- keyboard navigation,
- accessible form controls,
- sticky calculation summary where useful.

Avoid:

- dashboard overload,
- giant cards containing too much text,
- decorative gradients,
- ambiguous icon-only controls,
- color-only status,
- hidden calculations,
- tiny formula text,
- spreadsheet-like cell coordinates.

---

# 83. Input Component Requirements

Numeric input must show:

```text
Label
Value
Unit
Help text
Validation state
```

Example:

```text
Hoisting speed
[ 5.00 ] m/min

Speed at which the load is raised.
Source: Master Specifications
```

Invalid:

```text
Hoisting speed
[ -5.00 ] m/min

Error:
Value must be greater than 0.
```

---

# 84. Calculation Trace UI

Use collapsible steps.

```text
Calculation method

1. Determine effective lifted mass
   10.00 + 0.30 = 10.30 t

2. Apply duty factors
   ...

3. Calculate motor power
   P = ...

4. Convert kW to HP
   ...
```

Each step can expose:

```text
Formula
Substitution
Result
Source
Dependencies
```

---

# 85. Error Handling

Every calculation must handle:

```text
missing input
invalid input
division by zero
invalid sqrt domain
overflow
non-finite result
missing catalog item
unknown selected component
dependency unavailable
stale dependency
unsupported configuration
```

Never show:

```text
NaN
Infinity
undefined
```

to users.

Example:

```text
Cannot calculate drum thickness.

Reason:
Allowable crushing stress is missing.
```

---

# 86. Comparison Semantics

Use helpers.

```ts
function gte(actual: number, required: number): CheckResult;
function lte(actual: number, limit: number): CheckResult;
function between(actual: number, min: number, max: number): CheckResult;
```

Example:

```ts
gte(selectedMotorKW, requiredMotorKW);
```

Use a defined numerical tolerance only where engineering review approves it.

Do not add arbitrary epsilon to safety-critical thresholds.

---

# 87. Rounding Policy

Default:

```text
Do calculations at full JavaScript number precision.

Round only for display.

Preserve explicit source ROUND operations.
```

Example:

Source:

```text
ROUND(value, 0)
```

Implementation:

```ts
excelRound(value, 0);
```

not:

```ts
Math.round(allIntermediateValues);
```

---

# 88. Catalog Data Architecture

Catalog data is separate from formula logic.

Example:

```ts
type BrakeCatalogItem = {
	id: string;
	model: string;
	drumDiameterMm: number;
	ratedTorqueKgm: number;
	ratedTorqueNm: number;
	weightKg: number;
	source: SourceLineage;
};
```

Selection:

```ts
function validateBrakeSelection(
	selected: BrakeCatalogItem,
	requiredTorqueKgm: number,
) {
	return {
		actual: selected.ratedTorqueKgm,
		required: requiredTorqueKgm,
		pass: selected.ratedTorqueKgm >= requiredTorqueKgm,
	};
}
```

---

# 89. Automatic Component Selection Policy

The workbook often contains a selected component but does not define a complete automated optimization rule.

Therefore MVP:

```text
Engineer selects component
  |
  v
System checks component against required values
```

Do not implement:

```text
automatically choose cheapest motor
automatically choose smallest gearbox
automatically choose lightest wheel
```

unless an engineering selection algorithm has been explicitly defined.

Future:

```text
Suggest compatible components
```

with clear explainability.

---

# 90. Local Calculation Test Strategy

Every tool needs automated tests before the UI uses it.

Recommended:

```text
Vitest
```

Each calculator must have:

### Unit tests

Test individual formula functions.

### Regression tests

Compare known source workbook outputs.

### Validation tests

Test invalid inputs.

### Check tests

Test PASS and FAIL conditions.

### Dependency tests

Change upstream value and ensure downstream tool becomes stale/recalculates.

---

# 91. Mandatory Golden Regression Fixtures

## Main hoist

Expected:

```text
motor kW      = 10.4879897176
motor HP      = 14.0643942112
brake kg-m    = 15.5072240017
brake N-m     = 152.073918257
rope load t   = 13.51875
rope load kN  = 132.6189375
drum req mm   = 288
drum L/D      = 5.8411
thickness mm  = 23.6067
gear ratio    = 93.99645
actual speed  = 4.54587
```

## Cross travel

```text
motor kW      = 0.5982255635
motor HP      = 0.8022204806
brake kg-m    = 0.6078394342
brake N-m     = 5.960868587
Pmax t        = 3.75
Pmin t        = 2.75
Pmean t       = 3.416666667
wheel req mm  = 134.3055
wheel rpm     = 39.7836
gear ratio    = 21.61416
actual speed  = 20.1088
status        = PASS
```

## Long travel

```text
motor kW      = 0.5990938154
motor HP      = 0.8033848064
brake kg-m    = 0.6452449378
brake N-m     = 6.327691269
Pmax t        = 8.35
Pmin t        = 3.15
Pmean t       = 6.616666667
wheel req mm  = 179.51085
wheel rpm     = 31.82686
gear ratio    = 27.0177
actual speed  = ~25.136
status        = FAIL
```

The LT failure is a required test.

---

# 92. Property-Based / Invariant Testing

Where mathematically justified and engineering-reviewed, add invariants such as:

- increasing required lifting load must not decrease required hoist power,
- increasing hoist speed must not decrease calculated hoist power under the same remaining inputs,
- selected motor below required power cannot PASS,
- selected brake below required torque cannot PASS,
- selected drum diameter below required diameter cannot PASS,
- a speed outside the lower/upper band must FAIL,
- no calculator may return non-finite values,
- all physical dimensions must remain positive.

Do not add invariants that are not physically guaranteed.

---

# 93. Report Regression Tests

Given the same project fixture:

1. generate report model,
2. compare section IDs,
3. compare key values,
4. compare status,
5. ensure source lineage exists,
6. ensure all selected tool outputs appear,
7. ensure deselected tools do not appear.

---

# 94. Firestore Test Strategy

Use Firebase Emulator Suite locally.

Test:

```text
Unauthenticated user cannot read project
Unauthenticated user cannot write project

User A can read User A project
User A cannot read User B project
User A cannot update User B project
User A cannot change ownerUid

User A can read/write own tool instances
User A cannot access another project tools

User A can read/write own report metadata
```

---

# 95. Save/Reload Test

Mandatory:

```text
create project
add tools
enter inputs
calculate
reload browser
verify project restored
recalculate
compare outputs
```

The outputs must match.

---

# 96. Version Migration

Every stored project gets:

```text
schemaVersion
calculationEngineVersion
```

Every tool instance gets:

```text
toolVersion
```

If an updated tool changes formulas:

```text
old project
   |
   v
detect old tool version
   |
   v
recalculate under new version
   |
   +-- optionally preserve old snapshot
```

MVP can prompt:

```text
This calculation was created with engine version 0.1.0.
Current engine is 0.2.0.

[Recalculate]
```

Do not silently alter the calculation result.

---

# 97. Source Lineage Type

```ts
type SourceLineage = {
	workbook: string;
	sheet?: string;
	cells?: string[];
	formulaIds?: string[];
	notes?: string[];
};
```

Example:

```json
{
	"workbook": "01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx",
	"sheet": "M.H.",
	"cells": ["H20", "H21"],
	"formulaIds": ["MH-MOTOR-01", "MH-MOTOR-02"]
}
```

---

# 98. Formula ID Convention

Use stable IDs.

Examples:

```text
MH-MOTOR-01
MH-MOTOR-02
MH-BRAKE-01
MH-BRAKE-02
MH-ROPE-01
MH-DRUM-01
MH-DRUM-02
MH-GEARBOX-01
MH-SHEAVE-01

CT-MOTOR-01
CT-BRAKE-01
CT-WHEEL-01
CT-GEARBOX-01

LT-MOTOR-01
LT-BRAKE-01
LT-WHEEL-01
LT-GEARBOX-01

GRD-PROP-01
GRD-PROP-02
GRD-LOAD-01
GRD-STRESS-01
GRD-DEFLECT-01

LEG-PROP-01
LEG-BM-01
LEG-WIND-01
LEG-STABILITY-01
```

These IDs make reports and tests stable across UI refactors.

---

# 99. Engineering Review Workflow

The MVP should have an internal review state even if no multi-user approval workflow exists.

Each tool:

```text
SOURCE IDENTIFIED
      |
      v
FORMULA TRANSCRIBED
      |
      v
AUTOMATED TESTS PASS
      |
      v
ENGINEER REVIEW
      |
      v
VALIDATED
```

Only `VALIDATED` tools can be treated as production engineering calculations.

UI can show:

```text
Legacy source, engineering review required
```

rather than hiding the state.

---

# 100. Recommended Internal Tool Metadata

```ts
type EngineeringValidationMetadata = {
	formulaValidated: boolean;
	reviewedBy?: string;
	reviewedAt?: string;
	reviewNotes?: string;

	sourceWorkbook: string;
	sourceSheet?: string;

	sourceStandard?: StandardReference[];

	status:
		| 'source-only'
		| 'transcribed'
		| 'tested'
		| 'engineering-reviewed'
		| 'production';
};
```

---

# 101. Project Dashboard UX

Example:

```text
10T EOT Crane - Plant A
by StaticaLabs

Capacity         10 t
Span             10 m
Lift             18 m
Duty             M5

Calculation Health

15 tools configured
12 PASS
2 WARNING
1 FAIL

Recent issue
Long Travel Gearbox
Actual speed 25.136 m/min
Allowed max 22.000 m/min

[Open Tool]
```

The most important engineering failures should appear at the top.

---

# 102. Global Calculation Summary

The project should have one summary panel:

```text
Calculation Summary

Main Hoist
  Motor       10.488 kW       PASS
  Brake       15.507 kg-m     PASS
  Rope        132.619 kN      PASS
  Drum        320 mm selected PASS
  Gearbox     4.546 m/min     PASS

Cross Travel
  Motor       0.598 kW        PASS
  Wheel       160 mm          PASS
  Gearbox     20.109 m/min    PASS

Long Travel
  Motor       0.599 kW        PASS
  Wheel       200 mm          PASS
  Gearbox     25.136 m/min    FAIL
```

---

# 103. Report Safety Language

Every report should contain an engineering review note:

```text
Engineering Review Notice

This report reproduces calculations from the configured calculation
engine and its referenced source formulas. A calculation result is not
a substitute for engineering judgment, project-specific verification,
inspection, testing, or professional approval.

Where a source formula is marked "engineering review required", the
result must not be treated as an independently validated design check.

Standard references are shown as source references and are not to be
interpreted as automatic certification of compliance with the latest
edition of an Indian Standard.
```

Do not call the product:

```text
certified
approved
guaranteed compliant
```

without external engineering/legal basis.

---

# 104. Cloudflare Pages Deployment

Target:

```text
eot.staticalabs.com
```

Build:

```text
npm run build
```

Output:

```text
dist
```

Cloudflare Pages supports Vite deployment using a build command and output directory.

Configure production custom domain:

```text
eot.staticalabs.com
```

Add SPA fallback using a suitable Cloudflare Pages configuration such as:

```text
/* /index.html 200
```

via the project's public `_redirects` configuration.

---

# 105. Firebase Environment Configuration

Use Vite environment variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Firebase web configuration values are client-side configuration, not a substitute for security rules.

Security comes from:

- Firebase Auth,
- Firestore Rules,
- App Check,
- least-privilege access.

---

# 106. Production Domains

Configure Firebase Authentication authorized domains for:

```text
eot.staticalabs.com
localhost
127.0.0.1
```

Use only domains actually required.

---

# 107. Development Environment

Suggested:

```text
Node.js
npm
Vite
TypeScript
Firebase CLI
Firebase Emulator Suite
Vitest
```

Scripts:

```json
{
	"dev": "vite",
	"build": "tsc -b && vite build",
	"preview": "vite preview",
	"test": "vitest",
	"test:watch": "vitest --watch",
	"lint": "eslint .",
	"format": "prettier --write ."
}
```

---

# 108. CI Pipeline

Every PR should run:

```text
npm ci
npm run lint
npm run test
npm run build
```

Deployment:

```text
main branch
   |
   v
Cloudflare Pages
   |
   v
npm run build
   |
   v
dist
```

Do not deploy if calculation tests fail.

---

# 109. Calculation Engine Code Example

Illustrative pattern:

```ts
export const mainHoistMotor: CalculationToolDefinition = {
  id: "main-hoist-motor",
  version: "1.0.0",
  name: "Main Hoist Motor",
  category: "Hoisting",
  status: "engineering-review-required",

  inputs: [...],
  outputs: [...],
  dependencies: [...],

  calculate(ctx) {
    const steps: CalculationStep[] = [];

    const effectiveLoadT =
      ctx.capacityT + ctx.hookBlockWeightT;

    steps.push({
      id: "MH-MOTOR-01",
      label: "Effective lifted mass",
      formulaText: "effectiveLoad = SWL + hook block weight",
      substitutedExpression:
        `${ctx.capacityT} + ${ctx.hookBlockWeightT}`,
      variables: {
        capacity: value(ctx.capacityT, "t"),
        hookBlockWeight: value(ctx.hookBlockWeightT, "t")
      },
      result: value(effectiveLoadT, "t"),
      dependsOn: []
    });

    const powerKw =
      (
        effectiveLoadT *
        ctx.hoistingSpeedMPerMin *
        ctx.factorA *
        ctx.factorB *
        ctx.factorC
      ) /
      (
        6.12 *
        ctx.efficiencyFactor *
        ctx.deratingFactor
      );

    steps.push(...);

    return buildResult(...);
  }
};
```

The actual implementation must match the verified source formula mapping exactly.

---

# 110. Do Not Build Formula Parsers

Do not attempt to execute Excel formulas dynamically.

Bad:

```text
read user formula -> eval()
```

Bad:

```text
dangerously parse string -> Function()
```

Good:

```text
formula logic is source-controlled TypeScript
```

Every formula is code-reviewed and tested.

---

# 111. No `eval`

This product must not use:

```ts
eval();
new Function();
```

to calculate engineering formulas.

All formulas must be ordinary TypeScript functions.

---

# 112. Local Calculation Testing Without Firebase

Every tool calculation must work in tests without Firebase.

Example:

```ts
const result = mainHoistMotor.calculate(fixtureContext);

expect(result.outputs.requiredMotorPowerKw.value).toBeCloseTo(10.4879897176, 8);
```

This keeps formula correctness independent from application infrastructure.

---

# 113. Tool Input Schema Example

```ts
const mainHoistInputs: InputDefinition[] = [
	{
		key: 'capacityT',
		label: 'Rated Capacity',
		unit: 't',
		type: 'number',
		required: true,
		min: 0,
		description: 'Rated crane lifting capacity.',
	},
	{
		key: 'hookBlockWeightT',
		label: 'Hook Block Weight',
		unit: 't',
		type: 'number',
		required: true,
		min: 0,
		description: 'Hook block mass.',
	},
	{
		key: 'hoistingSpeedMPerMin',
		label: 'Hoisting Speed',
		unit: 'm/min',
		type: 'number',
		required: true,
		min: 0,
	},
];
```

---

# 114. Output Schema Example

```ts
const mainHoistOutputs = [
	{
		key: 'requiredMotorPowerKw',
		label: 'Required Motor Power',
		unit: 'kW',
	},
	{
		key: 'requiredMotorPowerHp',
		label: 'Equivalent Motor Power',
		unit: 'HP',
	},
];
```

---

# 115. Engineering Margin Display

Where useful:

```text
Required: 10.488 kW
Selected: 13.000 kW

Margin:
+2.512 kW
+23.95%
```

Formula:

```text
margin = actual - required

marginPercent =
  ((actual - required) / required) * 100
```

Only display margin where comparison semantics are valid.

Do not call an arbitrary difference a "safety factor".

---

# 116. Selection Check Taxonomy

Use explicit check types:

```text
MINIMUM_REQUIRED
MAXIMUM_ALLOWED
RANGE
EQUALITY
REFERENCE_ONLY
ENGINEERING_REVIEW
```

Examples:

```text
Motor rating >= required
Wheel diameter >= required
Drum L/D <= 6
Speed within ±10%
Hardness >= minimum
```

---

# 117. Warning Versus Fail

Use:

`FAIL`

when a deterministic numeric requirement is violated.

Use:

`WARNING`

when:

- a source formula is not independently validated,
- a standard crosswalk is missing,
- a component catalog rating is incomplete,
- engineering review is required,
- a source spreadsheet contains an apparent inconsistency but the numeric calculation itself is complete.

Example:

```text
LT actual speed > upper bound
=> FAIL

Formula inherited from legacy standard
=> WARNING

No current standard crosswalk
=> WARNING
```

---

# 118. Source Workbook Inconsistency Policy

If the spreadsheet contains:

```text
formula says 25.136
narrative says OK
```

the application must:

1. calculate 25.136,
2. compare against the numerical limit,
3. derive FAIL,
4. optionally record the source narrative as a note,
5. never use the narrative to override the calculation.

This policy applies globally.

---

# 119. Standard Reference Display

Example:

```text
Source standard reference
IS 3177:1999
Table 21A, Clause C-2.2
Source: workbook note

Current standard status
Review required against current BIS reference
```

Do not convert this to:

```text
IS 3177:2020 compliant
```

without validation.

---

# 120. Tool Addition Workflow

Project page:

```text
[+ Add Calculation Tool]
```

Modal:

```text
Hoisting
  Main Hoist Motor
  Main Hoist Brake
  Wire Rope
  Rope Drum
  Hoist Gearbox
  Sheaves

Cross Travel
  CT Motor
  CT Brake
  CT Wheels
  CT Gearbox

Long Travel
  LT Motor
  LT Brake
  LT Wheels
  LT Gearbox

Weight
  Crab Weight

Reference
  Crane Category
  Motor Catalog
  Brake Catalog

Structural
  Box Beam Properties [Engineering Review]
  Bending Moment [Engineering Review]
  Gantry Girder [Engineering Review]
  Gantry Leg [Engineering Review]
```

---

# 121. Tool Reordering

Project tool order is user-editable.

Store:

```text
toolOrder: string[]
```

Example:

```json
[
	"main-hoist-motor",
	"main-hoist-brake",
	"wire-rope",
	"rope-drum",
	"hoist-gearbox",
	"ct-motor",
	"lt-motor"
]
```

Report follows this order by default.

---

# 122. Report Selection State

Report builder should store:

```ts
type ReportSelection = {
	toolInstanceId: string;
	included: boolean;
	order: number;
};
```

The report itself should be a generated artifact from current calculations.

---

# 123. Project Search

MVP project list should allow:

```text
Search projects...
```

Filter by:

- project name,
- crane type,
- status.

Sort by:

- updated,
- created,
- name.

---

# 124. Empty State

New user:

```text
No crane projects yet.

Create a project to start an engineering calculation.

[Create New Project]
```

---

# 125. Login Page

Minimal professional UI:

```text
StaticaLabs

EOT Crane Engineering

Calculation and engineering workflow tools.

[ Continue with Google ]
```

No email/password form.

---

# 126. Navigation

Global:

```text
Projects
New Project

Current Project
Specifications
Calculations
Report

Account
Sign Out
```

---

# 127. Accessibility

At minimum:

- semantic labels,
- keyboard navigation,
- visible focus,
- readable text contrast,
- no status communicated by color alone,
- accessible error messages,
- form labels linked to inputs,
- table headers,
- print-friendly structure.

Engineering users may use keyboard-heavy workflows, so tab order matters.

---

# 128. Mobile Behavior

The app is primarily desktop/tablet engineering software.

Mobile should still:

- allow login,
- view projects,
- edit basic inputs,
- inspect outputs,
- view reports.

Complex structural tables can scroll horizontally.

Do not attempt to force large engineering tables into tiny cards.

---

# 129. Local Storage Safety Net

Optional but recommended:

Keep a temporary local draft cache:

```text
localStorage:
  projectDraft:{projectId}
```

This protects against accidental browser refresh before Firestore save.

It is not the source of truth.

On load:

```text
Firestore current
+
local draft newer
=
ask user which to keep
```

Do not silently overwrite Firestore.

---

# 130. Unsaved Changes UX

Before navigation:

```text
You have unsaved changes.

[Stay]
[Discard]
```

If the Firestore write has already succeeded, do not treat the form as unsaved.

---

# 131. Calculation Loading UX

For client-side calculations:

```text
Calculating...
```

should normally be very short.

For structural tools:

```text
Running calculation...
Validating section properties...
Validating load cases...
Validating stress...
Validating deflection...
```

These can still be synchronous, but progress UI improves user confidence.

---

# 132. Logging

Do not log full project input payloads to public production console.

Development logs can contain:

```text
toolId
toolVersion
resultStatus
duration
```

Avoid sensitive or unnecessary information.

---

# 133. Observability

MVP can be minimal.

Track client-side errors using a future error-monitoring service if desired.

Do not send engineering calculation data externally without a clear privacy policy.

---

# 134. Privacy

Project data can include proprietary engineering designs.

Firestore documents must remain private to the project owner.

Do not expose project IDs in public URLs that bypass authorization.

Public project sharing is out of scope.

---

# 135. Performance

The calculation engine is local, so most calculations should feel instantaneous.

Use:

- memoized tool calculations where useful,
- calculation result caching keyed by tool version + input hash,
- lazy loading of structural modules if bundle size becomes large.

Example cache key:

```text
toolId|toolVersion|stableHash(inputs)
```

Do not cache if a dependency/catalog version changed.

---

# 136. Input Hashing

For deterministic stale detection:

```ts
calculationFingerprint = hash({
	toolId,
	toolVersion,
	inputs,
	dependencySnapshots,
	catalogVersion,
});
```

Store:

```text
inputFingerprint
calculatedFingerprint
```

If equal:

```text
CURRENT
```

Otherwise:

```text
STALE
```

---

# 137. Catalog Versioning

Catalog files must include:

```ts
{
	catalogVersion: '2026.09.01';
}
```

A component update should invalidate dependent calculations.

---

# 138. Engineering Calculation Snapshot

For every calculation, optionally store:

```json
{
	"toolId": "lt-gearbox",
	"toolVersion": "1.0.0",
	"catalogVersion": "2026.09.01",
	"inputFingerprint": "...",
	"outputs": {
		"actualSpeedMPerMin": 25.136
	},
	"checks": [
		{
			"id": "LT-GEARBOX-SPEED",
			"status": "FAIL"
		}
	]
}
```

---

# 139. Report Snapshot and Reproducibility

An engineering report should be reproducible from:

```text
project inputs
tool versions
catalog versions
calculation engine version
report selections
```

This is more important than simply storing the rendered HTML.

---

# 140. Firestore Collection Example

```text
users/
  123/

projects/
  p001/
    ownerUid: 123
    projectName: "10T EOT Crane - Plant A"
    schemaVersion: 1
    calculationEngineVersion: "0.1.0"

  toolInstances/
    t001/
      toolId: "main-hoist-motor"
      toolVersion: "1.0.0"
      inputs: {...}
      outputs: {...}
      status: "PASS"

    t002/
      toolId: "lt-gearbox"
      toolVersion: "1.0.0"
      status: "FAIL"

  reports/
    r001/
      includedToolInstanceIds: [...]
      generatedAt: ...
      engineVersion: "0.1.0"
```

---

# 141. Firestore Rules Pseudocode

Production rules must be implemented and emulator-tested.

Concept:

```text
function signedIn() {
  return request.auth != null;
}

function isProjectOwner(projectId) {
  return signedIn()
    && get(
      /databases/$(database)/documents/projects/$(projectId)
    ).data.ownerUid == request.auth.uid;
}

projects:
  create if signedIn && request.resource.data.ownerUid == request.auth.uid
  read if owner
  update if owner and ownerUid unchanged
  delete if owner

toolInstances:
  read/write if isProjectOwner(projectId)

reports:
  read/write if isProjectOwner(projectId)
```

---

# 142. No Client-Controlled Admin Fields

Do not trust the client to set:

```text
isAdmin
role
subscriptionTier
verifiedEngineer
```

These belong to a future trusted admin/backend layer.

MVP does not need those fields.

---

# 143. Billing Out of Scope

The first MVP should not implement payments.

Future architecture can add:

```text
subscription
usage
credits
teams
licenses
```

after the engineering workflow is validated.

The product's initial goal is validating:

> Do engineers want to use this?

not:

> Can we bill them?

---

# 144. Recommended MVP Milestones

## Milestone 1

Foundation:

- Vite React app
- Firebase Auth
- Firestore
- Cloudflare Pages
- project CRUD
- layout

## Milestone 2

Calculation engine:

- master specs
- unit helpers
- core validation
- tool registry
- golden fixtures

## Milestone 3

Mechanism suite:

- MH
- CT
- LT
- catalogs
- crab weight
- hardness

## Milestone 4

Tool UX:

- calculation trace
- dependency tracking
- stale indicators
- project summary

## Milestone 5

Reports:

- selection
- ordering
- preview
- print/PDF

## Milestone 6

Structural beta:

- Box Beam
- B.M.
- Girder
- Leg

behind engineering-review flags.

---

# 145. Acceptance Criteria

## Authentication

- Google login works.
- No email/password login exists.
- Signed-out users cannot see project data.

## Projects

- Create project.
- Rename project.
- Delete project.
- Reopen project.
- Inputs persist.

## Tools

- Add multiple tools.
- Remove tools.
- Reorder tools.
- Inputs editable at any time.
- Outputs recalculate.
- Dependencies update.
- Stale state works.

## Calculation correctness

- All mandatory golden test cases pass.
- No NaN/Infinity.
- LT gearbox regression fails as expected.
- Hardness issue is surfaced.
- Calculation traces match formula definitions.

## Reports

- Select/deselect tools.
- Preview report.
- Report includes formulas and substitutions.
- Report includes status.
- Report includes source lineage.
- Print to PDF works.
- Outdated report warning works.

## Deployment

- Cloudflare Pages deployment works.
- `eot.staticalabs.com` resolves.
- SPA routes work on direct refresh.
- Firebase authentication domain works.

---

# 146. Critical Engineering QA Checklist

Before enabling any calculation for real engineering use:

```text
[ ] Source workbook identified
[ ] Formula extracted
[ ] Formula manually reviewed
[ ] Variables named
[ ] Units documented
[ ] Constants verified
[ ] Rounding points verified
[ ] Standard reference documented
[ ] Current standard crosswalk reviewed
[ ] Golden case matches
[ ] Edge cases tested
[ ] Invalid inputs tested
[ ] PASS condition tested
[ ] FAIL condition tested
[ ] Independent engineering review completed
[ ] Tool marked production
```

A tool must remain:

```text
ENGINEERING REVIEW REQUIRED
```

until all relevant gates are complete.

---

# 147. What the AI Coding Model Must Never Do

When implementing this specification, the coding model must not:

1. Invent formulas for missing `.xls` files.
2. Treat a spreadsheet narrative "OK" as calculation truth.
3. Replace legacy constants without documenting it.
4. Silently migrate legacy standards to current standards.
5. Automatically select components without a defined rule.
6. round all calculations for prettier UI.
7. hide warnings because they look alarming.
8. overwrite master inputs from calculated outputs without user action.
9. expose private project data.
10. deploy permissive Firestore rules.
11. use `eval` to calculate formulas.
12. claim compliance with a current standard without engineering validation.
13. generate fabrication drawings from incomplete calculations.
14. merge old and new report snapshots silently.
15. assume a selected component is valid without running its checks.

---

# 148. Source Mapping Summary

| Source Workbook                     | Primary Function           | Dependency                 | MVP Status           |
| ----------------------------------- | -------------------------- | -------------------------- | -------------------- |
| 01-MAC-CRANE...INDOOR.xlsx          | Main mechanism             | Master specs + catalogs    | Implement            |
| MAC-CRANE...xlsx                    | Duplicate mechanism source | Same                       | Consolidate          |
| GIRDER\_...xlsx                     | 40T/60T girder             | Beam properties/load cases | Review gate          |
| LEG CALCULATION...xlsx              | Gantry leg                 | propB + input              | Review gate          |
| MAC-Box Beam-Properties.xlsx        | Section properties + BM    | Input geometry             | Review gate          |
| CAL_AXLE.xls                        | Axle                       | Unknown from binary        | Manual               |
| CAL_AXLE1.xls                       | Axle variant               | Unknown                    | Manual               |
| CAL_BOLT.xls                        | Bolt                       | Unknown                    | Manual               |
| CAL_BUFFER.xls                      | Buffer                     | LT/CT speed and mass       | Manual               |
| CAL_Cradle(1331).xls                | Cradle                     | Unknown                    | Manual               |
| CAL_CROSS HEAD.XLS                  | Crosshead                  | Unknown                    | Manual               |
| Cal_Gear Box.xls                    | Gearbox                    | Unknown                    | Manual               |
| CAL_PIN.xls                         | Pin                        | Unknown                    | Manual               |
| CAL_PLATE.xls                       | Plate                      | Unknown                    | Manual               |
| CAL_PLATE1.xls                      | Plate                      | Unknown                    | Manual               |
| CAL_PULLEY BEARING.xls              | Pulley bearing life        | Bearing inputs             | Manual               |
| CAL_ROPE DRUM THK.xls               | Rope drum thickness        | Drum inputs                | Manual/corroboration |
| CAL_SHACKLE PLATE.xls               | Shackle plate              | Unknown                    | Manual               |
| CAL_Trolley Structure.xls           | Trolley structure          | Unknown                    | Manual               |
| CAL_WHEEL BEARING LIFE.xls          | Wheel bearing life         | Wheel/bearing inputs       | Manual               |
| Crane Mechanism.xls                 | Older mechanism            | Unknown                    | Manual               |
| Gear PCD & OD.xls                   | Gear geometry              | Teeth/module/helix         | Manual               |
| Mechanism Calculation-OUTDOOR...xls | Outdoor mechanism          | Wind                       | Manual               |
| NUTRAL AXIS_CAL.xls                 | Neutral axis               | Section geometry           | Manual               |
| ROPE-RATIO.xls                      | Rope ratio                 | Reeving                    | Manual               |
| STD CALULATION.xls                  | Generic calculations       | Unknown                    | Manual               |
| WEIGHT.xls                          | Weight                     | Component data             | Manual               |

---

# 149. Product Naming

Working product name:

```text
StaticaLabs EOT
```

Branding shown to customers:

```text
{project_name} by StaticaLabs
```

Potential future product family:

```text
StaticaLabs EOT
StaticaLabs Crane
StaticaLabs Engineering
```

Do not hard-code the project name into report templates.

---

# 150. Definition of Done for the MVP

The MVP is not done merely when:

```text
the UI works
```

It is done when all of the following are true:

```text
React application deployed
+
Google authentication works
+
Firestore security rules tested
+
Project CRUD works
+
Core calculations implemented
+
Core formulas have golden tests
+
Inputs are editable
+
Dependencies work
+
Calculation traces are visible
+
Numerical checks derive status
+
Reports include selected calculations
+
Reports include formulas and substitutions
+
Reports include source lineage
+
Print-to-PDF works
+
Legacy unsupported calculations are visibly gated
+
LT gearbox regression test fails correctly
+
Engineering review metadata exists
```

---

# 151. Current External Implementation References

These references are for software infrastructure and standard-status checks only.

## Firebase Google Authentication

Firebase documents Google sign-in for JavaScript using `GoogleAuthProvider`, with popup or redirect flows.

https://firebase.google.com/docs/auth/web/google-signin

## Firebase Firestore Security Rules

Firebase recommends Authentication plus Firestore Security Rules for browser-accessed Firestore data.

https://firebase.google.com/docs/firestore/security/overview

https://firebase.google.com/docs/firestore/security/get-started

## Vite

Vite's current documentation includes React templates and a production build process.

https://vite.dev/guide/

## Cloudflare Pages

Cloudflare Pages documents Vite deployments with:

```text
npm run build
dist
```

https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/

## Bureau of Indian Standards

Current standard-status checks referenced during this design:

https://standards.bis.gov.in/

IS 3177:2020:
Electric Overhead Travelling Crane and Gantry Crane for all Applications - Code of Practice, Third Revision, reviewed in 2025.

IS 807:2006:
Design, erection and testing (Structural Portion) of cranes and hoists - Code of practice, Second Revision, reviewed in 2026.

IS 800:2007:
General construction in steel - Code of practice, Third Revision, reviewed in 2022.

These current-status references do not automatically validate or replace the formulas contained in the legacy workbooks.

---

# 152. Final Implementation Instruction to the AI Coding Model

Implement the application from this document as a production-quality React + Vite + Firebase application.

The highest priority is not visual polish.

The highest priority is:

```text
calculation correctness
traceability
validation
data integrity
and explicit engineering review state
```

When a formula is clearly available in the verified `.xlsx` sources, implement the formula exactly and expose its calculation steps.

When a formula is not reliably recoverable:

```text
DO NOT GUESS.
```

Create the tool interface and mark it:

```text
ENGINEERING REVIEW REQUIRED
```

or:

```text
NOT IMPLEMENTED
```

The application must be able to explain every important number it produces.

For example, a user should be able to click:

```text
Required Motor Power = 10.488 kW
```

and see:

```text
Formula
Substitution
Intermediate calculations
Input values
Units
Source workbook
Source sheet/cell
Standard note
Tool version
```

The application is intended to turn a large collection of engineering spreadsheets into a maintainable software calculation platform.

The correct architecture is therefore:

```text
Engineering knowledge
      |
      v
Versioned calculation engine
      |
      v
Validated tool outputs
      |
      v
Project-level workflow
      |
      v
Traceable engineering report
```

not:

```text
Excel -> prettier UI
```

That distinction should guide every implementation decision.
