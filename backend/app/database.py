"""
Database — async SQLAlchemy engine targeting Neon PostgreSQL.

Connection string format from Neon:
  postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

We convert it to the asyncpg dialect automatically.
"""

import os
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase

logger = logging.getLogger(__name__)


def _build_async_url(url: str) -> tuple[str, dict]:
    """
    Convert a standard Postgres URL to the asyncpg dialect.
    Returns (url, connect_args) — connect_args carries SSL config for Neon.
    """
    # Replace scheme
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    # asyncpg does not understand ?sslmode=require — strip it and pass ssl via connect_args
    connect_args: dict = {}
    if "sslmode=require" in url:
        url = url.replace("?sslmode=require", "").replace("&sslmode=require", "")
        connect_args["ssl"] = "require"
    elif "neon.tech" in url:
        # Neon always needs SSL even if not explicitly stated
        connect_args["ssl"] = "require"

    return url, connect_args


# ── Engine & session factory ──────────────────────────────────────────────────

DATABASE_URL = os.environ.get("DATABASE_URL", "")

if DATABASE_URL:
    _async_url, _connect_args = _build_async_url(DATABASE_URL)
    engine = create_async_engine(
        _async_url,
        connect_args=_connect_args,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        echo=False,
    )
else:
    # No DATABASE_URL — engine will be set after env is loaded
    engine = None  # type: ignore[assignment]

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
) if engine else None  # type: ignore[assignment]


def init_engine(url: str) -> None:
    """(Re-)initialize the engine from a URL — called in lifespan if env was late-loaded."""
    global engine, AsyncSessionLocal
    _async_url, _connect_args = _build_async_url(url)
    engine = create_async_engine(
        _async_url,
        connect_args=_connect_args,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        echo=False,
    )
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


# ── ORM Base ──────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ── Dependency ────────────────────────────────────────────────────────────────

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields a fresh async DB session."""
    if AsyncSessionLocal is None:
        raise RuntimeError("Database not initialised. Set DATABASE_URL env var.")
    async with AsyncSessionLocal() as session:
        yield session


# ── Table creation ────────────────────────────────────────────────────────────

async def create_tables() -> None:
    """Create all tables if they don't exist yet (idempotent)."""
    if engine is None:
        logger.warning("No DATABASE_URL set — skipping table creation. Using in-memory store.")
        return
    # Import ORM models so Base.metadata knows about them
    from app.models import orm  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ready.")
