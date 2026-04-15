import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, PlusCircle, LayoutDashboard } from 'lucide-react';

export const Layout: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-[Inter] flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-xl leading-none">S</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Split<span className="text-emerald-400">Mint</span>
              </span>
            </Link>

            {/* Nav Links & User */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4 text-sm font-medium">
                <Link to="/" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <Link to="/groups/create" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <PlusCircle size={16} />
                  Create Group
                </Link>
              </div>

              <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-semibold text-white">{profile?.name || 'User'}</span>
                  <span className="text-xs text-slate-500">{profile?.email}</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                  <User size={20} />
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-slate-800 hover:text-red-400 rounded-lg transition-all text-slate-400"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-sm text-slate-600">
        &copy; {new Date().getFullYear()} SplitMint. Keep your finances fresh.
      </footer>
    </div>
  );
};
