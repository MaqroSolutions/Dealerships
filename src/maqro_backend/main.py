import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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
    "http://localhost:3000",  # Local development frontend
    "http://127.0.0.1:3000",  # Alternative localhost
    
    # Flutter Web Development (add common Flutter web ports)
    "http://localhost:8080",  # Common Flutter web port
    "http://localhost:5000",  # Alternative Flutter web port
    "http://localhost:53083",  # Current Flutter web port
    "http://127.0.0.1:8080",  # Alternative localhost
    "http://127.0.0.1:5000",  # Alternative localhost
    "http://127.0.0.1:53083",  # Current Flutter web port
    
    # Production Frontend
    "https://dealerships-two.vercel.app",  # Current Vercel deployment
    "https://usemaqro.com",  # Your custom domain
    "https://www.usemaqro.com",  # With www subdomain

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
