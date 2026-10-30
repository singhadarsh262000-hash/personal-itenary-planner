import React from 'react';
import {
  Clock,
  MapPin,
  DollarSign,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Info
} from 'lucide-react';
import { Activity } from '../../types';
import { CategoryBadge } from '../ui/Badge';
import { formatCurrency, formatDuration, formatCostBasis } from '../../utils/formatters';

interface ActivityCardProps {
  activity: Activity;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onMoveUp: (activityId: string) => void;
  onMoveDown: (activityId: string) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 relative group">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        {/* Timing & Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            {activity.start_time} – {activity.end_time}
          </span>
          <span className="text-xs text-slate-400 font-medium bg-slate-800/80 px-2 py-0.5 rounded-md">
            {formatDuration(activity.estimated_duration_minutes)}
          </span>
          <CategoryBadge category={activity.category} size="sm" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:opacity-75 sm:group-hover:opacity-100 transition-opacity self-end sm:self-auto">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onMoveUp(activity.id)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Move Up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMoveDown(activity.id)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Move Down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(activity)}
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
            title="Edit Activity"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(activity.id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Delete Activity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title & Description */}
      <h4 className="text-base font-bold text-white mb-1.5 group-hover:text-amber-200 transition-colors">
        {activity.name}
      </h4>
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
        {activity.description}
      </p>

      {/* Location & Cost Info Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-medium text-slate-300">{activity.location_name}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium">Est. Cost:</span>
          <span className="font-bold text-white">
            {formatCurrency(activity.estimated_cost, activity.currency)}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {formatCostBasis(activity.cost_basis)}
          </span>
        </div>
      </div>

      {/* Notes or Booking Tips if present */}
      {activity.notes && (
        <div className="mt-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>{activity.notes}</span>
        </div>
      )}
    </div>
  );
};
