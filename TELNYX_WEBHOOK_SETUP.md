# Telnyx Webhook Setup Guide

This guide will help you configure Telnyx webhooks for your dealership messaging system.

## Backend Configuration

Your backend is already configured with the following endpoints:

### Webhook Endpoints
- **Primary Webhook URL**: `https://development-bxaf.onrender.com/telnyx/webhook`
- **Verification URL**: `https://development-bxaf.onrender.com/telnyx/webhook` (GET)

### API Endpoints
- **Send SMS**: `POST https://development-bxaf.onrender.com/telnyx/send-sms`

## Environment Variables

Add these environment variables to your Render backend:

```bash
# Telnyx SMS Configuration
TELNYX_API_KEY=your_telnyx_api_key_here
TELNYX_PHONE_NUMBER=your_telnyx_phone_number_here
TELNYX_MESSAGING_PROFILE_ID=your_telnyx_messaging_profile_id_here
TELNYX_WEBHOOK_SECRET=your_telnyx_webhook_secret_here
```

## Telnyx Portal Configuration

### 1. Create a Messaging Profile

1. Log in to [Telnyx Mission Control Portal](https://portal.telnyx.com/)
2. Navigate to **Programmable Messaging** → **Messaging Profiles**
3. Click **"Add New Profile"**
4. Provide a unique name (e.g., "Dealership Messaging")
5. Ensure API version is set to **v2**

### 2. Assign Phone Number to Messaging Profile

1. Go to **My Numbers** section
2. Select your phone number
3. Under **Messaging Profile** column, click the edit icon
4. Assign the newly created messaging profile to this number

### 3. Configure Webhook URLs

1. In your messaging profile settings, go to **Inbound Settings**
2. Set **Webhook URL** to: `https://development-bxaf.onrender.com/telnyx/webhook`
3. Optionally set a **Failover URL** for redundancy
4. Set **Webhook Event Types** to include:
   - `message.received`
   - `message.finalized` (optional)
   - `message.failed` (optional)

### 4. Webhook Security (Recommended)

1. In the webhook settings, generate a **Webhook Secret**
2. Copy this secret and add it to your environment variables as `TELNYX_WEBHOOK_SECRET`
3. The backend will automatically verify webhook signatures for security

## Testing Your Setup

### 1. Test Webhook Reception

Send a test SMS to your Telnyx phone number and check your backend logs:

```bash
# Check your Render logs
# You should see: "Received Telnyx webhook: {...}"
```

### 2. Test Outbound SMS

Use the API endpoint to send a test message:

```bash
curl -X POST https://development-bxaf.onrender.com/telnyx/send-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+1234567890",
    "message": "Test message from dealership system"
  }'
```

## Webhook Payload Structure

Telnyx sends webhooks with this structure:

```json
{
  "data": {
    "event_type": "message.received",
    "id": "webhook_id",
    "occurred_at": "2024-01-17T10:00:00Z",
    "payload": {
      "id": "message_id",
      "from": {
        "phone_number": "+1234567890"
      },
      "to": {
        "phone_number": "+1987654321"
      },
      "text": "Hello, I'm interested in a car",
      "received_at": "2024-01-17T10:00:00Z"
    }
  }
}
```

## Security Features

- **Webhook Signature Verification**: Automatically verifies incoming webhooks using HMAC-SHA256
- **Rate Limiting**: 200 requests per minute per IP address
- **Phone Number Normalization**: Converts all phone numbers to E.164 format
- **Dealership Mapping**: Automatically determines which dealership a phone number belongs to

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check that the webhook URL is correctly set in Telnyx portal
   - Verify your Render backend is running and accessible
   - Check firewall settings

2. **Signature verification failing**
   - Ensure `TELNYX_WEBHOOK_SECRET` is correctly set
   - Verify the secret matches what's configured in Telnyx portal

3. **Messages not being processed**
   - Check backend logs for error messages
   - Verify phone number format (should be E.164)
   - Ensure dealership phone mapping is configured

### Logs to Monitor

- `"Received Telnyx webhook:"` - Webhook received
- `"Processing message from {phone}:"` - Message being processed
- `"Determined dealership {id} for phone {phone}"` - Dealership mapping
- `"SMS sent successfully to {phone}"` - Outbound message sent

## Migration from Other Services

If migrating from Vonage or WhatsApp:

1. Update your frontend to use the new Telnyx endpoints
2. Configure phone number mapping in your database
3. Test thoroughly before switching over
4. Keep old services running during transition period

## Support

For issues with:
- **Telnyx API**: Contact Telnyx support
- **Backend Integration**: Check this codebase documentation
- **Dealership Mapping**: Review the `dealership_phone_mapping_service`
