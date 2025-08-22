# Dealership Sales Mobile App

A React Native mobile application that allows salespeople to manage customer conversations and approve AI-generated responses from their mobile devices instead of receiving SMS/WhatsApp messages.

## Features

- **Authentication**: Secure login for salespeople
- **Conversations**: View all customer conversations and leads
- **Pending Approvals**: Review and approve/reject/edit AI-generated responses
- **Push Notifications**: Real-time notifications for new messages and approvals
- **Profile Management**: User profile and app settings
- **Offline Support**: Basic offline functionality with data caching

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Physical device for testing push notifications

## Installation

1. **Clone the repository and navigate to the mobile app directory:**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install Expo Go app on your mobile device:**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Configuration

1. **Update API Base URL:**
   Open `src/services/apiClient.ts` and update the `API_BASE_URL` constant:
   ```typescript
   const API_BASE_URL = 'http://your-backend-url:8000';
   ```

2. **Configure Push Notifications:**
   - For iOS: Update the bundle identifier in `app.json`
   - For Android: Update the package name in `app.json`

## Running the App

### Development Mode

1. **Start the development server:**
   ```bash
   npm start
   # or
   yarn start
   ```

2. **Scan the QR code:**
   - Use the Expo Go app on your phone to scan the QR code
   - Or press `i` for iOS simulator or `a` for Android emulator

### Building for Production

1. **Build for iOS:**
   ```bash
   expo build:ios
   ```

2. **Build for Android:**
   ```bash
   expo build:android
   ```

## Usage

### Login
- Use the demo credentials:
  - Email: `demo@dealership.com`
  - Password: `password123`

### Main Features

1. **Conversations Tab:**
   - View all customer leads and conversations
   - Search and filter leads
   - Tap on a lead to view detailed conversation

2. **Pending Approvals Tab:**
   - Review AI-generated responses
   - Approve, reject, or edit responses
   - Send custom messages directly to customers

3. **Profile Tab:**
   - View user information
   - Manage app settings
   - Logout from the app

### Push Notifications

The app will automatically:
- Request notification permissions on first launch
- Register the device for push notifications
- Display notifications for new messages and pending approvals

## Backend Integration

The mobile app integrates with your existing dealership backend through the following endpoints:

- `POST /mobile/login` - User authentication
- `GET /mobile/me` - Get current user profile
- `POST /mobile/push-token` - Register push notification token
- `GET /mobile/conversations` - Get all conversations
- `GET /mobile/conversations/{lead_id}/history` - Get conversation history
- `GET /mobile/conversations/pending-approvals` - Get pending approvals
- `POST /mobile/conversations/approve/{approval_id}` - Approve/reject/edit responses
- `GET /mobile/leads` - Get all leads
- `GET /mobile/leads/{lead_id}` - Get specific lead

## Architecture

The app follows a clean architecture pattern:

```
src/
├── components/          # Reusable UI components
├── context/            # React Context for state management
├── screens/            # Screen components
├── services/           # API and external service integrations
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Key Technologies

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **React Navigation**: Navigation between screens
- **React Native Paper**: Material Design components
- **Axios**: HTTP client for API calls
- **Expo Notifications**: Push notification handling

## Customization

### Styling
- Update colors in `src/theme/colors.ts`
- Modify component styles in individual screen files
- Use React Native Paper theme customization

### API Integration
- Modify `src/services/apiClient.ts` for different API endpoints
- Update request/response handling as needed
- Add new API methods for additional functionality

### Push Notifications
- Customize notification content in `src/context/NotificationContext.tsx`
- Update notification handling logic
- Modify notification appearance and behavior

## Troubleshooting

### Common Issues

1. **Metro bundler errors:**
   ```bash
   npm start -- --reset-cache
   ```

2. **iOS build issues:**
   - Ensure Xcode is up to date
   - Check iOS deployment target compatibility

3. **Android build issues:**
   - Verify Android SDK installation
   - Check Java version compatibility

4. **Push notification issues:**
   - Ensure device has internet connection
   - Check notification permissions in device settings
   - Verify backend push notification service

### Debug Mode

Enable debug logging by setting environment variables:
```bash
export EXPO_DEBUG=true
export EXPO_VERBOSE=true
```

## Security Considerations

- **Authentication**: JWT tokens for secure API access
- **Data Storage**: Secure storage for sensitive information
- **Network Security**: HTTPS for all API communications
- **Input Validation**: Client-side validation for user inputs

## Performance Optimization

- **Image Optimization**: Use appropriate image formats and sizes
- **Lazy Loading**: Implement lazy loading for large lists
- **Memory Management**: Proper cleanup of event listeners and subscriptions
- **Network Caching**: Implement response caching for better performance

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for new features
3. Test on both iOS and Android devices
4. Update documentation for new features

## License

This project is part of the Maqro Dealership Management System.

## Support

For technical support or questions:
- Check the backend API documentation
- Review the Expo documentation
- Contact the development team

## Future Enhancements

- **Real-time Chat**: WebSocket integration for live messaging
- **File Attachments**: Support for images and documents
- **Voice Messages**: Audio message recording and playback
- **Advanced Analytics**: Detailed conversation analytics
- **Multi-language Support**: Internationalization support
- **Dark Mode**: Theme switching capability
