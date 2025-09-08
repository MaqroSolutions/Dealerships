"""
Scalable background task system for embedding generation and other async operations.
"""
import asyncio
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ..db.session import get_db
from ..crud import ensure_embeddings_for_dealership


class BackgroundTaskManager:
    """Manages background tasks with retry logic and monitoring."""
    
    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.max_retries = 3
        self.retry_delay = 5  # seconds
    
    async def queue_embedding_task(self, inventory_id: str, dealership_id: str) -> str:
        """Queue an embedding generation task with proper tracking."""
        task_id = f"embedding_{inventory_id}_{datetime.now().isoformat()}"
        
        task_data = {
            "task_id": task_id,
            "type": "embedding_generation",
            "inventory_id": inventory_id,
            "dealership_id": dealership_id,
            "status": "queued",
            "created_at": datetime.now(),
            "retry_count": 0,
            "last_error": None
        }
        
        self.tasks[task_id] = task_data
        
        # Start the task in background
        asyncio.create_task(self._execute_embedding_task(task_id))
        
        logger.info(f"Queued embedding task {task_id} for inventory {inventory_id}")
        return task_id
    
    async def _execute_embedding_task(self, task_id: str):
        """Execute embedding generation task with retry logic."""
        task = self.tasks.get(task_id)
        if not task:
            logger.error(f"Task {task_id} not found")
            return
        
        try:
            task["status"] = "running"
            task["started_at"] = datetime.now()
            
            # Get database session
            async for session in get_db():
                await ensure_embeddings_for_dealership(
                    session=session,
                    dealership_id=task["dealership_id"]
                )
                break  # Only need one session
            
            task["status"] = "completed"
            task["completed_at"] = datetime.now()
            logger.info(f"Embedding task {task_id} completed successfully")
            
        except Exception as e:
            task["last_error"] = str(e)
            task["retry_count"] += 1
            
            if task["retry_count"] < self.max_retries:
                task["status"] = "retrying"
                logger.warning(f"Embedding task {task_id} failed, retrying in {self.retry_delay}s (attempt {task['retry_count']}/{self.max_retries})")
                
                # Schedule retry
                await asyncio.sleep(self.retry_delay)
                asyncio.create_task(self._execute_embedding_task(task_id))
            else:
                task["status"] = "failed"
                task["failed_at"] = datetime.now()
                logger.error(f"Embedding task {task_id} failed after {self.max_retries} attempts: {e}")
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a background task."""
        return self.tasks.get(task_id)
    
    async def cleanup_old_tasks(self, max_age_hours: int = 24):
        """Clean up old completed/failed tasks to prevent memory leaks."""
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        tasks_to_remove = []
        for task_id, task in self.tasks.items():
            if task.get("completed_at") and task["completed_at"] < cutoff_time:
                tasks_to_remove.append(task_id)
            elif task.get("failed_at") and task["failed_at"] < cutoff_time:
                tasks_to_remove.append(task_id)
        
        for task_id in tasks_to_remove:
            del self.tasks[task_id]
        
        if tasks_to_remove:
            logger.info(f"Cleaned up {len(tasks_to_remove)} old tasks")


# Global task manager instance
task_manager = BackgroundTaskManager()


async def queue_embedding_task(inventory_id: str, dealership_id: str) -> str:
    """Queue an embedding generation task."""
    return await task_manager.queue_embedding_task(inventory_id, dealership_id)


async def get_task_status(task_id: str) -> Optional[Dict[str, Any]]:
    """Get task status."""
    return await task_manager.get_task_status(task_id)


async def cleanup_background_tasks():
    """Clean up old background tasks."""
    await task_manager.cleanup_old_tasks()
