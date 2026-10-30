from typing import Any, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base application exception."""
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Any] = None
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class ResourceNotFoundException(AppException):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource} with ID '{resource_id}' was not found.",
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND
        )


class AIProviderException(AppException):
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="AI_PROVIDER_ERROR",
            status_code=status.HTTP_502_BAD_GATEWAY,
            details=details
        )


class AIConfigurationException(AppException):
    def __init__(self, message: str = "Groq API key is not configured. Please add a valid GROQ_API_KEY in backend/.env"):
        super().__init__(
            message=message,
            code="AI_CONFIG_ERROR",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


class InvalidTripException(AppException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            code="INVALID_TRIP_DATA",
            status_code=status.HTTP_400_BAD_REQUEST
        )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        logger.warning(f"AppException: {exc.code} - {exc.message} (Path: {request.url.path})")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.info(f"RequestValidationError at {request.url.path}: {exc.errors()}")
        formatted_errors = []
        for err in exc.errors():
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            formatted_errors.append({
                "field": loc,
                "message": err.get("msg", "Invalid input"),
                "type": err.get("type", "")
            })
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "The request payload failed validation.",
                    "details": formatted_errors,
                }
            }
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled error occurred at {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected internal server error occurred. Please try again later.",
                    "details": None,
                }
            }
        )
