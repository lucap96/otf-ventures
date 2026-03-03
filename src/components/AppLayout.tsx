import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FileText, BarChart3, Users, LogOut, Shield, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
  { label: 'Data Room', path: '/', icon: FileText },
  { label: 'Operators', path: '/operators', icon: Users },
];

const adminItems = [
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Invitations', path: '/admin/invitations', icon: Shield },
];

export default function AppLayout() {
  const { user, isAdmin, signOut } = useAuth();
  const { trackPageView } = useAnalytics();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [fullName, setFullName] = useState<string>('');
  const [pageEntering, setPageEntering] = useState(true);
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
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    const pageMap: Record<string, string> = {
      '/': 'dataroom_cover',
      '/operators': 'operators',
      '/admin/analytics': 'admin_analytics',
      '/admin/invitations': 'admin_invitations',
    };
    const page = pageMap[location.pathname];
    if (!page) return;
    void trackPageView(page);
  }, [location.pathname, trackPageView]);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "h-full flex flex-col border-r border-border bg-card transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
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

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="absolute right-0 top-9 z-50 flex h-7 w-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}

        {collapsed && (
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
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
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
        <Outlet />
      </main>
    </div>
  );
}
