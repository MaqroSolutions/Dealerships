"""
Unit tests for Marketcheck service
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from maqro_backend.services.marketcheck_service import (
    MarketcheckService, 
    DealerAddress, 
    MarketcheckVehicle
)


class TestMarketcheckService:
    """Test cases for MarketcheckService"""

    @pytest.fixture
    def marketcheck_service(self):
        """Create a MarketcheckService instance for testing"""
        with patch.dict('os.environ', {'MARKETCHECK_API_KEY': 'test_api_key'}):
            return MarketcheckService()

    @pytest.fixture
    def sample_address(self):
        """Sample dealer address for testing"""
        return DealerAddress(
            street="123 Main Street",
            city="Beverly Hills",
            state="CA",
            zip="90210",
            dealer_name="ABC Motors"
        )

    @pytest.fixture
    def sample_dealer_response(self):
        """Sample dealer lookup response"""
        return {
            "dealers": [
                {
                    "id": "12345",
                    "name": "ABC Motors",
                    "address": "123 Main Street, Beverly Hills, CA 90210"
                }
            ]
        }

    @pytest.fixture
    def sample_inventory_response(self):
        """Sample inventory response"""
        return {
            "listings": [
                {
                    "id": "vehicle_1",
                    "build": {
                        "make": "Toyota",
                        "model": "Camry",
                        "year": 2023,
                        "body_type": "Sedan",
                        "fuel_type": "Gasoline",
                        "transmission": "Automatic"
                    },
                    "price": {
                        "value": 25000
                    },
                    "miles": {
                        "value": 15000
                    },
                    "condition": "Excellent",
                    "stock_no": "ABC123",
                    "vin": "1HGBH41JXMN109186",
                    "media": {
                        "photo_links": [
                            "https://example.com/image1.jpg",
                            "https://example.com/image2.jpg"
                        ]
                    }
                }
            ]
        }

    @pytest.mark.asyncio
    async def test_find_dealer_id_success(self, marketcheck_service, sample_address, sample_dealer_response):
        """Test successful dealer ID lookup"""
        with patch('httpx.AsyncClient') as mock_client:
            # Mock the HTTP response
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = sample_dealer_response
            
            # Mock the client context manager
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            dealer_id = await marketcheck_service.find_dealer_id(sample_address)
            
            assert dealer_id == "12345"
            mock_client_instance.get.assert_called_once()

    @pytest.mark.asyncio
    async def test_find_dealer_id_no_dealers_found(self, marketcheck_service, sample_address):
        """Test dealer lookup when no dealers are found"""
        with patch('httpx.AsyncClient') as mock_client:
            # Mock empty response
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"dealers": []}
            
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            with pytest.raises(Exception, match="No dealer found"):
                await marketcheck_service.find_dealer_id(sample_address)

    @pytest.mark.asyncio
    async def test_get_active_inventory_success(self, marketcheck_service, sample_inventory_response):
        """Test successful inventory fetch"""
        with patch('httpx.AsyncClient') as mock_client:
            # Mock the HTTP response
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = sample_inventory_response
            
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            inventory = await marketcheck_service.get_active_inventory("12345")
            
            assert len(inventory) == 1
            vehicle = inventory[0]
            assert vehicle.make == "Toyota"
            assert vehicle.model == "Camry"
            assert vehicle.year == 2023
            assert vehicle.price == "25000"
            assert vehicle.mileage == 15000
            assert vehicle.condition == "Excellent"
            assert vehicle.stock_number == "ABC123"
            assert vehicle.vin == "1HGBH41JXMN109186"

    @pytest.mark.asyncio
    async def test_get_active_inventory_empty(self, marketcheck_service):
        """Test inventory fetch when no inventory is found"""
        with patch('httpx.AsyncClient') as mock_client:
            # Mock empty response
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {"listings": []}
            
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            inventory = await marketcheck_service.get_active_inventory("12345")
            
            assert inventory == []

    @pytest.mark.asyncio
    async def test_fetch_inventory_by_address_success(self, marketcheck_service, sample_address, sample_dealer_response, sample_inventory_response):
        """Test complete workflow: find dealer and fetch inventory"""
        with patch('httpx.AsyncClient') as mock_client:
            # Mock both responses
            mock_response = MagicMock()
            mock_response.status_code = 200
            
            # First call returns dealer data, second call returns inventory data
            mock_response.json.side_effect = [sample_dealer_response, sample_inventory_response]
            
            mock_client_instance = AsyncMock()
            mock_client_instance.get.return_value = mock_response
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            inventory = await marketcheck_service.fetch_inventory_by_address(sample_address)
            
            assert len(inventory) == 1
            assert inventory[0].make == "Toyota"
            # Verify both API calls were made
            assert mock_client_instance.get.call_count == 2

    def test_parse_listing_complete_data(self, marketcheck_service, sample_inventory_response):
        """Test parsing a complete listing"""
        listing = sample_inventory_response["listings"][0]
        vehicle = marketcheck_service._parse_listing(listing)
        
        assert vehicle.make == "Toyota"
        assert vehicle.model == "Camry"
        assert vehicle.year == 2023
        assert vehicle.price == "25000"
        assert vehicle.mileage == 15000
        assert vehicle.condition == "Excellent"
        assert vehicle.stock_number == "ABC123"
        assert vehicle.vin == "1HGBH41JXMN109186"
        assert vehicle.images == ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
        assert vehicle.body_type == "Sedan"
        assert vehicle.fuel_type == "Gasoline"
        assert vehicle.transmission == "Automatic"

    def test_parse_listing_minimal_data(self, marketcheck_service):
        """Test parsing a listing with minimal data"""
        listing = {
            "build": {
                "make": "Honda",
                "model": "Civic",
                "year": 2022
            }
        }
        
        vehicle = marketcheck_service._parse_listing(listing)
        
        assert vehicle.make == "Honda"
        assert vehicle.model == "Civic"
        assert vehicle.year == 2022
        assert vehicle.price is None
        assert vehicle.mileage is None
        assert vehicle.condition is None
        assert vehicle.stock_number is None
        assert vehicle.vin is None
        assert vehicle.images == []

    def test_service_initialization_without_api_key(self):
        """Test that service raises error without API key"""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="MARKETCHECK_API_KEY environment variable is required"):
                MarketcheckService()

    def test_service_initialization_with_api_key(self):
        """Test that service initializes correctly with API key"""
        with patch.dict('os.environ', {'MARKETCHECK_API_KEY': 'test_key'}):
            service = MarketcheckService()
            assert service.api_key == 'test_key'
            assert service.base_url == "https://marketcheck-prod.apigee.net/v2"
