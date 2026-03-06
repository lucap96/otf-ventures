import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, User, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type Mode = 'magic' | 'password' | 'request';

export default function Login() {
  const { user, loading, signIn, sendMagicLink, requestPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(() => {
    const reason = window.sessionStorage.getItem('auth:signout_reason') ?? '';
    if (reason) window.sessionStorage.removeItem('auth:signout_reason');
    return reason;
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>('magic');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-display text-primary text-lg tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  if (user && !submitting) return <Navigate to="/" replace />;

  const switchMode = (next: Mode) => {
    setError('');
    setStatusMessage('');
    setMode(next);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setSubmitting(true);
    const { error } = await sendMagicLink(email);
    if (error) {
      setError(error.message);
    } else {
      setStatusMessage('Check your email — a sign-in link is on its way.');
    }
    setSubmitting(false);
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    setSubmitting(false);
  };

  const handleResetPassword = async () => {
    setError('');
    setStatusMessage('');
    setSubmitting(true);
    const { error } = await requestPasswordReset(email);
    if (error) {
      setError(error.message);
    } else {
      setStatusMessage('If an account exists for this email, a reset link has been sent.');
    }
    setSubmitting(false);
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');
    setSubmitting(true);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string;

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/request-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          full_name: fullName.trim() || undefined,
          message: message.trim() || undefined,
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Request failed. Please try again.');
      } else {
        setStatusMessage("Your request has been submitted. We'll review it and be in touch.");
        setEmail('');
        setFullName('');
        setMessage('');
      }
    } catch {
      setError('Network error. Please try again.');
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
            {mode === 'password' ? 'Sign In' : mode === 'request' ? 'Request Access' : 'Welcome'}
          </h1>
          <p className="text-sm text-muted-foreground mb-8 font-body">
            {mode === 'password'
              ? 'Sign in with your admin credentials.'
              : mode === 'request'
              ? "Tell us who you are and why you'd like access."
              : 'Access is by invitation only. Enter your email to receive a sign-in link.'}
          </p>

          {mode === 'magic' && (
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
              {statusMessage && <p className="text-sm text-foreground font-body">{statusMessage}</p>}

              <Button
                type="submit"
                className="w-full font-display font-bold tracking-wider uppercase"
                disabled={submitting}
              >
                {submitting ? 'Sending…' : 'Send Sign-In Link'}
              </Button>

              <button
                type="button"
                onClick={() => switchMode('request')}
                className="w-full py-2.5 rounded-lg border border-primary/30 bg-primary/5 text-sm font-display font-bold tracking-wider uppercase text-primary hover:bg-primary/10 transition-colors"
              >
                Request Access
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('password')}
                  className="text-xs font-body text-muted-foreground hover:text-primary transition-colors"
                >
                  Admin? Sign in with password →
                </button>
              </div>
            </form>
          )}

          {mode === 'password' && (
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
              {statusMessage && <p className="text-sm text-foreground font-body">{statusMessage}</p>}

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
                  onClick={() => switchMode('magic')}
                  className="text-xs font-body text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Use magic link instead
                </button>
              </div>
            </form>
          )}

          {mode === 'request' && (
            <form onSubmit={handleRequestAccess} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="req-email" className="text-xs uppercase tracking-wider font-body font-semibold text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="req-email"
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
                <Label htmlFor="req-name" className="text-xs uppercase tracking-wider font-body font-semibold text-muted-foreground">
                  Name <span className="normal-case font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="req-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 font-body"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="req-message" className="text-xs uppercase tracking-wider font-body font-semibold text-muted-foreground">
                  Message <span className="normal-case font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    id="req-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 min-h-[80px] rounded-md border border-input bg-background text-sm font-body resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Why are you interested in OTF Ventures?"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive font-body">{error}</p>}
              {statusMessage && <p className="text-sm text-foreground font-body">{statusMessage}</p>}

              <Button
                type="submit"
                className="w-full font-display font-bold tracking-wider uppercase"
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit Request'}
              </Button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => switchMode('magic')}
                  className="text-xs font-body text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Already have access? Sign in
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
