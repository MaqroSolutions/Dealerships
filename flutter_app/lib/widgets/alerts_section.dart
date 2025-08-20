import 'package:flutter/material.dart';
import 'package:maqro_dealerships/utils/theme.dart';

class AlertsSection extends StatelessWidget {
  const AlertsSection({super.key});

  @override
  Widget build(BuildContext context) {
    // Mock data - in real app this would come from API
    final alerts = [
      {
        'id': 1,
        'type': 'action-needed',
        'title': 'Action Needed',
        'message': 'Sarah Johnson requires immediate follow-up',
        'leadName': 'Sarah Johnson',
        'time': '2 hours ago',
      },
      {
        'id': 2,
        'type': 'follow-up',
        'title': 'Follow-Up',
        'message': 'Mike Chen hasn\'t responded in 3 days',
        'leadName': 'Mike Chen',
        'time': '3 days ago',
      },
      {
        'id': 3,
        'type': 'action-needed',
        'title': 'Action Needed',
        'message': 'Emily Davis is ready to schedule appointment',
        'leadName': 'Emily Davis',
        'time': '1 hour ago',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Alerts',
          style: TextStyle(
            color: AppTheme.white,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 24),
        
        // Alerts list
        Column(
          children: alerts.map((alert) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _buildAlertCard(alert),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildAlertCard(Map<String, dynamic> alert) {
    final isActionNeeded = alert['type'] == 'action-needed';
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.gray800.withOpacity(0.5),
        border: Border.all(color: AppTheme.gray700),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with icon and badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    isActionNeeded ? Icons.warning : Icons.access_time,
                    color: isActionNeeded ? Colors.red : Colors.yellow,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isActionNeeded 
                          ? Colors.red.withOpacity(0.2)
                          : Colors.yellow.withOpacity(0.2),
                      border: Border.all(
                        color: isActionNeeded 
                            ? Colors.red.withOpacity(0.3)
                            : Colors.yellow.withOpacity(0.3),
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      alert['title'] as String,
                      style: TextStyle(
                        color: isActionNeeded ? Colors.red : Colors.yellow,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              Text(
                alert['time'] as String,
                style: const TextStyle(
                  color: AppTheme.gray500,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Message
          Text(
            alert['message'] as String,
            style: const TextStyle(
              color: AppTheme.gray300,
              fontSize: 14,
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Lead name
          Text(
            'Lead: ${alert['leadName']}',
            style: const TextStyle(
              color: AppTheme.gray500,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
