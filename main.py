#!/usr/bin/env python3
"""
Main script to demonstrate Maqro RAG system functionality.
"""

import os
import sys
from pathlib import Path
from loguru import logger
from maqro_rag import Config, DatabaseRAGRetriever


def setup_logging(config: Config):
    """Setup logging configuration."""
    logger.remove()  # Remove default handler
    logger.add(
        sys.stderr,
        format=config.logging.format,
        level=config.logging.level
    )


def main():
    """Main function to demonstrate RAG system."""
    try:
        # Load configuration
        config = Config.from_yaml("config.yaml")
        setup_logging(config)
        
        logger.info("🚗 Starting Maqro RAG System Demo")
        
        # Initialize database RAG retriever
        retriever = DatabaseRAGRetriever(config)
        
        logger.info("Database RAG retriever initialized")
        logger.info("Note: This demo requires a database connection to work properly")
        logger.info("For full functionality, run the FastAPI application instead")
        
        logger.info("\n" + "="*60)
        logger.info("✅ Demo completed successfully!")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"Error in main: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 