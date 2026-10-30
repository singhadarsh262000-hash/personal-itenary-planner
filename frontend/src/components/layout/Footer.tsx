import React from 'react';
import { Compass, Sparkles, ShieldAlert, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 text-slate-400 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-900">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base tracking-tight">WanderPlan AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Engineered with FastAPI, React, and Google Gemini. Generates custom day-by-day itineraries with authoritative multi-basis budget calculation and customizable activities.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg max-w-md">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Important Notice:</strong> All AI-generated travel recommendations, opening schedules, and estimated costs are suggestions and require external verification.
              </span>
            </div>
          </div>

          {/* Quick Nav */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-amber-400 transition-colors">Home Landing</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-amber-400 transition-colors">Trip Dashboard</Link>
              </li>
              <li>
                <Link to="/trips/new" className="hover:text-amber-400 transition-colors">Plan New Trip</Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Storage */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>FastAPI + Pydantic v2</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Google Gemini API</span>
              </li>
              <li className="text-[11px] text-slate-500 mt-2">
                Storage: In-Memory Repository (Phase 1 Ephemeral).
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} WanderPlan AI. Built with precision for intelligent travel planning.</p>
          <p className="text-[11px] font-mono">Phase 1 Prototype</p>
        </div>
      </div>
    </footer>
  );
};
