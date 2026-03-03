import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Check, Plus, Trash2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

interface Invitation {
  id: string;
  email: string;
  accepted: boolean;
  role: 'admin' | 'user';
  created_at: string;
}

export default function AdminInvitations() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [manualInviteLink, setManualInviteLink] = useState('');

  const getFunctionErrorMessage = async (error: unknown) => {
    if (typeof error === 'object' && error !== null) {
      const maybeContext = (error as { context?: unknown }).context;
      if (typeof maybeContext === 'string' && maybeContext.trim()) {
        return maybeContext;
      }
      if (maybeContext && typeof maybeContext === 'object' && 'json' in maybeContext) {
        try {
          const payload = await (maybeContext as { json: () => Promise<{ error?: string; message?: string }> }).json();
          if (payload?.error) return payload.error;
          if (payload?.message) return payload.message;
        } catch {
          // ignore parse errors, fallback below
        }
      }

      const maybeMessage = (error as { message?: unknown }).message;
      if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
        return maybeMessage;
      }
    }
    return 'Request failed.';
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setActionError(error.message);
        toast.error(`Failed to load invitations: ${error.message}`);
        return;
      }

      setInvitations(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !user) return;
    setSubmitting(true);
    setActionError('');
    setManualInviteLink('');

    const normalizedEmail = newEmail.trim().toLowerCase();
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      const message = 'Your session expired. Please sign in again.';
      setActionError(message);
      toast.error(message);
      setSubmitting(false);
      return;
    }

    const { data, error } = await supabase.functions.invoke('send-invitation', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        email: normalizedEmail,
        role: inviteRole,
        redirectTo: `${window.location.origin}/accept-invite`,
      },
    });

    if (error) {
      const message = await getFunctionErrorMessage(error);
      const normalizedMessage = message.toLowerCase();
      if (error.code === '23505') {
        toast.error('This email has already been invited.');
      } else if (error.code === '42501') {
        const message = 'You do not have permission to send invites. Ensure your user has the admin role.';
        setActionError(message);
        toast.error(message);
      } else if (normalizedMessage.includes('error sending invite email')) {
        const guidance = 'Supabase could not send the invite email. Check Auth > Email provider and make sure your app URL (including /accept-invite) is allowed in Auth URL settings.';
        setActionError(guidance);
        toast.error(guidance);
      } else {
        setActionError(message);
        toast.error(message);
      }
    } else if (!data?.invitation) {
      const message = 'Invite request completed but no invitation was returned.';
      setActionError(message);
      toast.error(message);
    } else {
      setInvitations((prev) => [{ ...data.invitation, role: data.invitation.role ?? inviteRole }, ...prev.filter((inv) => inv.email !== data.invitation.email)]);
      if (data.emailSent === false && typeof data.inviteLink === 'string') {
        setManualInviteLink(data.inviteLink);
        toast.warning('Invite created, but email delivery failed. Share the manual invite link below.');
      } else {
        toast.success(`Invitation email sent to ${normalizedEmail}`);
      }
      setNewEmail('');
      setInviteRole('user');
    }
    setSubmitting(false);
  };

  const handleCopyManualInviteLink = async () => {
    if (!manualInviteLink) return;
    try {
      await navigator.clipboard.writeText(manualInviteLink);
      toast.success('Manual invite link copied.');
    } catch {
      toast.error('Unable to copy invite link. Copy it manually.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    setActionError('');

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      const message = 'Your session expired. Please sign in again.';
      setActionError(message);
      toast.error(message);
      setDeletingId(null);
      return;
    }

    const { error } = await supabase.functions.invoke('delete-invitation-user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        invitationId: id,
      },
    });

    if (error) {
      const message = await getFunctionErrorMessage(error);
      setActionError(message);
      toast.error(message);
      setDeletingId(null);
      return;
    }

    toast.success('Invitation and user removed');
    await fetchInvitations();
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-display text-primary text-lg tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="decorative-circle-lg" />
      <div className="decorative-circle-sm" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 relative z-10">
        <div className="page-header">
          <div className="font-display text-xs font-bold tracking-[3px] text-primary uppercase">OTF Ventures</div>
          <div className="text-[10px] text-muted-foreground tracking-[1.5px] uppercase font-body">Invitations</div>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2">
          Manage Invitations
        </h1>
        <p className="text-sm text-muted-foreground font-body mb-8">
          Invite users by email. Only invited users can create accounts and access the data room.
        </p>

        {/* Invite form */}
        <form onSubmit={handleInvite} className="glass-card p-6 mb-10 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">New Invitation</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="invite-email" className="sr-only">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invite-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="investor@example.com"
                  className="pl-10 font-body"
                  required
                />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <Label htmlFor="invite-role" className="sr-only">Role</Label>
              <Select value={inviteRole} onValueChange={(value: 'admin' | 'user') => setInviteRole(value)}>
                <SelectTrigger id="invite-role" className="font-body">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto font-display font-bold tracking-wider uppercase gap-2">
              <Plus className="h-4 w-4" />
              {submitting ? 'Inviting…' : 'Invite'}
            </Button>
          </div>
          {actionError && (
            <p className="mt-3 text-sm text-destructive font-body">{actionError}</p>
          )}
          {manualInviteLink && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="manual-invite-link" className="text-xs uppercase tracking-wider font-body font-semibold text-muted-foreground">
                Manual Invite Link
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="manual-invite-link"
                  value={manualInviteLink}
                  readOnly
                  className="font-body"
                />
                <Button type="button" variant="secondary" onClick={handleCopyManualInviteLink}>
                  Copy Link
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* Invitations list */}
        <div className="mb-4">
          <h2 className="font-display text-xl font-extrabold text-foreground tracking-tight mb-1">Invited Users</h2>
          <div className="section-rule mb-5" />
        </div>

        <div className="space-y-2">
          {invitations.map((inv, i) => (
            <div key={inv.id} className="glass-card px-4 sm:px-5 py-4 flex items-center justify-between gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg ${inv.accepted ? 'bg-primary/10' : 'bg-accent'}`}>
                  {inv.accepted ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Mail className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-body font-semibold text-foreground truncate">{inv.email}</div>
                  <div className="text-[10px] text-muted-foreground font-body">
                    Invited {format(new Date(inv.created_at), 'MMM d, yyyy')}
                    {` · ${inv.role === 'admin' ? 'Admin' : 'User'}`}
                    {inv.accepted && ' · Accepted'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(inv.id)}
                disabled={deletingId === inv.id}
                className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {invitations.length === 0 && (
            <div className="glass-card px-5 py-10 text-center text-muted-foreground font-body text-sm">
              No invitations yet. Start by inviting someone above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
