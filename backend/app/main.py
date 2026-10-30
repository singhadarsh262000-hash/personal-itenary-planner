import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.api.routes import health, trips, itineraries, activities

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("travel_planner")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Active Environment: {settings.ENVIRONMENT}")
    logger.info(f"Groq Model configured: {settings.GROQ_MODEL}")
    logger.info("Storage: In-Memory (Phase 1 Ephemeral Repository)")
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY.strip() in ("", "your_groq_api_key_here"):
        logger.warning("WARNING: GROQ_API_KEY is not set. Real AI generation will return 503 until key is added.")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Personalized Travel Itinerary Planner API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Centralized exception handling
register_exception_handlers(app)

# Include root health check
app.include_router(health.router)

# Include versioned API v1 routers
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(trips.router, prefix=settings.API_V1_PREFIX)
app.include_router(itineraries.router, prefix=settings.API_V1_PREFIX)
app.include_router(activities.router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.BACKEND_HOST, port=settings.BACKEND_PORT, reload=True)
