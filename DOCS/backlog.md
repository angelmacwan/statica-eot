# EOT Crane Engineering Platform MVP Backlog

This backlog contains issues found during the codebase audit against the `DOCS/design-doc.md` specifications.

## 1. Tool Definition Interface Mismatches
**Severity**: Medium  
**Location**: `src/engine/types.ts`  
**Status**: Resolved  
**Description**: 
- The design doc specifies the `status` property for `CalculationToolDefinition` with string literals: `'verified-source' | 'engineering-review-required' | 'not-implemented'`. However, `src/engine/types.ts` uses `reviewStatus` with completely different `EngineeringReviewStatus` literal types (`'SOURCE ONLY' | 'TRANSCRIBED'`, etc.).
- The design doc specifies `calculate(context: CalculationContext): CalculationResult;`, but the implementation uses `calculate: (inputs: Record<string, any>, context?: Record<string, any>) => CalculationResult;`. `CalculationContext` is neither defined nor used.
**Resolution**:
- Added `CalculationToolStatus` type with `'verified-source' | 'engineering-review-required' | 'not-implemented'` string literal union.
- Defined `CalculationContext` interface and updated `CalculationToolDefinition` to `calculate(context: CalculationContext): CalculationResult;`.
- Added `status: CalculationToolStatus` to `CalculationToolDefinition` and assigned proper statuses to all 23 tool definitions across mechanism, structural, and legacy inventory packages.
- Updated `StatusBadge` to support `CalculationToolStatus` variants.

## 2. Report Builder Branding Omission
**Severity**: Low  
**Location**: `src/pages/ReportBuilderPage.tsx`  
**Status**: Resolved  
**Description**: 
Section 11 of the design doc strictly requires the exact branding pattern `{project_name} by StaticaLabs` in the browser report title, project header, and printed report header/footer. 
The implementation in `ReportBuilderPage.tsx` renders `<h1 className="text-2xl font-bold tracking-tight text-white print:text-black">{project.projectName}</h1>` without the required `"by StaticaLabs"` suffix. Also, it fails to set `document.title` to the required branding.
**Resolution**:
- Added `useEffect` in `ReportBuilderPage.tsx` to set `document.title = `${project.projectName} by StaticaLabs``.
- Updated report project header to display `{project.projectName} by StaticaLabs`.
- Added printed report footer containing `{project.projectName} by StaticaLabs` and `eot.staticalabs.com`.

## 3. UserProfile Missing `updatedAt` field
**Severity**: Low  
**Location**: `src/types/project.ts`, `src/auth/AuthContext.tsx`  
**Status**: Resolved  
**Description**: 
Section 9 of the design doc specifies that the user document (`users/{uid}`) must contain an `updatedAt` timestamp. The current `UserProfile` interface and the initial profile creation logic in `AuthContext.tsx` only set `createdAt` and `lastLoginAt`, omitting the `updatedAt` field entirely.
**Resolution**:
- Added `updatedAt: number;` to the `UserProfile` interface in `src/types/project.ts`.
- Updated `src/auth/AuthContext.tsx` to populate and update `updatedAt` during initial profile creation, login session updates, and offline fallback scenarios.
