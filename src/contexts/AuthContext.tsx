import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session, Provider } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: Provider) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from profiles table
  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      return null;
    }
  }

  // Refresh profile data
  async function refreshProfile() {
    if (user) {
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setIsAdmin(profileData.is_admin);
      }
    }
  }

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    
    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('Auth initialization timed out');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(profileData => {
          if (!isMounted) return;
          if (profileData) {
            setProfile(profileData);
            setIsAdmin(profileData.is_admin);
          }
          setIsLoading(false);
        }).catch(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        console.log('Auth event:', event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          if (isMounted && profileData) {
            setProfile(profileData);
            setIsAdmin(profileData.is_admin);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email/password
  async function signInWithEmail(email: string, password: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  // Sign up with email/password
  async function signUpWithEmail(email: string, password: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  // Sign in with OAuth provider (Google, Discord, Facebook)
  async function signInWithProvider(provider: Provider): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  // Sign out
  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      isAdmin,
      isLoading,
      signInWithEmail,
      signUpWithEmail,
      signInWithProvider,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
