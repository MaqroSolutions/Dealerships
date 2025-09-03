"""
Database session management with connection pooling for scalability
"""
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from loguru import logger
from collections.abc import AsyncGenerator

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost/dbname")

# Connection pooling configuration for scalability
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL debugging
    pool_size=10,  # Number of connections to maintain
    max_overflow=10,  # Additional connections when pool is full
    pool_pre_ping=True,  # Validate connections before use
    pool_recycle=300,  # Recycle connections every hour
    pool_timeout=30,  # Timeout for getting connection from pool
)

# Session factory with connection pooling
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevent expired object access issues
    autoflush=True,
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


async def close_db_connections():
    """Close all database connections (for graceful shutdown)."""
    await engine.dispose()
    logger.info("Database connections closed")


# Health check function
async def check_db_health() -> bool:
    """Check if database is accessible."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            result.fetchone()
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False