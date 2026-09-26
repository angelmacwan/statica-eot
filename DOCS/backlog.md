# Implementation Plan: Drawing Generation Feature

This plan turns calculated outputs into browser-native SVG previews and
downloadable DXF files. It is scoped into phases so agents can execute,
test, and PR each phase independently. No new npm dependencies are
required anywhere in this plan (pure TS/JS SVG string building and a
minimal hand-rolled DXF writer).

Reference prototype (not production code, adapt to repo conventions):
`dxfBuilder.ts`, `svgBuilder.ts`, `boxGirderDrawing.ts`, `ropeDrumDrawing.ts`,
`circularComponentDrawing.ts` — shared separately. Treat these as a proof
that the geometry math and DXF output are correct, not as final code.
Rewrite to match this repo's file headers, naming and test conventions.

---

## 0. Ground rules for every phase

- No external CAD/SVG libraries. Everything is hand-generated strings.
- Every drawing function is a **pure function**: `(inputs) => string`. No
  DOM access, no React, no side effects. This makes them trivially unit
  testable with vitest, same pattern as `tests/engine`.
- Drawing modules read the **same input/output keys** the calc engine
  already produces. Never introduce a parallel/duplicate key name for a
  dimension that already exists in a `CalculationToolDefinition`.
- If a drawing needs a dimension that does not exist yet in any calc
  module's `inputs`/`outputs` (see Phase 2), add it to the calc module
  first, in the same style as existing `InputDefinition` entries, before
  writing drawing code that depends on it. Never invent a number.
- Every new file gets a matching test file under `tests/engine/drawing/`.

---

## Phase 1 — Core drawing engine + 2 fully-accurate components

**Goal:** box girder cross-section and rope drum, both fully determined
by existing calc data, no new inputs needed anywhere.

### 1.1 New folder: `src/engine/drawing/`

