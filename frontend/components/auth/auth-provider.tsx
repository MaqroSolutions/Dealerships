"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

// Create context
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  useEffect(() => {
    // Define public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/login',
      '/signup',
      '/confirm-email',
      '/setup-complete',
      '/test-signup',
      '/test',
      '/forgot-password',
      '/reset-password'
    ];
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.includes("/auth/");

    // Check if we have a session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        setLoading(false);
        
        // Only redirect if we're on a protected route and have no user
        if (!session?.user && !isPublicRoute) {
          router.push("/");
          return;
        }
        
        // If user is authenticated and on login/signup, redirect appropriately
        if (session?.user && (pathname === "/login" || pathname === "/signup")) {
          router.push("/");
          return;
        }
        
      } catch (error) {
        console.error('AuthProvider: Error getting session:', error);
        setLoading(false);
      }
    };
    
    getSession();

    // Listen for auth state changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user || null);
        setLoading(false);

        // Handle auth events
        if (event === "SIGNED_OUT") {
          router.push("/");
        } else if (event === "SIGNED_IN" && 
                  (pathname === "/login" || pathname === "/signup")) {
          router.push("/");
        }
      });

      // Cleanup subscription
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('AuthProvider: Error setting up auth listener:', error);
      setLoading(false);
    }
  }, [pathname, router]);

  // Context value
  const value = {
    user,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 