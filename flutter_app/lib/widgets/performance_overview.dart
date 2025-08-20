import 'package:flutter/material.dart';
import 'package:maqro_dealerships/utils/theme.dart';

class PerformanceOverview extends StatelessWidget {
  const PerformanceOverview({super.key});

  @override
  Widget build(BuildContext context) {
    final stats = [
      {
        'title': 'Total Leads',
        'value': '1,247',
        'change': '+12%',
        'icon': Icons.people,
        'color': AppTheme.primaryBlue,
      },
      {
        'title': 'Warm Leads',
        'value': '342',
        'change': '+8%',
        'icon': Icons.local_fire_department,
        'color': Colors.orange,
      },
      {
        'title': 'Avg Response Time',
        'value': '2.4h',
        'change': '-15%',
        'icon': Icons.access_time,
        'color': Colors.green,
      },
      {
        'title': 'Booked Appointments',
        'value': '89',
        'change': '+23%',
        'icon': Icons.calendar_today,
        'color': AppTheme.primaryPurple,
      },
      {
        'title': 'Deals Closed',
        'value': '\$47,500',
        'change': '+31%',
        'icon': Icons.attach_money,
        'color': Colors.green,
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Performance Overview',
          style: TextStyle(
            color: AppTheme.white,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 24),
        
                  // Stats grid - Mobile layout (2 columns)
          Column(
            children: [
              for (int i = 0; i < stats.length; i += 2)
                Row(
                  children: [
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _buildStatCard(stats[i]),
                      ),
                    ),
                    if (i + 1 < stats.length) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _buildStatCard(stats[i + 1]),
                        ),
                      ),
                    ],
                  ],
                ),
            ],
          ),
      ],
    );
  }

  Widget _buildStatCard(Map<String, dynamic> stat) {
    final isPositiveChange = (stat['change'] as String).startsWith('+');
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.gray800.withOpacity(0.5),
        border: Border.all(color: AppTheme.gray700),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with icon
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  stat['title'] as String,
                  style: const TextStyle(
                    color: AppTheme.gray400,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Icon(
                stat['icon'] as IconData,
                color: stat['color'] as Color,
                size: 16,
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Value
          Text(
            stat['value'] as String,
            style: const TextStyle(
              color: AppTheme.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
            overflow: TextOverflow.ellipsis,
          ),
          
          // Change indicator
          Text(
            '${stat['change']} from last month',
            style: TextStyle(
              color: isPositiveChange ? Colors.green : Colors.red,
              fontSize: 11,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
