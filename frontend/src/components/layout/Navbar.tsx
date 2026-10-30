import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Plus, Sparkles, User, Activity } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    api.checkHealth()
      .then(() => setIsBackendHealthy(true))
      .catch(() => setIsBackendHealthy(false));
  }, []);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Plan Trip', path: '/trips/new' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
              WanderPlan <span className="text-amber-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">AI</span>
            </span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-medium">Smart Travel Architect</span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-slate-800/80 rounded-full px-3 py-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              location.pathname === '/' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Home
          </Link>
          {navLinks.map((link) => {
            const active = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Action & User Profile Placeholder */}
        <div className="flex items-center gap-3">
          {/* Backend Status indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800"
            title={isBackendHealthy ? 'API connected' : 'API unreachable'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy === null
                  ? 'bg-slate-500'
                  : isBackendHealthy
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-400 font-mono text-[10px]">
              {isBackendHealthy ? 'API Online' : 'API Offline'}
            </span>
          </div>

          <Link to="/trips/new">
            <Button size="sm" variant="primary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Create Trip
            </Button>
          </Link>

          {/* User Profile Badge (Explicit local single-user label) */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-tight">Local User</p>
              <p className="text-[10px] text-slate-500 leading-tight">Prototype Mode</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
