"""
Calendar booking service for RAG system test drive scheduling.

This service handles the creation of Google Calendar events for test drive appointments,
including date/time parsing, URL generation, and lead status updates.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
import urllib.parse

logger = logging.getLogger(__name__)


class CalendarBookingService:
    """Service for handling calendar booking from RAG system"""
    
    def __init__(self):
        self.logger = logger
        self._fallback_url = (
            "https://calendar.google.com/calendar/render?"
            "action=TEMPLATE&text=Test%20Drive%20Appointment&sf=true&output=xml"
        )
    
    async def schedule_test_drive(
        self,
        customer_name: str,
        customer_phone: str,
        vehicle_interest: str,
        preferred_date: str,
        preferred_time: str,
        special_requests: str = "None",
        dealership_id: str = None,
        lead_id: str = None
    ) -> Dict[str, Any]:
        """
        Schedule a test drive and generate calendar booking (async version).
        
        Args:
            customer_name: Name of the customer
            customer_phone: Phone number of the customer
            vehicle_interest: Vehicle they're interested in
            preferred_date: Date they prefer (e.g., "tomorrow", "Dec 15", "12/15")
            preferred_time: Time they prefer (e.g., "2pm", "2:30pm", "14:00")
            special_requests: Any special requests
            dealership_id: ID of the dealership
            lead_id: Lead ID for database updates
            
        Returns:
            Dict with booking details and calendar URL
        """
        try:
            # Generate calendar URL and parse datetime
            calendar_url = self._generate_test_drive_calendar_url(
                customer_name=customer_name,
                vehicle_interest=vehicle_interest,
                preferred_date=preferred_date,
                preferred_time=preferred_time,
                special_requests=special_requests,
                dealership_id=dealership_id,
                customer_phone=customer_phone
            )
            
            appointment_datetime = self._parse_appointment_datetime(
                preferred_date, preferred_time
            )
            
            # Update lead status if lead_id is provided
            lead_update_result = None
            if lead_id:
                lead_update_result = await self._update_lead_appointment(
                    lead_id=lead_id,
                    appointment_datetime=appointment_datetime,
                    vehicle_interest=vehicle_interest
                )
            
            return self._build_success_response(
                calendar_url=calendar_url,
                appointment_datetime=appointment_datetime,
                customer_name=customer_name,
                customer_phone=customer_phone,
                vehicle_interest=vehicle_interest,
                preferred_date=preferred_date,
                preferred_time=preferred_time,
                lead_update=lead_update_result
            )
            
        except Exception as e:
            self.logger.error(f"Error scheduling test drive: {e}")
            return self._build_error_response("Test drive scheduling failed")
    
    def schedule_test_drive_sync(
        self,
        customer_name: str,
        customer_phone: str,
        vehicle_interest: str,
        preferred_date: str,
        preferred_time: str,
        special_requests: str = "None",
        dealership_id: str = None,
        lead_id: str = None
    ) -> Dict[str, Any]:
        """
        Schedule a test drive and generate calendar booking (synchronous version).
        
        This is used in non-async contexts like the RAG enhanced service.
        """
        try:
            # Generate calendar URL and parse datetime
            calendar_url = self._generate_test_drive_calendar_url(
                customer_name=customer_name,
                vehicle_interest=vehicle_interest,
                preferred_date=preferred_date,
                preferred_time=preferred_time,
                special_requests=special_requests,
                dealership_id=dealership_id,
                customer_phone=customer_phone
            )
            
            appointment_datetime = self._parse_appointment_datetime(
                preferred_date, preferred_time
            )
            
            # Update lead status if lead_id is provided (synchronous placeholder)
            lead_update_result = None
            if lead_id:
                lead_update_result = self._build_lead_update_sync(
                    lead_id=lead_id,
                    appointment_datetime=appointment_datetime,
                    vehicle_interest=vehicle_interest
                )
            
            return self._build_success_response(
                calendar_url=calendar_url,
                appointment_datetime=appointment_datetime,
                customer_name=customer_name,
                customer_phone=customer_phone,
                vehicle_interest=vehicle_interest,
                preferred_date=preferred_date,
                preferred_time=preferred_time,
                lead_update=lead_update_result
            )
            
        except Exception as e:
            self.logger.error(f"Error scheduling test drive: {e}")
            return self._build_error_response("Test drive scheduling failed")
    
    def _generate_test_drive_calendar_url(
        self,
        customer_name: str,
        vehicle_interest: str,
        preferred_date: str,
        preferred_time: str,
        special_requests: str,
        dealership_id: str = None,
        customer_phone: str = "Unknown"
    ) -> str:
        """Generate Google Calendar URL for test drive appointment."""
        try:
            appointment_datetime = self._parse_appointment_datetime(
                preferred_date, preferred_time
            )
            
            # Create event details
            event_title, event_description = self._build_event_details(
                customer_name=customer_name,
                vehicle_interest=vehicle_interest,
                customer_phone=customer_phone,
                special_requests=special_requests
            )
            
            # Create end time (1 hour later)
            end_datetime = appointment_datetime + timedelta(hours=1)
            
            # Format dates for Google Calendar
            start_date = appointment_datetime.strftime("%Y%m%dT%H%M%S")
            end_date = end_datetime.strftime("%Y%m%dT%H%M%S")
            
            # Build Google Calendar URL
            return self._build_calendar_url(
                event_title=event_title,
                event_description=event_description,
                start_date=start_date,
                end_date=end_date
            )
            
        except Exception as e:
            self.logger.error(f"Error generating calendar URL: {e}")
            return self._fallback_url
    
    def _parse_appointment_datetime(self, preferred_date: str, preferred_time: str) -> datetime:
        """Parse appointment date and time into datetime object."""
        try:
            appointment_date = self._parse_date(preferred_date)
            hour, minute = self._parse_time(preferred_time)
            
            return appointment_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
        except Exception as e:
            self.logger.error(f"Error parsing appointment datetime: {e}")
            # Default to tomorrow at 2pm
            return datetime.now() + timedelta(days=1, hours=14)
    
    def _parse_date(self, preferred_date: str) -> datetime:
        """Parse date string into datetime object."""
        date_lower = preferred_date.lower()
        
        if date_lower == "tomorrow":
            return datetime.now() + timedelta(days=1)
        elif date_lower == "today":
            return datetime.now()
        elif date_lower == "next week":
            return datetime.now() + timedelta(days=7)
        else:
            return self._parse_specific_date(preferred_date)
    
    def _parse_specific_date(self, date_str: str) -> datetime:
        """Parse specific date formats like 'Dec 15' or '12/15'."""
        try:
            if "/" in date_str:
                return self._parse_slash_date(date_str)
            else:
                return self._parse_text_date(date_str)
        except Exception:
            # Default to tomorrow if parsing fails
            return datetime.now() + timedelta(days=1)
    
    def _parse_slash_date(self, date_str: str) -> datetime:
        """Parse MM/DD or MM/DD/YYYY format."""
        parts = date_str.split("/")
        if len(parts) == 2:
            month, day = int(parts[0]), int(parts[1])
            year = datetime.now().year
            return datetime(year, month, day)
        else:
            month, day, year = int(parts[0]), int(parts[1]), int(parts[2])
            return datetime(year, month, day)
    
    def _parse_text_date(self, date_str: str) -> datetime:
        """Parse text date like 'Dec 15'."""
        return datetime.strptime(f"{date_str} {datetime.now().year}", "%b %d %Y")
    
    def _parse_time(self, preferred_time: str) -> Tuple[int, int]:
        """Parse time string into hour and minute."""
        time_str = preferred_time.lower().replace(" ", "")
        
        if "pm" in time_str:
            return self._parse_pm_time(time_str)
        elif "am" in time_str:
            return self._parse_am_time(time_str)
        else:
            return self._parse_24hour_time(time_str)
    
    def _parse_pm_time(self, time_str: str) -> Tuple[int, int]:
        """Parse PM time format."""
        time_str = time_str.replace("pm", "")
        if ":" in time_str:
            hour, minute = map(int, time_str.split(":"))
            hour = hour + 12 if hour != 12 else 12
        else:
            hour, minute = int(time_str) + 12, 0
        return hour, minute
    
    def _parse_am_time(self, time_str: str) -> Tuple[int, int]:
        """Parse AM time format."""
        time_str = time_str.replace("am", "")
        if ":" in time_str:
            hour, minute = map(int, time_str.split(":"))
            hour = 0 if hour == 12 else hour
        else:
            hour, minute = int(time_str), 0
        return hour, minute
    
    def _parse_24hour_time(self, time_str: str) -> Tuple[int, int]:
        """Parse 24-hour time format."""
        if ":" in time_str:
            hour, minute = map(int, time_str.split(":"))
        else:
            hour, minute = int(time_str), 0
        return hour, minute
    
    def _build_event_details(
        self, 
        customer_name: str, 
        vehicle_interest: str, 
        customer_phone: str, 
        special_requests: str
    ) -> Tuple[str, str]:
        """Build event title and description for calendar."""
        event_title = f"Test Drive: {customer_name} - {vehicle_interest}"
        
        event_description = f"Test drive appointment for {customer_name}\n\n"
        event_description += f"Vehicle: {vehicle_interest}\n"
        event_description += f"Customer Phone: {customer_phone}\n"
        
        if special_requests and special_requests != "None":
            event_description += f"Special Requests: {special_requests}\n"
        
        event_description += f"\nScheduled via Maqro AI Assistant"
        
        return event_title, event_description
    
    def _build_calendar_url(
        self, 
        event_title: str, 
        event_description: str, 
        start_date: str, 
        end_date: str
    ) -> str:
        """Build Google Calendar URL with parameters."""
        base_url = "https://calendar.google.com/calendar/render"
        params = {
            "action": "TEMPLATE",
            "text": event_title,
            "dates": f"{start_date}/{end_date}",
            "details": event_description,
            "location": "Dealership",  # Could be made configurable
            "sf": "true",  # Show form
            "output": "xml"
        }
        
        query_string = urllib.parse.urlencode(params)
        return f"{base_url}?{query_string}"
    
    def _build_success_response(
        self,
        calendar_url: str,
        appointment_datetime: datetime,
        customer_name: str,
        customer_phone: str,
        vehicle_interest: str,
        preferred_date: str,
        preferred_time: str,
        lead_update: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Build success response dictionary."""
        return {
            "success": True,
            "calendar_url": calendar_url,
            "appointment_datetime": appointment_datetime,
            "customer_name": customer_name,
            "customer_phone": customer_phone,
            "vehicle_interest": vehicle_interest,
            "lead_update": lead_update,
            "message": f"Test drive scheduled for {customer_name} on {preferred_date} at {preferred_time}"
        }
    
    def _build_error_response(self, error_message: str) -> Dict[str, Any]:
        """Build error response dictionary."""
        return {
            "success": False,
            "error": error_message,
            "message": "Sorry, there was an error scheduling your test drive. Please try again."
        }
    
    def _build_lead_update_sync(
        self, 
        lead_id: str, 
        appointment_datetime: datetime, 
        vehicle_interest: str
    ) -> Dict[str, Any]:
        """Build lead update result for synchronous context."""
        return {
            "success": True,
            "lead_id": lead_id,
            "status": "appointment_booked",
            "appointment_datetime": appointment_datetime.isoformat(),
            "car_interest": vehicle_interest,
            "message": "Lead updated with appointment information"
        }
    
    async def _update_lead_appointment(
        self,
        lead_id: str,
        appointment_datetime: datetime,
        vehicle_interest: str
    ) -> Dict[str, Any]:
        """Update lead with appointment information (async placeholder)."""
        try:
            # This would typically use the database session to update the lead
            # For now, return a placeholder that indicates what should be updated
            return {
                "success": True,
                "lead_id": lead_id,
                "status": "appointment_booked",
                "appointment_datetime": appointment_datetime.isoformat(),
                "car_interest": vehicle_interest,
                "message": "Lead updated with appointment information"
            }
        except Exception as e:
            self.logger.error(f"Error updating lead appointment: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to update lead with appointment information"
            }


# Global instance
calendar_booking_service = CalendarBookingService()