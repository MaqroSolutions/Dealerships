from .lead import LeadCreate, LeadResponse, LeadUpdate
from .conversation import MessageCreate, ConversationResponse
from .ai import AIResponseRequest, GeneralAIRequest, AIResponse, VehicleSearchResponse
from .inventory import InventoryCreate, InventoryResponse, InventoryUpdate
from .dealership import DealershipCreate, DealershipResponse, DealershipUpdate
from .user_profile import (
    UserProfileCreate, 
    UserProfileResponse, 
    UserProfileUpdate,
    UserProfileWithRoleResponse,
    UserProfileLegacyResponse
)
from .settings import (
    SettingDefinitionResponse,
    DealershipSettingResponse,
    DealershipSettingUpdate,
    DealershipSettingCreate,
    UserSettingResponse,
    UserSettingUpdate,
    UserSettingCreate,
    EffectiveSettingResponse,
    SettingsValidationError
)
from .roles import (
    RoleResponse,
    UserRoleResponse,
    UserRoleCreate,
    UserRoleUpdate,
    UserWithRoleResponse,
    DealershipUsersResponse,
    RolePermissionCheck
)

__all__ = [
    # Legacy schemas
    "LeadCreate", 
    "LeadResponse",
    "LeadUpdate",
    "MessageCreate", 
    "ConversationResponse",
    "AIResponseRequest",
    "GeneralAIRequest", 
    "AIResponse",
    "VehicleSearchResponse",
    "InventoryCreate", 
    "InventoryResponse", 
    "InventoryUpdate",
    "DealershipCreate", 
    "DealershipResponse", 
    "DealershipUpdate",
    
    # User profile schemas
    "UserProfileCreate", 
    "UserProfileResponse", 
    "UserProfileUpdate",
    "UserProfileWithRoleResponse",
    "UserProfileLegacyResponse",
    
    # Settings schemas
    "SettingDefinitionResponse",
    "DealershipSettingResponse",
    "DealershipSettingUpdate",
    "DealershipSettingCreate",
    "UserSettingResponse",
    "UserSettingUpdate",
    "UserSettingCreate",
    "EffectiveSettingResponse",
    "SettingsValidationError",
    
    # Role schemas
    "RoleResponse",
    "UserRoleResponse",
    "UserRoleCreate",
    "UserRoleUpdate",
    "UserWithRoleResponse",
    "DealershipUsersResponse",
    "RolePermissionCheck"
]