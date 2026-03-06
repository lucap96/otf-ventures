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
  sendMagicLink: (email: string) => Promise<{ error: any }>;
  requestPasswordReset: (email: string) => Promise<{ error: any }>;
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

  const fetchUserRecord = async (userId: string, email?: string) => {
    setRoleLoading(true);
    try {
      const result = await Promise.race([
        supabase
          .from('users')
          .select('role, status')
          .eq('user_id', userId)
          .maybeSingle(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timed out while checking user record')), 5000);
        }),
      ]);
      if (result.error) {
        console.error('Failed to fetch user record:', result.error);
        return null;
      }
      // Not found by user_id — could be a pending viewer whose user_id hasn't been
      // set yet (claim_invitation_role runs after setSession in MagicAuth). Fall back
      // to an email lookup so we don't sign them out prematurely.
      if (!result.data && email) {
        const emailResult = await supabase
          .from('users')
          .select('role, status')
          .eq('email', email.toLowerCase())
          .maybeSingle();
        return emailResult.data ?? null;
      }
      return result.data;
    } catch (error) {
      console.error('Failed to resolve user record:', error);
      return null;
    } finally {
      setRoleLoading(false);
    }
  };

  const trackLogin = async (userId: string, sessionToken?: string) => {
    if (sessionToken && typeof window !== 'undefined') {
      const dedupeKey = `analytics:last_login_token:${userId}`;
      if (window.localStorage.getItem(dedupeKey) === sessionToken) return;
      window.localStorage.setItem(dedupeKey, sessionToken);
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
      if (signature === lastSessionSignature.current) return;
      lastSessionSignature.current = signature;

      if (!nextSession?.user) {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setRoleLoading(false);
        return;
      }

      // Set session immediately so auth calls (signIn, updateUser) aren't blocked.
      // Supabase JS v2 awaits onAuthStateChange callbacks — doing a DB query here
      // deadlocks the client. Defer the access check via setTimeout to escape the
      // notifyAllSubscribers execution context.
      setSession(nextSession);
      setUser(nextSession.user);
      // Keep roleLoading true until the deferred check resolves so that
      // adminOnly ProtectedRoute shows a spinner instead of redirecting to "/".
      setRoleLoading(true);

      const capturedEvent = event;
      const capturedSession = nextSession;
      setTimeout(() => {
        if (!mounted) return;
        void (async () => {
          const record = await fetchUserRecord(capturedSession.user.id, capturedSession.user.email ?? undefined);
          if (!mounted) return;

          if (!record || record.status === 'blocked') {
            window.sessionStorage.setItem(
              'auth:signout_reason',
              !record
                ? 'This account no longer exists. Contact an administrator.'
                : 'Your access has been revoked. Please contact an administrator.',
            );
            await supabase.auth.signOut();
            return;
          }

          const isAdminUser = record.role === 'admin' && record.status === 'active';
          setIsAdmin(isAdminUser);

          if (capturedEvent === 'SIGNED_IN' && !isAdminUser) {
            void trackLogin(capturedSession.user.id, capturedSession.access_token);
          }
        })();
      }, 0);
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

  // Force-logout a user who is already logged in and gets blocked by an admin.
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-access-watch:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const status = (payload.new as { status: string }).status;
          if (status === 'blocked') {
            window.sessionStorage.setItem('auth:signout_reason', 'Your access has been revoked. Please contact an administrator.');
            void supabase.auth.signOut();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'users',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          window.sessionStorage.setItem('auth:signout_reason', 'This account no longer exists. Contact an administrator.');
          void supabase.auth.signOut();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

    if (error || !data.user) {
      const { data: inviteStatus } = await supabase.rpc('get_invite_status', { check_email: normalizedEmail });
      if (!inviteStatus) {
        return { error: { message: 'This email has not been invited. Contact an administrator to request access.' } };
      }
      if (inviteStatus === 'pending') {
        return { error: { message: 'You have been invited but have not completed registration yet. Check your email for the invitation link.' } };
      }
      return { error };
    }

    const { data: userRecord, error: userRecordError } = await supabase
      .from('users')
      .select('role, status')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (userRecordError) {
      await supabase.auth.signOut();
      return { error: { message: 'Unable to verify account status. Please try again.' } };
    }

    if (!userRecord) {
      await supabase.auth.signOut();
      return { error: { message: 'This email has not been invited. Contact an administrator to request access.' } };
    }

    if (userRecord.status === 'blocked') {
      await supabase.auth.signOut();
      return { error: { message: 'Your access has been revoked. Please contact an administrator.' } };
    }

    return { error: null };
  };

  const sendMagicLink = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { error: { message: 'Please enter your email address.' } };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: supabaseKey },
        body: JSON.stringify({ email: normalizedEmail, origin: window.location.origin }),
      });
      const data = await res.json();
      if (!res.ok) return { error: { message: data.error ?? 'Failed to send sign-in link.' } };
      return { error: null };
    } catch {
      return { error: { message: 'Network error. Please try again.' } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setRoleLoading(false);
  };

  const requestPasswordReset = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return { error: { message: 'Please enter your email address.' } };
    }

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, roleLoading, signIn, sendMagicLink, requestPasswordReset, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
