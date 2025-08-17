"""
Password reset service for handling secure password reset flow
"""
import secrets
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple
from fastapi import HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, or_

from ..db.models import PasswordResetToken, PasswordResetAuditLog
from ..core.config import settings
from ..utils.email_service import send_email

logger = logging.getLogger(__name__)


class PasswordResetService:
    """Service for handling password reset functionality"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    def _hash_token(self, token: str) -> str:
        """Hash a token for secure storage"""
        return hashlib.sha256(token.encode()).hexdigest()
    
    def _generate_token(self) -> str:
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)
    
    def _get_client_info(self, request: Request) -> Tuple[Optional[str], Optional[str]]:
        """Extract client IP and user agent from request"""
        # Get IP address
        ip_address = None
        if request.headers.get("x-forwarded-for"):
            ip_address = request.headers["x-forwarded-for"].split(",")[0].strip()
        elif request.headers.get("x-real-ip"):
            ip_address = request.headers["x-real-ip"]
        else:
            ip_address = request.client.host if request.client else None
        
        # Get user agent
        user_agent = request.headers.get("user-agent")
        
        return ip_address, user_agent
    
    async def _log_event(
        self, 
        event_type: str, 
        user_id: Optional[str] = None, 
        success: bool = True, 
        error_message: Optional[str] = None,
        request: Optional[Request] = None,
        metadata: dict = None
    ):
        """Log password reset events for audit"""
        ip_address, user_agent = self._get_client_info(request) if request else (None, None)
        
        audit_entry = PasswordResetAuditLog(
            user_id=user_id,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            error_message=error_message,
            event_metadata=metadata or {}
        )
        
        try:
            self.db.add(audit_entry)
            await self.db.commit()
            logger.info(f"Password reset audit log: {event_type} - {success}")
        except Exception as e:
            logger.error(f"Failed to log password reset event: {e}")
            await self.db.rollback()
    
    async def create_reset_token(self, email: str, request: Request) -> Optional[str]:
        """
        Create a password reset token for the given email
        
        Args:
            email: User's email address
            request: FastAPI request object for client info
            
        Returns:
            Optional[str]: Reset token if user exists, None otherwise
        """
        try:
            # Check if user exists (using Supabase auth)
            # Note: In a real implementation, you'd query Supabase auth.users
            # For now, we'll assume the user exists and create the token
            
            # Generate token and hash
            token = self._generate_token()
            token_hash = self._hash_token(token)
            
            # Set expiration (30 minutes from now)
            expires_at = datetime.utcnow() + timedelta(minutes=30)
            
            # Get client info
            ip_address, user_agent = self._get_client_info(request)
            
            # Store token in database
            reset_token = PasswordResetToken(
                expires_at=expires_at,
                user_id=email,  # In real implementation, this would be the user's UUID
                token_hash=token_hash,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            self.db.add(reset_token)
            await self.db.commit()
            
            # Log the event
            await self._log_event(
                "token_created",
                user_id=email,
                success=True,
                request=request,
                metadata={"expires_at": expires_at.isoformat()}
            )
            
            logger.info(f"Password reset token created for {email}")
            return token
            
        except Exception as e:
            logger.error(f"Failed to create reset token for {email}: {e}")
            await self.db.rollback()
            await self._log_event(
                "token_created",
                user_id=email,
                success=False,
                error_message=str(e),
                request=request
            )
            return None
    
    async def validate_reset_token(self, token: str) -> Optional[str]:
        """
        Validate a password reset token
        
        Args:
            token: The reset token to validate
            
        Returns:
            Optional[str]: User ID if token is valid, None otherwise
        """
        try:
            token_hash = self._hash_token(token)
            
            # Find the token in database
            from sqlalchemy import select
            stmt = select(PasswordResetToken).where(
                and_(
                    PasswordResetToken.token_hash == token_hash,
                    PasswordResetToken.expires_at > datetime.utcnow(),
                    PasswordResetToken.used_at.is_(None)
                )
            )
            result = await self.db.execute(stmt)
            reset_token = result.scalar_one_or_none()
            
            if not reset_token:
                logger.warning(f"Invalid or expired reset token attempted")
                return None
            
            logger.info(f"Reset token validated for user {reset_token.user_id}")
            return reset_token.user_id
            
        except Exception as e:
            logger.error(f"Error validating reset token: {e}")
            return None
    
    async def mark_token_used(self, token: str, user_id: str):
        """
        Mark a reset token as used
        
        Args:
            token: The reset token
            user_id: The user ID
        """
        try:
            token_hash = self._hash_token(token)
            
            stmt = select(PasswordResetToken).where(
                PasswordResetToken.token_hash == token_hash
            )
            result = await self.db.execute(stmt)
            reset_token = result.scalar_one_or_none()
            
            if reset_token:
                reset_token.used_at = datetime.utcnow()
                await self.db.commit()
                logger.info(f"Reset token marked as used for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error marking token as used: {e}")
            await self.db.rollback()
    
    def send_reset_email(self, email: str, token: str) -> bool:
        """
        Send password reset email
        
        Args:
            email: User's email address
            token: Reset token
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Validate email format
            if not email or '@' not in email:
                logger.error(f"Invalid email format: {email}")
                return False
            
            # Build reset URL
            reset_url = f"{settings.app_url}/reset-password?token={token}"
            
            # Send email using the utility function
            success = send_password_reset_email(email, reset_url)
            
            if success:
                logger.info(f"Password reset email sent to {email}")
            else:
                logger.error(f"Failed to send password reset email to {email}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending reset email to {email}: {e}")
            return False
    
    async def cleanup_expired_tokens(self):
        """Clean up expired and used tokens"""
        try:
            stmt = select(PasswordResetToken).where(
                or_(
                    PasswordResetToken.expires_at < datetime.utcnow(),
                    PasswordResetToken.used_at.isnot(None)
                )
            )
            result = await self.db.execute(stmt)
            tokens_to_delete = result.scalars().all()
            
            for token in tokens_to_delete:
                await self.db.delete(token)
            
            await self.db.commit()
            logger.info(f"Cleaned up {len(tokens_to_delete)} expired/used reset tokens")
            
        except Exception as e:
            logger.error(f"Error cleaning up expired tokens: {e}")
            await self.db.rollback()
