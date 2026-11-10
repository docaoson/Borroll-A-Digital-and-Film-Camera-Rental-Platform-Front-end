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
    const userRoles = user?.roles || [];
    const hasAccess = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasAccess) {
      return <Navigate to="/403" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
