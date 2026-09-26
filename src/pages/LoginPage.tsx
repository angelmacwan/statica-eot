import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { HardHat, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, signInWithGoogle, loading, error } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] flex items-center justify-center">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-slate-900 border-t-transparent" />
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
    <div className="min-h-screen bg-[#fbfbfa] text-slate-900 flex flex-col justify-center items-center px-4 relative">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-8 shadow-sm relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              StaticaLabs
              <span className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                EOT
              </span>
            </h1>
            <p className="text-xs text-slate-500">Crane Engineering Calculation Platform</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          Deterministic, verifiable structural and mechanical calculations for industrial overhead travelling and gantry
          cranes conforming to IS 3177 / IS 807.
        </p>

        <div className="space-y-2 mb-6 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Traceable formula derivations & step substitutions</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Automated cross-module dependency resolution</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Deterministic IS 3177 / IS 807 compliance checks</span>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-snug">
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-2.5 transition shadow-sm group"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.24 10.285V14.4h6.887C18.2 16.887 15.623 18.72 12.24 18.72c-4.032 0-7.36-3.328-7.36-7.36s3.328-7.36 7.36-7.36c1.824 0 3.488.672 4.784 1.776l3.184-3.184C18.288 1.056 15.424 0 12.24 0 5.472 0 0 5.472 0 12.24s5.472 12.24 12.24 12.24c7.056 0 12.016-4.96 12.016-12.016 0-.816-.08-1.584-.224-2.176H12.24z" />
          </svg>
          <span>Continue with Google</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
        </button>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Google Authentication Only · Secure Cloud Storage</span>
        </div>
      </div>
    </div>
  );
};
