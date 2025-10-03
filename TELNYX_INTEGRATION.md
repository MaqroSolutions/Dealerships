# Telnyx Messaging Integration

This document describes the Telnyx SMS integration that has been added to the dealership system as an alternative to the existing Vonage (Nexmo) service.

## Overview

The Telnyx integration provides:
- SMS messaging via Telnyx API
- Webhook handling for incoming SMS
- Message status tracking
- Health monitoring

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Telnyx Messaging Configuration
TELNYX_API_KEY=your_telnyx_api_key_here
TELNYX_MESSAGING_PROFILE_ID=your_telnyx_messaging_profile_id_here
TELNYX_PHONE_NUMBER=your_telnyx_phone_number_here
TELNYX_WEBHOOK_SECRET=your_telnyx_webhook_secret_here
```

### Getting Telnyx Credentials

1. **Create a Telnyx Account**: Sign up at [portal.telnyx.com](https://portal.telnyx.com/)
2. **Get API Key**: Navigate to the Auth section and create an API Key
3. **Create Messaging Profile**: Set up a messaging profile in the Programmable Messaging section
4. **Get Phone Number**: Purchase a phone number that supports SMS
5. **Set Webhook Secret**: Generate a webhook secret for signature verification

## API Endpoints

### Backend Endpoints

- `POST /telnyx/send-sms` - Send SMS via Telnyx
- `POST /telnyx/webhook` - Webhook for incoming messages
- `GET /telnyx/message-status/{message_id}` - Get message status
- `GET /telnyx/health` - Health check
- `GET /telnyx/webhook-test` - Test webhook endpoint

### Frontend API Functions

```typescript
import { sendTelnyxSMS, getTelnyxMessageStatus, checkTelnyxHealth } from './lib/telnyx-api';

// Send SMS
const smsResult = await sendTelnyxSMS('+1234567890', 'Hello from Telnyx!');

// (SMS-only) WhatsApp messaging is not supported

// Check message status
const status = await getTelnyxMessageStatus('message-id-here');

// Health check
const health = await checkTelnyxHealth();
```

## Usage Examples

### Sending Messages

```python
from src.maqro_backend.services.telnyx_service import telnyx_service

# Send SMS
result = await telnyx_service.send_sms('+1234567890', 'Hello from Telnyx!')

# (SMS-only) WhatsApp messaging is not supported
```

### Webhook Handling

The webhook endpoint automatically:
1. Verifies the webhook signature for security
2. Parses incoming SMS/MMS messages
3. Determines the dealership based on phone number
4. Processes the message through the AI system
5. Sends appropriate responses back

### Message Status Tracking

```python
# Get message status
status = await telnyx_service.get_message_status('message-id-here')
```

## Webhook Configuration

### Setting up Webhooks in Telnyx

1. Go to the Telnyx portal
2. Navigate to Messaging > Webhooks
3. Create a new webhook with:
   - **URL**: `https://your-domain.com/api/telnyx/webhook`
   - **Events**: Select `message.received` and `message.finalized`
   - **Secret**: Use the same secret as `TELNYX_WEBHOOK_SECRET`

### Webhook Security

The webhook endpoint verifies the signature using HMAC-SHA256 to ensure messages are from Telnyx.

## Integration with Existing System

The Telnyx service integrates seamlessly with the existing message flow system:

1. **Message Flow Service**: Uses the same `message_flow_service` for processing
2. **Dealership Mapping**: Uses the same phone number to dealership mapping
3. **AI Integration**: Uses the same RAG system for generating responses
4. **Database**: Uses the same conversation and lead management

## Provider Selection

The frontend SMS API now sends strictly via Telnyx:

```typescript
import { sendSMS } from './lib/sms-api';

await sendSMS('+1234567890', 'Hello!');
```

## Error Handling

The service includes comprehensive error handling:

- **Network errors**: Timeout and connection issues
- **API errors**: Invalid responses from Telnyx
- **Authentication errors**: Missing or invalid credentials
- **Validation errors**: Invalid phone numbers or messages

## Monitoring and Health Checks

### Health Check Endpoint

```bash
curl https://your-domain.com/api/telnyx/health
```

Returns:
```json
{
  "status": "healthy",
  "message": "Telnyx service is operational",
  "service": "telnyx"
}
```

### Logging

All operations are logged with appropriate levels:
- **INFO**: Successful operations
- **WARNING**: Non-critical issues
- **ERROR**: Failed operations

## Migration from Existing Services

### From Vonage to Telnyx

1. Update environment variables
2. Change provider in frontend calls
3. Update webhook URLs in Telnyx portal
4. Test thoroughly before switching

### From WhatsApp Business API to SMS-only

WhatsApp messaging has been removed. Use SMS flows instead.

## Troubleshooting

### Common Issues

1. **Invalid credentials**: Check API key and messaging profile ID
2. **Webhook signature verification failed**: Verify webhook secret
3. **Phone number not found**: Ensure phone number is properly configured in Telnyx
4. **Message not delivered**: Check message content and recipient number format

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=DEBUG` in your environment.

## Support

For Telnyx-specific issues:
- [Telnyx Documentation](https://developers.telnyx.com/)
- [Telnyx Support](https://support.telnyx.com/)

For integration issues:
- Check the application logs
- Verify environment variables
- Test with the health check endpoint
