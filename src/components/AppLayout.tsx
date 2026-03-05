import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  BookOpen,
  BarChart3,
  Users,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Scale,
  Search,
  Briefcase,
  ChevronDown,
  Handshake,
  Home,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { type ComponentType, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type MenuChild = {
  label: string;
  linkType?: 'native' | 'external';
  url?: string;
  enabled?: boolean;
};

type MenuItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  linkType?: 'native' | 'external';
  url?: string;
  enabled?: boolean;
  children?: MenuChild[];
};

const rawNavItems: MenuItem[] = [
  { label: 'Home', icon: Home, linkType: 'native', url: '/', enabled: true },
  {
    label: 'Deck',
    icon: BookOpen,
    enabled: true,
    children: [{ label: 'Long Deck', linkType: 'external', url: 'https://docsend.com/view/xsfzbimm3qdvtcdv', enabled: true }],
  },
  {
    label: 'Track Record',
    icon: BarChart3,
    enabled: true,
    children: [
      { label: 'Deals In Numbers', linkType: 'external', url: 'https://docs.google.com/spreadsheets/d/1c0zREYWLCO_rwHuahqN84zLJwzEMQY2xxoErGzSSuH0/edit?gid=0#gid=0', enabled: true },
      { label: 'Deals In Words', linkType: 'native', url: '/track-record/in-words', enabled: true },
    ],
  },
  {
    label: 'Operators',
    icon: Users,
    enabled: true,
    children: [
      { label: 'Our Operators', linkType: 'native', url: '/operators/our-operators', enabled: true },
      { label: 'How we work together', linkType: 'native', url: '/operators/how-we-work-together', enabled: true },
      { label: 'Incentives', linkType: 'native', url: '/operators/operator-incentives', enabled: true },
    ],
  },
  {
    label: 'Fund Model',
    icon: Briefcase,
    enabled: true,
    children: [
      { label: 'Fund Model', linkType: 'external', url: 'https://docs.google.com/spreadsheets/d/1FWXf2pkKaMxaKej9S3d0QoLHXt4bwvk6/edit?rtpof=true&sd=true&gid=1596136530#gid=1596136530', enabled: true },
      { label: 'Model Walkthrough', linkType: 'native', url: '/fund-model/walk-through', enabled: true },
      { label: 'Exit Strategy & Liquidity', linkType: 'native', url: '/fund-model/exit-strategy-liquidity', enabled: true },
    ],
  },
  { label: 'Sourcing', icon: Search, linkType: 'native', url: '/sourcing', enabled: true },
  { label: 'Committed deals in 2026', icon: Handshake, linkType: 'native', url: '/committed-deals-2026', enabled: true },
  {
    label: 'Legals',
    icon: Scale,
    enabled: true,
    children: [
      { label: 'Fund Terms', linkType: 'native', url: '/legals/fund-terms', enabled: true },
      { label: 'Subscription Agreement', linkType: 'native', url: '/legals/subscription-agreement', enabled: true },
      { label: 'Fund Structure & Setup', linkType: 'native', url: '/legals/fund-structure-setup', enabled: true },
    ],
  },
];

const isEnabled = (enabled?: boolean) => enabled !== false;

const navItems: MenuItem[] = rawNavItems
  .filter((item) => isEnabled(item.enabled))
  .map((item) => {
    if (!item.children?.length) return item;
    const visibleChildren = item.children.filter((child) => isEnabled(child.enabled));
    return {
      ...item,
      children: visibleChildren,
    };
  })
  .filter((item) => (item.children ? item.children.length > 0 : true));

const adminItems = [
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Invitations', path: '/admin/invitations', icon: Shield },
];

