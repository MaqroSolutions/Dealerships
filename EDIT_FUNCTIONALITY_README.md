# EDIT Functionality for Salesperson Message Approval

## Overview

The system now supports an additional option for salespeople when reviewing AI-generated responses: **EDIT**. This allows salespeople to request modifications to generated messages before sending them to customers.

## How It Works

### 1. Message Approval Flow

When a customer sends a message, the system:
1. Generates an AI response using the RAG system
2. Sends the response to the assigned salesperson for approval
3. Salesperson can respond with:
   - `YES` - Approve and send to customer
   - `NO` - Reject (don't send to customer)
   - `EDIT` - Request modifications

### 2. EDIT Command Usage

Salespeople can use any of these commands to request edits:
- `EDIT`
- `MODIFY`
- `CHANGE`
- `UPDATE`
- `REVISE`
- `REWRITE`

**Format:**
```
EDIT [your edit request]
```

**Examples:**
```
EDIT Add that we have financing available
EDIT Include warranty information
EDIT Mention our service department
EDIT Add test drive availability
```

### 3. Edit Processing

When an EDIT command is received:
1. The system extracts the edit request
2. Updates the approval status to "editing"
3. Regenerates the AI response incorporating the edit request
4. Creates a new pending approval with the edited response
5. Sends the new response to the salesperson for approval

### 4. Database Changes

The `pending_approvals` table now includes:
- `edit_request` field: Stores the edit request from salesperson
- `status` field: Now supports "editing" status

## Implementation Details

### New Functions Added

#### CRUD Functions
- `is_edit_request(message)` - Checks if message starts with edit command
- `extract_edit_request(message)` - Extracts edit request from message
- `update_approval_with_edit_request()` - Updates approval with edit request

#### Updated Functions
- `is_approval_command()` - Now includes edit commands
- `parse_approval_command()` - Now returns "edit" for edit commands

### Webhook Updates

Both SMS (Vonage) and WhatsApp webhooks now support:
- EDIT command processing
- Automatic response regeneration
- New approval workflow for edited responses

### Help Messages

Updated help messages now include EDIT option:
```
"Reply with 'YES' to send the response to the customer, 'NO' to reject it, or 'EDIT' followed by your changes."
```

## Example Workflow

1. **Customer**: "Do you have Honda Civics in stock?"
2. **AI Response**: "Yes, we have several Honda Civics available..."
3. **System**: Sends to salesperson for approval
4. **Salesperson**: "EDIT Add that we are in the process of buying a new Honda Civic"
5. **System**: Processes edit and generates new response
6. **New AI Response**: "Yes, we have several Honda Civics available... We are also in the process of buying a new Honda Civic..."
7. **System**: Sends new response to salesperson for approval
8. **Salesperson**: "YES" (approves and sends to customer)

## Benefits

- **Quality Control**: Salespeople can ensure responses meet their standards
- **Personalization**: Add dealership-specific information or context
- **Accuracy**: Correct or enhance AI-generated responses
- **Flexibility**: Multiple edit iterations possible
- **Audit Trail**: All edit requests are logged in the database

## Technical Notes

- Edit requests are stored in the `edit_request` field
- The system creates new pending approvals for edited responses
- Original approval is marked as "editing" status
- RAG system incorporates edit context when regenerating responses
- Support for both SMS and WhatsApp channels

## Migration Required

Run the database migration to add the new field:
```sql
-- Add edit_request field to pending_approvals table
ALTER TABLE public.pending_approvals 
ADD COLUMN edit_request text;

-- Update status constraint to include 'editing'
ALTER TABLE public.pending_approvals 
DROP CONSTRAINT pending_approvals_status_check;

ALTER TABLE public.pending_approvals 
ADD CONSTRAINT pending_approvals_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'expired'::text, 'editing'::text]));
```
