import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Eye, LogIn, Clock, ArrowUpRight, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const USERS_PER_PAGE = 10;
const EVENTS_PER_PAGE = 20;

// Normalise stored page values (paths or old slugs) to sidebar display names.
const PAGE_DISPLAY_NAMES: Record<string, string> = {
  // paths
  '/': 'Home',
  '/operators': 'Our Operators',
  '/operators/our-operators': 'Our Operators',
  '/operators/how-we-work-together': 'How We Work Together',
  '/operators/operator-incentives': 'Operator Incentives',
  '/fund-model/walk-through': 'Model Walkthrough',
  '/fund-model/exit-strategy-liquidity': 'Exit Strategy & Liquidity',
  '/sourcing': 'Sourcing',
  '/track-record/in-words': 'Deals In Words',
  '/committed-deals-2026': 'Committed Deals 2026',
  '/legals/fund-terms': 'Fund Terms',
  '/legals/subscription-agreement': 'Subscription Agreement',
  '/legals/fund-structure-setup': 'Fund Structure & Setup',
  '/legals/disclaimer': 'Disclaimer',
  '/admin/analytics': 'Admin — Analytics',
  '/admin/invitations': 'Admin — Invitations',
  // old slug-style values (before pageMap was updated)
  'home': 'Home',
  'operators': 'Our Operators',
  'our_operators': 'Our Operators',
  'how_we_work_together': 'How We Work Together',
  'operator_incentives': 'Operator Incentives',
  'model_walkthrough': 'Model Walkthrough',
  'exit_strategy_liquidity': 'Exit Strategy & Liquidity',
  'sourcing': 'Sourcing',
  'deals_in_words': 'Deals In Words',
  'committed_deals_2026': 'Committed Deals 2026',
  'fund_terms': 'Fund Terms',
  'subscription_agreement': 'Subscription Agreement',
  'fund_structure_setup': 'Fund Structure & Setup',
  'disclaimer': 'Disclaimer',
};

interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
}

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
  const [uniqueUsers, setUniqueUsers] = useState(0);
  const [totalLogins, setTotalLogins] = useState(0);
  const [totalPageViews, setTotalPageViews] = useState(0);
  const [totalExternalLinks, setTotalExternalLinks] = useState(0);
  const [externalLinkBreakdown, setExternalLinkBreakdown] = useState<{ label: string; count: number }[]>([]);
  const [pageViewBreakdown, setPageViewBreakdown] = useState<{ label: string; count: number }[]>([]);
  const [breakdownTab, setBreakdownTab] = useState<'pages' | 'links'>('pages');

  const [userSummaries, setUserSummaries] = useState<UserSummary[]>([]);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const userOffsetRef = useRef(0);

  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [hasMoreEvents, setHasMoreEvents] = useState(false);
  const [loadingMoreEvents, setLoadingMoreEvents] = useState(false);
  const eventOffsetRef = useRef(0);

  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'login' | 'page_view' | 'external_link'>('all');
  const [includeAdmins, setIncludeAdmins] = useState(false);
  const includeAdminsRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  const adminIdsRef = useRef<string[]>([]);
  const allProfilesRef = useRef<Profile[]>([]);
  const nonAdminProfilesRef = useRef<Profile[]>([]);
  const profileMapRef = useRef<Map<string, { email: string; full_name: string | null }>>(new Map());

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    const { data: usersData } = await supabase
      .from('users')
      .select('user_id, email, full_name, role, status')
      .not('user_id', 'is', null);

    const adminIds: string[] = [];
    const pMap = new Map<string, { email: string; full_name: string | null }>();
    const nonAdminProfiles: Profile[] = [];
    const allProfiles: Profile[] = [];

    for (const u of usersData ?? []) {
      if (!u.user_id) continue;
      pMap.set(u.user_id, { email: u.email, full_name: u.full_name });
      const profile: Profile = { user_id: u.user_id, email: u.email, full_name: u.full_name };
      allProfiles.push(profile);
      if (u.role === 'admin') {
        adminIds.push(u.user_id);
      } else {
        nonAdminProfiles.push(profile);
      }
    }

    adminIdsRef.current = adminIds;
    profileMapRef.current = pMap;
    nonAdminProfilesRef.current = nonAdminProfiles;
    allProfilesRef.current = allProfiles;

    await Promise.all([fetchStats(), fetchExternalLinkBreakdown(), fetchPageViewBreakdown(), fetchUserSummariesPage(), fetchEventsPage()]);
    setInitialLoading(false);
  };

  const fetchStats = async () => {
    const adminIds = adminIdsRef.current;
    let query = supabase.from('analytics_events').select('user_id, event_type');
    if (!includeAdminsRef.current && adminIds.length > 0) {
      query = query.not('user_id', 'in', `(${adminIds.join(',')})`);
    }
    const { data } = await query;
    if (data) {
      setUniqueUsers(new Set(data.map((e) => e.user_id)).size);
      setTotalLogins(data.filter((e) => e.event_type === 'login').length);
      setTotalPageViews(data.filter((e) => e.event_type === 'page_view').length);
      setTotalExternalLinks(data.filter((e) => e.event_type === 'external_link').length);
    }
  };

  const fetchUserSummariesPage = async () => {
    const offset = userOffsetRef.current;
    const profiles = includeAdminsRef.current ? allProfilesRef.current : nonAdminProfilesRef.current;
    const pageProfiles = profiles.slice(offset, offset + USERS_PER_PAGE);

    if (pageProfiles.length === 0) {
      setHasMoreUsers(false);
      return;
    }

    const userIds = pageProfiles.map((p) => p.user_id);
    const { data: eventsForUsers } = await supabase
      .from('analytics_events')
      .select('user_id, event_type, created_at')
      .in('user_id', userIds);

    const newSummaries: UserSummary[] = pageProfiles
      .map((p) => {
        const userEvents = (eventsForUsers ?? []).filter((e) => e.user_id === p.user_id);
        if (userEvents.length === 0) return null;
        return {
          email: p.email,
          fullName: p.full_name,
          totalEvents: userEvents.length,
          lastSeen: userEvents.reduce((max, e) => (e.created_at > max ? e.created_at : max), ''),
          logins: userEvents.filter((e) => e.event_type === 'login').length,
          pageViews: userEvents.filter((e) => e.event_type === 'page_view').length,
        };
      })
      .filter(Boolean) as UserSummary[];

    userOffsetRef.current = offset + USERS_PER_PAGE;
    setUserSummaries((prev) => [...prev, ...newSummaries]);
    setHasMoreUsers(offset + USERS_PER_PAGE < profiles.length);
  };

  const fetchEventsPage = async () => {
    const offset = eventOffsetRef.current;
    const adminIds = adminIdsRef.current;
    const pMap = profileMapRef.current;

    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + EVENTS_PER_PAGE - 1);
    if (!includeAdminsRef.current && adminIds.length > 0) {
      query = query.not('user_id', 'in', `(${adminIds.join(',')})`);
    }

    const { data } = await query;
    if (data) {
      const enriched = data.map((ev) => ({
        ...ev,
        profiles: pMap.get(ev.user_id) || { email: 'Unknown', full_name: null },
      }));
      eventOffsetRef.current = offset + EVENTS_PER_PAGE;
      setEvents((prev) => [...prev, ...(enriched as any)]);
      setHasMoreEvents(data.length === EVENTS_PER_PAGE);
    }
  };

  const fetchBreakdown = async (eventType: 'external_link' | 'page_view', setter: (v: { label: string; count: number }[]) => void) => {
    const adminIds = adminIdsRef.current;
    let query = supabase.from('analytics_events').select('metadata').eq('event_type', eventType);
    if (!includeAdminsRef.current && adminIds.length > 0) {
      query = query.not('user_id', 'in', `(${adminIds.join(',')})`);
    }
    const { data } = await query;
    if (!data) return;
    const counts = new Map<string, number>();
    for (const ev of data) {
      const meta = ev.metadata as Record<string, string> | null;
      const raw = eventType === 'external_link'
        ? (meta?.label || meta?.url || 'Unknown')
        : (meta?.page || 'Unknown');
      const label = eventType === 'page_view'
        ? (PAGE_DISPLAY_NAMES[raw] ?? raw)
        : raw;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    setter(
      Array.from(counts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
    );
  };

  const fetchExternalLinkBreakdown = () => fetchBreakdown('external_link', setExternalLinkBreakdown);
  const fetchPageViewBreakdown = () => fetchBreakdown('page_view', setPageViewBreakdown);

  const resetAndRefetch = async () => {
    setUserSummaries([]);
    setEvents([]);
    setHasMoreUsers(false);
    setHasMoreEvents(false);
    userOffsetRef.current = 0;
    eventOffsetRef.current = 0;
    await Promise.all([fetchStats(), fetchExternalLinkBreakdown(), fetchPageViewBreakdown(), fetchUserSummariesPage(), fetchEventsPage()]);
  };

  const handleToggleAdmins = async (value: boolean) => {
    setIncludeAdmins(value);
    includeAdminsRef.current = value;
    setInitialLoading(true);
    await resetAndRefetch();
    setInitialLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await resetAndRefetch();
    setRefreshing(false);
  };

  const handleLoadMoreUsers = async () => {
    setLoadingMoreUsers(true);
    await fetchUserSummariesPage();
    setLoadingMoreUsers(false);
  };

  const handleLoadMoreEvents = async () => {
    setLoadingMoreEvents(true);
    await fetchEventsPage();
    setLoadingMoreEvents(false);
  };

  const searchLower = search.trim().toLowerCase();
  const filteredSummaries = searchLower
    ? userSummaries.filter(
        (u) =>
          u.email.toLowerCase().includes(searchLower) ||
          (u.fullName ?? '').toLowerCase().includes(searchLower),
      )
    : userSummaries;
  const filteredEvents = events.filter((ev) => {
    if (eventTypeFilter !== 'all' && ev.event_type !== eventTypeFilter) return false;
    if (!searchLower) return true;
    return (
      ((ev as any).profiles?.email ?? '').toLowerCase().includes(searchLower) ||
      ((ev as any).profiles?.full_name ?? '').toLowerCase().includes(searchLower)
    );
  });

  if (initialLoading) {
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

        <div className="flex items-start justify-between gap-4 mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Data Room Analytics
          </h1>
          <div className="flex items-center gap-3 shrink-0 mt-1">
            <button
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              title="Refresh"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          <label className="flex items-center gap-2 cursor-pointer shrink-0 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
            <span className="text-xs font-body font-semibold text-foreground whitespace-nowrap">Include admins</span>
            <button
              role="switch"
              aria-checked={includeAdmins}
              onClick={() => void handleToggleAdmins(!includeAdmins)}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                includeAdmins ? 'bg-primary' : 'bg-muted-foreground/40'
              }`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                includeAdmins ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </label>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Unique Visitors', value: uniqueUsers, icon: Users },
            { label: 'Total Logins', value: totalLogins, icon: LogIn },
            { label: 'Page Views', value: totalPageViews, icon: Eye },
            { label: 'Ext. Link Clicks', value: totalExternalLinks, icon: ArrowUpRight },
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

        {/* Breakdown tabs */}
        {(pageViewBreakdown.length > 0 || externalLinkBreakdown.length > 0) && (
          <div className="glass-card p-5 mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setBreakdownTab('pages')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display font-bold uppercase tracking-wide transition-colors ${
                  breakdownTab === 'pages'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Pages
              </button>
              <button
                onClick={() => setBreakdownTab('links')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display font-bold uppercase tracking-wide transition-colors ${
                  breakdownTab === 'links'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                External Links
              </button>
            </div>
            <div className="space-y-1.5">
              {breakdownTab === 'pages' && (
                pageViewBreakdown.length > 0
                  ? pageViewBreakdown.map(({ label, count }) => (
                      <div key={label} className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-accent/40">
                        <span className="text-xs font-body text-foreground truncate">{label}</span>
                        <span className="text-xs font-body font-semibold text-primary shrink-0">{count} view{count !== 1 ? 's' : ''}</span>
                      </div>
                    ))
                  : <p className="text-xs text-muted-foreground font-body px-1">No page views recorded yet.</p>
              )}
              {breakdownTab === 'links' && (
                externalLinkBreakdown.length > 0
                  ? externalLinkBreakdown.map(({ label, count }) => (
                      <div key={label} className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-accent/40">
                        <span className="text-xs font-body text-foreground truncate">{label}</span>
                        <span className="text-xs font-body font-semibold text-primary shrink-0">{count} click{count !== 1 ? 's' : ''}</span>
                      </div>
                    ))
                  : <p className="text-xs text-muted-foreground font-body px-1">No external link clicks recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
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
                {filteredSummaries.map((user, i) => (
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
                {filteredSummaries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground font-body text-sm">
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {hasMoreUsers && (
            <div className="p-4 border-t border-border">
              <button
                onClick={handleLoadMoreUsers}
                disabled={loadingMoreUsers}
                className="w-full py-2 text-xs font-body font-semibold text-primary uppercase tracking-widest hover:bg-accent/50 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingMoreUsers ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </div>

        {/* Recent events */}
        <div className="mt-10 mb-4">
          <div className="flex items-center justify-between gap-4 mb-1">
            <h2 className="font-display text-xl font-extrabold text-foreground tracking-tight">Recent Events</h2>
            <div className="flex gap-1.5 flex-wrap">
              {([
                { key: 'all' as const, label: 'All', icon: null },
                { key: 'login' as const, label: 'Logins', icon: LogIn },
                { key: 'page_view' as const, label: 'Pages', icon: Eye },
                { key: 'external_link' as const, label: 'Ext. Links', icon: ArrowUpRight },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setEventTypeFilter(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-semibold border transition-colors whitespace-nowrap ${
                    eventTypeFilter === key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30'
                  }`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="section-rule mb-5" />
        </div>

        <div className="space-y-2">
          {filteredEvents.map((ev, i) => (
            <div
              key={ev.id}
              className="glass-card px-4 sm:px-5 py-3 flex items-center justify-between gap-3 animate-fade-in"
              style={{ animationDelay: `${Math.min(i, 19) * 30}ms` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-1.5 rounded-md ${ev.event_type === 'login' ? 'bg-primary/10' : ev.event_type === 'external_link' ? 'bg-primary/5' : 'bg-accent'}`}>
                  {ev.event_type === 'login' ? (
                    <LogIn className="h-3.5 w-3.5 text-primary" />
                  ) : ev.event_type === 'external_link' ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-body font-semibold text-foreground block truncate">
                    {(ev as any).profiles?.email || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground font-body block truncate">
                    {ev.event_type === 'login'
                      ? 'logged in'
                      : ev.event_type === 'external_link'
                      ? `opened ${ev.metadata?.label || ev.metadata?.url || 'external link'}`
                      : `viewed ${ev.metadata?.page || 'a page'}`}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground font-body shrink-0">
                {format(new Date(ev.created_at), 'MMM d, HH:mm')}
              </div>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="text-center text-muted-foreground font-body text-sm py-10">
              No events recorded yet.
            </div>
          )}
          {hasMoreEvents && (
            <button
              onClick={handleLoadMoreEvents}
              disabled={loadingMoreEvents}
              className="w-full py-3 text-xs font-body font-semibold text-primary uppercase tracking-widest hover:bg-accent/20 rounded-lg border border-border/50 transition-colors disabled:opacity-50 mt-2"
            >
              {loadingMoreEvents ? 'Loading…' : 'Load More'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
