from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security_events import log_event
from app.database import get_db
from app import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"require_exp": True},
        )
    except ExpiredSignatureError:
        raise credentials_exception  # normal, not an attack
    except JWTError:
        log_event("invalid_token", "warning", request, detail="Bad signature or malformed token")
        raise credentials_exception

    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        log_event("invalid_token", "warning", request, detail="Token has invalid subject")
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        log_event("invalid_token", "warning", request, user_id=user_id, detail="Token for a user that does not exist")
        raise credentials_exception

    # The role inside the token must match the database. Mismatch = forged or stale token.
    if payload.get("role") != user.role:
        log_event(
            "token_role_mismatch", "critical", request, email=user.email, user_id=user.id,
            detail=f"token role={payload.get('role')} db role={user.role}",
        )
        raise credentials_exception

    request.state.token_scope = payload.get("scope")
    return user


def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_admin(
    request: Request,
    current_user: models.User = Depends(get_current_active_user),
):
    # Must be an admin AND hold a token issued by /auth/admin-login
    if current_user.role != "admin" or getattr(request.state, "token_scope", None) != "admin":
        log_event(
            "admin_access_denied", "critical", request,
            email=current_user.email, user_id=current_user.id,
            detail=f"role={current_user.role} scope={getattr(request.state, 'token_scope', None)}",
        )
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user