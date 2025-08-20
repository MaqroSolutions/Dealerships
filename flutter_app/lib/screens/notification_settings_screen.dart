import 'package:flutter/material.dart';
import 'package:maqro_dealerships/utils/theme.dart';
// import 'package:maqro_dealerships/services/push_notification_service.dart';
// import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  bool _isLoading = false;
  // NotificationSettings? _settings;
  // String? _fcmToken;

  @override
  void initState() {
    super.initState();
    // _loadNotificationSettings();
  }

  // Future<void> _loadNotificationSettings() async {
  //   try {
  //     _settings = await PushNotificationService.getNotificationSettings();
  //     _fcmToken = PushNotificationService.fcmToken;
  //   } catch (e) {
  //     print('Error loading notification settings: $e');
  //   } finally {
  //     setState(() {
  //       _isLoading = false;
  //     });
  //   }
  // }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notification Settings'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.darkGradient,
        ),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // FCM Token (for debugging)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.gray800.withOpacity(0.5),
                        border: Border.all(color: AppTheme.gray700),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Device Token',
                            style: TextStyle(
                              color: AppTheme.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Not available', // _fcmToken ?? 'Not available',
                            style: const TextStyle(
                              color: AppTheme.gray300,
                              fontSize: 12,
                              fontFamily: 'monospace',
                            ),
                          ),
                          // if (_fcmToken != null) ...[
                          //   const SizedBox(height: 12),
                          //   Row(
                          //     children: [
                          //       Expanded(
                          //         child: ElevatedButton(
                          //           onPressed: () {
                          //             // Copy token to clipboard
                          //             // Clipboard.setData(ClipboardData(text: _fcmToken!));
                          //             ScaffoldMessenger.of(context).showSnackBar(
                          //               const SnackBar(
                          //                 content: Text('Token copied to clipboard'),
                          //               ),
                          //             );
                          //           },
                          //           style: ElevatedButton.styleFrom(
                          //             backgroundColor: AppTheme.primaryBlue,
                          //             foregroundColor: AppTheme.white,
                          //           ),
                          //           child: const Text('Copy Token'),
                          //         ),
                          //       ),
                          //     ],
                          //   ),
                          // ],
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Notification Settings
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppTheme.gray800.withOpacity(0.5),
                        border: Border.all(color: AppTheme.gray700),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Notification Permissions',
                            style: TextStyle(
                              color: AppTheme.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          // if (_settings != null) ...[
                          //   _buildPermissionRow(
                          //     'Alert',
                          //     _settings!.alert == AuthorizationStatus.authorized,
                          //     'Show notification banners',
                          //   ),
                          //   _buildPermissionRow(
                          //     'Badge',
                          //     _settings!.badge == AuthorizationStatus.authorized,
                          //     'Show notification count on app icon',
                          //   ),
                          //   _buildPermissionRow(
                          //     'Sound',
                          //     _settings!.sound == AuthorizationStatus.authorized,
                          //     'Play notification sounds',
                          //   ),
                          // ],
                          
                          const SizedBox(height: 20),
                          
                          // Request permissions button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: () async {
                                await _requestPermissions();
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryBlue,
                                foregroundColor: AppTheme.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                              child: const Text('Request Permissions'),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Topic Subscriptions
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppTheme.gray800.withOpacity(0.5),
                        border: Border.all(color: AppTheme.gray700),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Topic Subscriptions',
                            style: TextStyle(
                              color: AppTheme.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 16),
                          
                          const Text(
                            'Subscribe to receive notifications for specific events:',
                            style: TextStyle(
                              color: AppTheme.gray300,
                              fontSize: 14,
                            ),
                          ),
                          
                          const SizedBox(height: 16),
                          
                          _buildTopicRow('New Leads', 'new_leads'),
                          _buildTopicRow('WhatsApp Messages', 'whatsapp_messages'),
                          _buildTopicRow('Appointments', 'appointments'),
                          _buildTopicRow('Deal Updates', 'deal_updates'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildPermissionRow(String title, bool isGranted, String description) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(
            isGranted ? Icons.check_circle : Icons.cancel,
            color: isGranted ? Colors.green : Colors.red,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppTheme.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  description,
                  style: const TextStyle(
                    color: AppTheme.gray400,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopicRow(String title, String topic) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                color: AppTheme.white,
                fontSize: 16,
              ),
            ),
          ),
          Switch(
            value: true, // TODO: Track actual subscription state
            onChanged: (value) async {
              if (value) {
                // await PushNotificationService.subscribeToTopic(topic);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Subscribed to $title')),
                );
              } else {
                // await PushNotificationService.unsubscribeFromTopic(topic);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Unsubscribed from $title')),
                );
              }
            },
            activeColor: AppTheme.primaryBlue,
          ),
        ],
      ),
    );
  }

  Future<void> _requestPermissions() async {
    try {
      // await PushNotificationService.initialize();
      // await _loadNotificationSettings();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Permissions updated'),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error updating permissions: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
