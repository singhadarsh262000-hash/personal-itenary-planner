import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Compass,
  ArrowRight,
  Trash2,
  Sparkles,
  MapPin
} from 'lucide-react';
import { TripSummary } from '../../types';
import { formatCurrency, formatDateRange } from '../../utils/formatters';
import { StatusBadge, Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface TripCardProps {
  trip: TripSummary;
  onDelete: (tripId: string) => Promise<void>;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(trip.id);
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="glass-card glass-card-hover rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between relative group">
        <div>
          {/* Header Row: Destination & Status */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[200px]">{trip.destination}</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                {trip.title}
              </h3>
            </div>
            <StatusBadge status={trip.status} />
          </div>

          {/* Details Row: Dates & Travelers */}
          <div className="space-y-2 py-3 border-y border-slate-800/80 my-3 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {formatDateRange(trip.start_date, trip.end_date)}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {trip.duration_days} {trip.duration_days === 1 ? 'day' : 'days'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                {trip.travelers} {trip.travelers === 1 ? 'traveler' : 'travelers'}
              </span>
              <Badge variant="amber" size="sm">
                {trip.travel_style}
              </Badge>
            </div>
          </div>

          {/* Budget row */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-400">Planned Budget</span>
            <span className="text-base font-bold text-white">
              {formatCurrency(trip.budget, trip.currency)}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 gap-2">
          <button
            onClick={() => setShowConfirm(true)}
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            title="Delete Trip"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <Link to={`/trips/${trip.id}`} className="flex-1">
            <Button
              variant={trip.has_itinerary ? 'primary' : 'secondary'}
              size="sm"
              className="w-full justify-center"
              rightIcon={trip.has_itinerary ? <ArrowRight className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            >
              {trip.has_itinerary ? 'View Itinerary' : 'Generate Itinerary'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Delete Trip?"
        description="This action cannot be undone. All day-by-day schedules and activities will be removed from local storage."
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete <strong className="text-white">"{trip.title}"</strong> ({trip.destination})?
          </p>
          <div className="flex items-center justify-end gap-3 pt-3">
            <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDelete}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Trip
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
