from fastapi import APIRouter
from . import health, leads, conversation, ai, inventory, dealerships, user_profiles, vonage, telnyx, settings, invites, stripe_webhook, billing
# Commented out: roles route uses legacy RolesService that expects non-existent 'roles' table
# from . import roles

api_router = APIRouter()

# Include all route modules
api_router.include_router(health.router, tags=["health"])
api_router.include_router(leads.router, tags=["leads"])
api_router.include_router(conversation.router, tags=["conversations"])
api_router.include_router(inventory.router, tags=["inventory"])
api_router.include_router(ai.router, tags=["ai"])
api_router.include_router(dealerships.router, tags=["dealerships"])
api_router.include_router(user_profiles.router, tags=["user-profiles"])
api_router.include_router(settings.router, tags=["settings"])
# Commented out: roles route uses legacy RolesService that expects non-existent 'roles' table
# api_router.include_router(roles.router, tags=["roles"])
api_router.include_router(invites.router, tags=["invites"])
api_router.include_router(billing.router, tags=["billing"])
api_router.include_router(vonage.router, prefix="/vonage", tags=["vonage"])
api_router.include_router(telnyx.router, prefix="/telnyx", tags=["telnyx"])
api_router.include_router(stripe_webhook.router, tags=["stripe"]) 