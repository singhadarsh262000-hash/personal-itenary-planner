# System Architecture: Personalized Travel Itinerary Planner

## 1. High-Level Overview

The **Personalized Travel Itinerary Planner** is designed as a modular, decoupled full-stack application. It separates presentation, API routing, business domain logic, AI generation, and persistence through clean abstractions.

```
+------------------------------------------------------------------+
|                          REACT FRONTEND                          |
|  (Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Zod)   |
+---------------------------------+--------------------------------+
                                  |
                                  | HTTP REST API (JSON)
                                  v
+---------------------------------+--------------------------------+
|                         FASTAPI BACKEND                          |
|  - API Routing (/api/v1)                                         |
|  - Request & Response Pydantic Validation                        |
|  - Centralized Exception Handling & CORS Middleware              |
+---------------------------------+--------------------------------+
                                  |
         +------------------------+------------------------+
         |                                                 |
         v                                                 v
+--------+----------------+                       +--------+---------------+
|      TRIP SERVICES      |                       |     GROQ AI SERVICE    |
| - Trip Orchestration    |                       | - Prompt Builder       |
| - Itinerary Management  |                       | - Structured Output    |
| - Activity Ordering     |                       | - Schema Enforcement   |
| - Deterministic Budget  |                       | - Validation & Repair  |
|   Calculation Engine    |                       | - Bounded Retries      |
+--------+----------------+                       +------------------------+
         |
         v
+--------+----------------+
|  REPOSITORY INTERFACES  |
| - TripRepository        |
| - ItineraryRepository   |
+--------+----------------+
         |
         v
+--------+---------------------------------------+
|        STORAGE IMPLEMENTATION                  |
| - Phase 1: InMemoryTripRepository             |
|   (Thread-synchronized, in-process store)     |
| - Future: SupabasePostgresTripRepository       |
|   (PostgreSQL + Supabase Auth + RLS)           |
+------------------------------------------------+
```

---

## 2. Component Responsibilities

### 2.1 React Frontend
- **State & Form Management**: Uses React Hook Form with Zod schema validation to ensure invalid requests (negative budgets, reversed dates, excessive durations) are blocked on the client before touching the wire.
- **Visual Presentation**: Modern SaaS design system with accessible cards, timeline views, category tagging, responsive grid/flex layouts, and comprehensive loading/error states.
- **Budget Data Visualization**: Renders backend-authoritative budget statistics using interactive Recharts components (category breakdowns, variance warnings, cost per traveler).
- **API Client**: Centralized, typed HTTP client consuming `/api/v1` endpoints with standard error handling and cancellation support.

### 2.2 FastAPI Backend
- **Core Configuration**: Pydantic Settings reads from environment variables (`GROQ_API_KEY`, `GROQ_MODEL`, `CORS_ORIGINS`, etc.).
- **Data Contracts**: Pydantic v2 schemas for all requests, responses, internal models, and AI output validation.
- **Budget Calculation Engine**: Authoritative Python calculation service handling multiple cost bases (`per_person`, `per_group`, `per_night`, `total`), calculating category subtotals, per-traveler averages, and variance against planned budgets.
- **AI Integration**: Dedicated `GroqService` using Groq's official Python SDK (`groq`). Uses strict system prompts and structured output schemas (`json_schema` / `json_object`) to enforce predictable JSON responses with validation repair mechanisms.

### 2.3 Repository Abstraction & Storage Strategy
- Interfaces `TripRepository` and `ItineraryRepository` define contracts for CRUD operations.
- Phase 1 implementation uses `InMemoryTripRepository` and `InMemoryItineraryRepository` protected by thread locks (`asyncio.Lock` / `threading.Lock`).
- **Phase 1 Limitation**: Data in memory is volatile and does not survive server restarts. It serves as a local single-user development prototype.

---

## 3. Future Supabase Integration Strategy

The architecture is deliberately pre-factored for seamless integration with Supabase:

1. **Repository Swapping**:
   - Create `SupabaseTripRepository` implementing `TripRepository`.
   - Create `SupabaseItineraryRepository` implementing `ItineraryRepository`.
   - Update dependency injection in FastAPI route handlers to inject the Supabase repositories based on configuration (`STORAGE_BACKEND=supabase`).
2. **Database Schema**:
   - `profiles` table: linked to `auth.users` (`id`, `email`, `created_at`).
   - `trips` table: `id`, `user_id` (FK to profiles), `title`, `destination`, `start_date`, `end_date`, `budget`, `currency`, `travelers`, `preferences_json`, `created_at`, `updated_at`.
   - `itinerary_days` table: `id`, `trip_id` (FK to trips ON DELETE CASCADE), `day_number`, `date`, `theme`, `notes`.
   - `activities` table: `id`, `day_id` (FK to itinerary_days ON DELETE CASCADE), `name`, `description`, `category`, `start_time`, `end_time`, `duration_minutes`, `location_name`, `estimated_cost`, `currency`, `cost_basis`, `sort_order`.
3. **Security (Row Level Security)**:
   - Enable RLS on all tables: `ALTER TABLE trips ENABLE ROW LEVEL SECURITY;`
   - Policies ensuring `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE.
4. **Authentication Flow**:
   - Supabase Auth on Frontend providing JWT Bearer token in HTTP `Authorization` header.
   - FastAPI dependency `get_current_user` validating Supabase JWT and extracting `user_id`.
