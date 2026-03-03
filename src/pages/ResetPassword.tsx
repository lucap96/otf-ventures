import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const bootstrapRecovery = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = new URLSearchParams(window.location.search).get('code');

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setSessionError) {
            setError(setSessionError.message);
            return;
          }
          window.history.replaceState({}, document.title, '/reset-password');
        } else if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            return;
          }
          window.history.replaceState({}, document.title, '/reset-password');
        }

        const { data, error: getUserError } = await supabase.auth.getUser();
        if (getUserError || !data.user) {
          setError('Invalid or expired reset link. Request a new one from login.');
          return;
        }

        setReady(true);
      } finally {
        setLoading(false);
      }
    };

    void bootstrapRecovery();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: updateUserError } = await supabase.auth.updateUser({ password });
    if (updateUserError) {
      setError(updateUserError.message);
      setSubmitting(false);
      return;
    }

    await supabase.auth.signOut();
    toast.success('Password updated. Please sign in again.');
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-display text-primary text-lg tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="glass-card p-8 max-w-md w-full">
          <h1 className="font-display text-xl font-bold mb-3">Reset Link Invalid</h1>
          <p className="text-sm text-muted-foreground font-body">{error || 'This reset link is invalid.'}</p>
          <Button className="mt-6 w-full font-display uppercase tracking-wide" onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="decorative-circle-lg" />
      <div className="decorative-circle-sm" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="font-display text-xs font-bold tracking-[3px] uppercase text-primary mb-1">OTF Ventures</div>
          <div className="text-xs text-muted-foreground tracking-wider font-body">Reset Password</div>
        </div>

        <form onSubmit={handleReset} className="glass-card p-8 space-y-5">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight">Set a New Password</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Choose a password with at least 8 characters.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider font-body font-semibold text-muted-foreground">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 font-body"
                placeholder="Minimum 8 characters"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-xs uppercase tracking-wider font-body font-semibold text-muted-foreground">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 font-body"
                placeholder="Repeat password"
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive font-body">{error}</p>}

          <Button type="submit" className="w-full font-display font-bold tracking-wider uppercase" disabled={submitting}>
            {submitting ? 'Saving…' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
