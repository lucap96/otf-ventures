import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  roleLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const lastSessionSignature = useRef<string | null>(null);

  const checkAdmin = async (userId: string) => {
    setRoleLoading(true);
    try {
      const roleResult = await Promise.race([
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timed out while checking admin role')), 5000);
        }),
      ]);

      if (roleResult.error) {
        console.error('Failed to check admin role:', roleResult.error);
      }

      const isAdminUser = !!roleResult.data;
      setIsAdmin(isAdminUser);
      return isAdminUser;
    } catch (error) {
      console.error('Failed to resolve admin role:', error);
      setIsAdmin(false);
      return false;
    } finally {
      setRoleLoading(false);
    }
  };

  const trackLogin = async (userId: string, sessionToken?: string) => {
    if (sessionToken && typeof window !== 'undefined') {
      const dedupeKey = `analytics:last_login_token:${userId}`;
      if (window.sessionStorage.getItem(dedupeKey) === sessionToken) {
        return;
      }
      window.sessionStorage.setItem(dedupeKey, sessionToken);
    }

    const { error } = await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'login',
      metadata: { timestamp: new Date().toISOString() },
    });
    if (error) {
      console.error('Failed to track login event:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null;

    const applySession = async (event: string | null, nextSession: Session | null) => {
      if (!mounted) return;

      const signature = nextSession ? `${nextSession.user.id}:${nextSession.access_token}` : 'signed_out';
      if (signature === lastSessionSignature.current) {
        return;
      }
      lastSessionSignature.current = signature;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        void (async () => {
          const isAdminUser = await checkAdmin(nextSession.user.id);
          if (!mounted) return;
          if (event === 'SIGNED_IN' && !isAdminUser) {
            void trackLogin(nextSession.user.id, nextSession.access_token);
          }
        })();
      } else {
        setIsAdmin(false);
        setRoleLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          await applySession(event, session);
        } catch (error) {
          console.error('Auth state change handling failed:', error);
        } finally {
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
          }
          if (mounted) setLoading(false);
        }
      }
    );

    // Failsafe so loading never hangs if no auth event is emitted.
    loadingTimeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 4000);

    return () => {
      mounted = false;
      if (loadingTimeout) clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error || !data.user) return { error };

    const userEmail = (data.user.email ?? normalizedEmail).toLowerCase();
    const [adminResult, invitedResult] = await Promise.all([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'admin')
        .maybeSingle(),
      supabase.rpc('is_invited', { check_email: userEmail }),
    ]);

    if (adminResult.error) {
      console.error('Failed to check admin access during sign-in:', adminResult.error);
    }

    if (invitedResult.error) {
      await supabase.auth.signOut();
      return { error: { message: 'Unable to verify invitation status. Please try again.' } };
    }

    const isAdminUser = !!adminResult.data;
    const isInvitedUser = !!invitedResult.data;
    if (!isAdminUser && !isInvitedUser) {
      await supabase.auth.signOut();
      return { error: { message: 'Your account is not invited to this application.' } };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setRoleLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, roleLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
