import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Compass,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Info,
  Clock,
  Heart,
  HelpCircle,
} from 'lucide-react';
import { TravelStyle, TravelPace, CreateTripInput } from '../../types';
import { Button } from '../ui/Button';

const AVAILABLE_STYLES: { value: TravelStyle; label: string; desc: string }[] = [
  { value: 'Budget', label: 'Budget', desc: 'Hostels, public transit, street food' },
  { value: 'Comfort', label: 'Comfort', desc: 'Boutique hotels, casual dining, balanced pace' },
  { value: 'Luxury', label: 'Luxury', desc: '5-star lodging, fine dining, private transfers' },
  { value: 'Adventure', label: 'Adventure', desc: 'Active hiking, nature excursions, outdoors' },
  { value: 'Cultural exploration', label: 'Cultural Exploration', desc: 'Museums, historic landmarks, local arts' },
  { value: 'Romantic getaway', label: 'Romantic Getaway', desc: 'Intimate dinners, scenic vistas, relaxed pace' },
];

const AVAILABLE_PACES: { value: TravelPace; label: string; desc: string }[] = [
  { value: 'Relaxed', label: 'Relaxed', desc: '2–3 activities/day. Lots of free time & cafe visits' },
  { value: 'Balanced', label: 'Balanced', desc: '3–4 activities/day. Great mix of highlights and rest' },
  { value: 'Packed', label: 'Packed', desc: '4–6 activities/day. Maximize sightseeing from dawn to night' },
];

const AVAILABLE_INTERESTS = [
  'Historical places',
  'Food & Gastronomy',
  'Museums & Galleries',
  'Nature & Parks',
  'Local culture',
  'Beaches & Coastal',
  'Architecture',
  'Shopping',
  'Photography spots',
  'Nightlife & Bars',
  'Adventure sports',
  'Family-friendly activities',
];

const POPULAR_DESTINATIONS = [
  'Tokyo, Japan',
  'Paris, France',
  'Rome, Italy',
  'Kyoto, Japan',
  'Barcelona, Spain',
  'New York City, USA',
  'Bali, Indonesia',
  'London, UK',
  'Swiss Alps, Switzerland',
];

const tripFormSchema = z
  .object({
    destination: z.string().min(2, 'Please enter a valid destination city or region.'),
    title: z.string().max(150).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please pick a valid start date.'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Please pick a valid end date.'),
    budget: z.coerce.number().positive('Budget must be greater than zero.'),
    currency: z.string().min(3).max(5),
    travelers: z.coerce.number().int().min(1, 'At least 1 traveler is required.').max(20, 'Max 20 travelers.'),
    travel_style: z.enum([
      'Budget',
      'Comfort',
      'Luxury',
      'Adventure',
      'Cultural exploration',
      'Romantic getaway',
    ]),
    pace: z.enum(['Relaxed', 'Balanced', 'Packed']),
    interests: z.array(z.string()).min(1, 'Select at least 1 interest to personalize the plan.'),
    accommodation_preference: z.string().max(200).optional(),
    transportation_preference: z.string().max(200).optional(),
    dietary_preferences: z.string().max(200).optional(),
    additional_instructions: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    },
    {
      message: 'End date must be on or after start date.',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diffDays <= 14;
    },
    {
      message: 'Maximum supported duration is 14 days to ensure AI schedule quality.',
      path: ['end_date'],
    }
  );

type TripFormData = z.infer<typeof tripFormSchema>;

interface TripBuilderFormProps {
  onSubmit: (data: CreateTripInput) => Promise<void>;
  isLoading: boolean;
}

