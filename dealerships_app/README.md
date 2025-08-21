# Dealerships Flutter App

A Flutter mobile application for dealership management with AI-powered lead responses. This app provides the same functionality as the web application but optimized for mobile devices.

## Features

- **Authentication**: Secure login and signup using Supabase
- **Conversations**: Manage lead conversations with real-time messaging
- **Inventory**: View and manage vehicle inventory
- **Settings**: User profile and app preferences
- **Dark Theme**: Modern, professional dark theme design
- **Responsive Design**: Optimized for both iOS and Android

## Screenshots

The app features a sleek, professional design with:
- Dark theme matching the website design
- Intuitive navigation with bottom tabs
- Card-based layouts for easy reading
- Consistent color scheme and typography

## Prerequisites

- Flutter SDK (3.0 or higher)
- Dart SDK (3.0 or higher)
- Android Studio / VS Code
- iOS Simulator (for iOS development)
- Android Emulator (for Android development)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dealerships_app
```

### 2. Install Dependencies

```bash
flutter pub get
```

### 3. Configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key
3. Update the `lib/main.dart` file with your Supabase credentials:

```dart
await Supabase.initialize(
  url: 'YOUR_SUPABASE_URL', // Replace with your actual Supabase URL
  anonKey: 'YOUR_SUPABASE_ANON_KEY', // Replace with your actual Supabase anon key
);
```

### 4. Configure Backend API

The app is configured to connect to the backend at `https://dealerships-tnvx.onrender.com`. Make sure your backend is running and accessible.

### 5. Run the App

```bash
# For iOS
flutter run -d ios

# For Android
flutter run -d android

# For web (if needed)
flutter run -d chrome
```

## Project Structure

```
lib/
├── main.dart                 # App entry point and theme configuration
├── models/                   # Data models
│   ├── inventory.dart       # Inventory data model
│   └── conversation.dart    # Conversation and lead models
├── providers/               # State management
│   └── auth_provider.dart  # Authentication state provider
├── screens/                 # App screens
│   ├── splash_screen.dart  # Loading and authentication check
│   ├── login_screen.dart   # User login
│   ├── signup_screen.dart  # User registration
│   ├── home_screen.dart    # Main navigation hub
│   ├── conversations_screen.dart      # Lead conversations list
│   ├── conversation_detail_screen.dart # Individual conversation view
│   ├── inventory_screen.dart          # Vehicle inventory management
│   └── settings_screen.dart          # User settings and profile
├── services/                # API services
│   └── api_service.dart    # Backend API integration
└── widgets/                 # Reusable UI components
```

## Dependencies

The app uses the following key dependencies:

- **supabase_flutter**: Authentication and backend integration
- **provider**: State management
- **http**: HTTP requests to backend API
- **shared_preferences**: Local data storage
- **flutter_secure_storage**: Secure credential storage

## Authentication Flow

1. **Splash Screen**: Checks authentication status
2. **Login/Signup**: User authentication via Supabase
3. **Home Screen**: Main app with bottom navigation
4. **Protected Routes**: All main features require authentication

## API Integration

The app connects to the backend API at `https://dealerships-tnvx.onrender.com` for:

- **Inventory Management**: CRUD operations on vehicle inventory
- **Conversations**: Lead conversation management
- **User Management**: Authentication and user profiles

## Design System

### Colors
- **Primary**: `#2563EB` (Blue)
- **Background**: `#0A0A0A` (Dark)
- **Surface**: `#1F1F1F` (Card background)
- **Text Primary**: `#FFFFFF` (White)
- **Text Secondary**: `#9CA3AF` (Gray)

### Typography
- **Headings**: Bold, large text for main titles
- **Body**: Regular weight for content
- **Captions**: Smaller text for metadata

### Components
- **Cards**: Rounded corners with subtle borders
- **Buttons**: Consistent styling with hover states
- **Input Fields**: Dark theme with blue focus states

## Platform Support

- ✅ **iOS**: Full support with native iOS design patterns
- ✅ **Android**: Full support with Material Design 3
- ✅ **Web**: Basic support (not primary target)

## Development

### Code Style
- Follow Flutter best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistent formatting

### Testing
```bash
# Run unit tests
flutter test

# Run integration tests
flutter test integration_test/
```

### Building for Production

```bash
# Build APK for Android
flutter build apk --release

# Build IPA for iOS
flutter build ios --release
```

## Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify your Supabase URL and anon key
   - Check internet connectivity
   - Ensure Supabase project is active

2. **Backend API Error**
   - Verify backend is running at `https://dealerships-tnvx.onrender.com`
   - Check API endpoints are accessible
   - Review backend logs for errors

3. **Build Errors**
   - Run `flutter clean` and `flutter pub get`
   - Check Flutter and Dart SDK versions
   - Verify all dependencies are compatible

### Debug Mode

Run the app in debug mode for detailed error information:

```bash
flutter run --debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions:
- Check the troubleshooting section
- Review the code comments
- Contact the development team

## Changelog

### Version 1.0.0
- Initial release
- Authentication system
- Conversations management
- Inventory management
- Settings and profile
- Dark theme design
- Mobile-optimized UI
