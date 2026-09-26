import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  Cog,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Layers,
  Cpu,
  Lock,
  Compass,
  Users,
  Boxes,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

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
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                Statica EOT
              </span>
              <span className="text-[11px] font-normal text-slate-400 font-sans">
                by StaticaLabs
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono font-semibold uppercase tracking-wider">
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
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        {/* Alpha Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium mb-6">
          <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.2 rounded border border-slate-200/80 text-[10px]">
            ALPHA BUILD
          </span>
          <span className="text-slate-500">Deterministic IS 3177:1999 & IS 807:2006 Calculation Engine</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 max-w-4xl mx-auto leading-[1.12]">
          Crane engineering calculation is{' '}
          <span className="underline decoration-slate-300 underline-offset-8">not an option</span>.
          <br className="hidden sm:inline" /> It is a structural and legal imperative.
        </h1>

        {/* Subhead */}
        <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Suspended industrial loads cannot tolerate broken spreadsheet formulas, circular cell overrides, or unverified
          margins. <strong>Statica EOT</strong> delivers deterministic, code-compliant verification for overhead
          travelling and gantry cranes.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={user ? '/projects' : '/login'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition shadow-sm hover:shadow-md"
          >
            <span>Launch Calculation Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#why-must-have"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium transition shadow-2xs"
          >
            <span>Why It’s a Must-Have</span>
          </a>
        </div>

        {/* Quick proof bar */}
        <div className="mt-12 pt-8 border-t border-slate-200/70 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-medium block">Standard Governing</span>
            <span className="text-xs font-bold text-slate-900 mt-0.5 block">IS 3177 / IS 807</span>
          </div>
          <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-medium block">Calculation Time</span>
            <span className="text-xs font-bold text-slate-900 mt-0.5 block">0ms Synchronous DAG</span>
          </div>
          <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-medium block">Compliance Mode</span>
            <span className="text-xs font-bold text-emerald-700 mt-0.5 block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Live Pass/Fail Auditing
            </span>
          </div>
          <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-medium block">Export Formats</span>
            <span className="text-xs font-bold text-slate-900 mt-0.5 block">Printable PDF & Excel (.xlsx)</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: A Need, Not a Want (Why Ad-Hoc Spreadsheets Are Risky)           */}
      {/* ========================================================================= */}
      <section id="why-must-have" className="py-16 bg-white border-y border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Engineering Reliability
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Why Statica EOT is a Must-Have, Not a "Nice-to-Have"
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              When overhead cranes lift 10 to 100+ tonnes in industrial facilities, engineering validation is the barrier
              between safe operation and catastrophic mechanical failure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Way */}
            <div className="p-6 rounded-2xl border border-rose-200/80 bg-rose-50/20 space-y-4">
              <div className="flex items-center gap-2.5 text-rose-800 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>The Peril of Legacy Excel Templates</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">✕</span>
                  <span><strong>Accidental formula overwrites</strong>: A single user accidentally typing a static number into a cell corrupts downstream checks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">✕</span>
                  <span><strong>Hidden dependency breaks</strong>: Changing hoist speed without adjusting drum diameter or motor multiplicity leads to invalid motor sizing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold mt-0.5">✕</span>
                  <span><strong>Zero audit trail</strong>: Hard to prove which revision of an equation was evaluated when signing off design reports.</span>
                </li>
              </ul>
            </div>

            {/* The Statica EOT Way */}
            <div className="p-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-800 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>The Statica EOT Deterministic Standard</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>Locked deterministic calculation engine</strong>: Equations are immutable, audited code directly mapped to verified engineering workbooks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>Topological auto-dependency resolution</strong>: Upstream outputs dynamically populate downstream modules in 0ms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span><strong>Complete calculation trace</strong>: Every variable substitution and intermediate step is visually and mathematically verifiable.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: Code Compliance Features                                          */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            Built-in Verification
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
            Hardened Code Compliance (IS 3177 & IS 807)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Every mechanism and structural calculation is continuously audited against codified limits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Motor & Drive Sizing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verifies main hoist, cross travel, and long travel drive ratings against duty cycle factors, service factors,
              and gear reduction ratios.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Cpu className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Rope & Drum Geometry</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Validates wire rope safety factors (FoS &ge; 5.0) and drum-to-rope diameter ratios (D/d) matching duty class
              M1 through M8.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Braking Safety Margins</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enforces statutory deceleration rates and minimum holding torque multipliers (T_brake &ge; 1.5 &times; T_load)
              preventing brake slippage.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Compass className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Wheel & Rail Contact Stress</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calculates dynamic wheel loads under extreme crab approaches and checks rail head contact stresses against
              permissible BHN hardness.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Printer className="w-4 h-4 text-slate-700" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Sign-Off Ready PDF Reports</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates formal calculation reports in a dedicated window formatted with page-break protection and engineer
              sign-off signatures.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-2 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Full Excel (.xlsx) Workbooks</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Downloads multi-sheet Excel files containing complete master specs, compliance matrices, calculated outputs,
              and check criteria.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: Alpha Notice & Upcoming Roadmap                                   */}
      {/* ========================================================================= */}
      <section className="py-16 bg-slate-900 text-white px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                  ALPHA STAGE
                </span>
                <span className="text-xs text-slate-400">Current Release: v0.1.0</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                You are testing the Alpha Build of Statica EOT
              </h2>
            </div>

            <Link
              to={user ? '/projects' : '/login'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition shadow-sm"
            >
              <span>Launch Alpha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Statica EOT is currently in active <strong>Alpha development</strong>. The core deterministic mechanism suite
            (motors, gearboxes, brakes, ropes, drums, sheaves, wheels) is fully verified and functional. We are actively
            expanding the calculation library and platform infrastructure with upcoming capabilities:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Boxes className="w-4 h-4" />
                <span>Generative Design</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Automated box girder plate thickness and diaphragm optimization to reduce structural steel dead weight.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Users className="w-4 h-4" />
                <span>Team Collaboration</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Multi-engineer simultaneous workspaces, in-line comment threads, and multi-tier approval sign-offs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Layers className="w-4 h-4" />
                <span>Expanded Catalogs</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Live manufacturer component catalogs for Nord, SEW, BBL, Siemens, and wire rope wire strands.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Compass className="w-4 h-4" />
                <span>Global Standards</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Support for international crane codes including CMAA 70 (US), FEM 1.001 (Europe), and ISO 4301.
              </p>
            </div>
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
            <span className="text-slate-300">·</span>
            <span className="text-[11px]">Industrial Overhead Crane Engineering</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/login" className="hover:text-slate-900 underline">
              Sign In
            </Link>
            <span>·</span>
            <span>IS 3177 / IS 807</span>
            <span>·</span>
            <span>© {new Date().getFullYear()} StaticaLabs</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