export default function AppLayout() {
  const { user, isAdmin, signOut } = useAuth();
  const { trackPageView } = useAnalytics();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(() =>
    navItems.reduce<Record<string, boolean>>((acc, item) => {
      if (item.children?.length) {
        acc[item.label] = false;
      }
      return acc;
    }, {}),
  );
  const [fullName, setFullName] = useState<string>('');
  const [pageEntering, setPageEntering] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userEmail = user?.email ?? 'Account';
  const displayName = fullName.trim() || userEmail;
  const userInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    let active = true;

    if (!user?.id) {
      setFullName('');
      return;
    }

    void (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      setFullName(data?.full_name?.trim() ?? '');
    })();

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    setPageEntering(true);
    const timer = setTimeout(() => setPageEntering(false), 700);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateLayoutMode = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      setCollapsed((prev) => (mobile ? false : prev));
      if (!mobile) {
        setMobileMenuOpen(false);
      }
    };

    updateLayoutMode();
    mediaQuery.addEventListener('change', updateLayoutMode);
    return () => mediaQuery.removeEventListener('change', updateLayoutMode);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, location.pathname, location.hash]);

  useEffect(() => {
    if (isMobile && mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }

    document.body.style.overflow = '';
    return undefined;
  }, [isMobile, mobileMenuOpen]);

  useEffect(() => {
    const pageMap: Record<string, string> = {
      '/': 'dataroom_cover',
      '/operators': 'operators',
      '/operators/our-operators': 'operators',
      '/operators/how-we-work-together': 'operators',
      '/operators/operator-incentives': 'operators',
      '/fund-model/walk-through': 'fund_model_walk_through',
      '/fund-model/exit-strategy-liquidity': 'fund_model_exit_strategy_liquidity',
      '/sourcing': 'sourcing',
      '/committed-deals-2026': 'committed_deals_2026',
      '/legals/fund-terms': 'legal_fund_terms',
      '/legals/subscription-agreement': 'legal_subscription_agreement',
      '/legals/fund-structure-setup': 'legal_fund_structure_setup',
      '/admin/analytics': 'admin_analytics',
      '/admin/invitations': 'admin_invitations',
    };
    const page = pageMap[location.pathname];
    if (!page) return;
    void trackPageView(page);
  }, [location.pathname, trackPageView]);

  const isTargetActive = (url: string) => {
    const [pathPart, hashPart] = url.split('#');
    const targetPath = pathPart || '/';
    if (location.pathname !== targetPath) return false;
    if (!hashPart) return location.hash === '';
    return location.hash === `#${hashPart}`;
  };

  const getTarget = (link: { url?: string }) => link.url ?? '';
  const isExternal = (link: { linkType?: 'native' | 'external' }) => link.linkType === 'external';

  useEffect(() => {
    setExpandedMenus((prev) => {
      const next = { ...prev };
      let changed = false;

      navItems.forEach((item) => {
        if (!item.children?.length) return;
        const hasActiveChild = item.children.some((child) =>
          child.linkType === 'native' && child.url ? isTargetActive(child.url) : false,
        );
        if (hasActiveChild && !next[item.label]) {
          next[item.label] = true;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.hash]);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {isMobile && mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "h-full flex flex-col border-r border-border bg-card transition-all duration-300 relative",
        isMobile
          ? cn(
            'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          )
          : collapsed ? "w-16" : "w-64"
      )}>
        <div className={cn("border-b border-border", collapsed ? "p-4" : "px-6 py-3.5")}>
          {!collapsed ? (
            <div>
              <div>
                <div className="font-display text-xs font-bold tracking-[3px] uppercase text-primary">
                  OTF Ventures
                </div>
                <div className="text-[10px] text-muted-foreground tracking-wider font-body mt-0.5">
                  Data Room
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="font-display text-sm font-bold text-primary text-center">OTF</div>
            </div>
          )}
        </div>

        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close menu"
            title="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : !collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="absolute right-0 top-9 z-50 flex h-7 w-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}

        {!isMobile && collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute right-0 top-9 z-50 flex h-7 w-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {!collapsed && (
            <div className="text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground px-3 mb-2 font-body">
              Documents
            </div>
          )}
          {navItems.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const itemIsActive = item.linkType === 'native' && item.url ? isTargetActive(item.url) : false;
            const childIsActive =
              item.children?.some((child) => (child.linkType === 'native' && child.url ? isTargetActive(child.url) : false)) ?? false;

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                        return;
                      }
                      setExpandedMenus((prev) => ({
                        ...prev,
                        [item.label]: !prev[item.label],
                      }));
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors",
                      childIsActive
                        ? "bg-accent/60 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                    {!collapsed && (
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 shrink-0 transition-transform',
                          expandedMenus[item.label] && 'rotate-180',
                        )}
                      />
                    )}
                  </button>
                ) : (
                  isExternal(item) ? (
                    <a
                      href={getTarget(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (isMobile) setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="inline-flex items-center gap-1.5">
                          <span>{item.label}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" />
                        </span>
                      )}
                    </a>
                  ) : (
                    <Link
                      to={item.url ?? '/'}
                      onClick={() => {
                        if (isMobile) setMobileMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors",
                        itemIsActive
                          ? "bg-accent text-primary font-semibold"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  )
                )}

                {!collapsed && hasChildren && expandedMenus[item.label] && (
                  <div className="ml-5 mt-1 space-y-1 border-l border-border pl-3">
                    {item.children!.map((child) => {
                      const childActive = child.linkType === 'native' && child.url ? isTargetActive(child.url) : false;
                      return (
                        isExternal(child) ? (
                          <a
                            key={getTarget(child)}
                            href={getTarget(child)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (isMobile) setMobileMenuOpen(false);
                            }}
                            className="block rounded-md px-3 py-1.5 text-sm font-body transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <span>{child.label}</span>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" />
                            </span>
                          </a>
                        ) : (
                          <Link
                            key={child.url}
                            to={child.url ?? '/'}
                            onClick={() => {
                              if (isMobile) setMobileMenuOpen(false);
                            }}
                            className={cn(
                              'block rounded-md px-3 py-1.5 text-sm font-body transition-colors',
                              childActive
                                ? 'bg-accent text-primary font-semibold'
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                            )}
                          >
                            {child.label}
                          </Link>
                        )
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {isAdmin && (
            <>
              {!collapsed && (
                <div className="text-[10px] font-semibold uppercase tracking-[2px] text-muted-foreground px-3 mt-6 mb-2 font-body">
                  Admin
                </div>
              )}
              {collapsed && <div className="my-3 border-t border-border" />}
              {adminItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (isMobile) setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors",
                      active
                        ? "bg-accent text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-border">
          {!collapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full px-2 py-2 transition-colors hover:bg-accent/20 rounded-lg">
                  <div className="flex items-center gap-3.5">
                    <div className="h-11 w-11 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-base font-semibold font-body">
                      {userInitial}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-[9px] uppercase tracking-[1.3px] text-muted-foreground font-body font-semibold">Account</div>
                      <div className="text-[0.82rem] font-semibold font-body text-foreground truncate leading-[1.2]">{displayName}</div>
                      <div className="text-[0.74rem] font-body text-muted-foreground/90 truncate">{userEmail}</div>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/80 ml-1" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-64 p-1.5 translate-x-3">
                <DropdownMenuItem
                  onClick={signOut}
                  className="font-body text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-accent/50 transition-colors w-full"
                  aria-label="Open profile menu"
                  title={displayName}
                >
                  <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold font-body">
                    {userInitial}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="right" className="w-52">
                <DropdownMenuItem
                  onClick={signOut}
                  className="font-body text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

      </aside>

      {/* Main content */}
      <main className={cn("flex-1 h-full overflow-auto", pageEntering && "page-entering")}>
        {isMobile && (
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <div className="font-display text-xs font-bold tracking-[3px] uppercase text-primary">OTF Ventures</div>
              <div className="w-9" />
            </div>
          </header>
        )}
        <Outlet />
      </main>
    </div>
  );
}
