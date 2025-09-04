"""
Database session management with connection pooling for scalability
"""
import os
import ssl
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
    - Do not inject sslmode for asyncpg; use connect_args instead
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

    # Query params (preserve existing; don't add sslmode for asyncpg)
    query_params = dict(parse_qsl(parsed.query))

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
parsed_url = urlparse(DATABASE_URL)
hostname = parsed_url.hostname or ""
is_local = hostname in {"localhost", "127.0.0.1"} or hostname.endswith(".local")
logger.info(f"Using DATABASE_URL (async): {DATABASE_URL.split('@')[-1]}")
logger.info(f"DB SSL required: {'no' if is_local else 'yes'}")

# Connection pooling configuration for scalability
connect_args = {}
if not is_local:
    # Build SSL context. Try certifi bundle if available for wider CA support
    allow_self_signed = os.getenv("DB_SSL_ALLOW_SELF_SIGNED", "false").lower() in {"1", "true", "yes"}
    ssl_context = None
    try:
        import certifi  # type: ignore
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        logger.info("Using certifi CA bundle for DB SSL verification")
    except Exception:
        ssl_context = ssl.create_default_context()
        logger.info("Using system CA bundle for DB SSL verification")

    if allow_self_signed:
        logger.warning("DB SSL verification relaxed: allowing self-signed certificates (DB_SSL_ALLOW_SELF_SIGNED=true)")
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
    else:
        ssl_context.check_hostname = True
        ssl_context.verify_mode = ssl.CERT_REQUIRED

    connect_args = {"ssl": ssl_context}

engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL debugging
    pool_size=20,  # Number of connections to maintain
    max_overflow=30,  # Additional connections when pool is full
    pool_pre_ping=True,  # Validate connections before use
    pool_recycle=3600,  # Recycle connections every hour
    pool_timeout=30,  # Timeout for getting connection from pool
    connect_args=connect_args,
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
            from sqlalchemy import text
            result = await session.execute(text("SELECT 1"))
            result.fetchone()
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False