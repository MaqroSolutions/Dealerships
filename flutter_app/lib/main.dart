import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
// TODO: Uncomment when Firebase is configured
// import 'package:firebase_core/firebase_core.dart';
// import 'package:maqro_dealerships/firebase_options.dart';
import 'package:maqro_dealerships/providers/auth_provider.dart';
import 'package:maqro_dealerships/screens/landing_screen.dart';
import 'package:maqro_dealerships/screens/dashboard_screen.dart';
import 'package:maqro_dealerships/utils/theme.dart';
// import 'package:maqro_dealerships/services/push_notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // TODO: Uncomment when Firebase is configured
  // // Initialize Firebase
  // await Firebase.initializeApp(
  //   options: DefaultFirebaseOptions.currentPlatform,
  // );
  
  // // Initialize push notifications
  // await PushNotificationService.initialize();
  
  runApp(const MaqroApp());
}

class MaqroApp extends StatelessWidget {
  const MaqroApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'Maqro Dealerships',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.dark,
        debugShowCheckedModeBanner: false,
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        if (authProvider.isLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }
        
        if (authProvider.isAuthenticated) {
          return const DashboardScreen();
        }
        
        return const LandingScreen();
      },
    );
  }
}
