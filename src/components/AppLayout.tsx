import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FileText, BarChart3, Users, LogOut, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

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
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className={cn("p-6 border-b border-border", collapsed && "p-4")}>
          {!collapsed ? (
            <>
              <div className="font-display text-xs font-bold tracking-[3px] uppercase text-primary">
                OTF Ventures
              </div>
              <div className="text-[10px] text-muted-foreground tracking-wider font-body mt-0.5">
                Data Room
              </div>
            </>
          ) : (
            <div className="font-display text-sm font-bold text-primary text-center">OTF</div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1">
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

        <div className="p-3 border-t border-border space-y-1">
          {!collapsed && user && (
            <div className="px-3 py-2 text-xs text-muted-foreground font-body truncate">
              {user.email}
            </div>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-card border border-border rounded-full p-1 hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
