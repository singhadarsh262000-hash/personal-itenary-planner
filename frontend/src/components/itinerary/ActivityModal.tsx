import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Activity,
  ActivityCategory,
  CostBasis,
  CreateActivityInput,
  UpdateActivityInput,
} from '../../types';

const activitySchema = z
  .object({
    name: z.string().min(1, 'Activity name is required').max(120),
    description: z.string().min(1, 'Description is required').max(1000),
    category: z.enum([
      'Sightseeing',
      'Dining',
      'Transportation',
      'Accommodation',
      'Activity',
      'Culture',
      'Relaxation',
      'Nightlife',
      'Shopping',
      'Nature',
      'Other',
    ]),
    start_time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use 24h format HH:MM (e.g. 09:30)'),
    end_time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use 24h format HH:MM (e.g. 11:30)'),
    estimated_duration_minutes: z.coerce.number().min(5).max(1440),
    location_name: z.string().min(1, 'Location name is required').max(150),
    estimated_cost: z.coerce.number().min(0, 'Cost must be 0 or greater'),
    currency: z.string().min(3).max(5),
    cost_basis: z.enum(['per_person', 'per_group', 'per_night', 'total']),
    notes: z.string().max(500).optional(),
  });

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayId: string;
  activityToEdit?: Activity | null;
  currency: string;
  onSave: (data: CreateActivityInput | UpdateActivityInput, isEdit: boolean) => Promise<void>;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  activityToEdit,
  currency,
  onSave,
}) => {
  const isEdit = !!activityToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'Sightseeing',
      start_time: '10:00',
      end_time: '12:00',
      estimated_duration_minutes: 120,
      location_name: '',
      estimated_cost: 0,
      currency: currency || 'USD',
      cost_basis: 'per_person',
      notes: '',
    },
  });

  useEffect(() => {
    if (activityToEdit) {
      reset({
        name: activityToEdit.name,
        description: activityToEdit.description,
        category: activityToEdit.category,
        start_time: activityToEdit.start_time,
        end_time: activityToEdit.end_time,
        estimated_duration_minutes: activityToEdit.estimated_duration_minutes,
        location_name: activityToEdit.location_name,
        estimated_cost: activityToEdit.estimated_cost,
        currency: activityToEdit.currency || currency || 'USD',
        cost_basis: activityToEdit.cost_basis,
        notes: activityToEdit.notes || '',
      });
    } else {
      reset({
        name: '',
        description: '',
        category: 'Sightseeing',
        start_time: '10:00',
        end_time: '12:00',
        estimated_duration_minutes: 120,
        location_name: '',
        estimated_cost: 0,
        currency: currency || 'USD',
        cost_basis: 'per_person',
        notes: '',
      });
    }
  }, [activityToEdit, currency, reset, isOpen]);

  const onSubmit = async (data: ActivityFormData) => {
    await onSave(data, isEdit);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Activity' : 'Add New Activity'}
      description="Changes are saved and immediately reflected in authoritative budget calculations."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Activity Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Visit Senso-ji Temple"
            {...register('name')}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <select
              {...register('category')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Sightseeing">Sightseeing</option>
              <option value="Dining">Dining</option>
              <option value="Transportation">Transportation</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Activity">Activity</option>
              <option value="Culture">Culture</option>
              <option value="Relaxation">Relaxation</option>
              <option value="Nightlife">Nightlife</option>
              <option value="Shopping">Shopping</option>
              <option value="Nature">Nature</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Location / Venue *
            </label>
            <input
              type="text"
              placeholder="e.g. Asakusa, Tokyo"
              {...register('location_name')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {errors.location_name && (
              <p className="text-xs text-rose-400 mt-1">{errors.location_name.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Start Time *
            </label>
            <input
              type="text"
              placeholder="09:00"
              {...register('start_time')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            {errors.start_time && (
              <p className="text-xs text-rose-400 mt-1">{errors.start_time.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              End Time *
            </label>
            <input
              type="text"
              placeholder="11:30"
              {...register('end_time')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            {errors.end_time && (
              <p className="text-xs text-rose-400 mt-1">{errors.end_time.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Duration (mins)
            </label>
            <input
              type="number"
              min="5"
              max="1440"
              {...register('estimated_duration_minutes')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Estimated Cost ({currency})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              {...register('estimated_cost')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            {errors.estimated_cost && (
              <p className="text-xs text-rose-400 mt-1">{errors.estimated_cost.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Cost Basis
            </label>
            <select
              {...register('cost_basis')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="per_person">Per Person (multiplied by travelers)</option>
              <option value="per_group">Per Group (shared flat cost)</option>
              <option value="per_night">Per Night (for accommodations)</option>
              <option value="total">Total flat amount</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Description *
          </label>
          <textarea
            rows={2}
            placeholder="Details about what to do, see, and experience..."
            {...register('description')}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          {errors.description && (
            <p className="text-xs text-rose-400 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Optional Notes & Tips
          </label>
          <input
            type="text"
            placeholder="e.g. Booking in advance required, bring camera"
            {...register('notes')}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Activity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
