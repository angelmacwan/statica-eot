import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { HardHat, LogOut, LogIn, FolderKanban, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentProjectName?: string;
  autoSaveStatus?: 'saved' | 'saving' | 'error';
}

export const Navbar: React.FC<NavbarProps> = ({ currentProjectName, autoSaveStatus }) => {
  const { user, profile, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-13 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/projects" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center group-hover:bg-slate-800 transition shadow-sm">
              <HardHat className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                StaticaLabs
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  EOT
                </span>
              </span>
            </div>
          </Link>

          {currentProjectName && (
            <div className="hidden sm:flex items-center gap-2 pl-3 ml-2 border-l border-slate-200 text-xs">
              <span className="text-slate-400">/</span>
              <span className="font-medium text-slate-800 truncate max-w-xs">{currentProjectName}</span>
            </div>
          )}

          {autoSaveStatus && (
            <div className="hidden md:flex items-center gap-1.5 ml-2 text-[11px] text-slate-500">
              {autoSaveStatus === 'saving' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Saving changes...</span>
                </>
              ) : autoSaveStatus === 'saved' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-500">All changes saved</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-rose-600">Save failed</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/projects"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
            Projects
          </Link>

          {user ? (
            <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-200 shadow-sm"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-medium text-slate-900 leading-tight">
                    {profile?.displayName || user.displayName || 'Engineer'}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                    Verified
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  await signOut();
                  navigate('/login');
                }}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
