import 'package:flutter_dotenv/flutter_dotenv.dart';

class Config {
  // Supabase Configuration
  static String get supabaseUrl {
    return dotenv.env['SUPABASE_URL'] ?? 
           dotenv.env['NEXT_PUBLIC_SUPABASE_URL'] ?? 
           'https://placeholder.supabase.co';
  }
  
  static String get supabaseAnonKey {
    return dotenv.env['SUPABASE_ANON_KEY'] ?? 
           dotenv.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? 
           'placeholder-key';
  }
  
  // Backend API Configuration
  static const String backendBaseUrl = 'https://dealerships-tnvx.onrender.com';
  
  // App Configuration
  static const String appName = 'Dealerships App';
  static const String appVersion = '1.0.0';
  
  // Check if environment is properly configured
  static bool get isConfigured {
    return supabaseUrl != 'https://placeholder.supabase.co' && 
           supabaseAnonKey != 'placeholder-key';
  }
}
