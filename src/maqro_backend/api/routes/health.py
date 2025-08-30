"""
Health check and monitoring endpoints
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from maqro_backend.api.deps import get_db_session
from maqro_backend.services.background_tasks import get_task_status, cleanup_background_tasks

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {"status": "healthy", "message": "Service is running"}


@router.get("/health/db")
async def database_health_check(db: AsyncSession = Depends(get_db_session)):
    """Database health check"""
    try:
        # Simple query to test database connection
        from sqlalchemy import text
        result = await db.execute(text("SELECT 1"))
        result.fetchone()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


@router.get("/health/tasks/{task_id}")
async def task_status_check(task_id: str):
    """Check status of background tasks"""
    task_status = await get_task_status(task_id)
    if task_status:
        return {"status": "found", "task": task_status}
    else:
        return {"status": "not_found", "task_id": task_id}


@router.post("/health/tasks/cleanup")
async def cleanup_tasks():
    """Clean up old background tasks"""
    await cleanup_background_tasks()
    return {"status": "success", "message": "Background tasks cleaned up"}