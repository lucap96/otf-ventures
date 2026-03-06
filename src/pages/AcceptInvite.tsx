import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, User } from 'lucide-react';

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [assignedRole, setAssignedRole] = useState<'admin' | 'viewer' | null>(null);

  useEffect(() => {
    const bootstrapInvite = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setSessionError) {
            setError(setSessionError.message);
            return;
          }
          window.history.replaceState({}, document.title, '/accept-invite');
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user?.email) {
          setError('Invalid or expired invitation link. Request a new invite.');
          return;
        }

        const normalizedEmail = userData.user.email.toLowerCase();
        setEmail(normalizedEmail);
        setFullName((userData.user.user_metadata?.full_name as string) ?? '');

        const { data: invited, error: invitedError } = await supabase.rpc('is_invited', {
          check_email: normalizedEmail,
        });

        if (invitedError) {
          setError(invitedError.message);
          return;
        }

        if (!invited) {
          setError('This email address has not been invited. Contact an administrator to request access.');
          return;
        }

        setReady(true);
      } finally {
        setLoading(false);
      }
    };

    void bootstrapInvite();
  }, []);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user?.email) {
      setError('Invite session expired. Please open the invite link again.');
      setSubmitting(false);
      return;
    }

    // Update auth user password + metadata
    const { error: updateUserError } = await supabase.auth.updateUser({
      password,
      data: { full_name: fullName.trim() },
    });
    if (updateUserError) {
      setError(updateUserError.message);
      setSubmitting(false);
      return;
    }

    // Atomically activate the user record: sets user_id, status='active', full_name
    const { data: roleData, error: roleError } = await supabase.rpc('claim_invitation_role', {
      p_full_name: fullName.trim(),
    });
    if (roleError) {
      setError(roleError.message);
      setSubmitting(false);
      return;
    }

    const role = (roleData === 'admin' ? 'admin' : 'viewer') as 'admin' | 'viewer';
    setAssignedRole(role);
    await supabase.auth.refreshSession();
    toast.success('Account setup complete.');
    navigate('/', { replace: true });
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
          <h1 className="font-display text-xl font-bold mb-3">Access Denied</h1>
          <p className="text-sm text-muted-foreground font-body">{error || 'This invite link is invalid or has expired.'}</p>
          <Button className="mt-6 w-full font-display uppercase tracking-wide" onClick={() => navigate('/login')}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!email) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="decorative-circle-lg" />
      <div className="decorative-circle-sm" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="font-display text-xs font-bold tracking-[3px] uppercase text-primary mb-1">OTF Ventures</div>
          <div className="text-xs text-muted-foreground tracking-wider font-body">Complete Your Account</div>
        </div>

        <form onSubmit={handleComplete} className="glass-card p-8 space-y-5">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight">Set Your Profile</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">{email}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full-name" className="text-xs uppercase tracking-wider font-body font-semibold text-muted-foreground">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10 font-body"
                placeholder="Jane Doe"
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
          {assignedRole && !error && (
            <p className="text-xs text-muted-foreground font-body">
              Access granted as {assignedRole}.
            </p>
          )}

          <Button type="submit" className="w-full font-display font-bold tracking-wider uppercase" disabled={submitting}>
            {submitting ? 'Saving…' : 'Activate Account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
