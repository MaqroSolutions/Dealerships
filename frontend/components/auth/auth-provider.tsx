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
    console.log('AuthProvider: Starting auth check...');
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('AuthProvider: Timeout reached, setting loading to false');
      setLoading(false);
    }, 1000); // Reduced timeout to 1 second

    // Check if we have a session
    const getSession = async () => {
      try {
        console.log('AuthProvider: Getting session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthProvider: Session result:', session ? 'User found' : 'No user');
        setUser(session?.user || null);
        setLoading(false);
        
        // Define public routes that don't require authentication
        const publicRoutes = [
          "/login", 
          "/signup", 
          "/", 
          "/confirm-email",
          "/setup-complete"
        ];
        const isPublicRoute = publicRoutes.includes(pathname) || pathname.includes("/auth/");
        
        // If no user and not on public route, redirect to root
        if (!session?.user && !isPublicRoute) {
          console.log('AuthProvider: Redirecting to root');
          router.push("/");
        }
        
        // If user is authenticated, check role-based routing
        if (session?.user) {
          // Don't redirect if on setup-complete or confirm-email pages
          if (pathname === "/setup-complete" || pathname === "/confirm-email") {
            return;
          }
          
          // Import and use the role-based routing logic
          import('@/hooks/use-user-role').then(async ({ useUserRole }) => {
            try {
              // Get user profile to determine role
              const response = await fetch('/api/user-profiles/me', {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`
                }
              });
              
              if (response.ok) {
                const profile = await response.json();
                const userRole = profile.role;
                
                // Role-based routing logic
                if (userRole === 'owner' || userRole === 'manager') {
                  // Admin users should be in admin routes
                  if (pathname === "/" || pathname.startsWith("/app/")) {
                    console.log('AuthProvider: Redirecting admin to admin dashboard');
                    router.push("/admin/dashboard");
                  }
                } else if (userRole === 'salesperson') {
                  // Salesperson users should be in app routes
                  if (pathname === "/" || pathname.startsWith("/admin/")) {
                    console.log('AuthProvider: Redirecting salesperson to app');
                    router.push("/app/leads");
                  }
                }
              } else {
                // No profile found, user needs to complete setup
                if (pathname !== "/setup-complete") {
                  console.log('AuthProvider: No profile found, redirecting to setup-complete');
                  router.push("/setup-complete");
                }
              }
            } catch (error) {
              console.error('AuthProvider: Error checking user role:', error);
              // If there's an error checking profile, redirect to setup-complete
              if (pathname !== "/setup-complete") {
                router.push("/setup-complete");
              }
            }
          });
        }
      } catch (error) {
        console.error('AuthProvider: Error getting session:', error);
        setLoading(false);
        // If there's an error with Supabase, redirect to root
        if (pathname !== "/") {
          router.push("/");
        }
      }
    };
    
    getSession();

    // Listen for auth state changes
    try {
      console.log('AuthProvider: Setting up auth listener...');
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('AuthProvider: Auth state change:', event, session ? 'User found' : 'No user');
        setUser(session?.user || null);
        setLoading(false);

        // Handle auth events
        if (event === "SIGNED_OUT") {
          router.push("/");
        } else if (event === "SIGNED_IN" && 
                  (pathname === "/login" || pathname === "/signup")) {
          // Check if user has profile, if not redirect to setup-complete
          if (session?.user) {
            // Check for pending signup data
            const pendingSignup = localStorage.getItem('pendingSignup');
            if (pendingSignup) {
              router.push("/setup-complete");
            } else {
              router.push("/");
            }
          }
        }
      });

      // Cleanup subscription
      return () => {
        console.log('AuthProvider: Cleaning up...');
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    } catch (error) {
      console.error('AuthProvider: Error setting up auth listener:', error);
      setLoading(false);
      clearTimeout(timeout);
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