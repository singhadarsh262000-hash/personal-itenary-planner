import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Wallet,
  CheckCircle2,
  Sliders,
  MapPin,
  Clock,
  Layers,
  Utensils
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 py-6 sm:py-12">
      {/* HERO SECTION */}
      <section className="relative text-center max-w-4xl mx-auto px-4">
        {/* Glow backdrop effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-amber-500/15 via-cyan-500/10 to-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Powered by Google Gemini & Deterministic Budget Math</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
          Your Next Adventure,{' '}
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            Planned by AI.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
          Create personalized day-by-day travel itineraries that match your exact budget, interests, and travel pace in minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/trips/new">
            <Button
              size="lg"
              variant="primary"
              className="text-base px-8 py-4 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Plan My Trip
            </Button>
          </Link>

          <Link to="/dashboard">
            <Button size="lg" variant="secondary" className="text-base px-6 py-4">
              Explore Dashboard
            </Button>
          </Link>
        </div>

        <p className="text-xs text-slate-500 mt-4">
          Free local single-user prototype • Ephemeral in-memory storage • No sign-up required
        </p>
      </section>

      {/* INTERACTIVE PREVIEW CARD SHOWCASE */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                Sample Generated Itinerary
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                5 Days in Tokyo & Kyoto, Japan
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                2 Travelers • $2,400 USD Planned Budget • Comfort Travel Style
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-semibold">
                $2,180 Est. Total (Under Budget)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>09:30 – 11:30</span>
                <span className="text-slate-500 font-normal">Sightseeing</span>
              </div>
              <h5 className="font-bold text-white text-sm">Senso-ji & Nakamise</h5>
              <p className="text-xs text-slate-400">
                Explore Tokyo's oldest temple grounds and taste fresh ningyo-yaki sweets.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Asakusa, Tokyo</span>
                <span className="font-semibold text-white">Free</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>12:00 – 13:30</span>
                <span className="text-slate-500 font-normal">Dining</span>
              </div>
              <h5 className="font-bold text-white text-sm">Edomae Sushi Tasting</h5>
              <p className="text-xs text-slate-400">
                Fresh nigiri sushi counter in the outer Tsukiji marketplace.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Tsukiji Outer Market</span>
                <span className="font-semibold text-white">$35 / person</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>14:30 – 16:30</span>
                <span className="text-slate-500 font-normal">Activity</span>
              </div>
              <h5 className="font-bold text-white text-sm">TeamLab Planets Digital Art</h5>
              <p className="text-xs text-slate-400">
                Immersive body-interactive digital art museum walking through water.
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
                <span>Toyosu, Tokyo</span>
                <span className="font-semibold text-white">$28 / person</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
            Effortless Workflow
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            How WanderPlan AI Works
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            From broad destination ideas to a tailored day-by-day blueprint in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Enter Preferences',
              desc: 'Select your destination, calendar dates, budget, travel style, and dietary needs.',
              icon: <MapPin className="w-6 h-6 text-amber-400" />,
            },
            {
              step: '02',
              title: 'AI Generation',
              desc: 'Gemini AI constructs cohesive daily themes with realistic durations and transit.',
              icon: <Sparkles className="w-6 h-6 text-cyan-400" />,
            },
            {
              step: '03',
              title: 'Budget Analysis',
              desc: 'Backend engine computes verified subtotals across food, lodging, and activities.',
              icon: <Wallet className="w-6 h-6 text-emerald-400" />,
            },
            {
              step: '04',
              title: 'Customize & Iterate',
              desc: 'Add activities, reorder timelines, or regenerate specific days with custom focus.',
              icon: <Sliders className="w-6 h-6 text-purple-400" />,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3 relative group"
            >
              <span className="text-4xl font-black text-slate-800 group-hover:text-amber-500/20 transition-colors">
                {item.step}
              </span>
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                {item.icon}
              </div>
              <h4 className="text-base font-bold text-white">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
            Why Travelers Choose WanderPlan
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Designed for Real Travelers, Not Generic Lists
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Realistic Travel Pacing</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose between Relaxed, Balanced, or Packed paces. Activities are sequenced chronologically with realistic durations so you never feel rushed.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Wallet className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Deterministic Budget Math</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No financial hallucinations. The Python backend handles authoritative math across lodging, food, transit, and admissions with variance warnings.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Granular Day Regeneration</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Don't like Day 3? Regenerate only that day with custom prompts without altering or losing the rest of your personalized schedule.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center border border-amber-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Compass className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
            Ready to plan your next memorable getaway?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Generate an entire day-by-day itinerary complete with timing, costs, and dining suggestions in under 30 seconds.
          </p>
          <Link to="/trips/new">
            <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Start Planning Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
