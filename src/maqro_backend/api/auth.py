"""
JWT Authentication for Supabase integration

This module provides JWT token validation for FastAPI endpoints using Supabase Auth.
"""
import jwt
import logging
from typing import Optional
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..core.config import settings

# Set up logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


def _decode_jwt_payload(token: str) -> dict:
    """Private method to decode JWT payload"""
    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

class JWTBearer(HTTPBearer):
    """
    FastAPI dependency for validating Supabase JWT tokens.
    
    This class extends HTTPBearer to automatically extract and validate
    JWT tokens from the Authorization header.
    """
    
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request) -> str:
        """
        Extract and validate JWT token from request.
        
        Returns:
            str: The validated JWT token
            
        Raises:
            HTTPException: If token is missing, invalid, or expired
        """
        logger.info(f"🔐 Authentication attempt for {request.method} {request.url.path}")
        
        # Check if Authorization header exists
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            logger.warning("❌ No Authorization header found in request")
            raise HTTPException(
                status_code=401, 
                detail="Authorization header missing"
            )
        
        logger.info(f"📋 Authorization header present: {auth_header[:20]}...")
        
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)
        
        if not credentials:
            logger.error("❌ Failed to extract credentials from Authorization header")
            raise HTTPException(
                status_code=401, 
                detail="Authorization header missing"
            )
            
        if credentials.scheme != "Bearer":
            logger.error(f"❌ Invalid auth scheme: {credentials.scheme}, expected Bearer")
            raise HTTPException(
                status_code=401, 
                detail="Invalid authentication scheme. Expected Bearer token."
            )
            
        logger.info("🔍 Validating JWT token...")
        if not self.verify_jwt(credentials.credentials):
            logger.error("❌ JWT token validation failed")
            raise HTTPException(
                status_code=401, 
                detail="Invalid or expired token"
            )
            
        logger.info("✅ JWT token validation successful")
        return credentials.credentials
    

    def verify_jwt(self, token: str) -> bool:
        try:
            _decode_jwt_payload(token)
            return True
        except HTTPException:
            return False


def decode_jwt_token(token: str) -> dict:
    return _decode_jwt_payload(token)

async def get_current_user_id(token: str = Depends(JWTBearer())) -> str:
    logger.info("Extracting user ID from validated JWT token")
    
    payload = decode_jwt_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        logger.error("❌ User ID (sub) field missing from JWT payload")
        raise HTTPException(
            status_code=401, 
            detail="User ID missing from token"
        )
    
    logger.info(f"✅ User ID extracted: {user_id}")
    return user_id


async def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> None | str:
    if not credentials or credentials.scheme != "Bearer":
        return None
    try:
        payload = decode_jwt_token(credentials.credentials)
        return payload.get("sub")
    except HTTPException:
        return None


async def get_user_email(token: str = Depends(JWTBearer())) -> None | str:
    payload = decode_jwt_token(token)
    return payload.get("email")


# Legacy compatibility - for gradual migration
jwt_bearer = JWTBearer()