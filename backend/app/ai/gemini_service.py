"""Deprecated compatibility module. Use app.ai.groq_service.GroqService instead."""
import warnings
from app.ai.groq_service import GroqService

# Alias for backwards compatibility
GeminiService = GroqService

warnings.warn(
    "app.ai.gemini_service is deprecated. Use app.ai.groq_service.GroqService instead.",
    DeprecationWarning,
    stacklevel=2,
)

__all__ = ["GeminiService", "GroqService"]
