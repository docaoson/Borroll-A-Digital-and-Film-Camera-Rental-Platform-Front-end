import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function AdminTopbar({ isSidebarOpen, onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  };

  const roles = user?.roles || (user?.role ? [user.role] : []);
  const isAdmin = roles.includes("ADMIN");
  const isStaff = roles.includes("STAFF");

  const roleLabel = isAdmin
    ? "Quản trị viên"
    : isStaff
      ? "Nhân viên vận hành"
      : "Người dùng";

  const userInitial = (user?.fullName?.trim()?.[0] || "A").toUpperCase();

  return (
    <header className="admin-topbar" aria-label="Thanh điều hướng quản trị">
      <div className="admin-topbar-left">
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Đóng bảng điều hướng" : "Mở bảng điều hướng"}
          aria-expanded={isSidebarOpen}
        >
          <span aria-hidden="true">{isSidebarOpen ? "✕" : "☰"}</span>
        </button>

        <Link to="/admin" className="admin-brand">
          <span className="brand-mark">B</span>
          <div className="admin-brand-info">
            <strong className="admin-brand-name">BORROLL</strong>
            <span className="admin-brand-tag">Admin & Ops Portal</span>
          </div>
        </Link>
      </div>

      <div className="admin-topbar-center">
        <span className="admin-status-indicator">
          <span className="admin-status-dot" aria-hidden="true" />
          <span>Hệ thống vận hành trực tiếp</span>
        </span>
      </div>

      <div className="admin-topbar-right">
        <Link
          to="/"
          className="admin-topbar-btn public-link"
          title="Mở giao diện website cho người thuê"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span aria-hidden="true">↗</span>
          <span>Xem website khách</span>
        </Link>

        <div className="admin-user-capsule">
          <div className="admin-user-avatar" aria-hidden="true">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="admin-avatar-img" />
            ) : (
              <span className="admin-avatar-initial">{userInitial}</span>
            )}
          </div>
          <div className="admin-user-details">
            <span className="admin-user-name" title={user?.fullName || "Tài khoản"}>
              {user?.fullName || "Quản trị viên"}
            </span>
            <span
              className={`admin-role-badge ${isAdmin ? "is-admin" : "is-staff"}`}
            >
              {roleLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="admin-topbar-btn logout-btn"
          onClick={handleLogout}
          title="Đăng xuất khỏi hệ thống quản trị"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  );
}

export default AdminTopbar;
