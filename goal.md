# StaticaLabs EOT Crane Engineering Platform

You are the primary implementation agent for this project.

The complete product and engineering specification is in:

`design-doc.md`

You MUST read and understand `design-doc.md` completely before making substantial implementation decisions.

Your job is to implement the application described in that document as a production-quality MVP.

---

# 1. Core Technology Requirements

Use exactly:

- React
- Vite
- TypeScript
- Firebase Authentication
- Firebase Cloud Firestore
- Firebase CLI
- Cloudflare Pages compatible build

Do NOT use:

- Next.js
- Create React App
- a custom backend
- a Node/Express calculation API
- server-side calculation logic
- Excel files at runtime
- an Excel formula interpreter
- `eval()`
- `new Function()`

The engineering calculation engine must be implemented as deterministic TypeScript code inside the React application.

---

# 2. Firebase Configuration

Firebase CLI is already installed.

Use the existing Firebase project:

```text
statica-eot
```

Firebase configuration:

```ts
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
	apiKey: 'AIzaSyDvHpz-cpeRbz9C0qq2YtafEs',
	authDomain: 'statica-eot.firebaseapp.com',
	projectId: 'statica-eot',
	storageBucket: 'statica-eot.firebasestorage.app',
	messagingSenderId: '378588634942',
	appId: '1:378588634942:web:c675bb9237ffb0241c166f',
};

const app = initializeApp(firebaseConfig);
```

Use Firebase CLI to configure everything required for the application, including where appropriate:

- Firestore
- Firestore indexes
- Firestore security rules
- Firebase configuration
- local emulator configuration if useful
- Authentication configuration

Do not create an unnecessary Firebase backend.

---

# 3. Authentication

Authentication must use:

**Google only**

Do not implement:

- email/password
- password reset
- phone authentication
- anonymous authentication
- magic links

The application must have:

```text
Signed out
    |
    v
Login
    |
    v
Continue with Google
    |
    v
Authenticated application
```

Users must only be able to access their own projects.

---

# 4. Database

Use Cloud Firestore.

Follow the data model and security model specified in `design-doc.md`.

Security is extremely important.

NEVER create permissive rules such as:

```text
allow read, write: if true;
```

Projects must be private to their owner.

A user must not be able to:

- read another user's project
- modify another user's project
- delete another user's project
- change the owner UID of a project
- access another user's calculation tools
- access another user's reports

Use Firebase Emulator Suite to test Firestore rules if practical.

---

# 5. IMPORTANT: Engineering Calculation Safety

This is an engineering calculation application.

Calculation correctness is more important than speed of implementation.

The source Excel files contain engineering calculations used by a mechanical engineer.

DO NOT invent engineering formulas.

DO NOT "fix" a formula because you believe another formula is mathematically better.

DO NOT silently replace constants.

DO NOT silently change units.

DO NOT silently migrate an old engineering standard to a newer standard.

DO NOT infer missing formulas from context.

If a formula is explicitly available in `design-doc.md`, implement it exactly as specified.

If `design-doc.md` explicitly says that a calculation requires engineering review or that the source formula could not be reliably extracted:

**DO NOT GUESS THE FORMULA.**

Instead:

1. Implement the tool shell/UI if useful.
2. Mark the tool as:
   `ENGINEERING REVIEW REQUIRED`
   or
   `NOT IMPLEMENTED`.
3. Add the appropriate TODO/documentation.
4. Continue with other independently implementable features.

---

# 6. Calculation Engine Architecture

Calculation logic must be completely separate from React UI code.

Use a structure similar to:

```text
src/
  engine/
    types.ts
    registry.ts
    units.ts
    validation.ts

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
      gearboxCatalog.ts
      wheelCatalog.ts
```

The exact structure can be improved if you have a better architecture, but preserve the separation:

```text
UI
  |
  v
Tool configuration
  |
  v
Calculation engine
  |
  v
Calculation result
  |
  v
UI / Report
```

Calculation functions must not depend on React state.

Calculation functions must not directly access Firestore.

Calculation functions must not make network requests.

---

# 7. Every Calculation Must Be Traceable

This is a mandatory requirement.

A calculation must not simply return:

```ts
{
	result: 10.48;
}
```

It must return enough information to explain how the result was obtained.

For example:

```text
Required Motor Power
10.488 kW

Formula:
P = (...)

Substitution:
P = (10.30 × 5.00 × ...) / (...)

Intermediate values:
...

Source:
Workbook: ...
Sheet: ...
Cell: ...

Status:
PASS
```

The calculation engine must produce structured calculation steps.

Each important calculation should have:

