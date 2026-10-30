import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, AlertCircle, Search, Compass } from 'lucide-react';
import { TripSummary } from '../types';
import { api, ApiException } from '../services/api';
import { Button } from '../components/ui/Button';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { TripCard } from '../components/dashboard/TripCard';
import { EmptyState } from '../components/dashboard/EmptyState';
import { useToast } from '../components/ui/Toast';

export const DashboardPage: React.FC = () => {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const toast = useToast();

  const [isSampleLoading, setIsSampleLoading] = useState(false);

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.listTrips();
      setTrips(data);
    } catch (err: any) {
      const msg = err instanceof ApiException ? err.message : 'Failed to connect to trips API.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setIsSampleLoading(true);
      await api.createSampleTrip();
      toast.success('Sample Tokyo & Kyoto itinerary loaded!');
      await fetchTrips();
    } catch (err: any) {
      toast.error('Failed to load sample trip.');
    } finally {
      setIsSampleLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await api.deleteTrip(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      toast.success('Trip and itinerary deleted successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete trip.');
    }
  };

  const filteredTrips = trips.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      t.travel_style.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Trip Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your saved itineraries and plan upcoming journeys.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTrips}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Link to="/trips/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create New Trip
            </Button>
          </Link>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-500/40 text-center max-w-lg mx-auto space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Backend Server Unavailable</h3>
          <p className="text-xs text-rose-200 leading-relaxed">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchTrips} className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 border border-slate-800 animate-pulse space-y-4"
            >
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-6 bg-slate-800 rounded w-3/4" />
              <div className="h-16 bg-slate-800/60 rounded" />
              <div className="h-8 bg-slate-800 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* SUCCESS STATE */}
      {!isLoading && !error && (
        <>
          {/* Stats bar */}
          {trips.length > 0 && <StatsOverview trips={trips} />}

          {/* Filter & Search Bar */}
          {trips.length > 0 && (
            <div className="flex items-center justify-between gap-4 pb-2">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by city, title, or style..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Showing {filteredTrips.length} of {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
              </span>
            </div>
          )}

          {/* Trips Grid or Empty State */}
          {trips.length === 0 ? (
            <EmptyState onLoadSample={handleLoadSample} isLoadingSample={isSampleLoading} />
          ) : filteredTrips.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass-card border border-slate-800">
              <p className="text-sm text-slate-400">
                No trips matching "<span className="text-white font-medium">{searchQuery}</span>"
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs"
              >
                Clear Search Filter
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} onDelete={handleDeleteTrip} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
