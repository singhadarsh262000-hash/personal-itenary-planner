# Personalized Travel Itinerary Planner 🌍✈️

An AI-powered web application that generates personalized, day-by-day travel itineraries based on destination, travel dates, budget, travel style, interests, accommodation preferences, and dietary restrictions.

Built with a **FastAPI (Python)** backend, **React (TypeScript + Vite + Tailwind CSS)** frontend, and powered by the **Groq API** for high-speed, structured itinerary generation.

---

## 🚀 Key Features

- **Personalized Day-by-Day Itineraries**: Intelligent AI generation considering travel pace, dining preferences, traveler count, and interests.
- **Deterministic Budget Engine**: Authoritative backend calculations supporting varied cost bases (`per_person`, `per_group`, `per_night`, `total`) across categories (Accommodation, Food, Transportation, Activities, Miscellaneous).
- **Interactive Itinerary Viewer & Timeline**: Morning, afternoon, and evening groupings with time badges, location labels, and category icons.
- **Full Activity Customization**: Add, edit, delete, and reorder activities with backend state persistence.
- **Granular AI Regeneration**: Regenerate the entire trip or iterate on a single day without losing the rest of your itinerary.
- **Visual Budget Analytics**: Charts comparing estimated expenses to planned budget with variance warnings and per-traveler breakdowns.
- **Storage Abstraction**: Clean repository interface pattern allowing drop-in database replacement in the future.

> [!NOTE]  
> **Phase 1 Storage**: Uses an in-memory repository for local development. Data is ephemeral and resets when the backend server restarts.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router, React Hook Form, Zod, Recharts.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic v2, Pydantic Settings, HTTPX, Pytest.
- **AI Integration**: Groq API via official Python SDK (`groq`) using structured outputs (`json_schema` / `json_object`).

---

## 📂 Project Structure

```
personalized-itinerary-planner/
├── frontend/                     # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/           # UI components (dashboard, itinerary, budget, etc.)
│   │   ├── pages/                # Landing, Dashboard, TripBuilder, TripDetail
│   │   ├── services/             # Typed API client
│   │   ├── types/                # TypeScript interfaces
│   │   └── App.tsx
│   ├── .env.example
│   └── package.json
├── backend/                      # FastAPI Python backend
│   ├── app/
│   │   ├── ai/                   # Groq API client & prompt builder
│   │   ├── api/routes/           # FastAPI versioned route handlers (/api/v1)
│   │   ├── core/                 # Configuration & error handlers
│   │   ├── models/               # Domain models
│   │   ├── repositories/         # Abstract & In-Memory repository implementations
│   │   ├── schemas/              # Pydantic v2 schemas
│   │   ├── services/             # Business logic & deterministic budget engine
│   │   └── main.py
│   ├── tests/                    # pytest automated test suite
│   ├── .env.example
│   └── requirements.txt
├── docs/                         # Architecture, API & Status documentation
└── README.md
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher
- **Groq API Key**: Obtain a key from the [Groq Console](https://console.groq.com/)

### 2. Backend Setup

```powershell
cd backend

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and set:
# GROQ_API_KEY=your_groq_api_key_here
# GROQ_MODEL=openai/gpt-oss-120b

# Start backend server
uvicorn app.main:app --reload --port 8000
```

Backend will be accessible at:
- API Root: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 3. Frontend Setup

```powershell
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start development server
npm run dev
```

Frontend will run at: `http://localhost:5173`

---

## 🧪 Running Tests

### Backend Unit & Integration Tests
```powershell
cd backend
pytest -v
```
*(All tests use mocked Groq responses so no live API calls or API keys are required to execute the test suite).*

---

## 🗺️ Future Database Integration (Supabase)
See [`docs/ARCHITECTURE.md`](file:///c:/Users/Aviral/Desktop/personal-iternary-planner/docs/ARCHITECTURE.md) for details on swapping the `InMemoryTripRepository` with `SupabaseTripRepository` backed by Supabase Auth and PostgreSQL Row-Level Security.
