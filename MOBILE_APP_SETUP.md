# Mobile App Notification System Setup

This guide explains how to set up the mobile app notification system that replaces WhatsApp forwarding with real-time mobile app notifications.

## Overview

The system now sends notifications to salesperson mobile apps instead of WhatsApp, providing:
- **Push notifications** via Firebase Cloud Messaging (FCM)
- **Real-time updates** via WebSocket connections
- **Instant delivery** of new leads and conversation messages
- **Better user experience** with in-app notifications

## Architecture

```
Customer Message → Backend → Notification Service → Mobile App
                                    ↓
                              WebSocket Service → Real-time Updates
                                    ↓
                              Firebase FCM → Push Notifications
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

The new dependencies added:
- `firebase-admin>=6.2.0` - Firebase Admin SDK for push notifications
- `websockets>=11.0.3` - WebSocket support for real-time communication

### 2. Firebase Setup

#### Option A: Use Default Credentials (Development)
For development, Firebase will use default credentials:
```bash
# No additional setup needed
```

#### Option B: Use Service Account Key (Production)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings → Service Accounts
4. Generate new private key
5. Save the JSON file securely
6. Set environment variable:
```bash
export FIREBASE_SERVICE_ACCOUNT_KEY="/path/to/service-account-key.json"
```

### 3. Environment Variables

Add these to your `.env` file:
```bash
# Firebase Configuration (optional)
FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/service-account-key.json
FIREBASE_PROJECT_ID=your-project-id

# Existing WhatsApp config (can be removed if not using WhatsApp)
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
```

### 4. Database Schema Updates

The system uses existing database tables. No new tables are required.

## How It Works

### 1. New Lead Creation
When a new lead is created:
1. Lead is saved to database
2. Push notification sent to assigned salesperson
3. Real-time update sent via WebSocket
4. Salesperson receives instant notification on mobile app

### 2. New Message Handling
When a customer sends a message:
1. Message is saved to conversation
2. Push notification sent to assigned salesperson
3. Real-time update sent via WebSocket
4. Salesperson sees message immediately in app

### 3. Mobile App Connection
Mobile apps connect via WebSocket:
- **Endpoint**: `ws://your-server:8000/api/ws/{user_id}`
- **Authentication**: JWT token in query parameter or headers
- **Real-time**: Instant updates for leads and conversations

## API Endpoints

### WebSocket Endpoints
- `wss://dealerships-whats-app.onrender.com/api/ws/{user_id}` - WebSocket connection for real-time updates
- `wss://dealerships-whats-app.onrender.com/api/ws/authenticated/{user_id}` - Authenticated WebSocket connection
- `https://dealerships-whats-app.onrender.com/api/ws/status` - Connection status and statistics

### Notification Endpoints
- All existing endpoints now send notifications automatically
- No changes to existing API contracts

## Mobile App Integration

### WebSocket Connection
```javascript
// Production (Render)
const ws = new WebSocket(`wss://dealerships-whats-app.onrender.com/api/ws/${userId}`);

// Local development
// const ws = new WebSocket(`ws://localhost:8000/api/ws/${userId}`);

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'conversation_update':
            // Handle new message
            break;
        case 'lead_update':
            // Handle lead update
            break;
        case 'notification':
            // Handle notification
            break;
    }
};
```

### FCM Token Registration
```javascript
// Send FCM token to server
ws.send(JSON.stringify({
    type: 'fcm_token',
    data: { fcm_token: 'your-fcm-token' }
}));
```

## Quick Start

### 🚀 **Test the System**
1. **Open** `mobile_app_example.html` in your browser
2. **Connect** to the production backend (URL is pre-filled)
3. **Test** real-time notifications and WebSocket connections

### 📋 **Current Status**
- ✅ **Backend**: Running on Render at `https://dealerships-whats-app.onrender.com`
- ✅ **Core API**: Health check and root endpoints working
- ⚠️ **WebSocket**: New routes need to be deployed to production
- 🔄 **Deployment**: In progress - WebSocket endpoints will be available after deployment

## Testing

### 1. Backend is Running on Render
The backend is already running at:
```
https://dealerships-whats-app.onrender.com
```

