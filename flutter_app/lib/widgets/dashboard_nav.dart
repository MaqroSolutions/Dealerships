import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maqro_dealerships/providers/auth_provider.dart';
import 'package:maqro_dealerships/utils/theme.dart';
import 'package:maqro_dealerships/screens/notification_settings_screen.dart';

class DashboardNav extends StatelessWidget {
  const DashboardNav({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.darkGray.withOpacity(0.8),
        border: Border(
          bottom: BorderSide(
            color: AppTheme.gray700,
            width: 1,
          ),
        ),
      ),
      child: SafeArea(
        child: Container(
          height: 64,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              // Logo
              Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    decoration: const BoxDecoration(
                      gradient: AppTheme.blueToPurpleGradient,
                      borderRadius: BorderRadius.all(Radius.circular(8)),
                    ),
                    child: const Center(
                      child: Text(
                        'M',
                        style: TextStyle(
                          color: AppTheme.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Maqro',
                    style: TextStyle(
                      color: AppTheme.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
              
              const Spacer(),
              
              // User info and actions
              Consumer<AuthProvider>(
                builder: (context, authProvider, child) {
                  return Row(
                    children: [
                      Text(
                        'Welcome, ${authProvider.userName ?? 'User'}',
                        style: const TextStyle(
                          color: AppTheme.gray300,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(width: 16),
                      IconButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const NotificationSettingsScreen(),
                            ),
                          );
                        },
                        icon: const Icon(
                          Icons.notifications,
                          color: AppTheme.gray400,
                        ),
                        tooltip: 'Notification Settings',
                      ),
                      IconButton(
                        onPressed: () async {
                          await authProvider.signOut();
                        },
                        icon: const Icon(
                          Icons.logout,
                          color: AppTheme.gray400,
                        ),
                        tooltip: 'Sign Out',
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
