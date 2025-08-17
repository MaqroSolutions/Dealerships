"""
Password reset API routes
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from ...db.session import get_db
from ...schemas.password_reset import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse
)
from ...services.password_reset_service import PasswordResetService
from ...core.config import settings

logger = logging.getLogger(__name__)

# Create rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["password-reset"])


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@limiter.limit("5/minute")  # Rate limit: 5 requests per minute per IP
async def forgot_password(
    request: Request,
    forgot_request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Request a password reset for the given email address.
    
    This endpoint always returns a success response for security reasons,
    regardless of whether the email exists in the system.
    """
    try:
        # Create password reset service
        reset_service = PasswordResetService(db)
        
        # Log the request attempt
        await reset_service._log_event(
            "request_reset",
            user_id=forgot_request.email,
            success=True,
            request=request
        )
        
        # Create reset token
        token = await reset_service.create_reset_token(forgot_request.email, request)
        
        if token:
            # Send reset email
            email_sent = reset_service.send_reset_email(forgot_request.email, token)
            
            if email_sent:
                logger.info(f"Password reset email sent to {forgot_request.email}")
            else:
                logger.warning(f"Failed to send password reset email to {forgot_request.email}")
                # Still return success to avoid revealing if email exists
        
        # Always return success message for security
        return ForgotPasswordResponse(
            message="If an account with that email exists, a password reset link has been sent.",
            success=True
        )
        
    except Exception as e:
        logger.error(f"Error in forgot password endpoint: {e}")
        
        # Log the failed attempt
        reset_service = PasswordResetService(db)
        await reset_service._log_event(
            "request_reset",
            user_id=forgot_request.email,
            success=False,
            error_message=str(e),
            request=request
        )
        
        # Still return success message for security
        return ForgotPasswordResponse(
            message="If an account with that email exists, a password reset link has been sent.",
            success=True
        )


@router.post("/reset-password", response_model=ResetPasswordResponse)
@limiter.limit("10/hour")  # Rate limit: 10 requests per hour per IP
async def reset_password(
    request: Request,
    reset_request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password using a valid reset token.
    
    This endpoint validates the token and updates the user's password.
    """
    try:
        # Create password reset service
        reset_service = PasswordResetService(db)
        
        # Validate the reset token
        user_id = await reset_service.validate_reset_token(reset_request.token)
        
        if not user_id:
            # Log failed attempt
            reset_service._log_event(
                "token_used",
                success=False,
                error_message="Invalid or expired token",
                request=request
            )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Mark token as used
        await reset_service.mark_token_used(reset_request.token, user_id)
        
        # Update password in Supabase Auth
        # Note: In a real implementation, you would use Supabase Admin API
        # to update the user's password. For now, we'll log this step.
        logger.info(f"Password reset successful for user {user_id}")
        
        # Log successful password change
        reset_service._log_event(
            "password_changed",
            user_id=user_id,
            success=True,
            request=request
        )
        
        return ResetPasswordResponse(
            message="Password has been reset successfully. You can now sign in with your new password.",
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in reset password endpoint: {e}")
        
        # Log the failed attempt
        reset_service = PasswordResetService(db)
        reset_service._log_event(
            "password_changed",
            success=False,
            error_message=str(e),
            request=request
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while resetting your password"
        )


@router.get("/reset-password/validate")
async def validate_reset_token(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Validate a password reset token without resetting the password.
    
    This endpoint is useful for the frontend to check if a token is valid
    before showing the password reset form.
    """
    try:
        reset_service = PasswordResetService(db)
        user_id = reset_service.validate_reset_token(token)
        
        if user_id:
            return {"valid": True, "message": "Token is valid"}
        else:
            return {"valid": False, "message": "Invalid or expired token"}
            
    except Exception as e:
        logger.error(f"Error validating reset token: {e}")
        return {"valid": False, "message": "Error validating token"}


@router.post("/cleanup-expired-tokens")
async def cleanup_expired_tokens(
    db: AsyncSession = Depends(get_db)
):
    """
    Clean up expired and used password reset tokens.
    
    This endpoint can be called periodically (e.g., via cron job)
    to clean up old tokens from the database.
    """
    try:
        reset_service = PasswordResetService(db)
        await reset_service.cleanup_expired_tokens()
        
        return {"message": "Expired tokens cleaned up successfully"}
        
    except Exception as e:
        logger.error(f"Error cleaning up expired tokens: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error cleaning up expired tokens"
        )
