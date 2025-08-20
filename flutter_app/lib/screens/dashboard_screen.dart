import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:maqro_dealerships/providers/auth_provider.dart';
import 'package:maqro_dealerships/utils/theme.dart';
import 'package:maqro_dealerships/widgets/welcome_section.dart';
import 'package:maqro_dealerships/widgets/performance_overview.dart';
import 'package:maqro_dealerships/widgets/leads_section.dart';
import 'package:maqro_dealerships/widgets/alerts_section.dart';
import 'package:maqro_dealerships/widgets/dashboard_nav.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.darkGradient,
        ),
        child: const Column(
          children: [
            DashboardNav(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    WelcomeSection(),
                    const SizedBox(height: 24),
                    PerformanceOverview(),
                    const SizedBox(height: 32),
                    Column(
                      children: [
                        LeadsSection(),
                        const SizedBox(height: 24),
                        AlertsSection(),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
