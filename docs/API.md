# API Documentation: Personalized Travel Itinerary Planner

Base URL: `/api/v1`

---

## 1. Standard Error Format

All error responses return a standardized JSON structure:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Trip with ID '550e8400-e29b-41d4-a716-446655440000' not found",
    "details": null
  }
}
```

Standard Status Codes:
- `200 OK`: Operation succeeded.
- `201 Created`: Resource successfully created.
- `204 No Content`: Resource successfully deleted.
- `400 Bad Request`: Validation or semantic constraint failure.
- `404 Not Found`: Target resource does not exist.
- `422 Unprocessable Entity`: Request body schema validation error.
- `502 Bad Gateway`: External AI provider (Groq) error or failure.
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Health Endpoints

### `GET /health` and `GET /api/v1/health`
Checks backend service availability and configuration status.

**Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "ai_configured": true,
  "storage": "in_memory"
}
```

---

## 3. Trip Management Endpoints

### `POST /api/v1/trips`
Creates a new trip request.

**Request Body**:
```json
{
  "title": "Summer in Tokyo",
  "destination": "Tokyo, Japan",
  "start_date": "2026-07-01",
  "end_date": "2026-07-07",
  "budget": 2500.0,
  "currency": "USD",
  "travelers": 2,
  "travel_style": "Comfort",
  "interests": ["Food", "Historical places", "Local culture"],
  "pace": "Balanced",
  "accommodation_preference": "Boutique hotel near transit",
  "transportation_preference": "Public transit & walking",
  "dietary_preferences": "No shellfish",
  "additional_instructions": "Include Tsukiji outer market and TeamLab"
}
```

**Response `201 Created`**:
```json
{
  "id": "c1f1a4a2-97b7-4e9e-b9ef-d49d9cb301bc",
  "title": "Summer in Tokyo",
  "destination": "Tokyo, Japan",
  "start_date": "2026-07-01",
  "end_date": "2026-07-07",
  "duration_days": 7,
  "budget": 2500.0,
  "currency": "USD",
  "travelers": 2,
  "travel_style": "Comfort",
  "interests": ["Food", "Historical places", "Local culture"],
  "pace": "Balanced",
  "accommodation_preference": "Boutique hotel near transit",
  "transportation_preference": "Public transit & walking",
  "dietary_preferences": "No shellfish",
  "additional_instructions": "Include Tsukiji outer market and TeamLab",
  "status": "draft",
  "created_at": "2026-10-25T00:00:00Z",
  "updated_at": "2026-10-25T00:00:00Z"
}
```

---

### `GET /api/v1/trips`
Retrieves all trips in the local repository scope.

**Response `200 OK`**:
```json
[
  {
    "id": "c1f1a4a2-97b7-4e9e-b9ef-d49d9cb301bc",
    "title": "Summer in Tokyo",
    "destination": "Tokyo, Japan",
    "start_date": "2026-07-01",
    "end_date": "2026-07-07",
    "duration_days": 7,
    "budget": 2500.0,
    "currency": "USD",
    "travelers": 2,
    "travel_style": "Comfort",
    "status": "generated",
    "has_itinerary": true,
    "created_at": "2026-10-25T00:00:00Z"
  }
]
```

---

### `GET /api/v1/trips/{trip_id}`
Retrieves full details of a specific trip.

---

### `PATCH /api/v1/trips/{trip_id}`
Updates editable trip preferences (budget, title, travelers, pace, etc.).

---

### `DELETE /api/v1/trips/{trip_id}`
Deletes the trip and its associated itinerary from storage.

**Response `204 No Content`**

---

## 4. Itinerary & AI Generation Endpoints

### `POST /api/v1/trips/{trip_id}/generate`
Invokes the Gemini AI Service to generate a full day-by-day itinerary based on the trip's parameters.

**Response `200 OK`**:
Full Itinerary Response with authoritative budget calculation.

---

### `GET /api/v1/trips/{trip_id}/itinerary`
Retrieves the saved itinerary for the specified trip.

---

### `POST /api/v1/trips/{trip_id}/regenerate`
Regenerates the complete itinerary from scratch while preserving trip preferences.

---

### `POST /api/v1/itinerary-days/{day_id}/regenerate`
Regenerates an individual day of the itinerary. Preserves other days, dates, budget balance, and preferences.

---

## 5. Activity Management Endpoints

### `POST /api/v1/itinerary-days/{day_id}/activities`
Adds a new activity to an existing day.

**Request Body**:
```json
{
  "name": "Evening Ramen Tasting",
  "description": "Visit a renowned ramen shop in Shinjuku",
  "category": "Dining",
  "start_time": "19:00",
  "end_time": "20:30",
  "estimated_duration_minutes": 90,
  "location_name": "Shinjuku Golden Gai",
  "estimated_cost": 25.0,
  "currency": "USD",
  "cost_basis": "per_person"
}
```

---

### `PATCH /api/v1/activities/{activity_id}`
Updates activity details (name, description, timing, cost, category).

---

### `DELETE /api/v1/activities/{activity_id}`
Deletes the specified activity. Triggers itinerary budget recalculation.

---

### `POST /api/v1/itinerary-days/{day_id}/activities/reorder`
Reorders activities within a day.

**Request Body**:
```json
{
  "activity_ids": [
    "uuid-2",
    "uuid-1",
    "uuid-3"
  ]
}
```
