import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Check, Plus, Trash2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

interface Invitation {
  id: string;
  email: string;
  accepted: boolean;
  created_at: string;
}

export default function AdminInvitations() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setInvitations(data);
    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !user) return;
    setSubmitting(true);

    const { error } = await supabase.from('invitations').insert({
      email: newEmail.trim().toLowerCase(),
      invited_by: user.id,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('This email has already been invited.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(`Invitation sent to ${newEmail}`);
      setNewEmail('');
      fetchInvitations();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('invitations').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Invitation removed');
      fetchInvitations();
    }
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

      <div className="max-w-3xl mx-auto px-8 py-12 relative z-10">
        <div className="page-header">
          <div className="font-display text-xs font-bold tracking-[3px] text-primary uppercase">OTF Ventures</div>
          <div className="text-[10px] text-muted-foreground tracking-[1.5px] uppercase font-body">Invitations</div>
        </div>

        <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight mb-2">
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
          <div className="flex gap-3">
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
            <Button type="submit" disabled={submitting} className="font-display font-bold tracking-wider uppercase gap-2">
              <Plus className="h-4 w-4" />
              {submitting ? 'Inviting…' : 'Invite'}
            </Button>
          </div>
        </form>

        {/* Invitations list */}
        <div className="mb-4">
          <h2 className="font-display text-xl font-extrabold text-foreground tracking-tight mb-1">Invited Users</h2>
          <div className="section-rule mb-5" />
        </div>

        <div className="space-y-2">
          {invitations.map((inv, i) => (
            <div key={inv.id} className="glass-card px-5 py-4 flex items-center justify-between animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${inv.accepted ? 'bg-primary/10' : 'bg-accent'}`}>
                  {inv.accepted ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Mail className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-body font-semibold text-foreground">{inv.email}</div>
                  <div className="text-[10px] text-muted-foreground font-body">
                    Invited {format(new Date(inv.created_at), 'MMM d, yyyy')}
                    {inv.accepted && ' · Accepted'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(inv.id)}
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
