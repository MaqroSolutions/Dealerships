# Maqro Dealerships - Flutter Mobile App

A Flutter mobile application that replicates the UI of the Maqro Dealerships website, providing AI-powered lead management for dealerships and sales teams.

## Features

- **Landing Page**: Hero section with AI-powered messaging and feature highlights
- **Authentication**: Login and signup screens with form validation
- **Dashboard**: Performance overview, leads management, and alerts
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Dark Theme**: Modern dark theme matching the website design

## Screenshots

The app includes the following key screens:
- Landing page with hero section and features
- Login and signup authentication screens
- Dashboard with performance metrics
- Leads management section
- Alerts and notifications

## Getting Started

### Prerequisites

- Flutter SDK (3.0.0 or higher)
- Dart SDK
- Android Studio / VS Code with Flutter extensions
- Android emulator or physical device

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd flutter_app
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Run the app**
   ```bash
   flutter run
   ```

### Project Structure

```
lib/
├── main.dart                 # App entry point
├── providers/               # State management
│   └── auth_provider.dart   # Authentication state
├── screens/                 # App screens
│   ├── landing_screen.dart  # Landing page
│   ├── login_screen.dart    # Login screen
│   ├── signup_screen.dart   # Signup screen
│   └── dashboard_screen.dart # Dashboard
├── widgets/                 # Reusable widgets
│   ├── hero_section.dart    # Hero section
│   ├── feature_list.dart    # Feature list
│   ├── welcome_section.dart # Welcome section
│   ├── performance_overview.dart # Performance stats
│   ├── leads_section.dart   # Leads management
│   ├── alerts_section.dart  # Alerts display
│   ├── landing_nav.dart     # Landing navigation
│   └── dashboard_nav.dart   # Dashboard navigation
└── utils/                   # Utilities
    └── theme.dart           # App theme configuration
```

## Dependencies

The app uses the following key dependencies:

- **provider**: State management
- **shared_preferences**: Local storage
- **http**: HTTP requests (for future API integration)
- **flutter_secure_storage**: Secure storage for sensitive data

## Theme

The app uses a custom dark theme that matches the website design:

- **Primary Colors**: Blue (#3B82F6) and Purple (#8B5CF6)
- **Background**: Dark gray gradients
- **Text**: White and gray variations
- **Cards**: Semi-transparent dark backgrounds with borders

## Authentication

The app includes a complete authentication flow:

- **Login**: Email and password authentication
- **Signup**: Name, email, and password registration
- **State Management**: Persistent authentication state
- **Navigation**: Automatic routing based on auth status

## Future Enhancements

- **API Integration**: Connect to the backend services
- **Push Notifications**: Real-time alerts and updates
- **Offline Support**: Local data caching
- **Deep Linking**: Direct navigation to specific sections
- **Analytics**: User behavior tracking
- **Testing**: Unit and widget tests

## Development

### Code Style

The app follows Flutter best practices:
- Consistent naming conventions
- Proper widget separation
- Responsive design patterns
- Theme-based styling

### Adding New Features

1. Create new widgets in the `widgets/` directory
2. Add new screens in the `screens/` directory
3. Update navigation as needed
4. Follow the existing theme and design patterns

## Troubleshooting

### Common Issues

1. **Dependencies not found**: Run `flutter pub get`
2. **Build errors**: Check Flutter version compatibility
3. **Theme issues**: Verify theme configuration in `utils/theme.dart`

### Debug Mode

Run the app in debug mode for development:
```bash
flutter run --debug
```

## Contributing

1. Follow the existing code structure and patterns
2. Maintain consistent theming and styling
3. Test on multiple device sizes
4. Update documentation as needed

## License

This project is part of the Maqro Dealerships platform.

## Support

For support and questions, please refer to the main project documentation or contact the development team.
