import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from .core.config import settings
from .core.lifespan import lifespan
from .api.routes import api_router

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Create rate limiter instance
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.title,
    version=settings.version,
    lifespan=lifespan
)

# Set up rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration - SECURE: Only allow specific trusted domains
origins = [
    # Development
    "http://localhost:3000",
    "http://127.0.0.1:3000",

    # Production / Preview Frontends
    "https://dealerships-two.vercel.app",
    "https://usemaqro.com",
    "https://www.usemaqro.com",
]

# Optionally allow additional origins from env (comma-separated)
extra_origins = os.getenv("FRONTEND_CORS_ORIGINS")
if extra_origins:
    origins.extend([o.strip() for o in extra_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",  # allow all Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routes
app.include_router(api_router, prefix="/api")

# Startup event to log authentication configuration
@app.on_event("startup")
async def startup_event():
    """Log authentication configuration on startup"""
    if hasattr(settings, 'supabase_jwt_secret') and settings.supabase_jwt_secret:
        logger.info(" JWT Authentication ENABLED - Supabase JWT secret configured")
        logger.info(" Protected endpoints will require valid Bearer tokens")
    else:
        logger.error(" JWT Authentication NOT CONFIGURED - SUPABASE_JWT_SECRET missing!")
        logger.error(" All protected endpoints will reject requests!")
    
    logger.info(f"🚀 {settings.title} v{settings.version} started successfully")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Maqro Dealership API", "version": settings.version}