- formula
- formula ID
- variables
- units
- substituted expression
- result
- source workbook
- source sheet
- source cell where known
- dependencies
- engineering review status

This information will later be consumed by the report generator.

---

# 8. Do Not Use Excel at Runtime

The Excel files are source/reference material only.

Do not:

- upload Excel files to Firebase
- require Excel files to calculate
- parse Excel formulas in the browser
- call an external spreadsheet service
- depend on Excel being installed

All required calculation logic must be implemented directly in TypeScript.

---

# 9. Testing Is Mandatory

Do not consider a calculation implemented until it has automated tests.

Use:

```text
Vitest
```

For every implemented calculation, create tests for:

1. Normal/known input case
2. Expected output
3. PASS case
4. FAIL case where applicable
5. Invalid input
6. Boundary conditions where appropriate
7. Dependency behavior

Use the golden values in `design-doc.md`.

For example, the design document specifies:

```text
Main Hoist Motor
Required power ≈ 10.4879897176 kW
```

The test should verify this.

---

# 10. CRITICAL Regression Test

The design document identifies a specific issue with the Long Travel Gearbox.

The sample calculation produces approximately:

```text
Required speed = 20 m/min
Allowed range = 18 to 22 m/min
Actual calculated speed ≈ 25.136 m/min
```

Therefore:

```text
PASS = false
STATUS = FAIL
```

This MUST be implemented as an automated regression test.

Do not change the formula simply to make the test pass.

Do not copy a narrative "OK" value from the spreadsheet.

The software must derive the result from the numerical calculation.

---

# 11. Another Important Engineering Inconsistency

The design document identifies an apparent hardness calculation discrepancy.

The formula produces approximately:

```text
284.91 BHN
```

while the source workbook contains a minimum hardness indication around:

```text
300-350 BHN
```

Do not alter the calculation to make it pass.

Surface the discrepancy appropriately as:

```text
WARNING
Engineering Review Required
```

or whatever status is specified by the design document.

---

# 12. Formula Implementation Rules

When translating Excel formulas into TypeScript:

- Preserve constants.
- Preserve explicit rounding.
- Preserve unit conversions.
- Preserve intermediate calculations.
- Do not round intermediate values unless the source formula explicitly rounds them.
- Do not replace `9.81` with `9.80665` unless the source formula explicitly uses it.
- Do not replace `1.341` with another horsepower conversion factor.
- Do not introduce arbitrary numerical tolerances into engineering checks.
- Do not use floating-point hacks to force a PASS.

If the source explicitly contains:

```text
ROUND(value, 0)
```

implement that explicit rounding point.

Do not globally round the calculation.

---

# 13. PASS / FAIL Logic

PASS/FAIL must always be derived numerically.

For example:

```ts
selectedMotorKW >= requiredMotorKW;
```

or:

```ts
actualSpeed >= minimumSpeed && actualSpeed <= maximumSpeed;
```

Never do:

```ts
status = spreadsheetNarrativeValue;
```

Never trust a cell containing:

```text
OK
PASS
SAFE
YES
```

as the calculation result.

---

# 14. Project Model

Implement the project workflow exactly as described in `design-doc.md`.

A project can contain multiple calculation tools.

Example:

```text
10T EOT Crane - Plant A

Specifications

Calculations
  Main Hoist Motor
  Main Hoist Brake
  Wire Rope
  Rope Drum
  Hoist Gearbox
  CT Motor
  CT Brake
  CT Wheels
  CT Gearbox
  LT Motor
  LT Brake
  LT Wheels
  LT Gearbox
  Crab Weight

Reports
```

Users must be able to:

- create projects
- rename projects
- delete projects
- open projects
- add tools
- remove tools
- reorder tools
- edit tool inputs
- recalculate
- view calculation details
- generate reports

---

# 15. Inputs Must Remain Editable

A user can change any input at any time.

When an upstream input changes:

```text
input changed
    |
    v
calculation becomes stale
    |
    v
dependent calculations become stale
    |
    v
recalculate
    |
    v
new results
```

Never combine new inputs with old dependent outputs without clearly showing that the calculation is stale.

Use:

```text
inputRevision
calculatedRevision
```

or an equivalent robust mechanism.

---

# 16. Calculation Dependencies

Implement explicit dependency metadata.

For example:

```text
Master Specifications
        |
        +--> Main Hoist Motor
        |
        +--> Main Hoist Brake
        |
        +--> Wire Rope
        |
        +--> Rope Drum
        |
        +--> Gearbox
```

If a dependency changes, dependent calculations must become stale.

Do not hardcode dependency behavior inside random UI components.

