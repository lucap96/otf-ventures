import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
  const { user, loading, signIn, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => {
    const reason = window.sessionStorage.getItem('auth:signout_reason') ?? '';
    if (reason) window.sessionStorage.removeItem('auth:signout_reason');
    return reason;
  });
  const [submitting, setSubmitting] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-display text-primary text-lg tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  // Don't navigate while signIn is in-flight — blocked users are set briefly before signOut fires.
  if (user && !submitting) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setSubmitting(false);
  };

  const handleResetPassword = async () => {
    setError('');
    setResetMessage('');
    setResetSubmitting(true);
    const { error } = await requestPasswordReset(email);
    if (error) {
      setError(error.message);
      setResetSubmitting(false);
      return;
    }
    setResetMessage('If an account exists for this email, a reset link has been sent.');
    setResetSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="decorative-circle-lg" />
      <div className="decorative-circle-sm" />

      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="text-center mb-10">
          <div className="font-display text-xs font-bold tracking-[3px] uppercase text-primary mb-1">
            OTF Ventures
          </div>
          <div className="text-xs text-muted-foreground tracking-wider font-body">
            Data Room · Confidential
          </div>
        </div>

        <div className="glass-card p-8">
          <h1 className="font-display text-2xl font-extrabold text-foreground mb-1 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground mb-8 font-body">
            Access is by invitation only. Sign in with your credentials.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider font-body font-semibold text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 font-body"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider font-body font-semibold text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 font-body"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="text-xs font-body text-primary hover:underline disabled:opacity-60"
                  disabled={resetSubmitting || submitting}
                >
                  {resetSubmitting ? 'Sending reset link…' : 'Forgot password?'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-body">{error}</p>
            )}
            {resetMessage && (
              <p className="text-sm text-foreground font-body">{resetMessage}</p>
            )}

            <Button type="submit" className="w-full font-display font-bold tracking-wider uppercase" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-8 tracking-wider font-body">
          Confidential · Not for distribution
        </p>
      </div>
    </div>
  );
}
