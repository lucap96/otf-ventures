import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, Plus, Trash2, UserPlus, ShieldBan, ShieldCheck, Send } from 'lucide-react';
import { format } from 'date-fns';

type AppRole = 'admin' | 'viewer';
type UserStatus = 'pending' | 'active' | 'blocked';
type Tab = 'viewers' | 'admins';

interface ManagedUser {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  role: AppRole;
  status: UserStatus;
  created_at: string;
}

const STATUS_LABEL: Record<UserStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  blocked: 'Blocked',
};

const STATUS_COLOR: Record<UserStatus, string> = {
  pending: 'text-yellow-600',
  active: 'text-primary',
  blocked: 'text-destructive',
};

export default function AdminInvitations() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('viewers');
  const [newEmail, setNewEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('viewer');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [manualInviteLink, setManualInviteLink] = useState('');

  const getFunctionErrorMessage = async (error: unknown) => {
    if (typeof error === 'object' && error !== null) {
      const maybeContext = (error as { context?: unknown }).context;
      if (typeof maybeContext === 'string' && maybeContext.trim()) return maybeContext;
      if (maybeContext && typeof maybeContext === 'object' && 'json' in maybeContext) {
        try {
          const payload = await (maybeContext as { json: () => Promise<{ error?: string; message?: string }> }).json();
          if (payload?.error) return payload.error;
          if (payload?.message) return payload.message;
        } catch { /* ignore */ }
      }
      const maybeMessage = (error as { message?: unknown }).message;
      if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage;
    }
    return 'Request failed.';
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, user_id, email, full_name, role, status, created_at')
        .order('created_at', { ascending: false });
      if (error) {
        setActionError(error.message);
        toast.error(`Failed to load users: ${error.message}`);
        return;
      }
      setUsers((data ?? []) as ManagedUser[]);
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
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        email: normalizedEmail,
        role: inviteRole,
        redirectTo: inviteRole === 'viewer'
          ? `${window.location.origin}/magic-auth`
          : `${window.location.origin}/accept-invite`,
      },
    });

    if (error) {
      const message = await getFunctionErrorMessage(error);
      const normalizedMessage = message.toLowerCase();
      if (normalizedMessage.includes('error sending invite email')) {
        const guidance = 'Supabase could not send the invite email. Check Auth > Email provider and make sure your app URL is allowed in Auth URL settings.';
        setActionError(guidance);
        toast.error(guidance);
      } else {
        setActionError(message);
        toast.error(message);
      }
    } else if (!data?.invitation) {
      const message = 'Invite request completed but no record was returned.';
      setActionError(message);
      toast.error(message);
    } else {
      const newRecord = { ...data.invitation, role: data.invitation.role ?? inviteRole } as ManagedUser;
      setUsers((prev) => [newRecord, ...prev.filter((u) => u.email !== newRecord.email)]);
      if (data.emailSent === false && typeof data.inviteLink === 'string') {
        setManualInviteLink(data.inviteLink);
        toast.warning('Invite created, but email delivery failed. Share the manual invite link below.');
      } else {
        toast.success(`Invitation sent to ${normalizedEmail}`);
      }
      setNewEmail('');
      setInviteRole('viewer');
      // Switch to the tab matching the invited role
      setActiveTab(inviteRole === 'admin' ? 'admins' : 'viewers');
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

  const handleResend = async (u: ManagedUser) => {
    setActioningId(u.id);
    setActionError('');
    setManualInviteLink('');

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      toast.error('Your session expired. Please sign in again.');
      setActioningId(null);
      return;
    }

    const { data, error } = await supabase.functions.invoke('send-invitation', {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: {
        email: u.email,
        role: u.role,
        redirectTo: u.role === 'viewer'
          ? `${window.location.origin}/magic-auth`
          : `${window.location.origin}/accept-invite`,
      },
    });

    if (error) {
      const message = await getFunctionErrorMessage(error);
      toast.error(message);
    } else if (data?.emailSent === false && typeof data.inviteLink === 'string') {
      setManualInviteLink(data.inviteLink);
      toast.warning('Email delivery failed. Share the manual invite link below.');
    } else {
      toast.success(`Invitation resent to ${u.email}`);
    }
    setActioningId(null);
  };

  const handleBlock = async (u: ManagedUser) => {
    setActioningId(u.id);
    setActionError('');
    const newStatus: UserStatus = u.status === 'blocked' ? 'active' : 'blocked';
    const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', u.id);
    if (error) {
      setActionError(error.message);
      toast.error(error.message);
    } else {
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, status: newStatus } : x));
      toast.success(newStatus === 'blocked' ? `${u.email} blocked.` : `${u.email} unblocked.`);
    }
    setActioningId(null);
  };

  const handleDelete = async (u: ManagedUser) => {
    setActioningId(u.id);
    setActionError('');

    if (!u.user_id) {
      const { error } = await supabase.from('users').delete().eq('id', u.id);
      if (error) {
        setActionError(error.message);
        toast.error(error.message);
      } else {
        setUsers((prev) => prev.filter((x) => x.id !== u.id));
        toast.success('Invitation removed.');
      }
      setActioningId(null);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      const message = 'Your session expired. Please sign in again.';
      setActionError(message);
      toast.error(message);
      setActioningId(null);
      return;
    }

    const { error } = await supabase.functions.invoke('delete-invitation-user', {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: { userId: u.id },
    });

    if (error) {
      const message = await getFunctionErrorMessage(error);
      setActionError(message);
      toast.error(message);
    } else {
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.success('User removed.');
    }
    setActioningId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-display text-primary text-lg tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  const viewers = users.filter((u) => u.role === 'viewer');
  const admins  = users.filter((u) => u.role === 'admin');
  const tabUsers = activeTab === 'viewers' ? viewers : admins;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'viewers', label: 'Viewers', count: viewers.length },
    { key: 'admins',  label: 'Admins',  count: admins.length },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="decorative-circle-lg" />
      <div className="decorative-circle-sm" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 relative z-10">
        <div className="page-header">
          <div className="font-display text-xs font-bold tracking-[3px] text-primary uppercase">OTF Ventures</div>
          <div className="text-[10px] text-muted-foreground tracking-[1.5px] uppercase font-body">Users</div>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-2">
          Manage Users
        </h1>
        <p className="text-sm text-muted-foreground font-body mb-8">
          Invite users by email. Block or remove access at any time.
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
              <Select value={inviteRole} onValueChange={(value: AppRole) => setInviteRole(value)}>
                <SelectTrigger id="invite-role" className="font-body">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
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
                <Input id="manual-invite-link" value={manualInviteLink} readOnly className="font-body" />
                <Button type="button" variant="secondary" onClick={handleCopyManualInviteLink}>Copy Link</Button>
              </div>
            </div>
          )}
        </form>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-display font-bold tracking-wide transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`ml-2 text-xs font-body ${activeTab === tab.key ? 'text-primary' : 'text-muted-foreground'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Column headers */}
        {tabUsers.length > 0 && (
          <div className="grid grid-cols-[1fr_80px_80px_56px] gap-x-4 px-4 sm:px-5 mb-1">
            <div className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider">User</div>
            <div className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider">Status</div>
            <div className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider">Invited</div>
            <div />
          </div>
        )}

        {/* User rows */}
        <div className="space-y-1.5">
          {tabUsers.map((u, i) => {
            const isSelf = u.user_id === user?.id;
            const isActioning = actioningId === u.id;
            return (
              <div
                key={u.id}
                className="glass-card px-4 sm:px-5 py-3.5 grid grid-cols-[1fr_80px_80px_56px] gap-x-4 items-center animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Name / email */}
                <div className="min-w-0">
                  <div className="text-sm font-body font-semibold text-foreground truncate">
                    {u.full_name || u.email}
                    {isSelf && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(you)</span>}
                  </div>
                  {u.full_name && (
                    <div className="text-[11px] text-muted-foreground font-body truncate">{u.email}</div>
                  )}
                </div>

                {/* Status */}
                <div className={`text-xs font-body font-medium ${STATUS_COLOR[u.status]}`}>
                  {STATUS_LABEL[u.status]}
                </div>

                {/* Invited date */}
                <div className="text-xs font-body text-muted-foreground whitespace-nowrap">
                  {format(new Date(u.created_at), 'MMM d, yyyy')}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-0.5">
                  {u.status === 'pending' && (
                    <button
                      onClick={() => handleResend(u)}
                      disabled={isActioning}
                      title="Resend invitation"
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {!isSelf && u.status !== 'pending' && (
                    <button
                      onClick={() => handleBlock(u)}
                      disabled={isActioning}
                      title={u.status === 'blocked' ? 'Unblock user' : 'Block user'}
                      className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${
                        u.status === 'blocked'
                          ? 'text-primary hover:bg-primary/10'
                          : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                      }`}
                    >
                      {u.status === 'blocked' ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldBan className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  {!isSelf && (
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={isActioning}
                      title="Remove user"
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {tabUsers.length === 0 && (
            <div className="glass-card px-5 py-10 text-center text-muted-foreground font-body text-sm">
              No {activeTab === 'viewers' ? 'viewers' : 'admins'} yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
