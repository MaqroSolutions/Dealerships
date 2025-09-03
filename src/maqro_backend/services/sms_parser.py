"""
SMS Parser Service for extracting structured data from salesperson messages using LLM
"""
import re
import logging
import json
from typing import Any
import os

try:
    import openai
except ImportError:
    openai = None

logger = logging.getLogger(__name__)


class SMSParser:
    """Service for parsing SMS messages and extracting structured data using LLM"""
    
    def __init__(self):
        """Initialize SMS parser with LLM"""
        if openai is None:
            raise ImportError("OpenAI package not installed. Run: pip install openai")
        
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("OPENAI_API_KEY environment variable is not set. LLM parsing will not work.")
            logger.warning("SMS parsing will fall back to basic pattern matching only.")
            self.api_key = None
        
        if self.api_key:
            try:
                self.client = openai.OpenAI(api_key=self.api_key)
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                self.api_key = None
        else:
            self.client = None
            
        self.model = "gpt-4o-mini"  # Using GPT-4o-mini for cost efficiency
        
        # System prompt for the LLM
        self.system_prompt = """You are an SMS parser for a car dealership. Your job is to extract structured data from salesperson messages and classify the message type.

Extract information for these message types:

1. LEAD CREATION: When a salesperson meets a potential customer
   - Extract: name, phone, email, car_interest, price_range, source
   - Example: "I just met John. His number is 555-1234 and his email is john@email.com. He is interested in a Toyota Camry in the price range of $25K. I met him at the dealership."

2. INVENTORY UPDATE: When a salesperson adds a new vehicle
   - Extract: year, make, model, mileage, condition, price, description, features
   - Example: "I just picked up a 2020 Toyota Camry off auction. It has 45,000 miles. It is in excellent condition. Add it to the inventory."

3. LEAD_INQUIRY: When a salesperson asks about existing leads
   - Extract: lead_identifier (name, phone, or ID), inquiry_type (status, details, follow_up)
   - Example: "What's the status of lead John Smith?" or "Check details for lead #123"

4. INVENTORY_INQUIRY: When a salesperson asks about inventory
   - Extract: search_criteria (make, model, year, price_range), inquiry_type (availability, details, search)
   - Example: "Do we have any Honda Civics in stock?" or "What's the price of the 2020 Camry?"

5. GENERAL_QUESTION: When a salesperson asks general questions
   - Extract: question_topic (schedule, help, information), urgency (high, medium, low)
   - Example: "What's my schedule today?" or "I need help with a customer"

6. STATUS_UPDATE: When a salesperson provides updates on existing leads/opportunities
   - Extract: lead_identifier, update_type (progress, outcome, next_steps), details
   - Example: "Lead John Smith is coming in for test drive tomorrow" or "Customer #123 decided to go with the Honda"

7. TEST_DRIVE_SCHEDULING: When a salesperson receives a text about scheduling a test drive
   - Extract: customer_name, customer_phone, vehicle_interest, preferred_date, preferred_time, special_requests
   - Example: "Customer Sarah wants to test drive the 2020 Toyota Camry tomorrow at 2pm. Her number is 555-1234. She mentioned she has a 2-hour window."

Return ONLY a valid JSON object with the extracted data. If you can't extract certain fields, use null. Always include a "type" field indicating the message type.

For lead creation, the JSON should look like:
{
  "type": "lead_creation",
  "name": "John Doe",
  "phone": "+15551234",
  "email": "john@email.com",
  "car_interest": "Toyota Camry",
  "price_range": "25000",
  "source": "SMS Lead Creation"
}

For inventory updates, the JSON should look like:
{
  "type": "inventory_update",
  "year": 2020,
  "make": "Toyota",
  "model": "Camry",
  "mileage": 45000,
  "condition": "excellent",
  "price": null,
  "description": "excellent condition 2020 Toyota Camry",
  "features": "Condition: excellent"
}

For lead inquiries, the JSON should look like:
{
  "type": "lead_inquiry",
  "lead_identifier": "John Smith",
  "inquiry_type": "status",
  "search_by": "name"
}

For inventory inquiries, the JSON should look like:
{
  "type": "inventory_inquiry",
  "search_criteria": {
    "make": "Honda",
    "model": "Civic",
    "year": null,
    "price_range": null
  },
  "inquiry_type": "availability"
}

For general questions, the JSON should look like:
{
  "type": "general_question",
  "question_topic": "schedule",
  "urgency": "medium",
  "details": "What's my schedule today?"
}

For status updates, the JSON should look like:
{
  "type": "status_update",
  "lead_identifier": "John Smith",
  "update_type": "progress",
  "details": "Coming in for test drive tomorrow"
}

For test drive scheduling, the JSON should look like:
{
  "type": "test_drive_scheduling",
  "customer_name": "Sarah Johnson",
  "customer_phone": "555-1234",
  "vehicle_interest": "2020 Toyota Camry",
  "preferred_date": "tomorrow",
  "preferred_time": "2pm",
  "special_requests": "2-hour window"
}"""

    def parse_message(self, message: str) -> dict[str, Any]:
        """
        Parse SMS message using LLM to determine if it's a lead creation or inventory update
        
        Args:
            message: Raw SMS message text
            
        Returns:
            Dict with parsed data and message type
        """
        message = message.strip()
        
        try:
            # Use LLM to parse the message
            logger.info(f"Attempting to parse message with LLM: {message[:100]}...")
            parsed_data = self._parse_with_llm(message)
            
            if parsed_data and "type" in parsed_data:
                logger.info(f"LLM parsing successful: {parsed_data.get('type')}")
                # Determine confidence based on extracted data quality
                confidence = self._assess_confidence(parsed_data)
                
                return {
                    "type": parsed_data["type"],
                    "data": parsed_data,
                    "confidence": confidence
                }
            else:
                logger.warning("LLM parsing failed, using fallback parsing")
                # Fallback to basic pattern matching if LLM fails
                return self._fallback_parse(message)
                
        except Exception as e:
            logger.error(f"Error parsing message with LLM: {e}")
            # Fallback to basic pattern matching if LLM fails
            return self._fallback_parse(message)
    
    def _parse_with_llm(self, message: str) -> None | dict[str, Any]:
        """Parse message using OpenAI chat completions"""
        if self.client is None:
            logger.warning("OpenAI client not initialized. Cannot parse message with LLM.")
            return None

        try:
            logger.info(f"Sending message to OpenAI for parsing: {message[:100]}...")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"Parse this SMS message: {message}"}
                ],
                temperature=0.1,  # Low temperature for consistent parsing
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            logger.info(f"OpenAI response: {content}")
            
            # Try to extract JSON from the response
            try:
                # Remove any markdown formatting if present
                if content.startswith("```json"):
                    content = content.split("```json")[1].split("```")[0]
                elif content.startswith("```"):
                    content = content.split("```")[1].split("```")[0]
                
                parsed_data = json.loads(content)
                logger.info(f"Successfully parsed JSON: {parsed_data}")
                return parsed_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM response as JSON: {e}")
                logger.error(f"Raw response: {content}")
                return None
                
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None
    
    def _assess_confidence(self, parsed_data: dict[str, Any]) -> str:
        """Assess confidence level based on extracted data quality"""
        if parsed_data["type"] == "lead_creation":
            required_fields = ["name", "phone", "car_interest"]
            extracted_fields = sum(1 for field in required_fields if parsed_data.get(field))
            
            if extracted_fields == len(required_fields):
                return "high"
            elif extracted_fields >= 2:
                return "medium"
            else:
                return "low"
                
        elif parsed_data["type"] == "inventory_update":
            required_fields = ["year", "make", "model"]
            extracted_fields = sum(1 for field in required_fields if parsed_data.get(field))
            
            if extracted_fields == len(required_fields):
                return "high"
            elif extracted_fields >= 2:
                return "medium"
            else:
                return "low"
        
        elif parsed_data["type"] == "lead_inquiry":
            required_fields = ["lead_identifier", "inquiry_type"]
            extracted_fields = sum(1 for field in required_fields if parsed_data.get(field))
            
            if extracted_fields == len(required_fields):
                return "high"
            elif extracted_fields >= 1:
                return "medium"
            else:
                return "low"
        
        elif parsed_data["type"] == "inventory_inquiry":
            required_fields = ["inquiry_type"]
            extracted_fields = sum(1 for field in required_fields if parsed_data.get(field))
            
            if extracted_fields == len(required_fields):
                return "high"
            else:
                return "medium"
        
        elif parsed_data["type"] == "general_question":
            required_fields = ["question_topic"]
            extracted_fields = sum(1 for field in required_fields if parsed_data.get(field))
            
            if extracted_fields == len(required_fields):
                return "high"
            else:
                return "medium"
        
        elif parsed_data["type"] == "status_update":
            required_fields = ["lead_identifier", "update_type"]
            extracted_fields = sum(1 for field in required_fields if parsed_data.get(field))
            
            if extracted_fields == len(required_fields):
                return "high"
            elif extracted_fields >= 1:
                return "medium"
            else:
                return "low"
        
        return "low"
    
    def _fallback_parse(self, message: str) -> dict[str, Any]:
        """Fallback parsing using basic pattern matching if LLM fails"""
        message_lower = message.lower()
        
        # Simple keyword-based fallback for different message types
        if any(word in message_lower for word in ["met", "lead", "customer", "prospect"]):
            # Try to extract basic information from the message
            name = self._extract_name_from_message(message)
            phone = self._extract_phone_from_message(message)
            email = self._extract_email_from_message(message)
            car_interest = self._extract_car_interest_from_message(message)
            price_range = self._extract_price_from_message(message)
            
            return {
                "type": "lead_creation",
                "name": name or "Customer from SMS",
                "phone": phone or "Unknown",
                "email": email or "Not provided",
                "car_interest": car_interest or "Vehicle of interest",
                "price_range": price_range or "Not specified",
                "source": "SMS Lead Creation (Fallback)"
            }
        elif any(word in message_lower for word in ["picked up", "inventory", "vehicle", "car", "add"]):
            # Try to extract basic vehicle information
            year = self._extract_year_from_message(message)
            make = self._extract_make_from_message(message)
            model = self._extract_model_from_message(message)
            mileage = self._extract_mileage_from_message(message)
            condition = self._extract_condition_from_message(message)
            price = self._extract_price_from_message(message)
            
            return {
                "type": "inventory_update",
                "year": year or 2020,
                "make": make or "Vehicle",
                "model": model or "Model",
                "mileage": mileage or 0,
                "condition": condition or "Unknown",
                "price": price or "TBD",
                "description": f"{year or 'Unknown'} {make or 'Vehicle'} {model or 'Model'} from SMS",
                "features": f"Condition: {condition or 'Unknown'}"
            }
        elif any(word in message_lower for word in ["status", "check", "details", "lead", "customer"]) and any(word in message_lower for word in ["what", "how", "?"]):
            return {
                "type": "lead_inquiry",
                "lead_identifier": "Unknown",
                "inquiry_type": "status",
                "search_by": "unknown"
            }
        elif any(word in message_lower for word in ["stock", "available", "have", "price"]) and any(word in message_lower for word in ["what", "how", "?"]):
            return {
                "type": "inventory_inquiry",
                "search_criteria": {
                    "make": "Unknown",
                    "model": "Unknown",
                    "year": None,
                    "price_range": None
                },
                "inquiry_type": "availability"
            }
        elif any(word in message_lower for word in ["schedule", "help", "need", "question"]) or "?" in message:
            return {
                "type": "general_question",
                "question_topic": "general",
                "urgency": "medium",
                "details": message
            }
        elif any(word in message_lower for word in ["update", "progress", "coming", "decided", "test drive"]):
            return {
                "type": "status_update",
                "lead_identifier": "Unknown",
                "update_type": "progress",
                "details": message
            }
        elif any(word in message_lower for word in ["test drive", "schedule", "appointment"]) and any(word in message_lower for word in ["customer", "wants", "interested"]):
            return {
                "type": "test_drive_scheduling",
                "customer_name": "Unknown",
                "customer_phone": "Unknown",
                "vehicle_interest": "Unknown",
                "preferred_date": "Unknown",
                "preferred_time": "Unknown",
                "special_requests": "None"
            }
        
        return {
            "type": "unknown"
        }
    
    def _extract_name_from_message(self, message: str) -> None | str:
        """Extract a potential name from the message"""
        import re
        
        # Look for capitalized words that might be names
        # Common patterns: "I just met [Name]", "Met [Name]", "Customer [Name]"
        patterns = [
            r"I just met (\w+)",
            r"Met (\w+)",
            r"Customer (\w+)",
            r"(\w+) wants to",
            r"(\w+) is interested"
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                name = match.group(1)
                # Check if it's a reasonable name (not a common word)
                if len(name) > 2 and name.lower() not in ['the', 'and', 'for', 'with', 'from', 'this', 'that']:
                    return name
        
        return None
    
    def _extract_phone_from_message(self, message: str) -> None | str:
        """Extract phone number from the message"""
        import re
        
        # Look for phone number patterns
        phone_patterns = [
            r"(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})",  # 555-123-4567
            r"\((\d{3})\)\s*\d{3}[-.\s]?\d{4}",   # (555) 123-4567
            r"(\d{10,11})"                         # 5551234567
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, message)
            if match:
                phone = match.group(1)
                # Clean the phone number
                clean_phone = re.sub(r'[^\d]', '', phone)
                if len(clean_phone) >= 10:
                    return self._clean_phone(clean_phone)
        
        return None
    
    def _extract_email_from_message(self, message: str) -> None | str:
        """Extract email address from the message"""
        import re
        
        # Look for email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, message)
        
        if match:
            return match.group(0)
        
        return None
    
    def _extract_car_interest_from_message(self, message: str) -> None | str:
        """Extract car interest from the message"""
        import re
        
        # Look for car-related keywords
        car_keywords = [
            'toyota', 'honda', 'ford', 'chevrolet', 'nissan', 'bmw', 'mercedes', 'audi',
            'subaru', 'mazda', 'hyundai', 'kia', 'volkswagen', 'jeep', 'dodge', 'chrysler',
            'sedan', 'suv', 'truck', 'hatchback', 'wagon', 'convertible', 'coupe'
        ]
        
        message_lower = message.lower()
        found_interests = []
        
        for keyword in car_keywords:
            if keyword in message_lower:
                found_interests.append(keyword.title())
        
        if found_interests:
            return ', '.join(found_interests)
        
        return None
    
    def _extract_price_from_message(self, message: str) -> None | str:
        """Extract price information from the message"""
        import re
        
        # Look for price patterns
        price_patterns = [
            r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)',  # $25,000 or $25.50
            r'(\d+)K',                           # 25K
            r'(\d+)k',                           # 25k
            r'around \$(\d+)',                   # around $25,000
            r'price range.*?(\d+)',              # price range of $25
        ]
        
        for pattern in price_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                price = match.group(1)
                if 'K' in pattern or 'k' in pattern:
                    # Convert K notation to full price
                    try:
                        value = int(price) * 1000
                        return f"${value:,}"
                    except ValueError:
                        continue
                else:
                    return f"${price}"
        
        return None
    
    def _extract_year_from_message(self, message: str) -> None | int:
        """Extract year from the message"""
        import re
        
        # Look for year patterns (4-digit years)
        year_pattern = r'\b(19|20)\d{2}\b'
        match = re.search(year_pattern, message)
        
        if match:
            try:
                return int(match.group(0))
            except ValueError:
                pass
        
        return None
    
    def _extract_make_from_message(self, message: str) -> None | str:
        """Extract vehicle make from the message"""
        import re
        
        # Look for common vehicle makes
        makes = [
            'toyota', 'honda', 'ford', 'chevrolet', 'nissan', 'bmw', 'mercedes', 'audi',
            'subaru', 'mazda', 'hyundai', 'kia', 'volkswagen', 'jeep', 'dodge', 'chrysler'
        ]
        
        message_lower = message.lower()
        for make in makes:
            if make in message_lower:
                return make.title()
        
        return None
    
    def _extract_model_from_message(self, message: str) -> None | str:
        """Extract vehicle model from the message"""
        import re
        
        # Look for common vehicle models
        models = [
            'camry', 'civic', 'accord', 'corolla', 'f-150', 'silverado', 'altima', 'sentra',
            '3 series', 'c-class', 'a4', 'outback', 'cx-5', 'tucson', 'sportage', 'golf'
        ]
        
        message_lower = message.lower()
        for model in models:
            if model in message_lower:
                return model.title()
        
        return None
    
    def _extract_mileage_from_message(self, message: str) -> None | int:
        """Extract mileage from the message"""
        import re
        
        # Look for mileage patterns
        mileage_patterns = [
            r'(\d+(?:,\d{3})*)\s*miles?',  # 45,000 miles
            r'(\d+)\s*miles?',              # 45000 miles
            r'(\d+(?:,\d{3})*)\s*mi',       # 45,000 mi
        ]
        
        for pattern in mileage_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                mileage_str = match.group(1).replace(',', '')
                try:
                    return int(mileage_str)
                except ValueError:
                    pass
        
        return None
    
    def _extract_condition_from_message(self, message: str) -> None | str:
        """Extract vehicle condition from the message"""
        import re
        
        # Look for condition keywords
        conditions = [
            'excellent', 'good', 'fair', 'poor', 'like new', 'new', 'used', 'pre-owned'
        ]
        
        message_lower = message.lower()
        for condition in conditions:
            if condition in message_lower:
                return condition.title()
        
        return None
    
    def _clean_phone(self, phone: str) -> str:
        """Clean and normalize phone number"""
        if not phone:
            return None
            
        # Remove all non-digit characters
        digits = re.sub(r'[^\d]', '', phone)
        
        # Handle different formats
        if len(digits) == 10:
            return f"+1{digits}"
        elif len(digits) == 11 and digits.startswith('1'):
            return f"+{digits}"
        elif len(digits) > 11:
            # International number, keep as is
            return f"+{digits}"
        else:
            # Return as is if can't parse
            return phone.strip()
    
    def _parse_price(self, price_str: str) -> None | str:
        """Parse price string and return standardized format"""
        if not price_str:
            return None
        
        # Remove common characters
        clean_price = price_str.replace('$', '').replace(',', '').strip()
        
        # Handle K notation (thousands)
        if clean_price.upper().endswith('K'):
            try:
                value = float(clean_price[:-1]) * 1000
                return f"{value:.0f}"
            except ValueError:
                return clean_price
        
        # Try to parse as number
        try:
            value = float(clean_price)
            return f"{value:.0f}"
        except ValueError:
            return clean_price
    
    def _parse_mileage(self, mileage_str: str) -> None | int:
        """Parse mileage string and return integer"""
        if not mileage_str:
            return None
        
        try:
            # Remove commas and convert to int
            clean_mileage = mileage_str.replace(',', '')
            return int(clean_mileage)
        except ValueError:
            return None


# Global instance
sms_parser = SMSParser()
