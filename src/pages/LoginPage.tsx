import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { HardHat, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, signInWithGoogle, loading, error } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/projects" replace />;
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      navigate('/projects');
    } catch {
      // error is handled in context
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur shadow-2xl relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <HardHat className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              StaticaLabs <span className="text-blue-400 font-mono text-sm px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800/40">EOT</span>
            </h1>
            <p className="text-xs text-slate-400">Crane Engineering Calculation Platform</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Deterministic, verifiable structural and mechanical calculations for industrial overhead travelling and gantry cranes conforming to IS 3177 / IS 807.
        </p>

        <div className="space-y-2.5 mb-8 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Traceable calculation methodology and formula substitutions</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Verified golden engineering regression suites</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Complete project isolation and auditable report exports</span>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs leading-snug">
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-3 transition shadow-lg shadow-blue-600/20 group"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V14.4h6.887C18.2 16.887 15.623 18.72 12.24 18.72c-4.032 0-7.36-3.328-7.36-7.36s3.328-7.36 7.36-7.36c1.824 0 3.488.672 4.784 1.776l3.184-3.184C18.288 1.056 15.424 0 12.24 0 5.472 0 0 5.472 0 12.24s5.472 12.24 12.24 12.24c7.056 0 12.016-4.96 12.016-12.016 0-.816-.08-1.584-.224-2.176H12.24z" />
          </svg>
          <span>Continue with Google</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
        </button>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Google Authentication Only · Secure Firestore Access</span>
        </div>
      </div>
    </div>
  );
};
