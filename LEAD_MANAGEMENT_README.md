# Lead Management System

## Overview

The Lead Management system allows salespeople to manage their leads, track customer interactions, and receive SMS notifications when leads message the dealership's Vonage number.

## Features

### 1. Lead Management Interface
- **View Leads**: See all leads assigned to the current user
- **Add New Leads**: Create leads with name, phone, email, and notes
- **Search Leads**: Search by name, phone, email, or notes
- **Lead Status**: Track lead status (new, warm, hot, follow-up, cold, deal_won, deal_lost)

### 2. SMS Integration
- **Incoming Messages**: When a lead messages the Vonage number, the message is automatically forwarded to the assigned salesperson
- **Message History**: All conversations are stored in the database
- **Real-time Notifications**: Salespeople receive SMS notifications for incoming messages

## Database Schema

### Leads Table
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  car TEXT NOT NULL DEFAULT 'Unknown',
  source TEXT NOT NULL DEFAULT 'Website',
  status TEXT NOT NULL DEFAULT 'new',
  last_contact_at TIMESTAMP WITH TIME ZONE NOT NULL,
  message TEXT,
  deal_value DECIMAL(10,2),
  appointment_datetime TIMESTAMP WITH TIME ZONE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sender TEXT NOT NULL -- 'customer' or 'agent'
);
```

## API Endpoints

### Frontend API Routes

#### GET `/api/me/leads`
Get all leads assigned to the current user
- **Query Parameters**: `search` (optional) - Search term
- **Response**: Array of Lead objects

#### POST `/api/leads`
Create a new lead
- **Body**: Lead data (name, phone, email, car, source, message)
- **Response**: Lead creation result

#### GET `/api/webhook/vonage`
Webhook endpoint for incoming Vonage messages
- **Method**: POST
- **Body**: Vonage webhook data (msisdn, to, text, messageId, etc.)

## Setup Instructions

### 1. Database Migration
Run the new migration to ensure all required columns exist:
```bash
# Apply the migration in your Supabase dashboard
# Or run the SQL from: frontend/supabase/migrations/09062025-lead-management-enhancements.sql
```

### 2. Vonage Configuration
1. Set up Vonage webhook URL: `https://your-domain.com/api/webhook/vonage`
2. Configure environment variables:
   ```
   VONAGE_API_KEY=your_api_key
   VONAGE_API_SECRET=your_api_secret
   VONAGE_PHONE_NUMBER=your_vonage_number
   ```

### 3. User Profile Setup
Ensure user profiles have phone numbers set for SMS forwarding:
```sql
UPDATE user_profiles 
SET phone = '+1234567890' 
WHERE user_id = 'user-uuid';
```

## Usage

### Adding a New Lead
1. Navigate to "Lead Management" in the sidebar
2. Click "Add New Lead"
3. Fill in the required fields:
   - **Name**: Lead's full name
   - **Phone**: Contact phone number (required)
   - **Email**: Email address (optional)
   - **Notes**: Any additional information
4. Click "Add Lead"

### Receiving Messages
When a lead messages the Vonage number:
1. The webhook receives the message
2. System looks up the lead by phone number
3. Finds the assigned salesperson
4. Forwards the message to the salesperson's phone
5. Saves the conversation to the database

### Searching Leads
Use the search bar to find leads by:
- Name
- Phone number
- Email address
- Notes/messages

## Security

- **Row Level Security (RLS)**: Users can only access leads in their dealership
- **Authentication**: All endpoints require valid JWT tokens
- **Authorization**: Users can only manage their assigned leads

## Testing

Run the test script to verify functionality:
```bash
python test_lead_management.py
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check Vonage webhook URL configuration
   - Verify environment variables are set
   - Check server logs for errors

2. **Messages not forwarded to salesperson**
   - Ensure user profile has phone number set
   - Verify lead is assigned to a salesperson
   - Check Vonage API credentials

3. **Search not working**
   - Verify database indexes are created
   - Check backend search implementation
   - Ensure proper URL encoding

### Debug Steps

1. Check application logs for errors
2. Verify database connections
3. Test Vonage API credentials
4. Validate webhook endpoint accessibility

## Future Enhancements

- Lead status management
- Automated follow-up reminders
- Integration with CRM systems
- Advanced analytics and reporting
- Bulk lead import/export
- Lead scoring and prioritization
