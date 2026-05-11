import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/lib/database.types';

interface ProtectedRouteProps {
  allowedRole: Profile['role'];
}

export default function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();

  // Still resolving auth state — show a minimal loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 bg-navy flex items-center justify-center text-gold font-black animate-pulse">
            M
          </div>
          <p className="text-sm text-muted-foreground tracking-wider">Loading portal…</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but profile not loaded yet or wrong role → redirect to their correct portal
  if (profile && profile.role !== allowedRole) {
    const roleRoutes: Record<Profile['role'], string> = {
      admin: '/dashboard/admin',
      teacher: '/dashboard/teacher',
      student: '/dashboard/student',
      parent: '/dashboard/parent',
    };
    return <Navigate to={roleRoutes[profile.role]} replace />;
  }

  return <Outlet />;
}
