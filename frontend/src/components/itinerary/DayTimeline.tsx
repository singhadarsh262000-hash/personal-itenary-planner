import React from 'react';
import {
  Hotel,
  Utensils,
  Navigation,
  Plus,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Calendar,
  Clock
} from 'lucide-react';
import { ItineraryDay, Activity } from '../../types';
import { ActivityCard } from './ActivityCard';
import { Button } from '../ui/Button';
import { formatDate } from '../../utils/formatters';

interface DayTimelineProps {
  day: ItineraryDay;
  onAddActivity: (dayId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onMoveUpActivity: (activityId: string) => void;
  onMoveDownActivity: (activityId: string) => void;
  onRegenerateDay: (dayId: string, dayNumber: number) => void;
}

export const DayTimeline: React.FC<DayTimelineProps> = ({
  day,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onMoveUpActivity,
  onMoveDownActivity,
  onRegenerateDay,
}) => {
  // Sort activities by sort_order or start_time
  const sortedActivities = [...day.activities].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.start_time.localeCompare(b.start_time);
  });

  // Group activities into Morning, Afternoon, Evening
  const morningActivities = sortedActivities.filter((a) => a.start_time < '12:00');
  const afternoonActivities = sortedActivities.filter(
    (a) => a.start_time >= '12:00' && a.start_time < '17:00'
  );
  const eveningActivities = sortedActivities.filter((a) => a.start_time >= '17:00');

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    activities: Activity[]
  ) => {
    if (activities.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider pl-1">
          {icon}
          <span>{title}</span>
          <span className="text-slate-500 text-[10px]">({activities.length})</span>
        </div>
        <div className="space-y-3">
          {activities.map((act) => {
            const overallIndex = sortedActivities.findIndex((a) => a.id === act.id);
            return (
              <ActivityCard
                key={act.id}
                activity={act}
                isFirst={overallIndex === 0}
                isLast={overallIndex === sortedActivities.length - 1}
                onEdit={onEditActivity}
                onDelete={onDeleteActivity}
                onMoveUp={onMoveUpActivity}
                onMoveDown={onMoveDownActivity}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Day Overview Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Day {day.day_number}
              </span>
              <span className="text-slate-400 font-medium">{formatDate(day.date)}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {day.theme}
            </h3>
            {day.notes && <p className="text-xs text-slate-400 mt-1 max-w-2xl">{day.notes}</p>}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRegenerateDay(day.id, day.day_number)}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            >
              Regenerate Day
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onAddActivity(day.id)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Activity
            </Button>
          </div>
        </div>

        {/* Lodging, Dining & Transit Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          {day.accommodation_suggestion && (
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                <Hotel className="w-3.5 h-3.5" />
                <span>Accommodation Suggestion</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{day.accommodation_suggestion}</p>
            </div>
          )}

          {day.dining_suggestions && day.dining_suggestions.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                <Utensils className="w-3.5 h-3.5" />
                <span>Dining Highlights</span>
              </div>
              <ul className="text-slate-300 space-y-1 list-disc list-inside">
                {day.dining_suggestions.slice(0, 2).map((d, i) => (
                  <li key={i} className="truncate">{d}</li>
                ))}
              </ul>
            </div>
          )}

          {day.transportation_suggestions && day.transportation_suggestions.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
                <Navigation className="w-3.5 h-3.5" />
                <span>Transit Tips</span>
              </div>
              <ul className="text-slate-300 space-y-1 list-disc list-inside">
                {day.transportation_suggestions.slice(0, 2).map((t, i) => (
                  <li key={i} className="truncate">{t}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline List */}
      {sortedActivities.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
          <p className="text-sm text-slate-400 mb-3">No activities scheduled for this day yet.</p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAddActivity(day.id)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add an Activity
          </Button>
        </div>
      ) : (
        <div className="space-y-6 pl-2 sm:pl-4 border-l border-slate-800/80 ml-2 sm:ml-4">
          {renderSection(
            'Morning',
            <Sunrise className="w-4 h-4 text-amber-400" />,
            morningActivities
          )}
          {renderSection(
            'Afternoon',
            <Sun className="w-4 h-4 text-amber-300" />,
            afternoonActivities
          )}
          {renderSection(
            'Evening & Night',
            <Sunset className="w-4 h-4 text-purple-400" />,
            eveningActivities
          )}
        </div>
      )}
    </div>
  );
};
