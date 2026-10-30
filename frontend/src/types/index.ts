export type TravelStyle =
  | 'Budget'
  | 'Comfort'
  | 'Luxury'
  | 'Adventure'
  | 'Cultural exploration'
  | 'Romantic getaway';

export type TravelPace = 'Relaxed' | 'Balanced' | 'Packed';

export type ActivityCategory =
  | 'Sightseeing'
  | 'Dining'
  | 'Transportation'
  | 'Accommodation'
  | 'Activity'
  | 'Culture'
  | 'Relaxation'
  | 'Nightlife'
  | 'Shopping'
  | 'Nature'
  | 'Other';

export type CostBasis = 'per_person' | 'per_group' | 'per_night' | 'total';

export type TripStatus = 'draft' | 'generating' | 'generated' | 'failed';

export interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  budget: number;
  currency: string;
  travelers: number;
  travel_style: TravelStyle;
  interests: string[];
  pace: TravelPace;
  accommodation_preference?: string;
  transportation_preference?: string;
  dietary_preferences?: string;
  additional_instructions?: string;
  status: TripStatus;
  has_itinerary: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripSummary {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  budget: number;
  currency: string;
  travelers: number;
  travel_style: TravelStyle;
  status: TripStatus;
  has_itinerary: boolean;
  created_at: string;
}

export interface CreateTripInput {
  title?: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  travelers: number;
  travel_style: TravelStyle;
  interests: string[];
  pace: TravelPace;
  accommodation_preference?: string;
  transportation_preference?: string;
  dietary_preferences?: string;
  additional_instructions?: string;
}

export interface UpdateTripInput {
  title?: string;
  budget?: number;
  currency?: string;
  travelers?: number;
  travel_style?: TravelStyle;
  interests?: string[];
  pace?: TravelPace;
  accommodation_preference?: string;
  transportation_preference?: string;
  dietary_preferences?: string;
  additional_instructions?: string;
}

export interface Activity {
  id: string;
  day_id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  start_time: string;
  end_time: string;
  estimated_duration_minutes: number;
  location_name: string;
  estimated_cost: number;
  currency: string;
  cost_basis: CostBasis;
  sort_order: number;
  notes?: string;
  verification_status: string;
}

export interface CreateActivityInput {
  name: string;
  description: string;
  category: ActivityCategory;
  start_time: string;
  end_time: string;
  estimated_duration_minutes: number;
  location_name: string;
  estimated_cost: number;
  currency: string;
  cost_basis: CostBasis;
  sort_order?: number;
  notes?: string;
}

export interface UpdateActivityInput {
  name?: string;
  description?: string;
  category?: ActivityCategory;
  start_time?: string;
  end_time?: string;
  estimated_duration_minutes?: number;
  location_name?: string;
  estimated_cost?: number;
  currency?: string;
  cost_basis?: CostBasis;
  sort_order?: number;
  notes?: string;
}

export interface CategoryBreakdown {
  category: string;
  estimated_cost: number;
  percentage_of_total: number;
  item_count: number;
}

export interface BudgetSummary {
  planned_budget: number;
  total_estimated_cost: number;
  currency: string;
  remaining_budget: number;
  is_over_budget: boolean;
  over_budget_amount: number;
  cost_per_traveler: number;
  traveler_count: number;
  trip_days: number;
  categories: Record<string, CategoryBreakdown>;
  warnings: string[];
  disclaimer: string;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  theme: string;
  notes?: string;
  accommodation_suggestion?: string;
  dining_suggestions: string[];
  transportation_suggestions: string[];
  activities: Activity[];
}

export interface Itinerary {
  id: string;
  trip_id: string;
  trip_title: string;
  destination: string;
  days: ItineraryDay[];
  budget_estimate: BudgetSummary;
  general_travel_tips: string[];
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
