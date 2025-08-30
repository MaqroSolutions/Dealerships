# Dealerships Mobile App

A React Native mobile application for the dealership chat system with push notifications powered by Firebase Cloud Messaging (FCM) and authentication via Supabase.

## Features

- 📱 React Native with Expo
- 🔐 Supabase Authentication (Sign In/Sign Up)
- 🔔 Firebase Cloud Messaging for push notifications
- 🎨 Beautiful UI with Tailwind CSS (NativeWind)
- 🔄 Real-time notification handling (foreground/background)
- 🧪 Built-in notification testing features

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **npm** or **yarn**
- **Expo Go** app installed on your physical Android or iOS device
- Access to the **maqro-dealerships-v1** Firebase project

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

1. Copy the environment example file:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_BACKEND_URL=https://dealerships-whats-app.onrender.com
   ```

### 3. Firebase Configuration

You need to download the Firebase configuration files from the Firebase Console:

#### For Android:
1. Go to the Firebase Console → maqro-dealerships-v1 → Project Settings
2. Download `google-services.json`
3. Place it at: `android/app/google-services.json`

#### For iOS:
1. Go to the Firebase Console → maqro-dealerships-v1 → Project Settings
2. Download `GoogleService-Info.plist`
3. Place it at: `ios/GoogleService-Info.plist`

**Important:** Make sure these files are named exactly as shown above and placed in the correct directories.

## Running the App

1. Start the Expo development server:
   ```bash
   npx expo start
   ```

2. Open the **Expo Go** app on your physical device

3. Scan the QR code displayed in your terminal or browser

4. The app will load on your device

## App Usage

### Authentication Flow

1. **First Launch**: You'll see the login screen
2. **Sign Up**: Create a new account with email and password (minimum 6 characters)
3. **Sign In**: Use your existing credentials to log in
4. **Auto-Login**: The app remembers your session for future launches

### Chat Screen Features

Once logged in, you'll see the Chat Screen with:

- **Welcome Message**: Displays your email
- **FCM Token Display**: Shows your device's notification token
- **Copy Token Button**: Copies the FCM token to clipboard
- **Test Notification Button**: Sends a test notification via the backend
- **User Information**: Shows your user ID and email
- **Sign Out Button**: Logs you out and returns to login screen

## Testing Push Notifications

There are two methods to test push notifications:

### Method 1: Using the Firebase Console

1. **Log into the app** on your phone
2. **Copy the FCM token** displayed on the Chat Screen (use the "Copy Token" button)
3. **Open Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select the **maqro-dealerships-v1** project
   - Navigate to **Engage** → **Messaging**
4. **Create a test notification**:
   - Click "Create your first campaign" → "Firebase Notification messages"
   - Fill in the notification title and body
   - In the "Send test message" section on the right, paste your copied FCM token
   - Click "Test"
5. **Verify**: You should receive the notification on your device

### Method 2: Using the In-App Test Button

1. **Log into the app** on your phone
2. **Press the "Send Test Notification" button** on the Chat Screen
3. **Backend Processing**: The app sends a request to the backend with your user ID
4. **Notification Delivery**: The backend looks up your registered FCM token and sends a notification
5. **Verify**: You should receive the test notification immediately

### Notification Behavior

- **Foreground**: When the app is open, notifications appear as alerts
- **Background**: Notifications appear in the system notification tray
- **Closed App**: Notifications appear in the system notification tray and can reopen the app

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure your `.env` file has the correct Supabase URL and anon key
   - Make sure the file is named `.env` (not `.env.txt`)

2. **"Failed to register FCM token"**
   - Check that Firebase configuration files are in the correct locations
   - Verify the backend URL is correct in your `.env` file
   - Ensure you have an internet connection

3. **"No FCM token available"**
   - Grant notification permissions when prompted
   - Restart the app if permissions were denied initially
   - Check that Firebase plugins are properly configured in `app.json`

4. **"Firebase configuration not found"**
   - Ensure `google-services.json` is in `android/app/`
   - Ensure `GoogleService-Info.plist` is in `ios/`
   - Restart the Expo development server after adding these files

### Testing on Different Platforms

**Android:**
- Requires `google-services.json` in `android/app/`
- Notifications work in both foreground and background

**iOS:**
- Requires `GoogleService-Info.plist` in `ios/`
- May require additional permissions for notifications
- Test on a physical device (simulator has limited notification support)

### Development Tips

1. **View Logs**: Use `npx expo logs` to see detailed logs from your device
2. **Network Issues**: Ensure your device and computer are on the same network
3. **Cache Issues**: Try `npx expo start --clear` if you encounter caching problems
4. **Notification Permissions**: Test notification permission flow by denying initially, then re-enabling

## Project Structure

```
mobile-frontend/
├── src/
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client configuration
│   │   ├── firebase.ts      # Firebase FCM configuration
│   │   └── api.ts           # Backend API functions
│   ├── screens/
│   │   ├── LoginScreen.tsx  # Authentication screen
│   │   └── ChatScreen.tsx   # Main chat screen
│   └── components/
│       └── NotificationHandler.tsx  # FCM message handlers
├── android/app/             # Android Firebase config location
├── ios/                     # iOS Firebase config location
├── .env                     # Environment variables
├── app.json                 # Expo configuration
└── README.md               # This file
```

## Backend Integration

The app communicates with the backend at `https://dealerships-whats-app.onrender.com` for:

- **FCM Token Registration**: `POST /register-fcm-token`
- **Test Notifications**: `POST /send-test-notification`

Make sure the backend is running and accessible for full functionality.

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the console logs in Expo
3. Verify all configuration files are in place
4. Ensure environment variables are correctly set

## Next Steps

After successful testing, you can:

- Integrate real chat functionality
- Add more notification types
- Implement user profiles and settings
- Add offline support
- Enhance the UI/UX
