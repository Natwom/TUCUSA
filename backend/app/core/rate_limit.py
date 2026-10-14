import threading
import time
from collections import deque

from fastapi import HTTPException, Request

from app.core.security_events import get_client_ip, log_event


class SlidingWindowLimiter:
    """In-memory limiter (per process). Fine for a single Render instance."""

    def __init__(self):
        self._hits: dict[str, deque] = {}
        self._lock = threading.Lock()
        self._ops = 0

    def hit(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.monotonic()
        with self._lock:
            dq = self._hits.setdefault(key, deque())
            cutoff = now - window_seconds
            while dq and dq[0] <= cutoff:
                dq.popleft()
            if len(dq) >= limit:
                return False
            dq.append(now)
            self._ops += 1
            if self._ops % 5000 == 0:
                self._prune(now)
            return True

    def _prune(self, now: float):
        stale = [k for k, dq in self._hits.items() if not dq or dq[-1] < now - 3600]
        for k in stale:
            del self._hits[k]


limiter = SlidingWindowLimiter()


def rate_limit(name: str, limit: int, window_seconds: int):
    """FastAPI dependency: max `limit` calls per `window_seconds` per client IP."""

    def dependency(request: Request):
        ip = get_client_ip(request)
        if not limiter.hit(f"{name}:{ip}", limit, window_seconds):
            if limiter.hit(f"log:{name}:{ip}", 1, window_seconds):  # log once per window
                log_event("rate_limited", "warning", request, detail=f"{name}: {limit}/{window_seconds}s exceeded")
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please slow down and try again later.",
                headers={"Retry-After": str(window_seconds)},
            )

    return dependency