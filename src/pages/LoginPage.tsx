import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Cog, ShieldCheck, ArrowRight, CheckCircle2, ArrowLeft, Zap } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, signInWithGoogle, loading, error } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent" />
        <span className="text-xs text-slate-500 font-medium">Verifying authentication...</span>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/projects" replace />;
  }

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      navigate('/projects');
    } catch {
      // error is handled in context
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col justify-between p-4 sm:p-6 relative font-sans selection:bg-slate-200">
      {/* Top Header Link */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition px-2.5 py-1.5 rounded-lg hover:bg-slate-200/50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Product Overview</span>
        </Link>

        <span className="text-[10px] font-mono text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
          Alpha v0.1
        </span>
      </div>

      {/* Main Centered Auth Card */}
      <div className="w-full max-w-md mx-auto my-8">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-8 shadow-sm space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Cog className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900">Statica EOT</span>
                <span className="text-xs font-normal text-slate-400">by StaticaLabs</span>
              </div>
              <p className="text-[11px] text-slate-500">IS 3177 / IS 807 Crane Calculation Platform</p>
            </div>
          </div>

          {/* Value Header */}
          <div className="space-y-1.5 border-t border-slate-100 pt-4">
            <h2 className="text-base font-bold text-slate-900">Sign in to your workspace</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Access your saved crane engineering projects, live calculation modules, and verifiable compliance reports.
            </p>
          </div>

          {/* Feature Highlights Pill Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Deterministic IS 3177 / IS 807 compliance checks</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>0ms instant topological auto-dependency engine</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Paginated PDF reports & multi-sheet Excel workbooks</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-snug">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={signingIn}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs border border-slate-300 shadow-2xs hover:shadow-xs transition flex items-center justify-center gap-3 group disabled:opacity-50"
          >
            {/* Google Colorful 'G' Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>

            <span>{signingIn ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition" />
          </button>

          {/* Alpha Notice */}
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Alpha Build v0.1:</strong> Features generative design, team collaboration, and expanded catalogs are actively in development.
            </span>
          </div>

          {/* Security Subtext */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Protected by Google Cloud Authentication & Cloud Firestore</span>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center text-[11px] text-slate-400">
        Statica EOT by StaticaLabs · Deterministic Crane Engineering Platform · IS 3177 / IS 807
      </footer>
    </div>
  );
};
