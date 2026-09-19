from datetime import datetime, timedelta
from typing import Optional
import uuid as uuid_lib
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session

SECRET_KEY = "procuresense-jwt-secret-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# Hardcoded admin account — always available
BUILTIN_ADMIN = {
    "user_id": "admin-001",
    "email": "admin@procuresense.com",
    "name": "Neha Shanavas",
    "role": "admin",
    "hashed_password": _hash("NehaAdmin@2024"),
}

ROLE_PERMISSIONS = {
    "admin": ["upload", "delete", "view", "manage_users", "generate_reports", "chat", "evaluate"],
    "procurement": ["view", "upload", "chat", "generate_reports", "evaluate"],
    "legal": ["view", "chat"],
}

VALID_ROLES = ["procurement", "legal"]


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def authenticate_user(email: str, password: str, db: Optional[Session] = None) -> Optional[dict]:
    # Check built-in admin first
    if email == BUILTIN_ADMIN["email"]:
        if verify_password(password, BUILTIN_ADMIN["hashed_password"]):
            return BUILTIN_ADMIN
        return None

    # Check DB users
    if db:
        from database import User
        db_user = db.query(User).filter(User.email == email).first()
        if db_user and verify_password(password, db_user.hashed_password):
            return {
                "user_id": db_user.user_id,
                "email": db_user.email,
                "name": db_user.name,
                "role": db_user.role,
            }

    return None


def register_user(email: str, password: str, name: str, role: str, db: Session) -> dict:
    """Register a new user. Returns user dict or raises ValueError."""
    from database import User

    if role not in VALID_ROLES:
        raise ValueError(f"Invalid role '{role}'. Must be one of: {', '.join(VALID_ROLES)}")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise ValueError("An account with this email already exists.")

    if email == BUILTIN_ADMIN["email"]:
        raise ValueError("This email address is reserved.")

    user_id = str(uuid_lib.uuid4())
    hashed = _hash(password)

    new_user = User(
        user_id=user_id,
        email=email,
        name=name,
        role=role,
        hashed_password=hashed,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "user_id": new_user.user_id,
        "email": new_user.email,
        "name": new_user.name,
        "role": new_user.role,
    }


def create_token(user_id: str, role: str, email: str, name: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "role": role,
        "email": email,
        "name": name,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def has_permission(role: str, action: str) -> bool:
    return action in ROLE_PERMISSIONS.get(role, [])
