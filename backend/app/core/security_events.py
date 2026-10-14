"""
Security event logging, brute-force lockout and email alerts.
Uses its own DB sessions so logging never interferes with a request's transaction.
"""
import json
import logging
import threading
import time
import urllib.request
from datetime import datetime, timedelta, timezone

from fastapi import Request
from sqlalchemy import func

from app.core.config import settings
from app.database import SessionLocal
from app import models

logger = logging.getLogger("tucusa.security")

LOGIN_FAIL_EVENTS = ("login_failed", "admin_login_failed")

# Alert on the first occurrence (once per cooldown per email/IP)
IMMEDIATE_ALERTS = {
    "admin_login_success": "Admin login",
    "admin_access_denied": "Non-admin tried to reach an ADMIN endpoint",
    "token_role_mismatch": "Token role does not match database (possible forged token)",
    "login_blocked": "Login attempts blocked by lockout (possible brute force)",
    "election_deleted": "Election deleted",
    "candidate_deleted": "Candidate deleted",
    "integrity_mismatch": "Vote count integrity mismatch (possible database tampering)",
}

# Alert when `count` events from one IP happen within `minutes`
THRESHOLD_ALERTS = {
    "login_failed": (5, 10, "Repeated failed voter logins"),
    "admin_login_failed": (3, 10, "Repeated failed ADMIN logins"),
    "invalid_token": (5, 10, "Forged or malformed tokens"),
    "duplicate_vote_attempt": (2, 30, "Repeated duplicate vote attempts"),
    "vote_denied": (3, 10, "Repeated unauthorised vote attempts"),
    "rate_limited": (3, 10, "Rate limit repeatedly exceeded"),
    "upload_rejected": (3, 10, "Repeated invalid/malicious uploads"),
}

_alert_lock = threading.Lock()
_last_alert: dict[str, float] = {}


def get_client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        parts = [p.strip() for p in xff.split(",") if p.strip()]
        if parts:
            hops = max(settings.TRUSTED_PROXY_HOPS, 1)
            return parts[-hops] if len(parts) >= hops else parts[0]
    return request.client.host if request.client else "unknown"


def _utcnow():
    return datetime.now(timezone.utc)


def count_recent(event_types, minutes: int, ip: str | None = None, email: str | None = None) -> int:
    since = _utcnow() - timedelta(minutes=minutes)
    with SessionLocal() as s:
        q = s.query(func.count(models.SecurityEvent.id)).filter(
            models.SecurityEvent.event_type.in_(list(event_types)),
            models.SecurityEvent.created_at >= since,
        )
        if ip:
            q = q.filter(models.SecurityEvent.ip == ip)
        if email:
            q = q.filter(models.SecurityEvent.email == email)
        return q.scalar() or 0


def is_locked_out(request: Request, email: str) -> bool:
    ip = get_client_ip(request)
    email = email.lower()
    w = settings.LOCKOUT_WINDOW_MINUTES
    try:
        if count_recent(LOGIN_FAIL_EVENTS, w, ip=ip, email=email) >= settings.MAX_FAILED_PER_ACCOUNT_AND_IP:
            return True
        if count_recent(LOGIN_FAIL_EVENTS, w, email=email) >= settings.MAX_FAILED_PER_ACCOUNT:
            return True
        if count_recent(LOGIN_FAIL_EVENTS, w, ip=ip) >= settings.MAX_FAILED_PER_IP:
            return True
    except Exception:
        logger.exception("lockout check failed")
    return False


def _should_alert(key: str) -> bool:
    now = time.time()
    cooldown = settings.ALERT_COOLDOWN_MINUTES * 60
    with _alert_lock:
        if now - _last_alert.get(key, 0) < cooldown:
            return False
        _last_alert[key] = now
        return True


def _send_email(subject: str, body: str):
    try:
        recipients = [e.strip() for e in settings.ALERT_EMAIL_TO.split(",") if e.strip()]
        payload = json.dumps(
            {"from": settings.ALERT_FROM_EMAIL, "to": recipients, "subject": subject, "text": body}
        ).encode()
        req = urllib.request.Request(
            "https://api.resend.com/emails",
            data=payload,
            method="POST",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "tucusa-security/1.0",
            },
        )
        urllib.request.urlopen(req, timeout=10).read()
    except Exception:
        logger.exception("Failed to send security alert email")


def send_alert(subject: str, body: str):
    logger.warning("ALERT: %s | %s", subject, body.replace("\n", " | "))
    if not (settings.RESEND_API_KEY and settings.ALERT_EMAIL_TO):
        logger.warning("Email alerts not configured (RESEND_API_KEY / ALERT_EMAIL_TO)")
        return
    threading.Thread(target=_send_email, args=(subject, body), daemon=True).start()


def _maybe_alert(event_type, severity, ip, email, user_id, detail, path, ua):
    try:
        if event_type in IMMEDIATE_ALERTS:
            title = IMMEDIATE_ALERTS[event_type]
            key = f"{event_type}:{email or ip}"
        elif event_type in THRESHOLD_ALERTS:
            limit, minutes, title = THRESHOLD_ALERTS[event_type]
            if count_recent((event_type,), minutes, ip=ip) < limit:
                return
            key = f"{event_type}:{ip}"
        else:
            return
        if not _should_alert(key):
            return
        body = (
            f"{title}\n\n"
            f"Event:      {event_type}\n"
            f"Severity:   {severity}\n"
            f"Time (UTC): {_utcnow().isoformat(timespec='seconds')}\n"
            f"IP address: {ip}\n"
            f"Email:      {email}\n"
            f"User ID:    {user_id}\n"
            f"Path:       {path}\n"
            f"User agent: {ua}\n"
            f"Detail:     {detail}\n\n"
            f"Review all events in the admin dashboard (Security page)."
        )
        send_alert(f"[TUCUSA SECURITY] {title}", body)
    except Exception:
        logger.exception("alert evaluation failed")


def log_event(
    event_type: str,
    severity: str = "warning",
    request: Request | None = None,
    *,
    email: str | None = None,
    user_id: int | None = None,
    detail: str | None = None,
):
    ip = ua = path = method = None
    if request is not None:
        ip = get_client_ip(request)
        ua = (request.headers.get("user-agent") or "")[:300]
        path = request.url.path[:200]
        method = request.method
    email = email.lower()[:255] if email else None
    detail = detail[:1000] if detail else None
    try:
        with SessionLocal() as s:
            s.add(
                models.SecurityEvent(
                    event_type=event_type,
                    severity=severity,
                    ip=ip,
                    user_agent=ua,
                    path=path,
                    method=method,
                    email=email,
                    user_id=user_id,
                    detail=detail,
                )
            )
            s.commit()
    except Exception:
        logger.exception("could not store security event")
    logger.log(
        logging.INFO if severity == "info" else logging.WARNING,
        "SECURITY %s sev=%s ip=%s email=%s user=%s path=%s detail=%s",
        event_type, severity, ip, email, user_id, path, detail,
    )
    _maybe_alert(event_type, severity, ip, email, user_id, detail, path, ua)


def purge_old_events(days: int):
    try:
        cutoff = _utcnow() - timedelta(days=days)
        with SessionLocal() as s:
            s.query(models.SecurityEvent).filter(models.SecurityEvent.created_at < cutoff).delete()
            s.commit()
    except Exception:
        logger.exception("purge failed")