import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Demo mode types (no Supabase required)
interface DemoUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: DemoUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users (stored in localStorage)
const DEMO_STORAGE_KEY = 'soundscape_demo_user';
const ADMIN_EMAILS = ['admin@soundscape.app', 'admin@example.com'];

// Always use demo mode for now (Supabase auth not fully implemented)
const isDemoMode = true;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount (demo mode)
  useEffect(() => {
    if (isDemoMode) {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        try {
          const demoUser = JSON.parse(stored) as DemoUser;
          setUser(demoUser);
          setIsAdmin(ADMIN_EMAILS.includes(demoUser.email.toLowerCase()));
        } catch {
          localStorage.removeItem(DEMO_STORAGE_KEY);
        }
      }
      setIsLoading(false);
    } else {
      // Real Supabase mode - would initialize here
      setIsLoading(false);
    }
  }, []);

  async function signIn(email: string, password: string): Promise<{ error: Error | null }> {
    if (isDemoMode) {
      // Demo mode - accept any login with password >= 6 chars
      if (password.length < 6) {
        return { error: new Error('Password must be at least 6 characters') };
      }
      
      const demoUser: DemoUser = {
        id: `demo-${Date.now()}`,
        email: email.toLowerCase()
      };
      
      setUser(demoUser);
      setIsAdmin(ADMIN_EMAILS.includes(email.toLowerCase()));
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
      
      return { error: null };
    }
    
    // Real Supabase auth would go here
    return { error: new Error('Supabase not configured') };
  }

  async function signUp(email: string, password: string): Promise<{ error: Error | null }> {
    if (isDemoMode) {
      // In demo mode, signup works the same as login
      return signIn(email, password);
    }
    
    return { error: new Error('Supabase not configured') };
  }

  async function signOut(): Promise<void> {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem(DEMO_STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin, 
      isLoading, 
      signIn, 
      signUp, 
      signOut,
      isDemoMode 
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
