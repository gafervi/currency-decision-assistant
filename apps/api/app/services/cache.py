from __future__ import annotations

from dataclasses import dataclass
from time import time
from typing import Callable, Generic, TypeVar


T = TypeVar("T")


@dataclass
class CacheEntry(Generic[T]):
    value: T
    expires_at: float


class TimedCache(Generic[T]):
    def __init__(self, ttl_seconds: int) -> None:
        self.ttl_seconds = ttl_seconds
        self.entry: CacheEntry[T] | None = None

    def get_or_set(self, loader: Callable[[], T]) -> T:
        now = time()
        if self.entry and self.entry.expires_at > now:
            return self.entry.value

        value = loader()
        self.entry = CacheEntry(value=value, expires_at=now + self.ttl_seconds)
        return value

    def clear(self) -> None:
        self.entry = None
