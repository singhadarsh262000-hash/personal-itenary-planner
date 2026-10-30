import React from 'react';
import { Plane, Calendar, Wallet, Globe } from 'lucide-react';
import { TripSummary } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface StatsOverviewProps {
  trips: TripSummary[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ trips }) => {
  const totalTrips = trips.length;

  // Compute upcoming trips (start_date >= today's date)
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingTrips = trips.filter((t) => t.start_date >= todayStr).length;

  // Compute distinct destinations
  const uniqueDestinations = new Set(trips.map((t) => t.destination.split(',')[0].trim())).size;

  // Total planned budget
  const totalBudget = trips.reduce((acc, t) => acc + (t.budget || 0), 0);

  const stats = [
    {
      label: 'Total Trips Planned',
      value: totalTrips,
      icon: <Plane className="w-5 h-5 text-amber-400" />,
      sub: 'Saved in local workspace',
    },
    {
      label: 'Upcoming Adventures',
      value: upcomingTrips,
      icon: <Calendar className="w-5 h-5 text-emerald-400" />,
      sub: upcomingTrips > 0 ? 'Ready for departure' : 'No upcoming departures',
    },
    {
      label: 'Total Budget Allocated',
      value: formatCurrency(totalBudget, trips[0]?.currency || 'USD'),
      icon: <Wallet className="w-5 h-5 text-cyan-400" />,
      sub: 'Across all trips',
    },
    {
      label: 'Destinations',
      value: uniqueDestinations,
      icon: <Globe className="w-5 h-5 text-purple-400" />,
      sub: 'Cities and regions',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="glass-card rounded-2xl p-5 border border-slate-800/80 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {stat.label}
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
              {stat.icon}
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">{stat.value}</div>
          <p className="text-[11px] text-slate-500 mt-1">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
};
