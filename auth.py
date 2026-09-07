"""
auth.py — JWT-based authentication for ProcureSense (academic demo mode).
Three hardcoded demo users: admin, procurement, legal.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

import bcrypt

# Secret key — in production this would be env var
SECRET_KEY = "procuresense-secret-key-2024-academic-demo"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# Demo users — hardcoded for academic presentation
DEMO_USERS = {
    "admin@demo.com": {
        "user_id": "admin-001",
        "email": "admin@demo.com",
        "name": "Admin User",
        "role": "admin",
        "hashed_password": get_password_hash("admin123"),
    },
    "procurement@demo.com": {
        "user_id": "proc-001",
        "email": "procurement@demo.com",
        "name": "Procurement Officer",
        "role": "procurement",
        "hashed_password": get_password_hash("proc123"),
    },
    "legal@demo.com": {
        "user_id": "legal-001",
        "email": "legal@demo.com",
        "name": "Legal Reviewer",
        "role": "legal",
        "hashed_password": get_password_hash("legal123"),
    },
}

# Role permissions map
ROLE_PERMISSIONS = {
    "admin": ["upload", "delete", "view", "manage_users", "generate_reports", "chat", "evaluate"],
    "procurement": ["view", "chat", "generate_reports", "evaluate"],
    "legal": ["view", "chat", "evaluate"],
}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Validate credentials and return user dict or None."""
    user = DEMO_USERS.get(email)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


def create_token(user_id: str, role: str, email: str, name: str) -> str:
    """Create a signed JWT access token."""
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
    """Decode and verify a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def has_permission(role: str, action: str) -> bool:
    """Check if a role has permission to perform an action."""
    return action in ROLE_PERMISSIONS.get(role, [])


def get_demo_credentials() -> list:
    """Return demo credentials for display on the login page."""
    return [
        {"email": "admin@demo.com", "password": "admin123", "role": "Admin", "permissions": "Full access"},
        {"email": "procurement@demo.com", "password": "proc123", "role": "Procurement", "permissions": "View, Chat, Reports"},
        {"email": "legal@demo.com", "password": "legal123", "role": "Legal", "permissions": "View, Chat only"},
    ]