Dependencies belong in the calculation/tool model.

---

# 17. Catalogs

Keep catalog/reference data separate from formulas.

Examples:

- motors
- brakes
- gearboxes
- wheels
- wire ropes
- rails
- crane categories

Catalog data must be versioned.

Do not scatter catalog values throughout calculation functions.

---

# 18. Component Selection

For MVP:

```text
Engineer selects component
        |
        v
Application calculates requirements
        |
        v
Application checks selected component
```

Do not automatically choose:

```text
cheapest component
smallest component
lightest component
```

unless the design document explicitly defines the selection algorithm.

---

# 19. UI / UX

The UI must feel like professional engineering software.

Do not make it look like a generic CRUD dashboard.

Priorities:

1. clarity
2. readability
3. engineering workflow
4. traceability
5. fast data entry
6. clear validation
7. professional visual design

Avoid:

- excessive gradients
- unnecessary animations
- oversized cards
- confusing dashboards
- tiny text
- spreadsheet-like cell references
- status conveyed only by color

Use meaningful engineering labels.

For example:

```text
Hoisting Speed
[ 5.00 ] m/min
```

not:

```text
C17
```

---

# 20. Calculation Trace UI

Users should be able to expand a calculation and see:

```text
Calculation Method

1. Effective lifted mass
   10.00 + 0.30 = 10.30 t

2. Apply factors
   ...

3. Motor power
   Formula: ...

4. Final result
   10.488 kW
```

This is one of the most important UX features.

---

# 21. Report Builder

Implement the report system described in the design document.

User selects which tool outputs to include.

Example:

```text
[x] Main Hoist Motor
[x] Main Hoist Brake
[x] Wire Rope
[x] Rope Drum
[x] Hoist Gearbox

[ ] Gantry Girder
```

The report must contain:

- project information
- master specifications
- selected calculations
- inputs
- assumptions
- formulas
- substitutions
- intermediate values
- outputs
- component selections
- checks
- PASS/WARNING/FAIL
- source lineage
- engineering review status
- calculation engine version
- tool versions

---

# 22. Report Must Be Auditable

A reader must be able to start from a final result and understand where it came from.

Example:

```text
Required Drum Diameter
288 mm

Formula:
...

Inputs:
Rope Diameter = 16 mm
Falls = 4
Factor = ...

Source:
Workbook: ...
Sheet: ...
Cell: ...
```

Do not generate reports that only show final numbers.

---

# 23. Report PDF

For MVP:

Use a print-friendly HTML report and:

```ts
window.print();
```

The browser's:

```text
Save as PDF
```

workflow is sufficient.

Do not build a server-side PDF infrastructure unless necessary.

---

# 24. Design Generation

This is a MAYBE / FUTURE feature.

Do not spend significant implementation time on CAD/design generation before the core calculation product is complete.

If a preliminary visualization is implemented, it must clearly say:

```text
PRELIMINARY DESIGN VISUALIZATION
NOT A FABRICATION DRAWING
```

Do not generate fabrication drawings from unvalidated calculations.

---

# 25. Engineering Review States

Support:

```text
SOURCE ONLY
TRANSCRIBED
TESTED
ENGINEERING REVIEW REQUIRED
ENGINEERING REVIEWED
PRODUCTION
```

A calculation that has not been independently reviewed must not be represented as certified engineering design.

---

# 26. Important Legacy XLS Rule

The design document identifies many `.xls` workbooks where formulas could not be reliably extracted.

For those calculations:

DO NOT GUESS.

Do not create fake implementations based on:

- filenames
- sheet names
- vague labels
- assumptions
- internet formulas
- what "would normally" be used

Instead create:

```text
NOT IMPLEMENTED
Engineering Review Required
```

and leave a clear TODO describing what source material is missing.

---

# 27. Development Workflow

Work incrementally.

Do NOT attempt to implement the entire application in one giant change.

Use this sequence:

## Phase 1

Project foundation

- Vite
- React
- TypeScript
- Firebase
- Google auth
- Firestore
- security rules
- routing
- application shell

## Phase 2

Project management

- project CRUD
- project specifications
- persistence
- validation
- stale state

## Phase 3

Calculation engine foundation

- calculation types
- tool registry
- validation
- calculation trace
- units
- source lineage
- test framework

## Phase 4

Main Hoist

- motor
- brake
- rope
- drum
- gearbox
- sheaves

## Phase 5

Cross Travel

- motor
- brake
- wheels
- gearbox

## Phase 6

Long Travel

- motor
- brake
- wheels
- gearbox

## Phase 7

Other mechanism tools

- crab weight
- hardness
- catalogs
- crane category

