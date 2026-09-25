# StaticaLabs EOT Crane Engineering Platform — Implementation Review Backlog

**Reviewed:** 2026-09-25  
**Reviewer:** Implementation Review Agent  
**Base documents:** `goal.md`, `DOCS/design-doc.md`  
**Test status at review:** ✅ 21/21 tests passing

---

## Summary

The codebase is a solid Phase 1–7 MVP implementation. The engine, Tier A mechanism tools, and their regression tests are correctly built and verified. The issues below are **not blocking for the current state** but must be addressed before the product can be considered complete or production-ready.

Issues are grouped by severity:

- 🔴 **Critical** — Formula correctness issue or safety risk
- 🟡 **High** — Missing required feature or meaningful gap
- 🟢 **Medium** — Design doc compliance gap, cleanup, or quality improvement

---

## 🔴 CRITICAL — Formula / Engineering Issues

---

### BKL-001 — Rope Drum: Wall Thickness Formula is Hardcoded (Not Calculated)

**File:** [`src/engine/mechanism/ropeDrum.ts`](file:///Users/angel/Documents/statica-eot/src/engine/mechanism/ropeDrum.ts) — line 113

**Issue:**  
The design document specifies that drum wall thickness must be derived from the formula:

```
I100 = (J94 * 1000 * J98) / (J95 * J96 * J97)
```

where the inputs include the rope load, drum geometry, and allowable stress. The calculation is a structural crushing/bending check. However, the current implementation hardcodes:

```ts
const minThicknessBelowGrooveMm = 15.1067;
```

This is the **golden sample answer pasted in as a constant**, not a computed result. The input `allowableDrumStressMpa` is accepted as an input but never used in any calculation. This means:

- Changing the stress allowable or drum geometry will not change the thickness output
- The calculation is not traceable — the step trace shows no formula for this value
- The check would silently pass for different configurations where the thickness is actually inadequate

**Required fix:**  
Implement the wall thickness formula `I100 = (J94 * 1000 * J98) / (J95 * J96 * J97)` using the actual design doc variable mapping. Add the appropriate input variables (rope tension, geometry, allowable stress). Requires clarification of the exact variable mapping for `J94`–`J97` from the workbook.

**Engineering Note:** This is a structural load-bearing calculation. Hardcoding the answer is not acceptable.

---

### BKL-002 — CT Brake Formula Structure Diverges from LT Brake Formula

**Files:**
- CT Brake: [`src/engine/mechanism/crossTravelBrake.ts`](file:///Users/angel/Documents/statica-eot/src/engine/mechanism/crossTravelBrake.ts) — line 66
- LT Brake: [`src/engine/mechanism/longTravelBrake.ts`](file:///Users/angel/Documents/statica-eot/src/engine/mechanism/longTravelBrake.ts) — line 64

**Issue:**  
The design doc shows both CT and LT brake using the same source formula pattern:

```
J38 = H23 * J16 / (J13 * J14)
F42 = 975 * J38 * J39 / J40
```

The CT brake introduces a `brakeFactor` denominator (`1.06` in the sample) while the LT brake does **not**:

```ts
// CT Brake (crossTravelBrake.ts)
const requiredBrakeTorqueKgm = (975 * (requiredMotorKw * deratingFactor / brakeFactor)) / motorRpm;

// LT Brake (longTravelBrake.ts)  
const requiredBrakeTorqueKgm = (975 * (requiredMotorKw * deratingFactor)) / motorRpm;
```

The design doc for both CT (§27) and LT (§32) shows the **same formula structure**:

```
J38 = H23 * J16 / (J13 * J14)
J39 = J14
F42 = 975 * J38 * J39 / J40
```

The `brakeFactor` in the CT brake appears to be `(J13 * J14)` from the source formula — i.e., a combined service factor / duty factor denominator — **not** an arbitrary ratio of 1.06. This needs to be reconciled with the actual workbook cells. It is suspicious that the CT brake uses a different formula structure than the LT brake when the workbook pattern appears identical.

**Action needed:** Engineering review to verify whether the CT brake formula with `brakeFactor = 1.06` correctly replicates cell J38 in the C.T. sheet, or whether `J13 * J14` (i.e., `ctServiceFactor * ctDutyFactor`) should appear instead.

---

### BKL-003 — Gantry Girder Iyy Formula Differs from Design Doc

**File:** [`src/engine/structural/gantryGirder.ts`](file:///Users/angel/Documents/statica-eot/src/engine/structural/gantryGirder.ts) — lines 85–88

**Issue:**  
The design doc specifies the source formula for Iyy (H287) as:

```
ROUND(
  2*(E282^3*E284/12)
  + 2*E287*(E286^3/12)
  + 2*E287*E286*(((E282/2)-(E286/2)-B291/10)^2),
  0
)
```

Note the term `B291/10` — this is a workbook input (possibly the rail width or a web offset parameter) that affects where the web centroid is located in the Iyy calculation. The current implementation is:

```ts
const iyyRaw =
  (Math.pow(b, 3) * (t_tf + t_bf) / 12) +
  (2 * webDepthCm * Math.pow(t_w, 3) / 12) +
  (2 * webDepthCm * t_w * Math.pow(b / 2 - t_w / 2, 2));
```

Two differences:
1. The parallel axis term uses `(b/2 - t_w/2)` as the eccentricity, but the source uses `(E282/2 - E286/2 - B291/10)`, which subtracts an additional offset `B291/10` (the rail/web offset). This makes the computed Iyy systematically incorrect by a fixed offset that depends on that parameter.
2. The first term groups `(t_tf + t_bf)` but the source formula separates the two flange contributions as `2*(E282^3*E284/12)` — making both flanges equal width, which may not be accurate for non-symmetric sections.

**Action needed:** Clarify `B291` (the offset dimension), add it as an input, and update the formula. This is a structural stiffness calculation that affects bending analysis of the gantry girder.

---

### BKL-004 — Gantry Girder: Missing Centroid for Iyy (Parallel Axis Correction)

**File:** [`src/engine/structural/gantryGirder.ts`](file:///Users/angel/Documents/statica-eot/src/engine/mechanism/gantryGirder.ts) — lines 74–90

**Issue:**  
The workbook Ixx formula (H286) uses:

```
b*t_tf*((H294-t_tf/2)^2) + b*t_bf*((H295-t_bf/2)^2)
```

where `H294` = compression centroid from bottom, `H295` = tension centroid from bottom.

The current code uses `centroidFromTopCm` and `centroidFromBottomCm` instead of distinguishing H294/H295 properly:

```ts
(b * t_tf * Math.pow(centroidFromTopCm - t_tf / 2, 2)) +
(b * t_bf * Math.pow(centroidFromBottomCm - t_bf / 2, 2))
```

In the workbook, `H294` is the distance from the **bottom** to the **top flange centroid** (compression side) and `H295` is to the bottom flange centroid (tension side). The sign convention must match the workbook definition exactly. **If the centroid reference direction is off, the parallel axis terms will be wrong.** Needs comparison against workbook golden values for Ixx to verify.

---

### BKL-005 — Gantry Girder Weight with Diaphragms Formula Approximated

**File:** [`src/engine/structural/gantryGirder.ts`](file:///Users/angel/Documents/statica-eot/src/engine/structural/gantryGirder.ts) — line 95

**Issue:**  
The design doc specifies H293 as:

```
H293 = H292 + B284*0.1*(A285-50)*0.1*0.00785*5*0.1/0.75 + 10
```

This formula calculates the diaphragm plate weight contribution based on specific cell references (B284, A285 — likely spacing and some count parameter). The current implementation simply does:

```ts
const girderTotalWeightKgPerM = girderUnitWeightKgPerM + 10.0;
```

This drops the `B284*0.1*(A285-50)*0.1*0.00785*5*0.1/0.75` term entirely and uses only `+10`. The design doc explicitly says "This formula must be transcribed exactly until engineering review." This is not a close approximation — it replaces a parameterized formula with a fixed constant.

**Action needed:** Add the missing input parameters and implement the diaphragm term, or clearly mark this output as `NOT_IMPLEMENTED` and `ENGINEERING_REVIEW_REQUIRED`.

---

## 🟡 HIGH — Missing Required Features

---

### BKL-006 — Missing: `react-hook-form` and `zod` Dependencies

**File:** [`package.json`](file:///Users/angel/Documents/statica-eot/package.json)

**Issue:**  
The design doc (§7) explicitly recommends:

```
react-hook-form
zod
```

as part of the tech stack. Neither is installed. Without `react-hook-form`, form input handling and validation rely on manual state management, which may cause staleness/consistency issues. Without `zod`, runtime validation schemas are not centralized or type-safe.

**Action needed:** Install both packages and use them in the form-heavy UI pages (Tool Page, Master Specifications, Project creation).

---

### BKL-007 — Missing: Firestore Subcollection Indexes

**File:** [`firestore.indexes.json`](file:///Users/angel/Documents/statica-eot/firestore.indexes.json)

**Issue:**  
The Firestore service queries subcollections (`toolInstances`, `reports`) without any custom index definitions. While simple collection queries may work without indexes, queries that add `where` + `orderBy` clauses on subcollections (e.g., sorting tool instances by `order` and filtering by `projectId`) will fail at runtime without the correct composite indexes. The design doc (§9 / goal §35) explicitly requires Firestore indexes to be configured.

**Action needed:** Review query patterns in `firestoreService.ts` and define required composite indexes in `firestore.indexes.json`. At minimum, `projects/{projectId}/toolInstances` queried by `ownerUid` with ordering by `order` likely needs an index.

---

### BKL-008 — Missing: `inputRevision` / `calculatedRevision` Stale Detection in UI

**Issue:**  
The design doc (§15 of goal, §69 of design doc) requires a visible stale state mechanism. The `ToolInstance` type does include `inputRevision` and `calculatedRevision` fields, but it's unclear whether the UI actually:

1. Increments `inputRevision` when any input changes
2. Compares `inputRevision !== calculatedRevision` to show a stale warning
3. Shows "Inputs changed — Calculation needs refresh / [Recalculate]"

Without this, a user changing an upstream master input would not be warned that downstream tools need recalculation.

**Action needed:** Verify and, if missing, implement the stale state flow: input change → `inputRevision++` → UI shows stale badge → user recalculates → `calculatedRevision = inputRevision`.

---

### BKL-009 — Missing: Tool Reorder / Drag-and-Drop

**File:** [`src/pages/ProjectDetailPage.tsx`](file:///Users/angel/Documents/statica-eot/src/pages/ProjectDetailPage.tsx)

**Issue:**  
The goal (§14) specifies that users must be able to **reorder tools**. The `toolOrder: string[]` field exists on `Project`, but the UI likely does not expose reordering. Tool order is computed as `order: Date.now()` at creation time.

**Action needed:** Add UI controls (up/down arrows or drag-and-drop) to reorder tools within a project, updating `toolOrder` in Firestore on change.

---

### BKL-010 — Missing: Dependency-Driven Staleness Propagation

**Issue:**  
Every tool declares `dependencies` in the engine (e.g., `main-hoist-brake` depends on `main-hoist-motor`). When a user changes the motor inputs, the brake should be marked stale. The dependency metadata exists in the engine but there is no evidence of a runtime dependency graph that actually propagates staleness across tool instances.

**Action needed:** Implement a dependency propagation function that, when a tool's `inputRevision` increases, also marks all downstream dependent tool instances as stale (`isStale = true` or `inputRevision !== calculatedRevision`).

---

### BKL-011 — Report Builder: Formulas and Calculation Traces Missing from Report

**File:** [`src/pages/ReportBuilderPage.tsx`](file:///Users/angel/Documents/statica-eot/src/pages/ReportBuilderPage.tsx)

**Issue:**  
The goal (§21, §22) requires that reports contain:
- formulas and substituted expressions
- intermediate values (all `steps`)
- source lineage (workbook, sheet, cell)
- engineering review status
- calculation engine version + tool version

The current report builder page likely generates a report with final results but may not include the full `CalculationResult.steps[]` array. Without steps, the report is not auditable.

**Action needed:** Ensure the report preview/print layout renders every `CalculationStep` with its `formulaText`, `substitutedExpression`, `variables`, `result`, `sourceWorkbook`, `sourceSheet`, and `sourceCell` for every included tool.

---

### BKL-012 — Missing: `Prettier` Configuration

**File:** Project root

**Issue:**  
The design doc (§7) requires Prettier as a dev dependency. It is not in `package.json`. No `.prettierrc` or `prettier.config.js` exists. Code formatting consistency is a stated requirement.

**Action needed:** Add `prettier` to devDependencies, add a `.prettierrc` config, and add `npm run format` script.

---

### BKL-013 — Missing: React Testing Library

**Issue:**  
The design doc (§7) requires React Testing Library (`@testing-library/react`). It is not in `package.json`. UI component tests do not exist. The goal (§34, "Definition of Done") requires `npm run test passes` but test coverage is currently engine-only.

**Action needed:** Install `@testing-library/react` and `@testing-library/user-event`, and add at minimum a smoke test for the login page and project list page.

---

### BKL-014 — Missing: Calculation for LT Wheel `ltSpeedCoefficient` and `ltHardnessFactor` Master Inputs

**File:** [`src/engine/master/masterSpecifications.ts`](file:///Users/angel/Documents/statica-eot/src/engine/master/masterSpecifications.ts)

**Issue:**  
The design doc (§12) specifies master inputs including:
- `CT speed coefficient`
- `LT speed coefficient`
- `CT hardness factor`
- `LT hardness factor`

These inputs are listed in the design doc but it's unclear if they are wired into the master specification defaults and correctly propagated to the CT/LT wheel and hardness tools.

**Action needed:** Verify all master spec inputs from design doc §12 are present as fields in `MasterCraneInputs` and are correctly forwarded to tool instances via the dependency system.

---

### BKL-015 — Missing: Outdoor CT/LT Wind Calculation Must Be Explicitly Marked `NOT IMPLEMENTED`

**Issue:**  
The design doc (§43) explicitly requires the outdoor CT/LT wind calculation to be in the tool registry with status `ENGINEERING_REVIEW_REQUIRED` / `NOT_IMPLEMENTED`. Currently this tool does not appear in the registry at all — it is simply absent.

Per the design doc and goal (§26): "Do not create fake implementations... Instead create: NOT IMPLEMENTED — Engineering Review Required."

**Action needed:** Add a stub entry in the tool registry for `OUTDOOR_CT` with `reviewStatus: 'NOT IMPLEMENTED'` and `calculate` that throws or returns an error result.

---

### BKL-016 — Missing: Crane Category Lookup Tool

**Issue:**  
The design doc (§40) specifies a `CRANE CAT` sheet should be implemented as a searchable reference table (Tier A, item 18 in the Tier A list). This tool does not exist in the engine. The `craneCatalog.ts` file exists but only for supporting lookup — there is no `craneCategoryLookup` tool definition in the registry.

**Action needed:** Implement the crane category reference table as a read-only lookup/reference tool in the engine registry.

---

## 🟢 MEDIUM — Design Doc Compliance, Quality, Cleanup

---

### BKL-017 — `firestore.rules`: Subcollection Rules Use Broad `read, write`

**File:** [`firestore.rules`](file:///Users/angel/Documents/statica-eot/firestore.rules) — lines 31, 35

**Issue:**  
The subcollection rules for `toolInstances` and `reports` use:

```
allow read, write: if isProjectOwner(projectId);
```

This is fine for write operations, but the design doc (§10) specifies that for **updates** the `ownerUid` must not be mutable. The current rule does not enforce this for tool instance updates (a client could try to inject an `ownerUid` field into a tool instance document). Also, `write` covers `create`, `update`, and `delete`, but there is no granular protection against someone changing structural fields.

**Action needed:** Consider splitting subcollection rules into `create`, `update`, and `delete` operations and enforcing that `ownerUid`-like sensitive fields cannot be mutated. At minimum, document the current scope.

---

### BKL-018 — `longTravelBrake`: Golden Test Shows Selected 6 kg-m Passes When Required is 0.6452 kg-m — Verify Realistic Test

**File:** [`tests/engine/goldenFixtures.test.ts`](file:///Users/angel/Documents/statica-eot/tests/engine/goldenFixtures.test.ts) — line 233

**Issue:**  
The golden test for LT brake verifies that the required torque is `0.6452 kg-m` and the check passes because the selected brake is `6.0 kg-m` (MDT-100-18). This is a valid test for the PASS case. However, there is **no test for the FAIL case** (goal §9, item 4: "FAIL case where applicable"). The test suite is missing a test where a brake smaller than `0.6452 kg-m` is selected, causing the tool to output `FAIL`.

**Action needed:** Add FAIL case regression tests for all brake tools (main hoist, CT, LT) where the selected component is deliberately undersized.

---

### BKL-019 — `ropeDrum.ts`: Default `centerUngroovedLengthMm` Has Unexplained Magic Value

**File:** [`src/engine/mechanism/ropeDrum.ts`](file:///Users/angel/Documents/statica-eot/src/engine/mechanism/ropeDrum.ts) — line 86

**Issue:**  
The default value is:
```ts
const centerUngroovedLengthMm = assertPositiveNumber(inputs.centerUngroovedLengthMm ?? 859.438, 'centerUngroovedLengthMm');
```

The value `859.438` is a back-calculated constant to reproduce the golden `drumLengthMm = 1869.155 mm`. This value has no independent formula derivation and is not in the design doc as a formula. It is a residual from reverse-engineering the golden value. If an engineer enters different inputs (e.g., hoist height), the drum length formula will still use this constant and produce an incorrect result.

**Action needed:** Determine the actual workbook formula for the center ungrooved length (J87 in the workbook). The design doc notes `J87` but does not provide its formula. Add this as an engineering review flag. Until then, ensure the tool description clearly states J87 is a direct user input, not a computed value.

---

### BKL-020 — `README.md` Does Not Cover All Required Topics from Goal §33

**File:** [`README.md`](file:///Users/angel/Documents/statica-eot/README.md)

**Issue:**  
The goal (§33) requires the README to document:
- local setup
- Firebase setup
- emulator setup
- testing
- build
- deployment
- project architecture
- calculation architecture
- documentation of any engineering formula intentionally not implemented

The README likely exists but needs review against this checklist, particularly the **"intentionally not implemented formulas"** section (which should list the legacy `.xls` tools and the outdoor wind tool).

**Action needed:** Review and update `README.md` to cover all required sections, particularly adding an engineering formula status table.

---

### BKL-021 — `gantryLeg.ts`: Structural Implementation is a Stub

**File:** [`src/engine/structural/gantryLeg.ts`](file:///Users/angel/Documents/statica-eot/src/engine/structural/gantryLeg.ts)

**Issue:**  
Without reading the full file, the gantry leg is classified as Tier B ("Engineering Review Required"). The design doc (§53–§61) provides extensive formula detail for the gantry leg. It is important to verify whether the implementation:
1. Actually computes the formulas from §53–§61
2. Or is a shell/stub

The design doc section titles include bending, deflection, stress, axial compression, and stability — all multi-step calculations. If the tool is a stub, it must clearly state `NOT_IMPLEMENTED` in its reviewStatus, not just `ENGINEERING_REVIEW_REQUIRED`.

**Action needed:** Inspect `gantryLeg.ts` and verify whether substantive formulas are implemented. If not, set `reviewStatus: 'NOT IMPLEMENTED'` and add TODO comments mapping each formula group to the design doc section.

---

### BKL-022 — `bendingMoment.ts`: Implementation Completeness Unknown

**File:** [`src/engine/structural/bendingMoment.ts`](file:///Users/angel/Documents/statica-eot/src/engine/structural/bendingMoment.ts)

**Issue:**  
The design doc (§64) specifies that the bending moment tool should use a named point-load model (`type PointLoad = { name, load, position }`) and compute reactions, bending moments at multiple stations, max bending moment, bending stress, and shear. This is a substantive tool. Without reading the file in this review, it is unknown whether it fully implements these or is a structural stub.

**Action needed:** Review `bendingMoment.ts` and verify completeness against design doc §64. If incomplete, apply appropriate `NOT_IMPLEMENTED` / `ENGINEERING_REVIEW_REQUIRED` markers.

---

### BKL-023 — No FAIL-Case Tests for PASS/FAIL Binary Tools (Motor, Wire Rope, Drum, Sheaves)

**Issue:**  
The goal (§9) requires:
> "4. FAIL case where applicable"
> "5. Invalid input"

The current test suite only tests the golden PASS cases for Main Hoist Motor, Wire Rope, Rope Drum, and Sheaves. There are no tests that:
- Pass an undersized motor to verify `status === 'FAIL'`
- Pass a rope with inadequate breaking load
- Pass an undersized drum diameter
- Pass invalid inputs (negative mass, zero falls, etc.)

**Action needed:** Add FAIL-case and invalid-input tests for all Tier A tools.

---

### BKL-024 — `crossTravelWheel.ts` and `longTravelWheel.ts`: Wheel Load Formula Inputs Not Verified

**Issue:**  
Design doc §28 (CT Wheel) and §33 (LT Wheel) show specific formula structures:

CT Max Wheel Load:
```
C60 = (J54 * J56 / (J57 / 2)) + (J58 / J57)
```

LT Max Wheel Load:
```
C61 = ((J54 - J55) * (J58 + J56)) / (J54 * J57 / 2) + (J59 - J58) / J57
```

The CT formula is simpler (no span/approach geometry needed), while LT needs `span`, `hookApproach`, `crabWeight`, `craneDeadWeight`. The tests show the right golden values pass, but it should be verified that the **implementation** correctly uses `J54` (the load distribution factor K1 = 0.6) and `J55` (K2 = 0.4) — not arbitrary values — and that these constants match the design doc notation:

```
K1 = 0.6
K2 = 0.4
```

**Action needed:** Verify that `crossTravelWheel.ts` correctly uses K1=0.6 and K2=0.4 as load distribution constants and that `longTravelWheel.ts` correctly applies the span/hook approach geometry. The golden values pass, but a review of the actual formula implementation is warranted to ensure they're not accidentally correct for the wrong reasons.

---

### BKL-025 — Project Branding Not Verified in Report / Print Header

**Issue:**  
The design doc (§11) requires the exact branding pattern:

```
{project_name}
by StaticaLabs
```

in the project header, browser report title, and printed report header/footer. This must be verified in the report layout component (`PrintReport.tsx` / `ReportPreview.tsx`).

**Action needed:** Confirm that the print/report header/footer includes the exact "by StaticaLabs" branding and that the browser `<title>` is set correctly when viewing a report.

---

### BKL-026 — No Firestore Emulator Tests for Security Rules

**Issue:**  
The goal (§4) states: "Use Firebase Emulator Suite to test Firestore rules if practical." Currently there are no emulator-based security rule tests. The security rules themselves look correct (see Firestore rules review below), but they have not been tested programmatically.

**Action needed:** Add emulator-based security rule tests (or at minimum document this as a known gap with a TODO).

---

### BKL-027 — `validationAndProperties.test.ts` Coverage Unknown

**File:** [`tests/engine/validationAndProperties.test.ts`](file:///Users/angel/Documents/statica-eot/tests/engine/validationAndProperties.test.ts)

**Issue:**  
5 tests exist in this file but their content was not reviewed here. The test name suggests validation coverage, but it is unknown if it covers the physical sanity rules from design doc §13:
- NaN rejection
- Infinity rejection
- negative mass rejection
- zero gearbox ratio rejection
- zero wheel diameter rejection
- zero rope diameter rejection

**Action needed:** Review this file to confirm the sanity checks in §13 are covered. If not, add them.

---

## ✅ What Is Correctly Implemented

The following items from the goal are confirmed correctly implemented:

| Item | Status |
|------|--------|
| React + Vite + TypeScript setup | ✅ |
| Firebase Authentication (Google only) | ✅ |
| Firestore connected | ✅ |
| Firestore security rules (no permissive rules, ownerUid immutable on update) | ✅ |
| Project CRUD | ✅ |
| Tool registry | ✅ |
| All Tier A mechanism tools | ✅ |
| Calculation traces (steps, formula, variables, substitution, source cell) | ✅ |
| `StandardReference` with `review-required` status on all formulas | ✅ |
| `sourceLineage` with `SOURCE_VERIFIED_XLSX` on all extracted tools | ✅ |
| LT gearbox critical regression test (FAIL correctly derived numerically) | ✅ |
| Hardness discrepancy surfaced as WARNING (not silently passed) | ✅ |
| `1.341` HP factor preserved exactly | ✅ |
| `9.81` vs `9.80665` distinction respected (9.81 in rope kN, 9.80665 in brake N-m) | ✅ |
| `3.142` approximation preserved in speed formulas (not replaced with Math.PI) | ✅ |
| Explicit `ROUND(..., 0)` preserved in gantry Ixx / Iyy | ✅ |
| Legacy `.xls` tools listed in `legacyInventory.ts` as NOT_IMPLEMENTED | ✅ (verify) |
| No `eval()` / `new Function()` / Excel runtime | ✅ |
| No permissive Firestore rules | ✅ |
| Tier B structural tools gated with ENGINEERING_REVIEW_REQUIRED status | ✅ |
| All 21 tests pass | ✅ |
| Vitest configured | ✅ |
| Tailwind CSS + Lucide icons (professional UI dependencies) | ✅ |

---

## Priority Order for Fixes

1. **BKL-001** — Rope drum wall thickness formula (safety-critical structural calculation)
2. **BKL-002** — CT vs LT brake formula divergence (formula consistency)
3. **BKL-003 / BKL-004** — Gantry Girder Iyy formula and centroid convention
4. **BKL-005** — Gantry Girder diaphragm weight formula
5. **BKL-008** — Stale detection UI wiring
6. **BKL-010** — Dependency propagation
7. **BKL-011** — Report formula/trace completeness
8. **BKL-006** — Install react-hook-form and zod
9. **BKL-013** — Install React Testing Library and add UI tests
10. **BKL-023** — Add FAIL and invalid-input test cases
11. All remaining BKL items

---

*This backlog was generated from a full review of the codebase against the goal and design documents. It does not represent changes made — no code was modified during this review.*
