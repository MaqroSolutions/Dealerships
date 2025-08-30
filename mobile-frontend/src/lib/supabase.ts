import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get environment variables from Expo Constants
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

console.log('Environment debugging:');
console.log('- Constants.expoConfig?.extra:', JSON.stringify(Constants.expoConfig?.extra, null, 2));
console.log('- Supabase URL:', supabaseUrl);
console.log('- Supabase Key available:', !!supabaseAnonKey);
console.log('- Supabase Key length:', supabaseAnonKey?.length);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables. Check your app.config.js file.');
  console.error('Available config:', Constants.expoConfig?.extra);
} else {
  console.log('✅ Supabase configuration loaded successfully');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Type definitions for your Supabase tables
export type Lead = {
  id: string;
  created_at: string;
  name: string;
  car_interest: string;
  source: string;
  status: 'new' | 'warm' | 'hot' | 'follow-up' | 'cold' | 'deal_won' | 'deal_lost' | 'appointment_booked';
  last_contact_at: string;
  email?: string;
  phone?: string;
  message?: string;
  max_price?: string;
  user_id: string; // Foreign key to auth.users
  conversations?: Conversation[];
};

export type Inventory = {
  id: string;
  created_at: string;
  updated_at: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  description?: string;
  features?: string;
  condition?: string;
  dealership_id: string; // Foreign key to auth.users
  status: 'active' | 'sold' | 'pending';
};

export type Conversation = {
  id: string;
  created_at: string;
  message: string;
  sender: 'customer' | 'agent'
  lead_id: string;
}

export type UserProfile ={
  id: string
  user_id: string
  dealership_id?: string | null
  full_name: string
  phone?: string
  role: string
  timezone: string
  created_at: string
  updated_at: string
}

// Helper function to check if user is logged in
export const isUserLoggedIn = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
