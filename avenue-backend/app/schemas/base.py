from typing import Generic, TypeVar, Any
from pydantic import BaseModel

T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T | None = None
    error: Any | None = None