export const TripBuilderForm: React.FC<TripBuilderFormProps> = ({ onSubmit, isLoading }) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  // Set default dates: 14 days from now for 5 days
  const defaultStartDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const defaultEndDate = new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      destination: '',
      title: '',
      start_date: defaultStartDate,
      end_date: defaultEndDate,
      budget: 1500,
      currency: 'USD',
      travelers: 2,
      travel_style: 'Comfort',
      pace: 'Balanced',
      interests: ['Historical places', 'Food & Gastronomy', 'Local culture'],
      accommodation_preference: '',
      transportation_preference: '',
      dietary_preferences: '',
      additional_instructions: '',
    },
  });

  const selectedInterests = watch('interests') || [];
  const watchedStyle = watch('travel_style');
  const watchedPace = watch('pace');
  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  // Compute duration in days
  let durationDays = 1;
  if (watchedStartDate && watchedEndDate) {
    const s = new Date(watchedStartDate);
    const e = new Date(watchedEndDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
      durationDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
  }

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setValue(
        'interests',
        selectedInterests.filter((i) => i !== interest),
        { shouldValidate: true }
      );
    } else {
      setValue('interests', [...selectedInterests, interest], { shouldValidate: true });
    }
  };

  const handleFormSubmit = async (data: TripFormData) => {
    const input: CreateTripInput = {
      destination: data.destination,
      title: data.title || `${data.destination} Adventure`,
      start_date: data.start_date,
      end_date: data.end_date,
      budget: Number(data.budget),
      currency: data.currency,
      travelers: Number(data.travelers),
      travel_style: data.travel_style,
      pace: data.pace,
      interests: data.interests,
      accommodation_preference: data.accommodation_preference || undefined,
      transportation_preference: data.transportation_preference || undefined,
      dietary_preferences: data.dietary_preferences || undefined,
      additional_instructions: data.additional_instructions || undefined,
    };
    await onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Steps indicator */}
      <div className="flex items-center justify-between max-w-2xl mx-auto px-2">
        {[
          { step: 1, label: 'Destination & Dates' },
          { step: 2, label: 'Budget & Travelers' },
          { step: 3, label: 'Style & Interests' },
          { step: 4, label: 'Preferences & Review' },
        ].map((s) => (
          <button
            key={s.step}
            type="button"
            onClick={() => setActiveStep(s.step)}
            className="flex flex-col items-center group focus:outline-none"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                activeStep === s.step
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
                  : activeStep > s.step
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {activeStep > s.step ? <Check className="w-4 h-4 stroke-[3]" /> : s.step}
            </div>
            <span
              className={`text-[11px] mt-1.5 hidden sm:block font-medium ${
                activeStep === s.step ? 'text-amber-300 font-semibold' : 'text-slate-400'
              }`}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>

      {/* STEP 1: Destination & Dates */}
      {activeStep === 1 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Where and when do you want to travel?</h2>
            <p className="text-xs text-slate-400">Select your destination and travel window.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Destination City or Region *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-amber-400" />
              <input
                type="text"
                placeholder="e.g. Kyoto, Japan or Florence, Italy"
                {...register('destination')}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            {errors.destination && (
              <p className="text-xs text-rose-400 mt-1.5">{errors.destination.message}</p>
            )}

            {/* Quick destination suggestion pills */}
            <div className="mt-3 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-slate-500 mr-1">Popular:</span>
              {POPULAR_DESTINATIONS.slice(0, 6).map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => setValue('destination', dest, { shouldValidate: true })}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-colors"
                >
                  {dest}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  {...register('start_date')}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              {errors.start_date && (
                <p className="text-xs text-rose-400 mt-1.5">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                End Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  {...register('end_date')}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              {errors.end_date && (
                <p className="text-xs text-rose-400 mt-1.5">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Duration info callout */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Calculated Trip Duration:
            </span>
            <span className="font-bold text-amber-300 text-sm">
              {durationDays} {durationDays === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Optional Trip Title
            </label>
            <input
              type="text"
              placeholder="e.g. Summer in Tokyo with Friends"
              {...register('title')}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setActiveStep(2)}
            >
              Continue to Budget
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Budget & Travelers */}
      {activeStep === 2 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Set your budget & traveler count</h2>
            <p className="text-xs text-slate-400">
              The AI will recommend activities and accommodations calibrated to this total budget.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Total Planned Budget *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="any"
                  min="1"
                  placeholder="2000"
                  {...register('budget')}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              {errors.budget && (
                <p className="text-xs text-rose-400 mt-1.5">{errors.budget.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Currency
              </label>
              <select
                {...register('currency')}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Number of Travelers *
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setValue('travelers', num, { shouldValidate: true })}
                  className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    watch('travelers') === num
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {num} {num === 1 ? 'Solo' : num === 2 ? 'Couple' : 'People'}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-slate-400">Custom count:</span>
              <input
                type="number"
                min="1"
                max="20"
                {...register('travelers')}
                className="w-24 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            {errors.travelers && (
              <p className="text-xs text-rose-400 mt-1.5">{errors.travelers.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setActiveStep(1)}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setActiveStep(3)}
            >
              Continue to Style
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Style & Interests */}
      {activeStep === 3 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Travel style & your interests</h2>
            <p className="text-xs text-slate-400">
              Customize the vibe and activities suited to your personal tastes.
            </p>
          </div>

          {/* Travel Style Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
              Travel Style *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AVAILABLE_STYLES.map((style) => (
                <div
                  key={style.value}
                  onClick={() => setValue('travel_style', style.value)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    watchedStyle === style.value
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{style.label}</span>
                    {watchedStyle === style.value && (
                      <Check className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{style.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Travel Pace Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
              Preferred Pace *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AVAILABLE_PACES.map((pace) => (
                <div
                  key={pace.value}
                  onClick={() => setValue('pace', pace.value)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    watchedPace === pace.value
                      ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{pace.label}</span>
                    {watchedPace === pace.value && (
                      <Check className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{pace.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interests Multi-Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
              Your Interests (Select all that apply) *
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-semibold border-amber-400 shadow-sm'
                        : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
            {errors.interests && (
              <p className="text-xs text-rose-400 mt-1.5">{errors.interests.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setActiveStep(2)}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setActiveStep(4)}
            >
              Continue to Preferences
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Preferences & Review */}
      {activeStep === 4 && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Logistics & Special Requests</h2>
            <p className="text-xs text-slate-400">
              Fine-tune lodging, transportation, dietary needs, or must-see landmarks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Accommodation Preference
              </label>
              <input
                type="text"
                placeholder="e.g. Boutique hotel near metro, Ryokan, Airbnb"
                {...register('accommodation_preference')}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
                Transportation Preference
              </label>
              <input
                type="text"
                placeholder="e.g. Public transit, walking, rental car"
                {...register('transportation_preference')}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Dietary Restrictions & Dining Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Vegetarian, Halal, no shellfish, love street food markets"
              {...register('dietary_preferences')}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2">
              Additional Instructions or Specific Attractions
            </label>
            <textarea
              rows={3}
              placeholder="e.g. We definitely want to visit TeamLab Planets on Day 2, and prefer a relaxed morning on the last day."
              {...register('additional_instructions')}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Review Summary Card */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-200 space-y-2">
            <h4 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Ready to Generate
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div>
                <span className="text-slate-400 block">Destination:</span>
                <span className="font-semibold text-white">{watch('destination') || 'Not set'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Duration:</span>
                <span className="font-semibold text-white">{durationDays} days</span>
              </div>
              <div>
                <span className="text-slate-400 block">Budget:</span>
                <span className="font-semibold text-white">{watch('currency')} {watch('budget')}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Travelers:</span>
                <span className="font-semibold text-white">{watch('travelers')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => setActiveStep(3)}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              leftIcon={<Sparkles className="w-5 h-5 text-slate-950" />}
            >
              Generate Itinerary with AI
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};
