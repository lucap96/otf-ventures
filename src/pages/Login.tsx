import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
  const { user, loading, signIn, sendMagicLink, requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => {
    const reason = window.sessionStorage.getItem('auth:signout_reason') ?? '';
    if (reason) window.sessionStorage.removeItem('auth:signout_reason');
    return reason;
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-display text-primary text-lg tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  if (user && !submitting) return <Navigate to="/" replace />;

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    const { error } = await sendMagicLink(email);
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email — a sign-in link is on its way.');
    }
    setSubmitting(false);
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setSubmitting(false);
  };

  const handleResetPassword = async () => {
    setError('');
    setMessage('');
    setSubmitting(true);
    const { error } = await requestPasswordReset(email);
    if (error) {
      setError(error.message);
    } else {
      setMessage('If an account exists for this email, a reset link has been sent.');
    }
    setSubmitting(false);
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
            {showPasswordForm ? 'Sign In' : 'Welcome'}
          </h1>
          <p className="text-sm text-muted-foreground mb-8 font-body">
            {showPasswordForm
              ? 'Sign in with your admin credentials.'
              : 'Access is by invitation only. Enter your email to receive a sign-in link.'}
          </p>

          {!showPasswordForm ? (
            /* Magic link form (default — for viewers) */
            <form onSubmit={handleMagicLink} className="space-y-5">
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

              {error && <p className="text-sm text-destructive font-body">{error}</p>}
              {message && <p className="text-sm text-foreground font-body">{message}</p>}

              <Button
                type="submit"
                className="w-full font-display font-bold tracking-wider uppercase"
                disabled={submitting}
              >
                {submitting ? 'Sending…' : 'Send Sign-In Link'}
              </Button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => { setError(''); setMessage(''); setShowPasswordForm(true); }}
                  className="text-xs font-body text-muted-foreground hover:text-primary transition-colors"
                >
                  Admin? Sign in with password →
                </button>
              </div>
            </form>
          ) : (
            /* Password form (for admins) */
            <form onSubmit={handlePasswordSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email-pw" className="text-xs uppercase tracking-wider font-body font-semibold text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email-pw"
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
                    disabled={submitting}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive font-body">{error}</p>}
              {message && <p className="text-sm text-foreground font-body">{message}</p>}

              <Button
                type="submit"
                className="w-full font-display font-bold tracking-wider uppercase"
                disabled={submitting}
              >
                {submitting ? 'Signing in…' : 'Sign In'}
              </Button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => { setError(''); setMessage(''); setShowPasswordForm(false); }}
                  className="text-xs font-body text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Use magic link instead
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-8 tracking-wider font-body">
          Confidential · Not for distribution
        </p>
      </div>
    </div>
  );
}
