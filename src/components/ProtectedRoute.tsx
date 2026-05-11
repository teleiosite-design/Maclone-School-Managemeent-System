import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { dashboardPathForRole, type UserRole } from "@/lib/supabaseAuth";

export default function ProtectedRoute({ role, children }: { role: UserRole; children: ReactNode }) {
  const { loading, isAuthenticated, session } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-cream text-navy">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-navy" />
          <p className="text-sm font-semibold tracking-wider uppercase">Checking secure session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (session.role !== role) {
    return <Navigate to={dashboardPathForRole(session.role)} replace />;
  }

  return children;
}
