"""
Resend Email Service for sending professional emails with template support
"""
import resend
import os
from typing import Dict, Any, Optional
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, Template
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)


class ResendEmailService:
    """Service for handling Resend email operations with template support"""
    
    def __init__(self):
        self.api_key = settings.resend_api_key
        resend.api_key = self.api_key
        
        # Setup Jinja2 template environment
        template_dir = Path(__file__).parent.parent / "templates" / "emails"
        self.template_env = Environment(loader=FileSystemLoader(template_dir))
    
    def _validate_credentials(self) -> bool:
        """Validate that Resend API key is available"""
        return bool(self.api_key)
    
    def _load_template(self, template_name: str) -> Optional[Template]:
        """Load email template file"""
        try:
            return self.template_env.get_template(template_name)
        except Exception as e:
            logger.error(f"Failed to load template {template_name}: {e}")
            return None
    
    async def send_invite_email(
        self, 
        email: str, 
        invite_link: str, 
        dealership_name: str,
        role_name: str,
        inviter_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send dealership invite email via Resend using templates
        
        Args:
            email: Recipient email address
            invite_link: Full signup link with token
            dealership_name: Name of the dealership
            role_name: Role being invited for (salesperson, manager)
            inviter_name: Name of person sending invite (optional)
            
        Returns:
            Dict with success status and details
        """
        if not self._validate_credentials():
            logger.error("Resend API key not configured")
            return {
                "success": False,
                "error": "Email service not configured"
            }
        
        try:
            logger.info(f"🔑 API key configured: {bool(self.api_key)}")
            logger.info(f"🔑 API key length: {len(self.api_key) if self.api_key else 0}")
            logger.info(f"🔑 API key prefix: {self.api_key[:8] if self.api_key else 'None'}...")
            
            # Template variables
            template_vars = {
                "email": email,
                "invite_link": invite_link,
                "dealership_name": dealership_name,
                "role_name": role_name,
                "inviter_name": inviter_name
            }
            
            logger.info(f"📧 Template variables: {template_vars}")
            
            # Load and render HTML template
            html_template = self._load_template("invite_user.html")
            if not html_template:
                return {"success": False, "error": "Failed to load HTML template"}
            
            html_content = html_template.render(**template_vars)
            
            # Load and render text template
            text_template = self._load_template("invite_user.txt")
            text_content = text_template.render(**template_vars) if text_template else None
            
            # Prepare email data
            email_data = {
                "from": "invites@mail.usemaqro.com",  # Using verified domain
                "to": email,
                "subject": f"You're invited to join {dealership_name}",
                "html": html_content,
            }
            
            # Add text version if available
            if text_content:
                email_data["text"] = text_content
            
            # Send email via Resend
            logger.info(f"📨 Sending email with data: {email_data}")
            logger.info(f"📨 From: {email_data['from']}, To: {email_data['to']}")
            logger.info(f"📨 Subject: {email_data['subject']}")
            
            response = resend.Emails.send(email_data)
            logger.info(f"📨 Resend response: {response}")
            
            logger.info(f"✅ Invite email sent successfully to {email} via Resend")
            
            return {
                "success": True,
                "message": f"Invite email sent to {email}",
                "email_id": response.get("id"),
                "invite_link": invite_link
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to send invite email to {email}: {str(e)}")
            logger.error(f"❌ Exception type: {type(e).__name__}")
            logger.error(f"❌ Exception details: {repr(e)}")
            return {
                "success": False,
                "error": f"Failed to send email: {str(e)}"
            }