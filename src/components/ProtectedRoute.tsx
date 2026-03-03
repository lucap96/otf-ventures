import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-display text-primary text-lg tracking-widest uppercase">Loading…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
