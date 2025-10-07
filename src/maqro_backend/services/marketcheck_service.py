"""
Marketcheck API service for fetching dealership inventory data
"""
import os
import httpx
import logging
from typing import List, Dict, Optional, Any
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class DealerAddress(BaseModel):
    """Address model for dealer lookup"""
    street: Optional[str] = None
    city: str
    state: str
    zip: str
    dealer_name: Optional[str] = None

class MarketcheckVehicle(BaseModel):
    """Marketcheck vehicle data model"""
    id: Optional[str] = None
    make: str
    model: str
    year: int
    price: Optional[str] = None
    mileage: Optional[int] = None
    description: Optional[str] = None
    features: Optional[str] = None
    condition: Optional[str] = None
    stock_number: Optional[str] = None
    images: Optional[List[str]] = None
    vin: Optional[str] = None
    body_type: Optional[str] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    drivetrain: Optional[str] = None
    engine: Optional[str] = None
    exterior_color: Optional[str] = None
    interior_color: Optional[str] = None

class MarketcheckService:
    """Service for interacting with Marketcheck API"""
    
    def __init__(self):
        self.api_key = os.getenv("MARKETCHECK_API_KEY")
        self.base_url = "https://marketcheck-prod.apigee.net/v2"
        
        if not self.api_key:
            raise ValueError("MARKETCHECK_API_KEY environment variable is required")
    
    async def find_dealer_id(self, address: DealerAddress) -> str:
        """
        Find dealer ID using address information
        
        Args:
            address: DealerAddress object with location details
            
        Returns:
            str: Dealer ID
            
        Raises:
            Exception: If dealer not found or API error
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "api_key": self.api_key,
                    "city": address.city,
                    "state": address.state,
                    "zip": address.zip,
                }
                
                # Add optional parameters if provided
                if address.street:
                    params["street"] = address.street
                if address.dealer_name:
                    params["dealer_name"] = address.dealer_name
                
                logger.info(f"Searching for dealer at {address.city}, {address.state} {address.zip}")
                
                response = await client.get(
                    f"{self.base_url}/dealers/car",
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Marketcheck API error: {response.status_code} - {response.text}")
                    raise Exception(f"Failed to find dealer: API returned {response.status_code}")
                
                data = response.json()
                
                if not data.get("dealers") or len(data["dealers"]) == 0:
                    raise Exception(f"No dealer found at {address.city}, {address.state} {address.zip}")
                
                # Get the first dealer (most relevant)
                dealer = data["dealers"][0]
                dealer_id = dealer.get("id")
                
                if not dealer_id:
                    raise Exception("Dealer ID not found in API response")
                
                logger.info(f"Found dealer: {dealer.get('name', 'Unknown')} (ID: {dealer_id})")
                return str(dealer_id)
                
        except httpx.RequestError as e:
            logger.error(f"Network error finding dealer: {e}")
            raise Exception("Network error while searching for dealer")
        except Exception as e:
            logger.error(f"Error finding dealer: {e}")
            raise
    
    async def get_active_inventory(self, dealer_id: str, limit: int = 50) -> List[MarketcheckVehicle]:
        """
        Get active inventory for a dealer
        
        Args:
            dealer_id: Marketcheck dealer ID
            limit: Maximum number of vehicles to fetch (default 50)
            
        Returns:
            List[MarketcheckVehicle]: List of vehicles in active inventory
            
        Raises:
            Exception: If API error or no inventory found
        """
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "api_key": self.api_key,
                    "rows": limit
                }
                
                logger.info(f"Fetching active inventory for dealer {dealer_id}")
                
                response = await client.get(
                    f"{self.base_url}/dealer/{dealer_id}/active",
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Marketcheck API error: {response.status_code} - {response.text}")
                    raise Exception(f"Failed to fetch inventory: API returned {response.status_code}")
                
                data = response.json()
                listings = data.get("listings", [])
                
                if not listings:
                    logger.warning(f"No active inventory found for dealer {dealer_id}")
                    return []
                
                vehicles = []
                for listing in listings:
                    try:
                        vehicle = self._parse_listing(listing)
                        vehicles.append(vehicle)
                    except Exception as e:
                        logger.warning(f"Failed to parse listing: {e}")
                        continue
                
                logger.info(f"Successfully fetched {len(vehicles)} vehicles from Marketcheck")
                return vehicles
                
        except httpx.RequestError as e:
            logger.error(f"Network error fetching inventory: {e}")
            raise Exception("Network error while fetching inventory")
        except Exception as e:
            logger.error(f"Error fetching inventory: {e}")
            raise
    
    def _parse_listing(self, listing: Dict[str, Any]) -> MarketcheckVehicle:
        """
        Parse a Marketcheck listing into our vehicle model
        
        Args:
            listing: Raw listing data from Marketcheck API
            
        Returns:
            MarketcheckVehicle: Parsed vehicle data
        """
        # Extract basic vehicle information
        build = listing.get("build", {})
        price_info = listing.get("price", {})
        mileage_info = listing.get("miles", {})
        
        # Parse price - handle different formats
        price = None
        if price_info:
            price_value = price_info.get("value")
            if price_value is not None:
                price = str(price_value)
        
        # Parse mileage
        mileage = None
        if mileage_info:
            mileage_value = mileage_info.get("value")
            if mileage_value is not None:
                mileage = int(mileage_value)
        
        # Extract images
        images = []
        media = listing.get("media", {})
        if media:
            photo_links = media.get("photo_links", [])
            if photo_links:
                images = photo_links[:5]  # Limit to first 5 images
        
        # Build description from available data
        description_parts = []
        if build.get("body_type"):
            description_parts.append(f"{build['body_type']}")
        if build.get("fuel_type"):
            description_parts.append(f"{build['fuel_type']}")
        if build.get("transmission"):
            description_parts.append(f"{build['transmission']}")
        
        description = ", ".join(description_parts) if description_parts else None
        
        return MarketcheckVehicle(
            id=listing.get("id"),
            make=build.get("make", ""),
            model=build.get("model", ""),
            year=int(build.get("year", 0)),
            price=price,
            mileage=mileage,
            description=description,
            features=None,  # Marketcheck doesn't provide detailed features
            condition=listing.get("condition"),
            stock_number=listing.get("stock_no"),
            images=images,
            vin=listing.get("vin"),
            body_type=build.get("body_type"),
            fuel_type=build.get("fuel_type"),
            transmission=build.get("transmission"),
            drivetrain=build.get("drivetrain"),
            engine=build.get("engine"),
            exterior_color=build.get("exterior_color"),
            interior_color=build.get("interior_color")
        )
    
    async def fetch_inventory_by_address(self, address: DealerAddress) -> List[MarketcheckVehicle]:
        """
        Complete workflow: find dealer ID and fetch their active inventory
        
        Args:
            address: DealerAddress object with location details
            
        Returns:
            List[MarketcheckVehicle]: List of vehicles in active inventory
            
        Raises:
            Exception: If any step fails
        """
        try:
            # Step 1: Find dealer ID
            dealer_id = await self.find_dealer_id(address)
            
            # Step 2: Fetch active inventory
            inventory = await self.get_active_inventory(dealer_id)
            
            return inventory
            
        except Exception as e:
            logger.error(f"Error in fetch_inventory_by_address: {e}")
            raise

# Global instance
marketcheck_service = MarketcheckService()