| File            | Responsibility                                                                                                                                                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `svgBuilder.ts` | Primitive SVG string helpers: rect, circle, line, text, horizontal/vertical dimension lines with extension lines, `svgDocument()` wrapper.                                                                                                                            |
| `dxfBuilder.ts` | `DxfDocument` class: `addLine`, `addRectOutline`, `addCircle`, `addText`, `toString()` (R12 ASCII, `$INSUNITS` = 4 for mm). Also `downloadDxf(text, filename)` using `Blob` + `URL.createObjectURL` (browser-only, guard with a check so it doesn't break SSR/tests). |
| `types.ts`      | `DrawingResult { svg: string; dxf: string; title: string; }` — the shape every drawing generator returns, so the UI layer (Phase 3) can treat all components uniformly.                                                                                               |

### 1.2 `src/engine/drawing/boxGirderDrawing.ts`

Consumes the exact input keys from `src/engine/structural/boxBeamProperties.ts`:
`topFlangeWidthMm`, `topFlangeThicknessMm`, `webDepthMm`, `webThicknessMm`,
`webSpacingMm`, `bottomFlangeWidthMm`, `bottomFlangeThicknessMm`.

Geometry (must match the calc engine's own assumption comment
`"Symmetric rectangular box section with two continuous webs"`):

- `totalHeightMm = t_bf + h_w + t_tf`
- `totalWidthMm = max(b_tf, b_bf)`
- top flange, bottom flange: rectangles centered on the section centerline
- two webs: thickness `t_w`, positioned so the **clear** gap between their
  inner faces equals `webSpacingMm` (this must match how
  `boxBeamProperties.ts` computes `webCenterDist` internally, so cross-check
  against that file, not against this plan, if the calc engine changes)

Exports: `computeBoxGirderGeometry(inputs)`, `boxGirderToSVG(inputs)`,
`boxGirderToDXF(inputs)`.

**Acceptance test:** feed it the box-beam-properties defaults
(`b_tf=500, t_tf=12, h_w=1200, t_w=8, s=350, b_bf=500, t_bf=12`) and assert
`totalHeightMm === 1224` (this must equal `neutralAxisFromBottomMm * 2`
from the calc module's own test fixtures, since the section is symmetric —
cross-check against `boxBeamProperties.test.ts` if it exists).

### 1.3 `src/engine/drawing/ropeDrumDrawing.ts`

Consumes from `src/engine/mechanism/ropeDrum.ts` outputs/inputs:
`selectedDrumDiameterMm`, `drumLengthMm`, `selectedGroovePitchMm`,
`totalGroovesPerSide`.

Produces end view (circle) + side profile (rectangle with groove tick
marks at true pitch spacing, capped by `Math.floor(sideWidthPx / pitchPx)`
so rounding never draws more grooves than fit).

Exports: `ropeDrumToSVG(inputs)`, `ropeDrumToDXF(inputs)`.

### 1.4 Tests

`tests/engine/drawing/boxGirderDrawing.test.ts` and
`ropeDrumDrawing.test.ts`: assert geometry numbers (not string contents —
don't snapshot-test raw SVG/DXF strings, they're brittle; assert on the
`computeBoxGirderGeometry()` return object's numeric fields instead).

**Phase 1 is done when:** both modules have passing tests, and a
throwaway Storybook-style dev page or a temporary route can render both
SVGs on screen for visual sanity check.

---

## Phase 2 — Add missing dimensional inputs to wheel/sheave modules

**Problem:** `crossTravelWheel.ts`, `longTravelWheel.ts`, and `sheaves.ts`
only output/select a **diameter**. There is no tread width, flange width,
or hub bore anywhere in the engine, so no wheel/sheave drawing can be more
than a diameter-accurate circle today.

**Do not fake these numbers in drawing code.** Add them as real inputs to
the calc modules, following the exact `InputDefinition` pattern already
used in `boxBeamProperties.ts` (see `topFlangeWidthMm` etc. for the
shape: `key`, `label`, `unit`, `type`, `defaultValue`, `required`, `min`,
`description`).

| Module                                      | New inputs to add                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `crossTravelWheel.ts`, `longTravelWheel.ts` | `treadWidthMm`, `hubBoreMm` — check `wheelCatalog.ts` first, these may already exist as catalog fields per `selectedWheelId` and just need surfacing into the tool's `outputs`, in which case no new user input is needed, just wire the catalog lookup through to `outputs`. |
| `sheaves.ts`                                | `sheaveGrooveWidthMm`, `hubBoreMm` (same catalog-first check)                                                                                                                                                                                                                 |

**Agent action before writing any code here:** open `wheelCatalog.ts` and
confirm whether width/bore already exist per catalog entry. If yes, this
phase is just "surface existing catalog fields into `outputs`", which is
a smaller, safer change than adding new user-facing inputs. If no, add
the inputs with sensible defaults and update the corresponding tests in
`tests/engine`.

Only after this phase, extend `circularComponentDrawing.ts` (the
prototype's generic wheel/sheave schematic) to draw an actual side
profile (tread width) instead of the current honest placeholder circle.

---

## Phase 3 — UI integration

**Where:** `src/pages/ToolPage.tsx` (per-module view) and
`src/pages/ReportBuilderPage.tsx` (full report view) are the two places
results currently render.

1. Add a `src/components/engineering/DrawingPreview.tsx` component:
   props `{ svg: string; dxf: string; filename: string; title: string }`.
   Renders the SVG inline (dangerouslySetInnerHTML is fine here since the
   SVG is generated by our own trusted code, not user input) plus an
   "Export DXF" button calling `downloadDxf()`.
2. In `ToolPage.tsx`, for `toolId` values that have a matching drawing
   generator (`box-beam-properties`, `rope-drum`, `cross-travel-wheel`,
   `long-travel-wheel`, `sheaves`), render a `DrawingPreview` below the
   existing `CalculationTraceView`. Map `ToolInstance.inputs` /
   `.calculationResult.outputs` into the drawing function's expected
   shape — reuse the same key names, no remapping layer needed if Phase
   1/2 naming was kept consistent.
3. Add a small registry, `src/engine/drawing/registry.ts`, mapping
   `toolId -> (instance: ToolInstance) => DrawingResult | null`, so
   `ToolPage.tsx` doesn't need a growing if/else chain. This mirrors the
   existing `TOOL_REGISTRY` pattern in `src/engine/registry.ts`.
4. In `ReportBuilderPage.tsx`, add a "Drawings" section that iterates the
   same registry across all tool instances in the project and renders
   every available drawing together, in the same module order as the
   existing compliance matrix.

**Phase 3 is done when:** opening a project's report page shows box
girder + rope drum drawings pulled live from that project's actual saved
inputs, not hardcoded demo numbers, and DXF export works for both.

---

## Phase 4 — General arrangement (GA) view (do last, needs design input)

Full crane layout (span, wheelbase, gauge) needs data currently spread
across `gantryGirder.ts` (`spanM`, `flangeWidthCm`, `girderDepthCm`,
`topFlangeThkCm`, `bottomFlangeThkCm`, `webThkCm` — note this is a
**second**, gantry-specific box-section module, separate from
`boxBeamProperties.ts`, confirm with the user which one the GA view
should actually use before starting), plus wheel positions which are not
currently modeled anywhere as x/y coordinates, only diameters and loads.

**Do not start this phase without explicit input from the user on:**

- which box-girder calc module is authoritative for the visible crane
  (`boxBeamProperties.ts` vs `gantryGirder.ts`)
- where wheelbase/gauge numbers should come from (they don't exist as
  calc outputs today, `craneCategoryLookup.ts` and `craneCatalog.ts`
  should be checked first for whether they already exist under a
  different key name before assuming new inputs are needed)

This phase is deliberately left under-specified here because it depends
on structural decisions only the user can make, not something an agent
should infer.

---

## Suggested execution order for agents

1. Phase 1 (self-contained, zero risk, fully testable in isolation)
2. Phase 3, steps 1–2 only, wired to Phase 1's two modules (gets something
   real in front of the user fast)
3. Phase 2 (touches existing calc modules, needs a human check on catalog
   fields first, per the note above)
4. Phase 3, steps 3–4 (finish UI integration once wheel/sheave drawings
   are real)
5. Phase 4 (blocked on user decisions, do not auto-start)

Each phase should be its own PR with its own test run (`npm test`) green
before moving to the next.
