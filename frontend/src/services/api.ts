import {
  Trip,
  TripSummary,
  CreateTripInput,
  UpdateTripInput,
  Itinerary,
  ItineraryDay,
  Activity,
  CreateActivityInput,
  UpdateActivityInput,
  ApiError
} from '../types';

/**
 * Resolves the backend API base URL cleanly:
 * - Checks import.meta.env.VITE_API_BASE_URL first.
 * - In production environments, falls back to the deployed Render backend if unset.
 * - In local dev (localhost), falls back to http://localhost:8000/api/v1.
 * - Strips any trailing slashes to prevent double slashes.
 * - Automatically ensures /api/v1 is present if missing from a domain URL.
 */
export function getApiBaseUrl(): string {
  let envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

  // Runtime safeguard: if running on a remote domain (e.g. Vercel), never use localhost
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0';

    if (!isLocalhost) {
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return 'https://personal-itinerary-planner-2.onrender.com/api/v1';
      }
    }
  }

  if (!envUrl) {
    if (import.meta.env.PROD) {
      return 'https://personal-itinerary-planner-2.onrender.com/api/v1';
    }
    return 'http://localhost:8000/api/v1';
  }

  // Remove trailing slashes
  envUrl = envUrl.replace(/\/+$/, '');

  // If the user provided the domain URL without /api/v1, append it cleanly
  if (!envUrl.endsWith('/api/v1') && !envUrl.includes('/api/')) {
    envUrl = `${envUrl}/api/v1`;
  }

  return envUrl;
}

export const API_BASE_URL = getApiBaseUrl();

function buildUrl(endpoint: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

export class ApiException extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'ApiException';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = buildUrl(endpoint);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      const errPayload = data?.error as ApiError | undefined;
      const message = errPayload?.message || `Request failed with status ${response.status}`;
      const code = errPayload?.code || `HTTP_${response.status}`;
      throw new ApiException(message, code, errPayload?.details);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    // Network or CORS errors
    const currentBase = getApiBaseUrl();
    throw new ApiException(
      `Unable to connect to the backend server (${currentBase}). Please verify the backend is online and CORS allows this origin.`,
      'NETWORK_ERROR'
    );
  }
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; version: string; ai_configured: boolean; storage: string }>('/health'),

  // Trips
  createTrip: (tripData: CreateTripInput) =>
    request<Trip>('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData),
    }),

  createSampleTrip: () =>
    request<Trip>('/trips/sample', {
      method: 'POST',
    }),

  listTrips: () => request<TripSummary[]>('/trips'),

  getTrip: (tripId: string) => request<Trip>(`/trips/${tripId}`),

  updateTrip: (tripId: string, tripData: UpdateTripInput) =>
    request<Trip>(`/trips/${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify(tripData),
    }),

  deleteTrip: (tripId: string) =>
    request<void>(`/trips/${tripId}`, {
      method: 'DELETE',
    }),

  // Itinerary & AI Generation
  generateItinerary: (tripId: string) =>
    request<Itinerary>(`/trips/${tripId}/generate`, {
      method: 'POST',
    }),

  getItinerary: (tripId: string) => request<Itinerary>(`/trips/${tripId}/itinerary`),

  regenerateItinerary: (tripId: string) =>
    request<Itinerary>(`/trips/${tripId}/regenerate`, {
      method: 'POST',
    }),

  regenerateDay: (dayId: string, additionalInstructions?: string) =>
    request<ItineraryDay>(`/itinerary-days/${dayId}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ additional_instructions: additionalInstructions }),
    }),

  // Activities
  addActivity: (dayId: string, activityData: CreateActivityInput) =>
    request<Activity>(`/itinerary-days/${dayId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activityData),
    }),

  updateActivity: (activityId: string, activityData: UpdateActivityInput) =>
    request<Activity>(`/activities/${activityId}`, {
      method: 'PATCH',
      body: JSON.stringify(activityData),
    }),

  deleteActivity: (activityId: string) =>
    request<void>(`/activities/${activityId}`, {
      method: 'DELETE',
    }),

  reorderActivities: (dayId: string, activityIds: string[]) =>
    request<Activity[]>(`/itinerary-days/${dayId}/activities/reorder`, {
      method: 'POST',
      body: JSON.stringify({ activity_ids: activityIds }),
    }),
};
