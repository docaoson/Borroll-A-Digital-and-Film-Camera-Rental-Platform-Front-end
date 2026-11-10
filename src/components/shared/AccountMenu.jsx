import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function AccountMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="account-menu" aria-label="Tài khoản người dùng">
        <span className="account-status-text">Đang tải...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const isStaffOrAdmin =
      user.roles?.includes("STAFF") || user.roles?.includes("ADMIN");

    return (
      <div className="account-menu" aria-label="Tài khoản người dùng">
        {isStaffOrAdmin && (
          <NavLink to="/admin" className="account-link">
            Quản trị
          </NavLink>
        )}
        <NavLink to="/profile" className="account-link primary">
          {user.fullName}
        </NavLink>
        <button
          type="button"
          className="account-link account-logout-btn"
          onClick={handleLogout}
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <div className="account-menu" aria-label="Tài khoản người dùng">
      <NavLink to="/login" className="account-link">
        Đăng nhập
      </NavLink>
      <NavLink to="/register" className="account-link primary">
        Đăng ký
      </NavLink>
    </div>
  );
}

export default AccountMenu;
