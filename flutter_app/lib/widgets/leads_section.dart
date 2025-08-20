import 'package:flutter/material.dart';
import 'package:maqro_dealerships/utils/theme.dart';

class LeadsSection extends StatelessWidget {
  const LeadsSection({super.key});

  @override
  Widget build(BuildContext context) {
    // Mock data - in real app this would come from API
    final leads = [
      {
        'id': '1',
        'name': 'John Smith',
        'car_interest': '2023 Toyota Camry',
        'source': 'Website',
        'status': 'new',
        'last_contact_at': '2 hours ago',
      },
      {
        'id': '2',
        'name': 'Sarah Johnson',
        'car_interest': '2024 Honda CR-V',
        'source': 'Facebook',
        'status': 'warm',
        'last_contact_at': '1 day ago',
      },
      {
        'id': '3',
        'name': 'Mike Chen',
        'car_interest': '2023 Ford F-150',
        'source': 'Instagram',
        'status': 'hot',
        'last_contact_at': '3 hours ago',
      },
      {
        'id': '4',
        'name': 'Emily Davis',
        'car_interest': '2024 Tesla Model 3',
        'source': 'Phone',
        'status': 'appointment_booked',
        'last_contact_at': '5 hours ago',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Recent Leads',
          style: TextStyle(
            color: AppTheme.white,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 24),
        
        // Leads list
        Column(
          children: leads.map((lead) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _buildLeadCard(lead),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildLeadCard(Map<String, dynamic> lead) {
    final statusColors = {
      'new': {'bg': AppTheme.primaryBlue.withOpacity(0.2), 'text': AppTheme.primaryBlue, 'border': AppTheme.primaryBlue.withOpacity(0.3)},
      'warm': {'bg': Colors.orange.withOpacity(0.2), 'text': Colors.orange, 'border': Colors.orange.withOpacity(0.3)},
      'hot': {'bg': Colors.red.withOpacity(0.2), 'text': Colors.red, 'border': Colors.red.withOpacity(0.3)},
      'follow-up': {'bg': Colors.yellow.withOpacity(0.2), 'text': Colors.yellow, 'border': Colors.yellow.withOpacity(0.3)},
      'cold': {'bg': AppTheme.gray500.withOpacity(0.2), 'text': AppTheme.gray400, 'border': AppTheme.gray500.withOpacity(0.3)},
      'appointment_booked': {'bg': AppTheme.primaryPurple.withOpacity(0.2), 'text': AppTheme.primaryPurple, 'border': AppTheme.primaryPurple.withOpacity(0.3)},
      'deal_won': {'bg': Colors.green.withOpacity(0.2), 'text': Colors.green, 'border': Colors.green.withOpacity(0.3)},
      'deal_lost': {'bg': Colors.red.withOpacity(0.2), 'text': Colors.red, 'border': Colors.red.withOpacity(0.3)},
    };

    final status = lead['status'] as String;
    final statusColor = statusColors[status] ?? statusColors['new']!;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.gray800.withOpacity(0.5),
        border: Border.all(color: AppTheme.gray700),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppTheme.gray700,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Center(
              child: Text(
                _getInitials(lead['name'] as String),
                style: const TextStyle(
                  color: AppTheme.gray300,
                  fontWeight: FontWeight.w500,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Lead info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lead['name'] as String,
                  style: const TextStyle(
                    color: AppTheme.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  lead['car_interest'] as String,
                  style: const TextStyle(
                    color: AppTheme.gray400,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      _getSourceIcon(lead['source'] as String),
                      color: AppTheme.gray500,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      lead['source'] as String,
                      style: const TextStyle(
                        color: AppTheme.gray500,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Status and time
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor['bg'] as Color,
                  border: Border.all(color: statusColor['border'] as Color),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _formatStatus(status),
                  style: TextStyle(
                    color: statusColor['text'] as Color,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                lead['last_contact_at'] as String,
                style: const TextStyle(
                  color: AppTheme.gray500,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getInitials(String name) {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}';
    }
    return name[0];
  }

  IconData _getSourceIcon(String source) {
    switch (source.toLowerCase()) {
      case 'website':
        return Icons.language;
      case 'facebook':
        return Icons.facebook;
      case 'instagram':
        return Icons.camera_alt;
      case 'phone':
        return Icons.phone;
      default:
        return Icons.language;
    }
  }

  String _formatStatus(String status) {
    return status.split('_').map((word) {
      return word[0].toUpperCase() + word.substring(1);
    }).join(' ');
  }
}
