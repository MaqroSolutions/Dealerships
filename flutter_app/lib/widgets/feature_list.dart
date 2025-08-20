import 'package:flutter/material.dart';
import 'package:maqro_dealerships/utils/theme.dart';

class FeatureList extends StatelessWidget {
  const FeatureList({super.key});

  @override
  Widget build(BuildContext context) {
    final features = [
      {
        'icon': Icons.flash_on,
        'title': 'Respond instantly with AI',
        'description': 'Automated responses that feel personal and human',
      },
      {
        'icon': Icons.track_changes,
        'title': 'Prioritize high-value leads',
        'description': 'AI identifies your best opportunities automatically',
      },
      {
        'icon': Icons.bar_chart,
        'title': 'Track team performance in real time',
        'description': 'Monitor conversions and optimize your sales process',
      },
    ];

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
      decoration: BoxDecoration(
        color: AppTheme.darkGray.withOpacity(0.5),
      ),
      child: Column(
        children: [
          // Header
          const Text(
            'Why Dealerships Choose Maqro',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Stop losing leads to slow responses. Start closing deals faster.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.gray300,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 40),
          
          // Features grid - Mobile layout (single column)
          Column(
            children: features.map((feature) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 32),
                child: _buildFeatureCard(feature),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard(Map<String, dynamic> feature) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.gray800.withOpacity(0.5),
        border: Border.all(color: AppTheme.gray700),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              gradient: AppTheme.blueToPurpleGradient,
              borderRadius: BorderRadius.all(Radius.circular(12)),
            ),
            child: Icon(
              feature['icon'] as IconData,
              color: AppTheme.white,
              size: 22,
            ),
          ),
          const SizedBox(height: 20),
          
          // Title
          Text(
            feature['title'] as String,
            style: const TextStyle(
              color: AppTheme.white,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          
          // Description
          Text(
            feature['description'] as String,
            style: const TextStyle(
              color: AppTheme.gray300,
              height: 1.4,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}
