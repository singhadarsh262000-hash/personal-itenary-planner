import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Sparkles, Plus, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  onLoadSample?: () => void;
  isLoadingSample?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onLoadSample, isLoadingSample }) => {
  return (
    <div className="glass-card rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto border border-dashed border-slate-800">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400">
        <Compass className="w-8 h-8 animate-pulse-subtle" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">No itineraries planned yet</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        Ready to explore? Tell us where you want to go, your dates, and budget. Our Gemini AI will craft an optimized, day-by-day travel plan with dining, activities, and budget breakdowns.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/trips/new">
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
            Plan Your First Trip
          </Button>
        </Link>

        {onLoadSample && (
          <Button
            variant="secondary"
            size="md"
            onClick={onLoadSample}
            isLoading={isLoadingSample}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
          >
            Load Sample Trip
          </Button>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center">
        <div>
          <span className="block text-xs font-semibold text-slate-300">Custom Pacing</span>
          <span className="text-[11px] text-slate-500">Relaxed to packed</span>
        </div>
        <div>
          <span className="block text-xs font-semibold text-slate-300">Budget Guardrails</span>
          <span className="text-[11px] text-slate-500">Deterministic math</span>
        </div>
        <div>
          <span className="block text-xs font-semibold text-slate-300">Full Control</span>
          <span className="text-[11px] text-slate-500">Edit, add, reorder</span>
        </div>
      </div>
    </div>
  );
};
