# StaticaLabs EOT Crane Engineering Platform

> Calculation platform for EOT and Gantry crane mechanism and structural engineering, built on React + Vite + TypeScript + Firebase.

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Firebase CLI (`npm install -g firebase-tools`)

### Local Development Setup
```bash
git clone <repo-url>
cd statica-eot
npm install
```

Copy `.env.example` to `.env.local` and add your Firebase project configuration:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Firebase Setup
1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** → Google Sign-In
3. Create a **Firestore** database (production mode)
4. Copy Web App config to `.env.local`
5. Deploy security rules: `firebase deploy --only firestore:rules`

### Running Locally
```bash
npm run dev
```

### Firebase Emulator Setup
```bash
npm install -g firebase-tools
firebase login
firebase emulators:start
```

## Testing

```bash
npm run test           # Run all tests (Vitest)
npm run test:watch     # Watch mode
```

All 21+ golden regression tests must pass before committing. Critical tests:
- **LT Gearbox Critical Regression**: MUST produce `status: 'FAIL'` with actual speed 25.136 m/min outside [18–22] m/min
- **Hardness WARNING**: MUST produce `status: 'WARNING'` for 284.913 BHN vs 300 BHN threshold

## Build & Deploy

```bash
npm run build          # TypeScript check + Vite build
npm run preview        # Preview production build locally
```

Deploy to Cloudflare Pages by pushing to `main` branch (CI/CD configured).

Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Project Architecture

```
src/
  engine/          # Pure calculation engine (no React dependencies)
    types.ts       # Core types: CalculationToolDefinition, CalculationResult
    registry.ts    # Tool registry — all tools registered here
    safeMath.ts    # Validated arithmetic helpers
    comparisons.ts # checkCapacityAdequacy, checkSpeedTolerance
    master/        # Master crane specifications
    mechanism/     # All mechanism tools (Tier A)
    structural/    # Structural tools (Tier B — engineering review gated)
    catalogs/      # Motor, gearbox, brake, rope, wheel catalogs
    legacy/        # Legacy .xls inventory (NOT IMPLEMENTED)
  firebase/        # Firestore service layer
  auth/            # Firebase Auth context
  pages/           # React page components
  components/      # Reusable UI components
  types/           # Project and report TypeScript types
```

## Calculation Architecture

Every tool implements `CalculationToolDefinition` with:
- **`calculate(inputs) → CalculationResult`** — pure function, no side effects
- **`steps[]`** — full calculation trace with formulas, variables, source cell references
- **`checks[]`** — pass/fail/warning criteria
- **`sourceLineage`** — workbook, sheet, cell traceability
- **`reviewStatus`** — `TESTED | ENGINEERING REVIEW REQUIRED | NOT IMPLEMENTED`

### Review Tiers
| Tier | Description | Examples |
|------|-------------|---------|
| **A** | Source-verified .xlsx, regression tested | All mechanism tools |
| **B** | Engineering review gated | Box Beam, Gantry Girder, Gantry Leg |
| **C** | Not implemented — legacy .xls source only | All CAL_*.xls tools |

## Engineering Formula Status

### Tier A — Implemented & Tested
All 17 mechanism tools are source-verified against `01-MAC-CRANE MECHANISM CALCULATION-IS3177-INDOOR.xlsx`.

### Tier B — Implemented, Engineering Review Required
| Tool | Notes |
|------|-------|
| Box Beam Properties | Ixx, Iyy, Zxx formulas transcribed. Engineering PE sign-off required. |
| Bending Moment | Twin wheel load model, M_max, bending stress. PE review required. |
| Gantry Girder | Section properties with ROUND(...,0). Missing B291 web offset (BKL-003). |
| Gantry Leg | Simplified stability calculation. Full formula chain pending. |

### Tier C — NOT IMPLEMENTED (Legacy .xls sources)
The following tools appear in the legacy inventory but are NOT implemented:
- `CAL_AXLE.xls`, `CAL_BOLT.xls`, `CAL_BUFFER.xls`, `CAL_PLATE.xls`, `CAL_PIN.xls`
- `CAL_PULLEY BEARING.xls`, `CAL_WHEEL BEARING LIFE.xls`
- `CAL_ROPE DRUM THK.xls`, `CAL_SHACKLE PLATE.xls`, `CAL_Trolley Structure.xls`
- `Mechanism Calculation-OUTDOOR CRANE-IS3177.xls` (BKL-015)
- `Gear PCD & OD.xls`, `NUTRAL AXIS_CAL.xls`, `ROPE-RATIO.xls`, `WEIGHT.xls`

**No formula from these files has been transcribed.** Do not use until manual engineering review.

### Known Formula Gaps (Backlog)
| BKL ID | Issue |
|--------|-------|
| BKL-001 | Rope drum wall thickness (I100) formula not transcribed |
| BKL-002 | CT vs LT brake formula structure divergence |
| BKL-003 | Gantry Girder Iyy missing B291/10 web offset |
| BKL-024 | CT Wheel required diameter formula (H77) not fully transcribed |

## Code Quality

```bash
npm run lint           # ESLint
npm run format         # Prettier (src/**/*.{ts,tsx})
```

## License
Proprietary — StaticaLabs Engineering Pvt. Ltd.
