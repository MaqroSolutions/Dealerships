import 'package:flutter/material.dart';
import 'package:maqro_dealerships/screens/login_screen.dart';
import 'package:maqro_dealerships/screens/signup_screen.dart';
import 'package:maqro_dealerships/utils/theme.dart';
import 'package:maqro_dealerships/widgets/hero_section.dart';
import 'package:maqro_dealerships/widgets/feature_list.dart';
import 'package:maqro_dealerships/widgets/landing_nav.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppTheme.darkGradient,
        ),
        child: const Column(
          children: [
            LandingNav(),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    HeroSection(),
                    FeatureList(),
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
