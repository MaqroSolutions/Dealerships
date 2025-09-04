"""
Database session management with connection pooling for scalability
"""
import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from loguru import logger
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

# Database configuration
# Prefer SUPABASE_DB_URL if provided, otherwise fallback to DATABASE_URL
RAW_DATABASE_URL = (
    os.getenv("SUPABASE_DB_URL")
    or os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/dbname")
)


def _normalize_database_url(url: str) -> str:
    """Normalize DATABASE_URL to async format and enforce SSL in production.

    - Convert postgres:// to postgresql://
    - Ensure driver is asyncpg: postgresql+asyncpg://
    - Add sslmode=require if not present and host is not localhost
    """
    if not url:
        return "postgresql+asyncpg://user:password@localhost/dbname"

    # Handle legacy scheme used by some providers
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]

    parsed = urlparse(url)

    # Ensure asyncpg driver
    scheme = parsed.scheme
    if scheme == "postgresql":
        scheme = "postgresql+asyncpg"
    elif scheme == "postgres":
        scheme = "postgresql+asyncpg"

    # Query params
    query_params = dict(parse_qsl(parsed.query))

    hostname = parsed.hostname or ""
    is_local = hostname in {"localhost", "127.0.0.1"} or hostname.endswith(".local")

    # Enforce SSL for non-local databases if not explicitly set
    if not is_local and "sslmode" not in query_params:
        query_params["sslmode"] = "require"

    normalized = urlunparse(
        (
            scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            urlencode(query_params),
            parsed.fragment,
        )
    )
    return normalized


DATABASE_URL = _normalize_database_url(RAW_DATABASE_URL)
logger.info(f"Using DATABASE_URL (async): {DATABASE_URL.split('@')[-1]}")

# Connection pooling configuration for scalability
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL debugging
    pool_size=20,  # Number of connections to maintain
    max_overflow=30,  # Additional connections when pool is full
    pool_pre_ping=True,  # Validate connections before use
    pool_recycle=3600,  # Recycle connections every hour
    pool_timeout=30,  # Timeout for getting connection from pool
)

# Session factory with connection pooling
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevent expired object access issues
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session with proper connection management."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def close_db_connections():
    """Close all database connections (for graceful shutdown)."""
    await engine.dispose()
    logger.info("Database connections closed")


# Health check function
async def check_db_health() -> bool:
    """Check if database is accessible."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute("SELECT 1")
            result.fetchone()
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False