import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  Cog,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Layers,
  Cpu,
  Lock,
  Compass,
  Boxes,
  Activity,
  Zap,
  HardHat,
  RefreshCw,
  Sliders,
  Check,
  X,
  Scale,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeSuiteTab, setActiveSuiteTab] = useState<'mechanism' | 'structural' | 'trace'>('mechanism');

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col font-sans selection:bg-slate-200">
      {/* ========================================================================= */}
      {/* Navigation Bar                                                            */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center group-hover:bg-slate-800 transition shadow-xs">
              <Cog className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">Statica EOT</span>
              <span className="text-[11px] font-normal text-slate-400 font-sans">by StaticaLabs</span>
            </div>
          </Link>

          {/* Quick Anchor Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
            <a href="#why-must-have" className="hover:text-slate-950 transition-colors">
              Why Statica EOT
            </a>
            <a href="#calculation-suites" className="hover:text-slate-950 transition-colors">
              Calculation Suites
            </a>
            <a href="#connected-architecture" className="hover:text-slate-950 transition-colors">
              Connected Logic
            </a>
            <a href="#comparison" className="hover:text-slate-950 transition-colors">
              Comparison
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Alpha v0.1
            </span>

            {user ? (
              <Link
                to="/projects"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition shadow-xs"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition shadow-xs"
              >
                <span>Sign In / Launch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* Hero Section                                                              */}
      {/* ========================================================================= */}
      <section className="pt-14 pb-12 sm:pt-20 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        {/* Alpha Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium mb-6">
          <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200/80 text-[10px]">
            IS 3177 / IS 807
          </span>
          <span className="text-slate-600">The deterministic calculation system for overhead crane design</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 max-w-4xl mx-auto leading-[1.12]">
          The calculation system
          <br className="hidden sm:inline" /> every crane engineering team needs.
        </h1>

        {/* Subhead */}
        <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          <strong>Statica EOT by StaticaLabs</strong> replaces fragile, error-prone calculation spreadsheets with a single,
          traceable engineering platform for EOT and gantry cranes. Move seamlessly from duty class assumptions to motor
          sizing, brake ratings, rope geometry, and structural girder checks with zero formula mutation and instant reviewable dossiers.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={user ? '/projects' : '/login'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition shadow-sm hover:shadow-md"
          >
            <span>Start a Project</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#calculation-suites"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium transition shadow-2xs"
          >
            <span>Explore Calculation Suites</span>
          </a>
        </div>

        {/* Quick proof bar */}
        <div className="mt-12 pt-8 border-t border-slate-200/70 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">Governing Standards</span>
            <span className="text-xs font-bold text-slate-900 mt-1 block">IS 3177:1999 & IS 807:2006</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Mechanisms & structural rules</span>
          </div>

          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">Architecture</span>
            <span className="text-xs font-bold text-slate-900 mt-1 block">Connected Logic Graph</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Zero isolated copy-paste inputs</span>
          </div>

          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">Transparency</span>
            <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Full Formula Substitution
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Every variable and unit cited</span>
          </div>

          <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">Deliverables</span>
            <span className="text-xs font-bold text-slate-900 mt-1 block">PDF Dossier & Multi-Sheet Excel</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Instant consultant-ready exports</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: The Engineering Baseline / Problem Statement                     */}
      {/* ========================================================================= */}
      <section id="why-must-have" className="scroll-mt-20 py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              The Engineering Baseline
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Why spreadsheet calculation sheets fail crane teams
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Industrial crane design demands rigorous, connected assumptions across hoisting, travel, and structural
              mechanics. When calculations live in fragmented workbooks, small oversights become major liabilities during
              client audits, fabrication, or field commissioning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Way */}
            <div className="p-6 rounded-2xl border border-rose-200/80 bg-rose-50/20 space-y-4">
              <div className="flex items-center gap-2.5 text-rose-800 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>The Failure Modes of Spreadsheet Design</span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5 shrink-0">✕</span>
                  <span>
                    <strong>Silent Formula Corruption:</strong> One accidentally overwritten cell or circular reference
                    silently invalidates downstream motor kW, brake torque, and wheel contact calculations without any warning.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5 shrink-0">✕</span>
                  <span>
                    <strong>Disconnected Project Revisions:</strong> When a client changes span or duty class from M5 to
                    M6, engineers must manually hunt down and update dozens of independent tabs, risking missed updates.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5 shrink-0">✕</span>
                  <span>
                    <strong>Hardcoded "OK" Masks:</strong> Spreadsheets frequently conceal engineering risks by displaying
                    static narrative cells like "OK" instead of evaluating real codal margins against actual stress limits.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold mt-0.5 shrink-0">✕</span>
                  <span>
                    <strong>Painful Review & Audit Cycles:</strong> Chief engineers and third-party inspection agencies spend
                    hours verifying cell formulas, trying to trace where numbers originated before signing off.
                  </span>
                </li>
              </ul>
            </div>

            {/* The Statica EOT Way */}
            <div className="p-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-800 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>The Statica EOT Verified System</span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold mt-0.5 shrink-0">✓</span>
                  <span>
                    <strong>Deterministic Calculation Logic:</strong> Formally verified TypeScript calculation engines
                    replace fragile cells. All math is mathematically pure, deterministic, and unit-validated.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold mt-0.5 shrink-0">✓</span>
                  <span>
                    <strong>Single Source of Truth:</strong> Capacity, span, lift height, speeds, and duty class reside in
                    a project master. When an input changes, downstream tools highlight stale states and sync with one click.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold mt-0.5 shrink-0">✓</span>
                  <span>
                    <strong>Transparent Step-by-Step Math:</strong> Every calculation step renders the exact standard formula,
                    numeric substitution, units, and codal threshold with real numeric PASS/FAIL indicators.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold mt-0.5 shrink-0">✓</span>
                  <span>
                    <strong>Instant Engineering Dossiers:</strong> Generate comprehensive PDF calculation reports and
                    multi-sheet Excel packages ready for client review and statutory authority approval in seconds.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: Calculation Suites (Interactive Tabbed Showcase)                 */}
      {/* ========================================================================= */}
      <section id="calculation-suites" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            Comprehensive Verification
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            Engineered for every critical crane calculation
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            From motor horsepower and braking torque to rope fleet angles and girder deflection, Statica EOT covers the full
            breadth of industrial crane design under IS 3177 and IS 807.
          </p>
        </div>

        {/* Suite Tabs */}
        <div className="flex justify-center border-b border-slate-200">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveSuiteTab('mechanism')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeSuiteTab === 'mechanism'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mechanical Mechanisms (Tier A)
            </button>
            <button
              onClick={() => setActiveSuiteTab('structural')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeSuiteTab === 'structural'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Structural Suite (Tier B)
            </button>
            <button
              onClick={() => setActiveSuiteTab('trace')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeSuiteTab === 'trace'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Formula Traceability
            </button>
          </div>
        </div>

        {/* Tab 1: Mechanism Suite */}
        {activeSuiteTab === 'mechanism' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Main Hoist Motor</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">IS 3177 Cl. 6.2</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculates required hoisting power considering combined mechanical efficiency, duty cycle rating factor,
                starting torque margin, and acceleration time.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Main Hoist Brake</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">IS 3177 Cl. 6.4</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates static holding torque against mandatory safety factors (minimum 1.5x full-load torque for Class II,
                higher for Class IV) with thermal dissipation checks.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Wire Rope & Reeving</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">IS 3177 Cl. 5.1</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computes maximum rope tension, reeving fall efficiency, factor of safety per mechanism duty group, and
                validates 6x36 / 6x37 IWRC wire rope specifications.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Cpu className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Rope Drum & Grooving</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">IS 3177 Cl. 5.2</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Determines pitch circle diameter (PCD), minimum barrel wall thickness under combined crushing/bending, groove
                radius, pitch, and fleet angle limits (&le; 4&deg;).
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Zap className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Cross & Long Travel Drives</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">IS 3177 Cl. 6.3</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sizes travel drive motors based on rolling resistance, track friction, acceleration kW, motor pull-out
                torque margin, and outdoor wind resistance where applicable.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Compass className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Wheel & Rail Contact Stress</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">IS 3177 Annex B</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates maximum static and dynamic wheel loads, crab approach eccentricities, permissible line-load
                stress, and verifies matching wheel/rail surface hardness (BHN).
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Structural Suite */}
        {activeSuiteTab === 'structural' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Boxes className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Box Beam Properties</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">IS 807 Cl. 26</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Calculates girder section area, moment of inertia (Ix, Iy), section moduli (Zx, Zy), radius of gyration,
                compression flange buckling ratios, and web slenderness limits.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Scale className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Bending Moment & Shear</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">IS 807 Cl. 28</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computes maximum vertical bending moment from moving crab wheel loads with dynamic impact factors (typically 1.25x),
                dead-weight distributed loads, and horizontal lateral inertia moments.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Sliders className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Deflection Ratio Verification</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">IS 3177 Cl. 4.2</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verifies that vertical girder deflection under full safe working load (SWL) does not exceed L/750 for Class I &amp; II
                or L/1000 for Class III &amp; IV heavy industrial cranes.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Gantry Girder Runway</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">IS 807 Cl. 31</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Checks longitudinal runway girders subjected to moving crane wheel pairs, surge forces, braking forces, and
                combined biaxial bending and shear stresses.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <HardHat className="w-4 h-4 text-slate-700" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Gantry Legs & Portal Frames</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Gantry Suite</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sizes portal legs and bracing columns against combined vertical dead/live loads, horizontal crab braking sway,
                and outdoor wind gust pressures.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
                <Printer className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Structural Summary Dossier</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Audit Ready</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Compiles web plate thicknesses, flange sizes, diaphragm spacing, camber requirements, and stress unity checks
                into an exportable bill of checks.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Formula Trace Preview */}
        {activeSuiteTab === 'trace' && (
          <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                  LIVE TRACE EXAMPLE
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Main Hoisting Motor kW Calculation Trace</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">Governing Standard: IS 3177:1999 Cl. 6.2.1</span>
            </div>

            {/* Simulated Trace Steps */}
            <div className="space-y-4 font-mono text-xs">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>STEP 1: HOISTING WORK RATE &amp; EFFICIENCY</span>
                  <span className="text-emerald-700 font-bold">✓ PASS</span>
                </div>
                <div className="text-slate-900 font-semibold">
                  Required Power (kW) = (Load in Tonnes &times; Speed in m/min) / (6.12 &times; Overall Efficiency &times; Rating Factor)
                </div>
                <div className="text-slate-600 text-[11px]">
                  Substituted: P_req = (10.00 t &times; 5.00 m/min) / (6.12 &times; 0.85 &times; 0.80) = <strong className="text-slate-900">12.01 kW</strong>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>STEP 2: MOTOR CATALOG SELECTION &amp; SERVICE FACTOR</span>
                  <span className="text-emerald-700 font-bold">✓ PASS</span>
                </div>
                <div className="text-slate-900 font-semibold">
                  Selected Motor: 15.00 kW (Standard Crane Duty S4 - 40% CDF, 150 Starts/hr)
                </div>
                <div className="text-slate-600 text-[11px]">
                  Power Reserve Margin: ((15.00 - 12.01) / 12.01) &times; 100% = <strong className="text-emerald-700">+24.9% (Compliant)</strong>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>STEP 3: ACCELERATION TORQUE VERIFICATION</span>
                  <span className="text-emerald-700 font-bold">✓ PASS</span>
                </div>
                <div className="text-slate-900 font-semibold">
                  Pull-Out Torque Check: (T_max / T_rated) &ge; 2.25 per IS 3177 Cl. 6.2.3
                </div>
                <div className="text-slate-600 text-[11px]">
                  Calculated Ratio: 2.75 &ge; 2.25 threshold &rarr; <strong className="text-emerald-700">Satisfactory Under Peak Starting Conditions</strong>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed italic">
              Every calculation in Statica EOT renders complete variable lineage, substituted numbers, unit dimensions,
              and standard clauses. Reviewers never have to guess how a number was derived.
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION: Connected Architecture (Single Source of Truth)                  */}
      {/* ========================================================================= */}
      <section id="connected-architecture" className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Integrated Engineering Logic
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              One change updates the entire crane workflow
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              In traditional spreadsheets, changing a project parameter requires manually updating five different workbooks.
              In Statica EOT, core project parameters automatically cascade across mechanisms, electrical drives, and structural checks.
            </p>
          </div>

          {/* Workflow Sequence */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-[#fbfbfa] border border-slate-200/80 space-y-3 relative">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-900">Project Master</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Define primary parameters once: Safe Working Load (SWL), Span, Lift Height, Hoisting &amp; Travel Speeds, and IS Duty Class (M1–M8).
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#fbfbfa] border border-slate-200/80 space-y-3 relative">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                2
              </span>
              <h3 className="text-xs font-bold text-slate-900">Mechanism Sizing</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Hoisting kW, brake holding torque, wire rope falls, and travel wheel reactions calculate immediately from project master values.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#fbfbfa] border border-slate-200/80 space-y-3 relative">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                3
              </span>
              <h3 className="text-xs font-bold text-slate-900">Structural Verification</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Crab weight and dynamic wheel reactions feed directly into girder bending moments, vertical deflection checks, and gantry column checks.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#fbfbfa] border border-slate-200/80 space-y-3 relative">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                4
              </span>
              <h3 className="text-xs font-bold text-slate-900">Instant Deliverables</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Export an official design verification report (PDF) and a multi-sheet calculation workbook (Excel) with 100% data concordance.
              </p>
            </div>
          </div>

          {/* Staleness and Auto-propagation Callout */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-white">Staleness Detection &amp; One-Click Synchronization</h4>
                <p className="text-[11px] text-slate-300">
                  When upstream parameters change, downstream calculation tools automatically indicate stale status and offer an instant one-click sync.
                </p>
              </div>
            </div>
            <Link
              to={user ? '/projects' : '/login'}
              className="whitespace-nowrap px-4 py-2 rounded-lg bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition shadow-2xs"
            >
              Try In Workspace &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: Side-by-Side Comparison Matrix                                   */}
      {/* ========================================================================= */}
      <section id="comparison" className="py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            Objective Comparison
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            How Statica EOT compares to legacy alternatives
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            See how purpose-built deterministic engineering software stacks up against scattered Excel spreadsheets and generic FEA tools.
          </p>
        </div>

        <div className="overflow-x-auto bg-white border border-slate-200/90 rounded-2xl shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-mono text-[11px] text-slate-700">
                <th className="p-4 font-bold">Engineering Capability</th>
                <th className="p-4 text-slate-500 font-normal">Legacy Spreadsheets (.xls / .xlsx)</th>
                <th className="p-4 text-slate-500 font-normal">Generic CAD / FEA Software</th>
                <th className="p-4 font-bold text-slate-900 bg-slate-100/70">Statica EOT Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-4 font-semibold text-slate-900">IS 3177 / IS 807 Codal Rules Built-in</td>
                <td className="p-4 text-slate-500">Manual formula entry; prone to transcription typos</td>
                <td className="p-4 text-slate-500">None; requires manual post-processing of stresses</td>
                <td className="p-4 font-medium text-emerald-800 bg-slate-50/50">
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Native Built-in Rules
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">Multi-Tool Parameter Propagation</td>
                <td className="p-4 text-rose-600">
                  <span className="inline-flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Fragile cross-sheet links
                  </span>
                </td>
                <td className="p-4 text-slate-500">Isolated to 3D geometry only</td>
                <td className="p-4 font-medium text-emerald-800 bg-slate-50/50">
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Reactive Dependency Graph
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">Transparent Mathematical Trace</td>
                <td className="p-4 text-slate-500">Opaque formula bar (e.g. `=C12*D18/6.12`)</td>
                <td className="p-4 text-slate-500">Black-box solver matrices</td>
                <td className="p-4 font-medium text-emerald-800 bg-slate-50/50">
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Full Substitution &amp; Units
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">Numeric PASS / FAIL Margin Checks</td>
                <td className="p-4 text-rose-600">
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Often hardcoded "OK" cells
                  </span>
                </td>
                <td className="p-4 text-slate-500">Color contour plots without codal margins</td>
                <td className="p-4 font-medium text-emerald-800 bg-slate-50/50">
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Strict Numeric Validation
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">Export Dual Formats (PDF + Excel)</td>
                <td className="p-4 text-slate-500">Excel only; unstructured printing</td>
                <td className="p-4 text-slate-500">Bulky proprietary reports</td>
                <td className="p-4 font-medium text-emerald-800 bg-slate-50/50">
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> 1-Click Dossier &amp; Workbook
                  </span>
                </td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-slate-900">Deployment &amp; Maintenance</td>
                <td className="p-4 text-slate-500">Dozens of uncontrolled file versions on shared drives</td>
                <td className="p-4 text-slate-500">Heavy desktop installation &amp; high licensing cost</td>
                <td className="p-4 font-medium text-emerald-800 bg-slate-50/50">
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Modern Cloud/Browser System
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* SECTION: Roadmap & Building in the Open                                   */}
      {/* ========================================================================= */}
      <section className="py-16 bg-slate-900 text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                  PLATFORM EVOLUTION
                </span>
                <span className="text-xs text-slate-400 font-mono">Current Release: v0.1.0</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                The modern calculation standard for crane builders
              </h2>
            </div>

            <Link
              to={user ? '/projects' : '/login'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition shadow-sm"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            <strong>Statica EOT is actively developed.</strong> Today, our core mechanism calculation suite (motors, brakes,
            wire ropes, drums, sheaves, gearboxes, and wheels) and structural suite (box beam properties, bending moments,
            and deflection ratios) provide a rock-solid engineering foundation. Here is where the platform is heading:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Boxes className="w-4 h-4" />
                <span>Generative Girder Sizing</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Automated optimization of box-girder plate thicknesses, diaphragm pitches, and weight-to-stiffness trade-offs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <HardHat className="w-4 h-4" />
                <span>Multi-User Review Workspaces</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Concurrent engineering review flags, chief engineer approvals, and digital stamp signing workflows.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Layers className="w-4 h-4" />
                <span>Expanded Vendor Catalogs</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Direct catalog integration for leading motor, brake, thruster, and gearbox manufacturers with live CAD dimensions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Compass className="w-4 h-4" />
                <span>International Standards</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Cross-verification modules for FEM 1.001 (Rules for Design of Hoisting Appliances) and CMAA 70 specifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: Final Call To Action                                             */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 bg-[#fbfbfa] text-center border-t border-slate-200">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Ready for your next crane project</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-950">
            Eliminate calculation risk on your next crane design
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Join forward-thinking overhead crane designers, structural engineers, and fabricators who have retired fragile
            calculation sheets for good.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={user ? '/projects' : '/login'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition shadow-sm hover:shadow-md"
            >
              <span>{user ? 'Open Your Workspace' : 'Start Designing in Statica EOT'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="pt-4 flex items-center justify-center gap-6 text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              100% Deterministic Engine
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              IS 3177 &amp; IS 807 Codal Compliance
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              PDF &amp; Excel Exports
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* Footer                                                                    */}
      {/* ========================================================================= */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cog className="w-4 h-4 stroke-[2.2] text-slate-800" />
            <span className="font-bold text-slate-900">Statica EOT</span>
            <span className="font-normal text-[11px] text-slate-400">by StaticaLabs</span>
            <span className="text-slate-300">&middot;</span>
            <span className="text-[11px]">Industrial Overhead Crane Engineering Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link to={user ? '/projects' : '/login'} className="hover:text-slate-900 underline">
              {user ? 'Projects' : 'Sign In'}
            </Link>
            <span>&middot;</span>
            <span>IS 3177:1999 &amp; IS 807:2006</span>
            <span>&middot;</span>
            <span>&copy; {new Date().getFullYear()} StaticaLabs</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
