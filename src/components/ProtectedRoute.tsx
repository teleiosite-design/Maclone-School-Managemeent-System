import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/lib/supabaseAuth";

const rolePaths: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  teacher: "/dashboard/teacher",
  student: "/dashboard/student",
  parent: "/dashboard/parent",
};

export default function ProtectedRoute({ role, children }: { role: UserRole; children: ReactNode }) {
  const { loading, isAuthenticated, role: currentRole } = useAuth();
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (currentRole && currentRole !== role) {
    return <Navigate to={rolePaths[currentRole]} replace />;
  }

  return children;
}
