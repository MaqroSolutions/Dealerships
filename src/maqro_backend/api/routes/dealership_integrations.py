"""
Dealership Integration Management API routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from pydantic import BaseModel

from maqro_backend.api.deps import get_db_session, get_user_dealership_id, require_dealership_manager
from maqro_backend.services.dealership_phone_mapping import dealership_phone_mapping_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class PhoneMappingRequest(BaseModel):
    phone_numbers: List[str]
    integration_type: str = "whatsapp"  # "whatsapp" or "vonage"


class PhoneMappingResponse(BaseModel):
    dealership_id: str
    integration_type: str
    phone_numbers: List[str]
    success: bool
    message: str


@router.post("/dealerships/phone-mappings", response_model=PhoneMappingResponse)
async def set_dealership_phone_mapping(
    request: PhoneMappingRequest,
    db: AsyncSession = Depends(get_db_session),
    dealership_id: str = Depends(require_dealership_manager)
):
    """
    Set phone number mappings for a dealership's integrations.
    
    This allows the system to determine which dealership a phone number belongs to
    when receiving WhatsApp or SMS messages.
    
    Required permissions: Dealership manager or admin
    """
    try:
        logger.info(f"Setting {request.integration_type} phone mappings for dealership {dealership_id}")
        
        success = await dealership_phone_mapping_service.set_dealership_phone_mapping(
            session=db,
            dealership_id=dealership_id,
            phone_numbers=request.phone_numbers,
            integration_type=request.integration_type
        )
        
        if success:
            return PhoneMappingResponse(
                dealership_id=dealership_id,
                integration_type=request.integration_type,
                phone_numbers=request.phone_numbers,
                success=True,
                message=f"Successfully set {request.integration_type} phone mappings"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to set phone mappings"
            )
            
    except Exception as e:
        logger.error(f"Error setting phone mappings: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error setting phone mappings: {str(e)}"
        )


@router.get("/dealerships/phone-mappings/{integration_type}")
async def get_dealership_phone_mapping(
    integration_type: str,
    db: AsyncSession = Depends(get_db_session),
    dealership_id: str = Depends(get_user_dealership_id)
):
    """
    Get phone number mappings for a dealership's integration.
    
    Args:
        integration_type: "whatsapp" or "vonage"
    """
    try:
        # Get dealership integration config
        from maqro_backend.crud import get_dealership_by_id
        
        dealership = await get_dealership_by_id(session=db, dealership_id=dealership_id)
        if not dealership:
            raise HTTPException(status_code=404, detail="Dealership not found")
        
        config = dealership.integration_config or {}
        integration_config = config.get(integration_type, {})
        phone_numbers = integration_config.get("phone_numbers", [])
        
        return {
            "dealership_id": dealership_id,
            "integration_type": integration_type,
            "phone_numbers": phone_numbers,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error getting phone mappings: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error getting phone mappings: {str(e)}"
        )


@router.delete("/dealerships/phone-mappings/{integration_type}")
async def clear_dealership_phone_mapping(
    integration_type: str,
    db: AsyncSession = Depends(get_db_session),
    dealership_id: str = Depends(require_dealership_manager)
):
    """
    Clear phone number mappings for a dealership's integration.
    
    Required permissions: Dealership manager or admin
    """
    try:
        logger.info(f"Clearing {integration_type} phone mappings for dealership {dealership_id}")
        
        success = await dealership_phone_mapping_service.set_dealership_phone_mapping(
            session=db,
            dealership_id=dealership_id,
            phone_numbers=[],
            integration_type=integration_type
        )
        
        if success:
            return {
                "dealership_id": dealership_id,
                "integration_type": integration_type,
                "phone_numbers": [],
                "success": True,
                "message": f"Successfully cleared {integration_type} phone mappings"
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to clear phone mappings"
            )
            
    except Exception as e:
        logger.error(f"Error clearing phone mappings: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error clearing phone mappings: {str(e)}"
        )
