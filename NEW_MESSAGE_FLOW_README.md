# New Message Flow System

## Overview

The dealership messaging system has been completely restructured to implement an approval-based workflow for incoming customer messages. This new system ensures quality control while maintaining the human touch in customer communication.

## How It Works

### 1. Customer Message Flow
1. **Customer sends message** via SMS or WhatsApp
2. **System identifies sender** (customer vs. salesperson)
3. **RAG system generates response** based on customer inquiry and inventory
4. **Response sent to salesperson** for approval (if lead has assigned salesperson)
5. **Salesperson reviews and decides** what to do with the response
6. **Customer receives final message** based on salesperson's decision

### 2. Salesperson Approval Options

When a salesperson receives a RAG response for approval, they have four options:

#### ✅ **YES** - Approve and Send
- Approves the AI-generated response
- Sends it directly to the customer
- Updates conversation history
- Marks approval as "approved"

**Example:** `YES`

#### ❌ **NO** - Reject
- Rejects the AI-generated response
- No message is sent to the customer
- Marks approval as "rejected"
- Customer receives no response

**Example:** `NO`

#### 🔄 **EDIT** - Regenerate with Instructions
- Requests the AI to regenerate the response
- Includes specific editing instructions
- Creates new approval request with edited response
- Original approval is marked as "expired"

**Example:** `EDIT Make it more friendly and mention our financing options`

#### 🚀 **FORCE** - Send Custom Message
- Sends a custom message directly to the customer
- Bypasses the AI-generated response entirely
- Allows salesperson to personalize the communication
- Marks approval as "force_sent"

**Example:** `FORCE Hi John! This is Sarah. I'd love to call you in 5 minutes to discuss the Toyota Camry.`

## Technical Implementation

### New Service: `MessageFlowService`

The core logic is now centralized in `src/maqro_backend/services/message_flow_service.py`:

```python
class MessageFlowService:
    async def process_incoming_message(
        self,
        session: AsyncSession,
        from_phone: str,
        message_text: str,
        dealership_id: str,
        enhanced_rag_service: EnhancedRAGService,
        message_source: str = "sms"  # "sms" or "whatsapp"
    ) -> Dict[str, Any]:
        # Determines if sender is customer or salesperson
        # Routes to appropriate handler
```

### Updated Database Schema

The `pending_approvals` table now supports the new status:

```sql
status = Column(Text, nullable=False, default="pending")  
-- Values: 'pending', 'approved', 'rejected', 'expired', 'force_sent'
```

### Updated Webhook Routes

Both SMS and WhatsApp webhooks now use the new message flow service:

- **SMS:** `src/maqro_backend/api/routes/vonage.py`
- **WhatsApp:** `src/maqro_backend/api/routes/whatsapp.py`

## Benefits

### 🎯 **Quality Control**
- Every AI-generated response is reviewed by a human
- Prevents inappropriate or inaccurate messages from reaching customers
- Maintains brand voice and messaging standards

### 👨‍💼 **Salesperson Empowerment**
- Salespeople can personalize responses based on their relationship with customers
- Quick approval process with simple commands
- Ability to override AI when needed

### 📊 **Full Audit Trail**
- Complete record of all message interactions
- Tracks approval decisions and timing
- Maintains conversation history for future reference

### 🚀 **Flexibility**
- Multiple response options for different situations
- Edit capability for fine-tuning AI responses
- Force send for urgent or personal communications

## Usage Examples

### Scenario 1: Standard Approval
```
Customer: "Do you have any Honda Civics in stock?"
System: [Generates RAG response about Honda Civics]
Salesperson: "YES"
Result: Customer receives the AI-generated response
```

### Scenario 2: Response Rejection
```
Customer: "What's the price of the Toyota Camry?"
System: [Generates RAG response about Toyota Camry]
Salesperson: "NO"
Result: Customer receives no response
```

### Scenario 3: Response Editing
```
Customer: "I'm interested in financing options"
System: [Generates RAG response about financing]
Salesperson: "EDIT Make it more friendly and mention our 0% APR promotion"
System: [Generates new response with edits]
Salesperson: "YES"
Result: Customer receives the edited response
```

### Scenario 4: Custom Message
```
Customer: "Can you call me about the BMW?"
System: [Generates RAG response about BMW]
Salesperson: "FORCE Hi! This is Mike. I'll call you in 10 minutes about the BMW. What's the best time?"
Result: Customer receives the custom message directly
```

## Configuration

### Default Settings
- **Approval timeout:** 1 hour (configurable in database)
- **Default dealership ID:** Set in webhook routes
- **Default user ID:** For leads without assigned salesperson

### Customization
You can modify these settings in:
- `src/maqro_backend/db/models.py` - Database schema
- `src/maqro_backend/services/message_flow_service.py` - Flow logic
- Webhook route files - Default IDs and settings

## Testing

### Run the Demo
```bash
python test_new_message_flow.py
```

This script demonstrates the complete message flow with examples of all approval scenarios.

### Manual Testing
1. Send a message from a customer phone number
2. Check that the RAG response is generated
3. Verify the approval request is sent to the assigned salesperson
4. Test each approval option (YES, NO, EDIT, FORCE)
5. Confirm the customer receives the appropriate response

## Troubleshooting

### Common Issues

#### Salesperson Not Receiving Approval Requests
- Check that the salesperson has a valid phone number in their profile
- Verify the lead is assigned to the correct salesperson
- Check SMS/WhatsApp service configuration

#### RAG Response Generation Fails
- Verify RAG service is running and accessible
- Check inventory data and embeddings
- Review error logs for specific failure reasons

#### Approval Commands Not Recognized
- Ensure commands are sent exactly as specified (YES, NO, EDIT, FORCE)
- Check that the salesperson has a pending approval
- Verify the approval hasn't expired

### Logging
The system provides comprehensive logging at each step:
- Customer message processing
- RAG response generation
- Approval request creation
- Salesperson response handling
- Message delivery status

## Migration Notes

### What Changed
- **Before:** Direct RAG responses to customers
- **After:** Approval-based workflow with salesperson oversight

### What Stayed the Same
- RAG system for response generation
- Database models for leads and conversations
- SMS and WhatsApp service integration
- Lead creation and management

### Backward Compatibility
- Existing leads and conversations remain intact
- All historical data is preserved
- No breaking changes to external APIs

## Future Enhancements

### Planned Features
- **Batch approvals** for multiple pending responses
- **Template responses** for common scenarios
- **Approval delegation** to other team members
- **Response analytics** and performance metrics
- **Mobile app integration** for approval management

### Customization Options
- **Approval timeout** per dealership
- **Auto-approval** for certain message types
- **Escalation rules** for urgent inquiries
- **Multi-language support** for international dealerships

## Support

For questions or issues with the new message flow system:

1. Check the logs for error details
2. Review this documentation
3. Test with the demo script
4. Contact the development team

---

**Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Production Ready
