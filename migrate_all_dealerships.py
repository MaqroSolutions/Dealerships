#!/usr/bin/env python3
"""
Migration script to rebuild embeddings for ALL dealerships with text-embedding-3-small model.
This script will:
1. Find all dealerships in the database
2. Clear existing embeddings for each dealership
3. Rebuild embeddings using the new model
4. Provide progress updates for each dealership
"""

import asyncio
import sys
import os
from pathlib import Path
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from maqro_rag import Config, DatabaseRAGRetriever
from maqro_backend.db.session import get_db
from maqro_backend.crud import get_inventory_by_dealership


async def get_all_dealerships(session: AsyncSession) -> list[str]:
    """Get all dealership IDs from the database."""
    try:
        from maqro_backend.db.models import Dealership
        
        result = await session.execute(select(Dealership.id))
        dealership_ids = [str(row[0]) for row in result.fetchall()]
        
        logger.info(f"Found {len(dealership_ids)} dealerships in database")
        return dealership_ids
        
    except Exception as e:
        logger.error(f"Error getting dealerships: {e}")
        return []


async def clear_existing_embeddings(session: AsyncSession, dealership_id: str) -> int:
    """Clear existing embeddings for a dealership."""
    try:
        result = await session.execute(
            text("DELETE FROM vehicle_embeddings WHERE dealership_id = :dealership_id"),
            {"dealership_id": dealership_id}
        )
        await session.commit()
        deleted_count = result.rowcount
        logger.info(f"Cleared {deleted_count} existing embeddings for dealership {dealership_id}")
        return deleted_count
    except Exception as e:
        await session.rollback()
        logger.error(f"Error clearing embeddings: {e}")
        raise


async def rebuild_embeddings_for_dealership(
    session: AsyncSession,
    dealership_id: str,
    retriever: DatabaseRAGRetriever
) -> dict:
    """Rebuild embeddings for all inventory in a dealership."""
    try:
        logger.info(f"Starting embedding rebuild for dealership {dealership_id}")
        
        # Get all inventory for the dealership
        inventory_items = await get_inventory_by_dealership(session=session, dealership_id=dealership_id)
        
        if not inventory_items:
            logger.warning(f"No inventory found for dealership {dealership_id}")
            return {"total": 0, "built": 0, "error": None}
        
        logger.info(f"Found {len(inventory_items)} inventory items to process")
        
        # Clear existing embeddings
        await clear_existing_embeddings(session, dealership_id)
        
        # Build new embeddings
        built_count = await retriever.build_embeddings_for_dealership(
            session=session,
            dealership_id=dealership_id,
            force_rebuild=True
        )
        
        logger.info(f"Successfully built {built_count} new embeddings")
        
        return {
            "total": len(inventory_items),
            "built": built_count,
            "error": None
        }
        
    except Exception as e:
        logger.error(f"Error rebuilding embeddings: {e}")
        return {
            "total": 0,
            "built": 0,
            "error": str(e)
        }


async def main():
    """Main migration function."""
    try:
        logger.info("🚀 Starting embedding migration to text-embedding-3-small for ALL dealerships")
        
        # Load configuration
        config = Config.from_yaml("config.yaml")
        logger.info(f"Using embedding model: {config.embedding.model}")
        
        # Initialize database retriever
        retriever = DatabaseRAGRetriever(config)
        logger.info("Database RAG retriever initialized")
        
        # Get database session
        async for db_session in get_db():
            try:
                # Get all dealerships
                dealership_ids = await get_all_dealerships(db_session)
                
                if not dealership_ids:
                    logger.error("No dealerships found in database")
                    sys.exit(1)
                
                # Process each dealership
                total_results = []
                successful_dealerships = 0
                failed_dealerships = 0
                
                for i, dealership_id in enumerate(dealership_ids, 1):
                    logger.info(f"\n{'='*60}")
                    logger.info(f"Processing dealership {i}/{len(dealership_ids)}: {dealership_id}")
                    logger.info(f"{'='*60}")
                    
                    # Rebuild embeddings
                    result = await rebuild_embeddings_for_dealership(
                        session=db_session,
                        dealership_id=dealership_id,
                        retriever=retriever
                    )
                    
                    total_results.append({
                        "dealership_id": dealership_id,
                        "result": result
                    })
                    
                    if result["error"]:
                        failed_dealerships += 1
                        logger.error(f"❌ Failed to migrate dealership {dealership_id}: {result['error']}")
                    else:
                        successful_dealerships += 1
                        logger.info(f"✅ Successfully migrated dealership {dealership_id}")
                        logger.info(f"   - Total inventory items: {result['total']}")
                        logger.info(f"   - Embeddings built: {result['built']}")
                
                # Summary
                logger.info(f"\n{'='*60}")
                logger.info("🎉 MIGRATION SUMMARY")
                logger.info(f"{'='*60}")
                logger.info(f"✅ Successful dealerships: {successful_dealerships}")
                logger.info(f"❌ Failed dealerships: {failed_dealerships}")
                logger.info(f"📊 Total dealerships processed: {len(dealership_ids)}")
                logger.info(f"🤖 Model used: {config.embedding.model}")
                
                if failed_dealerships > 0:
                    logger.warning(f"⚠️  {failed_dealerships} dealership(s) failed to migrate")
                    sys.exit(1)
                else:
                    logger.info("🎉 All dealerships migrated successfully!")
                
                break  # Exit after first session
                
            except Exception as e:
                logger.error(f"Error during migration: {e}")
                sys.exit(1)
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
