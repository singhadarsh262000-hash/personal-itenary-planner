import React, { useEffect, useState } from 'react';
import { Sparkles, MapPin, Compass, DollarSign, Calendar } from 'lucide-react';

interface GeneratingModalProps {
  isOpen: boolean;
  destination: string;
}

const GENERATING_STEPS = [
  'Curating top attractions matching your travel style...',
  'Structuring day-by-day itinerary schedule...',
  'Selecting local dining spots adhering to dietary preferences...',
  'Calculating authoritative budget subtotals across categories...',
  'Finalizing travel tips and transit recommendations...',
];

export const GeneratingModal: React.FC<GeneratingModalProps> = ({ isOpen, destination }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % GENERATING_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-lg">
      <div className="max-w-md w-full glass-panel bg-slate-900/95 border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400">
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          <h3 className="text-xl font-extrabold text-white mb-1.5 tracking-tight">
            Planning Your Journey
          </h3>
          <p className="text-sm text-amber-400 font-medium mb-6 flex items-center justify-center gap-1.5">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{destination || 'Your Destination'}</span>
          </p>

          {/* Animated step feedback */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 mb-6">
            <p className="text-xs text-slate-300 font-medium transition-all duration-300 min-h-[36px] flex items-center justify-center">
              {GENERATING_STEPS[currentStep]}
            </p>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Gemini AI is analyzing real distances, travel pace, and budget constraints. This usually takes 10–25 seconds.
          </p>
        </div>
      </div>
    </div>
  );
};