For local development, you can still run:
```bash
cd src/maqro_backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test WebSocket Connection
Open `mobile_app_example.html` in a browser:
1. The server URL is pre-filled with the production Render URL
2. Enter a user ID (e.g., `demo-user-123`)
3. Click "Connect" to establish WebSocket connection
4. Test various message types (ping, device info, FCM token)

**Production Testing:**
- ✅ Uses `wss://dealerships-whats-app.onrender.com` (secure WebSocket)
- ✅ HTTPS for status endpoint: `https://dealerships-whats-app.onrender.com/api/ws/status`
- ✅ Real-time updates from production backend

### 3. Test Notifications
1. Create a new lead via API
2. Send a message via conversation API
3. Check mobile app example for real-time updates

## Troubleshooting

### Common Issues

#### Firebase Not Initialized
```
Error: Firebase not initialized
```
**Solution**: Check Firebase credentials or use default credentials for development

#### WebSocket Connection Failed
```
Error: WebSocket connection failed
```
**Solution**: 
- ✅ **Production**: Server is running on Render at `https://dealerships-whats-app.onrender.com`
- Check CORS settings (should be configured for production)
- Ensure WebSocket endpoint is accessible: `wss://dealerships-whats-app.onrender.com/api/ws/{user_id}`
- **Local development**: Verify local server is running with `uvicorn main:app --reload`

#### Notifications Not Sending
```
Error: Failed to send notification
```
**Solution**:
- Check Firebase configuration
- Verify user has FCM token
- Check server logs for detailed errors

### Debug Mode
Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Production Deployment

### Render Deployment
The backend is deployed on Render at:
```
https://dealerships-whats-app.onrender.com
```

**Important Notes:**
- ✅ **HTTPS/WSS**: Production uses secure connections
- ✅ **Auto-scaling**: Render handles traffic automatically
- ✅ **SSL certificates**: Automatically managed by Render
- ⚠️ **Cold starts**: First request after inactivity may be slower

### Deploying Updates
To deploy the new mobile notification system:

1. **Push to Git**: The new code needs to be pushed to your repository
2. **Auto-deploy**: Render will automatically deploy from your Git repository
3. **Verify**: Check that WebSocket endpoints are available:
   ```bash
   curl https://dealerships-whats-app.onrender.com/api/ws/status
   ```

**Current Status**: Core API is working, WebSocket routes need deployment

### Production Considerations

### 1. Security
- Use authenticated WebSocket connections
- Validate JWT tokens
- Implement rate limiting
- ✅ HTTPS/WSS already configured on Render

### 2. Scalability
- WebSocket connections are per-user
- Consider connection pooling for high traffic
- Monitor memory usage for active connections

### 3. Monitoring
- Track WebSocket connection counts
- Monitor notification delivery rates
- Log failed notification attempts

## Migration from WhatsApp

### What Changed
- ✅ WhatsApp forwarding → Mobile app notifications
- ✅ SMS messages → Push notifications
- ✅ Phone number routing → User ID routing
- ✅ External service → Internal notification system

### What Stayed the Same
- ✅ Lead creation and management
- ✅ Conversation handling
- ✅ AI response generation
- ✅ Database structure

### Rollback Plan
If needed, you can temporarily disable notifications by commenting out the notification calls in:
- `conversation.py` - `add_message` function
- `leads.py` - `create_lead` function

## Production Status

### Check Backend Health
```bash
# Production health check
curl https://dealerships-whats-app.onrender.com/api/health

# WebSocket status
curl https://dealerships-whats-app.onrender.com/api/ws/status
```

### Render Dashboard
- **URL**: https://dashboard.render.com/
- **Service**: dealerships-whats-app
- **Status**: Check if service is running
- **Logs**: View real-time application logs

## Support

For issues or questions:
1. ✅ **Production**: Check Render dashboard and logs
2. Check server logs for error details
3. Verify Firebase configuration
4. Test WebSocket connectivity: `wss://dealerships-whats-app.onrender.com/api/ws/{user_id}`
5. Review environment variables

## Next Steps

1. **Mobile App Development**: Build native mobile apps using this system
2. **Push Notification UI**: Design notification interfaces
3. **Offline Support**: Implement offline message queuing
4. **Analytics**: Track notification engagement and response times
