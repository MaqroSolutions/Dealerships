"""
Email service for sending password reset emails
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os

from ..core.config import settings

logger = logging.getLogger(__name__)


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
    from_email: Optional[str] = None
) -> bool:
    """
    Send an email using the configured email provider
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        text_content: Plain text content (optional)
        from_email: Sender email (optional, uses default if not provided)
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Use configured email settings
        smtp_server = settings.smtp_server
        smtp_port = settings.smtp_port
        smtp_username = settings.smtp_username
        smtp_password = settings.smtp_password
        default_from_email = settings.default_from_email
        
        if not all([smtp_server, smtp_port, smtp_username, smtp_password]):
            logger.error("SMTP configuration incomplete")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email or default_from_email or smtp_username
        msg['To'] = to_email
        
        # Add text content if provided
        if text_content:
            text_part = MIMEText(text_content, 'plain')
            msg.attach(text_part)
        
        # Add HTML content
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """
    Send a password reset email with the given reset URL
    
    Args:
        to_email: Recipient email address
        reset_url: Password reset URL
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = "Reset Your Password - Maqro"
    
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9fafb; }}
            .button {{ display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You requested a password reset for your Maqro account.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset Password</a>
                </p>
                <p><strong>Important:</strong> This link will expire in 30 minutes for security reasons.</p>
                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
                <p style="word-break: break-all; color: #6b7280;">{reset_url}</p>
            </div>
            <div class="footer">
                <p>Best regards,<br>The Maqro Team</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Password Reset Request - Maqro
    
    Hello,
    
    You requested a password reset for your Maqro account.
    
    Click the link below to reset your password:
    {reset_url}
    
    Important: This link will expire in 30 minutes for security reasons.
    
    If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
    
    Best regards,
    The Maqro Team
    
    This is an automated message, please do not reply to this email.
    """
    
    return send_email(to_email, subject, html_content, text_content)
