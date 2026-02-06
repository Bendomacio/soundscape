import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session, Provider } from '@supabase/supabase-js';
import { logger } from '../lib/logger';

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
  isDevMode: boolean;
  isDevSession: boolean; // True when logged in via devLogin (no DB persistence)
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: Provider) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  devLogin: (type: 'admin' | 'user') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevSession, setIsDevSession] = useState(false);
  
  // Use refs to track initialization state (survives re-renders, no closure issues)
  const isInitialized = useRef(false);
  const isMounted = useRef(true);

  // Fetch user profile from profiles table with timeout
  async function fetchProfile(userId: string): Promise<Profile | null> {
    try {
      // Race between the query and a timeout
      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      const timeoutPromise = new Promise<null>((resolve) => 
        setTimeout(() => resolve(null), 5000)
      );
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      if (!result || !('data' in result)) {
        logger.warn('Profile fetch timed out');
        return null;
      }

      const { data, error } = result;

      if (error) {
        logger.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (err) {
      logger.error('Failed to fetch profile:', err);
      return null;
    }
  }

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      if (profileData) {
        setProfile(profileData);
        setIsAdmin(profileData.is_admin);
      }
    }
  }, [user]);

  // Initialize auth state
  useEffect(() => {
    isMounted.current = true;
    
    // Prevent double initialization (React StrictMode / HMR)
    if (isInitialized.current) {
      logger.debug('Auth already initialized, skipping');
      return;
    }

    async function initAuth() {
      logger.debug('Initializing auth...');

      // Hard timeout - no matter what, stop loading after 5 seconds
      const hardTimeout = setTimeout(() => {
        if (isMounted.current && !isInitialized.current) {
          logger.warn('Auth hard timeout - forcing load complete');
          isInitialized.current = true;
          setIsLoading(false);
        }
      }, 5000);

      try {
        // Get session with a timeout wrapper
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), 4000)
        );
        
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (!isMounted.current) {
          clearTimeout(hardTimeout);
          return;
        }

        // If timeout won or no session
        if (!result || !('data' in result)) {
          logger.warn('Session fetch timed out or failed');
          isInitialized.current = true;
          setIsLoading(false);
          clearTimeout(hardTimeout);
          return;
        }

        const { data: { session } } = result;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile but don't block on it
          const profileData = await fetchProfile(session.user.id);
          if (isMounted.current && profileData) {
            setProfile(profileData);
            setIsAdmin(profileData.is_admin);
          }
        }
        
        isInitialized.current = true;
        setIsLoading(false);
        clearTimeout(hardTimeout);
        logger.debug('Auth initialized successfully');

      } catch (err) {
        logger.error('Auth initialization error:', err);
        if (isMounted.current) {
          isInitialized.current = true;
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth changes (but don't set loading state)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted.current) return;
        
        // Skip INITIAL_SESSION event as we handle it above
        if (event === 'INITIAL_SESSION') return;

        logger.debug('Auth event:', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          try {
            const profileData = await fetchProfile(newSession.user.id);
            if (isMounted.current && profileData) {
              setProfile(profileData);
              setIsAdmin(profileData.is_admin);
            }
          } catch (err) {
            logger.error('Failed to fetch profile on auth change:', err);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email/password
  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
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
  }, []);

  // Sign up with email/password
  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
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
  }, []);

  // Sign in with OAuth provider (Google, Discord, Facebook)
  const signInWithProvider = useCallback(async (provider: Provider): Promise<{ error: Error | null }> => {
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
  }, []);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      logger.error('Error during sign out:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsAdmin(false);
      setIsDevSession(false);
    }
  }, []);

  // Dev-only login for local testing (bypasses Supabase auth)
  const isDevMode = import.meta.env.DEV && window.location.hostname === 'localhost';

  const devLogin = useCallback((type: 'admin' | 'user'): void => {
    if (!isDevMode) {
      logger.warn('Dev login attempted in production - ignored');
      return;
    }

    const mockUsers = {
      admin: {
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'testadmin@soundscape.dev',
          app_metadata: {},
          user_metadata: { display_name: 'Test Admin' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User,
        profile: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'testadmin@soundscape.dev',
          display_name: 'Test Admin',
          avatar_url: null,
          is_admin: true,
        } as Profile,
      },
      user: {
        user: {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'testuser@soundscape.dev',
          app_metadata: {},
          user_metadata: { display_name: 'Test User' },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User,
        profile: {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'testuser@soundscape.dev',
          display_name: 'Test User',
          avatar_url: null,
          is_admin: false,
        } as Profile,
      },
    };

    const mock = mockUsers[type];
    setUser(mock.user);
    setProfile(mock.profile);
    setIsAdmin(mock.profile.is_admin);
    setSession(null); // No real session in dev mode
    setIsDevSession(true); // Flag that this is a dev session (no DB persistence)
    logger.debug(`Dev login as ${type}: ${mock.profile.display_name}`);
  }, [isDevMode]);

  const value = useMemo(() => ({
    user,
    profile,
    session,
    isAdmin,
    isLoading,
    isDevMode,
    isDevSession,
    signInWithEmail,
    signUpWithEmail,
    signInWithProvider,
    signOut,
    refreshProfile,
    devLogin,
  }), [user, profile, session, isAdmin, isLoading, isDevMode, isDevSession, signInWithEmail, signUpWithEmail, signInWithProvider, signOut, refreshProfile, devLogin]);

  return (
    <AuthContext.Provider value={value}>
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
