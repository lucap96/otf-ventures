import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Users, Eye, LogIn, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  metadata: any;
  created_at: string;
  profiles?: { email: string; full_name: string | null };
}

interface UserSummary {
  email: string;
  fullName: string | null;
  totalEvents: number;
  lastSeen: string;
  logins: number;
  pageViews: number;
}

export default function AdminAnalytics() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const [{ data: adminRolesData }, { data: eventsData }, { data: profilesData }] = await Promise.all([
      supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin'),
      supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('user_id, email, full_name'),
    ]);

    const adminUserIds = new Set((adminRolesData ?? []).map((role) => role.user_id));

    const profileMap = new Map<string, { email: string; full_name: string | null }>();
    if (profilesData) {
      for (const p of profilesData) {
        profileMap.set(p.user_id, { email: p.email, full_name: p.full_name });
      }
    }

    if (eventsData) {
      const nonAdminEvents = eventsData.filter((ev) => !adminUserIds.has(ev.user_id));
      const enrichedEvents = nonAdminEvents.map(ev => ({
        ...ev,
        profiles: profileMap.get(ev.user_id) || { email: 'Unknown', full_name: null },
      }));
      setEvents(enrichedEvents as any);

      // Build user summaries
      const summaryMap = new Map<string, UserSummary>();
      for (const ev of enrichedEvents) {
        const email = ev.profiles.email;
        const existing = summaryMap.get(email) || {
          email,
          fullName: ev.profiles.full_name,
          totalEvents: 0,
          lastSeen: ev.created_at,
          logins: 0,
          pageViews: 0,
        };
        existing.totalEvents++;
        if (ev.event_type === 'login') existing.logins++;
        if (ev.event_type === 'page_view') existing.pageViews++;
        if (ev.created_at > existing.lastSeen) existing.lastSeen = ev.created_at;
        summaryMap.set(email, existing);
      }
      setUserSummaries(Array.from(summaryMap.values()));
    }
    setLoading(false);
  };

  const totalLogins = events.filter(e => e.event_type === 'login').length;
  const totalPageViews = events.filter(e => e.event_type === 'page_view').length;
  const uniqueUsers = userSummaries.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse font-display text-primary text-lg tracking-widest uppercase">Loading analytics…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="decorative-circle-lg" />
      <div className="decorative-circle-sm" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 relative z-10">
        <div className="page-header">
          <div className="font-display text-xs font-bold tracking-[3px] text-primary uppercase">OTF Ventures</div>
          <div className="text-[10px] text-muted-foreground tracking-[1.5px] uppercase font-body">Analytics</div>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-8">
          Data Room Analytics
        </h1>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Unique Visitors', value: uniqueUsers, icon: Users },
            { label: 'Total Logins', value: totalLogins, icon: LogIn },
            { label: 'Page Views', value: totalPageViews, icon: Eye },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-accent">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-body font-semibold">{stat.label}</span>
              </div>
              <div className="font-display text-3xl font-extrabold text-primary">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* User activity table */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-extrabold text-foreground tracking-tight mb-1">User Activity</h2>
          <div className="section-rule mb-5" />
        </div>

        <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-primary">
                {['User', 'Logins', 'Page Views', 'Total Events', 'Last Seen'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-bold text-left text-primary-foreground uppercase tracking-wider font-body">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userSummaries.map((user, i) => (
                <tr key={i} className="border-b border-border hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-body font-semibold text-foreground">{user.email}</div>
                    {user.fullName && <div className="text-xs text-muted-foreground font-body">{user.fullName}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm font-body text-foreground">{user.logins}</td>
                  <td className="px-4 py-3 text-sm font-body text-foreground">{user.pageViews}</td>
                  <td className="px-4 py-3 text-sm font-body font-semibold text-primary">{user.totalEvents}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-body flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {format(new Date(user.lastSeen), 'MMM d, yyyy HH:mm')}
                  </td>
                </tr>
              ))}
              {userSummaries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground font-body text-sm">
                    No activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Recent events */}
        <div className="mt-10 mb-4">
          <h2 className="font-display text-xl font-extrabold text-foreground tracking-tight mb-1">Recent Events</h2>
          <div className="section-rule mb-5" />
        </div>

        <div className="space-y-2">
          {events.slice(0, 20).map((ev, i) => (
            <div key={ev.id} className="glass-card px-4 sm:px-5 py-3 flex items-center justify-between gap-3 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-1.5 rounded-md ${ev.event_type === 'login' ? 'bg-primary/10' : 'bg-accent'}`}>
                  {ev.event_type === 'login' ? (
                    <LogIn className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-body font-semibold text-foreground block truncate">
                    {(ev as any).profiles?.email || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground font-body block truncate">
                    {ev.event_type === 'login' ? 'logged in' : `viewed ${ev.metadata?.page || 'a page'}`}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground font-body shrink-0">
                {format(new Date(ev.created_at), 'MMM d, HH:mm')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
