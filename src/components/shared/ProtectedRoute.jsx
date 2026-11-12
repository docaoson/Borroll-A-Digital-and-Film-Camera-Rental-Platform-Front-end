import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container auth-loading-shell">
        <div className="auth-card">
          <p className="eyebrow">BORROLL</p>
          <p>Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const nextPath = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(nextPath)}`}
        replace
      />
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const rawRoles = user?.roles || (user?.role ? [user.role] : []);
    // Admin inherits Staff privileges automatically (matching NestJS RolesGuard)
    const effectiveRoles = rawRoles.includes("ADMIN")
      ? Array.from(new Set([...rawRoles, "STAFF"]))
      : rawRoles;
    const hasAccess = allowedRoles.some((role) => effectiveRoles.includes(role));
    if (!hasAccess) {
      return <Navigate to="/403" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
