import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Users,
  Compass,
  ArrowLeft,
  Sparkles,
  PieChart as ChartIcon,
  Layers,
  Lightbulb,
  Plus,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';
import {
  Trip,
  Itinerary,
  ItineraryDay,
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
} from '../types';
import { api, ApiException } from '../services/api';
import { formatCurrency, formatDateRange } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { DayTabs } from '../components/itinerary/DayTabs';
import { DayTimeline } from '../components/itinerary/DayTimeline';
import { ActivityModal } from '../components/itinerary/ActivityModal';
import { RegenerateModal } from '../components/itinerary/RegenerateModal';
import { BudgetBreakdown } from '../components/budget/BudgetBreakdown';
import { GeneratingModal } from '../components/trip-builder/GeneratingModal';
import { useToast } from '../components/ui/Toast';

export const TripDetailPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view: 'timeline' or 'budget'
  const [activeTab, setActiveTab] = useState<'timeline' | 'budget'>('timeline');

  // Selected day: 'all' or specific day ID
  const [selectedDayId, setSelectedDayId] = useState<string | 'all'>('all');

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityModalDayId, setActivityModalDayId] = useState<string>('');
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);

  const [isRegenerateTripModalOpen, setIsRegenerateTripModalOpen] = useState(false);
  const [isRegenerateDayModalOpen, setIsRegenerateDayModalOpen] = useState(false);
  const [regenerateDayId, setRegenerateDayId] = useState<string>('');
  const [regenerateDayNumber, setRegenerateDayNumber] = useState<number>(1);

  const [isGenerating, setIsGenerating] = useState(false);

  const fetchTripAndItinerary = async () => {
    if (!tripId) return;
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch trip
      const tripData = await api.getTrip(tripId);
      setTrip(tripData);

      // 2. Fetch itinerary if trip has one
      try {
        const itinData = await api.getItinerary(tripId);
        setItinerary(itinData);
        if (itinData.days.length > 0 && selectedDayId === 'all') {
          // Keep 'all' or select first day
        }
      } catch (itinErr: any) {
        // Itinerary may not have been generated yet
        setItinerary(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load trip details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTripAndItinerary();
  }, [tripId]);

  // Generate Itinerary from scratch
  const handleGenerateFullItinerary = async () => {
    if (!tripId || !trip) return;
    try {
      setIsGenerating(true);
      const generated = await api.generateItinerary(tripId);
      setItinerary(generated);
      setTrip((prev) => (prev ? { ...prev, status: 'generated', has_itinerary: true } : prev));
      toast.success('Complete itinerary generated with AI!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate itinerary. Check backend Gemini configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate Entire Itinerary
  const handleRegenerateFullTrip = async () => {
    if (!tripId) return;
    try {
      setIsGenerating(true);
      const regenerated = await api.regenerateItinerary(tripId);
      setItinerary(regenerated);
      toast.success('Entire itinerary regenerated successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Regeneration failed. Preserved previous plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Single Day Regenerate Modal
  const openRegenerateDayModal = (dayId: string, dayNumber: number) => {
    setRegenerateDayId(dayId);
    setRegenerateDayNumber(dayNumber);
    setIsRegenerateDayModalOpen(true);
  };

  // Regenerate Single Day Action
  const handleRegenerateDay = async (instructions?: string) => {
    if (!regenerateDayId || !tripId) return;
    try {
      setIsGenerating(true);
      const updatedDay = await api.regenerateDay(regenerateDayId, instructions);

      // Update state with refreshed day & fetch updated authoritative budget
      setItinerary((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          days: prev.days.map((d) => (d.id === regenerateDayId ? updatedDay : d)),
        };
      });

      // Refetch full itinerary for latest budget calculations
      const freshItinerary = await api.getItinerary(tripId);
      setItinerary(freshItinerary);
      toast.success(`Day ${regenerateDayNumber} regenerated with fresh suggestions!`);
    } catch (err: any) {
      toast.error(err?.message || `Failed to regenerate Day ${regenerateDayNumber}.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Activity Handlers
  const handleOpenAddActivity = (dayId: string) => {
    setActivityModalDayId(dayId);
    setActivityToEdit(null);
    setIsActivityModalOpen(true);
  };

  const handleOpenEditActivity = (activity: Activity) => {
    setActivityModalDayId(activity.day_id);
    setActivityToEdit(activity);
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (
    data: CreateActivityInput | UpdateActivityInput,
    isEdit: boolean
  ) => {
    if (!tripId) return;
    try {
      if (isEdit && activityToEdit) {
        await api.updateActivity(activityToEdit.id, data as UpdateActivityInput);
        toast.success('Activity updated.');
      } else {
        await api.addActivity(activityModalDayId, data as CreateActivityInput);
        toast.success('Activity added.');
      }
      // Refresh itinerary to update timeline and authoritative budget
      const fresh = await api.getItinerary(tripId);
      setItinerary(fresh);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save activity.');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!tripId) return;
    try {
      await api.deleteActivity(activityId);
      const fresh = await api.getItinerary(tripId);
      setItinerary(fresh);
      toast.success('Activity removed.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete activity.');
    }
  };

  const handleMoveActivity = async (dayId: string, activityId: string, direction: 'up' | 'down') => {
    if (!itinerary) return;
    const targetDay = itinerary.days.find((d) => d.id === dayId);
    if (!targetDay) return;

    const acts = [...targetDay.activities].sort((a, b) => a.sort_order - b.sort_order);
    const index = acts.findIndex((a) => a.id === activityId);
    if (index === -1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= acts.length) return;

    // Swap elements
    const temp = acts[index];
    acts[index] = acts[swapIndex];
    acts[swapIndex] = temp;

    const orderedIds = acts.map((a) => a.id);
    try {
      const updatedActs = await api.reorderActivities(dayId, orderedIds);
      setItinerary((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          days: prev.days.map((d) => (d.id === dayId ? { ...d, activities: updatedActs } : d)),
        };
      });
    } catch (err: any) {
      toast.error('Failed to reorder activities.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-44 glass-card rounded-3xl" />
        <div className="h-12 glass-card rounded-2xl w-2/3" />
        <div className="h-64 glass-card rounded-3xl" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="p-8 rounded-3xl glass-card border border-rose-500/30 text-center max-w-lg mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Trip Not Found</h3>
        <p className="text-xs text-slate-300">{error || 'Unable to retrieve trip details.'}</p>
        <Link to="/dashboard">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const daysToRender =
    selectedDayId === 'all'
      ? itinerary?.days || []
      : (itinerary?.days || []).filter((d) => d.id === selectedDayId);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Return Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {itinerary && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRegenerateTripModalOpen(true)}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            >
              Regenerate Full Trip
            </Button>
          </div>
        )}
      </div>

      {/* TRIP HERO BANNER */}
      <div className="relative glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-transparent to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <MapPin className="w-3.5 h-3.5" />
                {trip.destination}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">{trip.duration_days} Days</span>
              <span className="text-slate-600">•</span>
              <Badge variant="amber" size="sm">{trip.travel_style}</Badge>
              <Badge variant="cyan" size="sm">{trip.pace} Pace</Badge>
              <StatusBadge status={trip.status} />
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {trip.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                {formatDateRange(trip.start_date, trip.end_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}
              </span>
            </div>
          </div>

          {/* Planned Budget Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-start md:items-end justify-center shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Planned Budget
            </span>
            <span className="text-2xl font-black text-white">
              {formatCurrency(trip.budget, trip.currency)}
            </span>
            {itinerary && (
              <span
                className={`text-[11px] font-bold mt-1 ${
                  itinerary.budget_estimate.is_over_budget ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {itinerary.budget_estimate.is_over_budget
                  ? `Over Budget by ${formatCurrency(itinerary.budget_estimate.over_budget_amount, trip.currency)}`
                  : `${formatCurrency(itinerary.budget_estimate.remaining_budget, trip.currency)} Remaining`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* IF NO ITINERARY GENERATED YET: CALL TO ACTION */}
      {!itinerary ? (
        <div className="glass-card rounded-3xl p-10 sm:p-12 text-center border border-dashed border-amber-500/40 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-white">Itinerary Not Generated Yet</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Your trip preferences are saved. Click below to generate your custom day-by-day plan using Gemini AI.
          </p>
          <div className="pt-2">
            <Button
              size="lg"
              variant="primary"
              onClick={handleGenerateFullItinerary}
              isLoading={isGenerating}
              leftIcon={<Sparkles className="w-5 h-5 text-slate-950" />}
            >
              Generate Itinerary with AI
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* TABS SELECTOR (Timeline vs Budget Analytics) */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Daily Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('budget')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'budget'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                <ChartIcon className="w-4 h-4" />
                <span>Budget Analytics</span>
              </button>
            </div>
          </div>

          {/* TAB 1: DAILY TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {/* Horizontal Day Switcher */}
              <DayTabs
                days={itinerary.days}
                selectedDayId={selectedDayId}
                onSelectDay={setSelectedDayId}
              />

              {/* Day Timelines */}
              <div className="space-y-10">
                {daysToRender.map((day) => (
                  <DayTimeline
                    key={day.id}
                    day={day}
                    onAddActivity={handleOpenAddActivity}
                    onEditActivity={handleOpenEditActivity}
                    onDeleteActivity={handleDeleteActivity}
                    onMoveUpActivity={(aid) => handleMoveActivity(day.id, aid, 'up')}
                    onMoveDownActivity={(aid) => handleMoveActivity(day.id, aid, 'down')}
                    onRegenerateDay={openRegenerateDayModal}
                  />
                ))}
              </div>

              {/* General Travel Tips Section */}
              {itinerary.general_travel_tips && itinerary.general_travel_tips.length > 0 && (
                <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4" />
                    <span>Travel Tips for {trip.destination}</span>
                  </div>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
                    {itinerary.general_travel_tips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BUDGET ANALYTICS */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <BudgetBreakdown budget={itinerary.budget_estimate} />
            </div>
          )}
        </>
      )}

      {/* ACTIVITY MODAL (Add / Edit) */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        dayId={activityModalDayId}
        activityToEdit={activityToEdit}
        currency={trip.currency}
        onSave={handleSaveActivity}
      />

      {/* REGENERATE FULL TRIP MODAL */}
      <RegenerateModal
        isOpen={isRegenerateTripModalOpen}
        onClose={() => setIsRegenerateTripModalOpen(false)}
        title="Regenerate Full Itinerary"
        onConfirm={handleRegenerateFullTrip}
        isLoading={isGenerating}
      />

      {/* REGENERATE SINGLE DAY MODAL */}
      <RegenerateModal
        isOpen={isRegenerateDayModalOpen}
        onClose={() => setIsRegenerateDayModalOpen(false)}
        title={`Regenerate Day ${regenerateDayNumber}`}
        isDayRegen={true}
        dayNumber={regenerateDayNumber}
        onConfirm={handleRegenerateDay}
        isLoading={isGenerating}
      />

      {/* GENERATION IN PROGRESS MODAL */}
      <GeneratingModal isOpen={isGenerating} destination={trip?.destination || ''} />
    </div>
  );
};
