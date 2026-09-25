import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { HardHat, LogOut, LogIn, FolderKanban, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentProjectName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentProjectName }) => {
  const { user, profile, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/projects" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 transition">
              <HardHat className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="font-semibold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
                StaticaLabs <span className="text-blue-400 font-mono text-xs px-1.5 py-0.2 rounded bg-blue-950 border border-blue-800/40">EOT</span>
              </span>
              <p className="text-[10px] text-slate-400">Crane Engineering Platform</p>
            </div>
          </Link>

          {currentProjectName && (
            <div className="hidden md:flex items-center gap-2 pl-3 ml-3 border-l border-slate-800 text-xs text-slate-400">
              <span className="text-slate-500">Project:</span>
              <span className="font-medium text-slate-200">{currentProjectName}</span>
              <span className="text-[10px] text-slate-500 italic">by StaticaLabs</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-900 transition"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
            Projects
          </Link>

          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-semibold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-slate-200 leading-tight">
                    {profile?.displayName || user.displayName || 'Engineer'}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    Google Auth
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  await signOut();
                  navigate('/login');
                }}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