## Phase 8

Reports

- report builder
- report preview
- print layout
- PDF workflow

## Phase 9

Structural tools

Only implement according to the engineering review status in `design-doc.md`.

---

# 28. Git Workflow

Git is part of the implementation workflow.

The repository already exists.

Work directly on:

```text
main
```

Do NOT create feature branches unless explicitly requested.

After every meaningful feature or code change:

```bash
git status
git add .
git commit -m "meaningful commit message"
git push origin main
```

Examples:

```text
feat: add Google authentication
feat: add project CRUD
feat: add master crane specifications
feat: implement main hoist motor calculation
test: add main hoist regression fixtures
feat: implement report builder
fix: correct LT gearbox speed validation
```

Do not create meaningless commits such as:

```text
update
changes
stuff
fix
```

Commit logical units of work.

Before committing:

```bash
npm run lint
npm run test
npm run build
```

If a test or build fails, fix it before committing unless the failure is explicitly documented and unrelated.

Always push successful meaningful commits to:

```text
origin/main
```

---

# 29. Git Safety

Before modifying the repository:

```bash
git status
```

Do not destroy unrelated existing work.

Do not:

```bash
git reset --hard
git clean -fd
```

unless explicitly instructed.

If the repository contains existing modifications:

1. inspect them,
2. understand whether they belong to the current task,
3. preserve them,
4. do not overwrite them blindly.

---

# 30. Firebase CLI Workflow

Inspect the existing project first.

Useful commands may include:

```bash
firebase projects:list
firebase use
firebase firestore:indexes
firebase firestore:rules
```

Inspect the repository before changing Firebase configuration.

Do not create a second Firebase project.

Use:

```text
statica-eot
```

unless the existing repository configuration clearly indicates otherwise.

---

# 31. Cloudflare Deployment Compatibility

The application must build successfully as a static Vite application.

Expected:

```bash
npm run build
```

Output:

```text
dist/
```

The final deployment target is:

```text
https://eot.staticalabs.com
```

Ensure client-side routes work on direct navigation/refresh.

---

# 32. Environment and Secrets

Do not hardcode server-side secrets.

Firebase web configuration is client-side configuration.

If environment variables are used, use Vite naming:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Do not commit private service-account credentials.

Never create:

```text
serviceAccount.json
```

in the repository.

---

# 33. Documentation

As you implement the application, maintain:

```text
README.md
```

with:

- local setup
- Firebase setup
- emulator setup
- testing
- build
- deployment
- project architecture
- calculation architecture

Also document any engineering formula that was intentionally not implemented.

---

# 34. Work Autonomously

You should work through the implementation rather than stopping after creating a scaffold.

If something can be determined from:

- `design-doc.md`
- the existing repository
- Firebase CLI
- existing source files
- tests

do not ask me unnecessary questions.

However, if you encounter a genuine engineering ambiguity where implementing either option could change a safety-critical calculation, STOP that specific calculation and mark it for engineering review rather than guessing.

---

# 35. Definition of Done

Do not claim the application is complete until:

```text
[ ] React + Vite application works
[ ] Firebase initialized
[ ] Google authentication works
[ ] Firestore connected
[ ] Firestore security rules implemented
[ ] Firestore indexes configured where required
[ ] Project CRUD works
[ ] Master specifications work
[ ] Tool registry works
[ ] Tool instances work
[ ] Inputs are editable
[ ] Calculations are deterministic
[ ] Calculation dependencies work
[ ] Stale calculations are detected
[ ] Calculation traces work
[ ] Core mechanism calculations work
[ ] Golden regression tests exist
[ ] LT gearbox regression test catches FAIL
[ ] Catalogs work
[ ] Report builder works
[ ] Reports contain formulas and calculation traces
[ ] Reports contain source lineage
[ ] Browser print/PDF works
[ ] Engineering review status is visible
[ ] Unsupported legacy XLS calculations are not fabricated
[ ] npm run lint passes
[ ] npm run test passes
[ ] npm run build passes
[ ] Git commits are clean
[ ] Changes are pushed to origin/main
```

---

# 36. Final Priority Order

When there is a conflict between priorities, use this order:

```text
1. Engineering calculation correctness
2. Data integrity
3. Security
4. Test coverage
5. Calculation traceability
6. Usability
7. Visual polish
8. Development speed
```

Never sacrifice calculation correctness or security for development speed.

Start by inspecting the repository and `design-doc.md`.

Then establish the application foundation.

Proceed incrementally.

After each meaningful completed feature:

```text
test
lint
build
commit
push
```

Continue until the MVP described in `design-doc.md` is implemented.
