from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def create_error_response(status_code: int, message: str, details: dict | None = None) -> dict:
    payload = {"success": False, "error": {"message": message}}
    if details:
        payload["error"]["details"] = details  # type: ignore
    return payload


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({"field": ".".join(str(loc) for loc in error["loc"]), "message": error["msg"]})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=create_error_response("Validation error", "Invalid request body.", {"errors": errors}),
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(exc.status_code, exc.detail),
    )


async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=create_error_response(500, "An unexpected internal error occurred. Our team has been notified."),
    )


# ── Custom Exception Classes ──────────────────────────────────────────────────
class AvenueException(HTTPException):
    """Base exception for Avenue-specific errors."""
    def __init__(self, status_code: int, message: str):
        super().__init__(status_code=status_code, detail=message)


class NotFoundError(AvenueException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(status_code=404, message=f"{resource} not found.")


class ConflictError(AvenueException):
    def __init__(self, message: str = "Resource already exists."):
        super().__init__(status_code=409, message=message)


class ForbiddenError(AvenueException):
    def __init__(self, message: str = "You do not have permission to access this resource."):
        super().__init__(status_code=403, message=message)


class BadRequestError(AvenueException):
    def __init__(self, message: str):
        super().__init__(status_code=400, message=message)
