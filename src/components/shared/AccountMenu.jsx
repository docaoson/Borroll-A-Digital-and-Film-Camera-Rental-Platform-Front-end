import { NavLink } from "react-router-dom";

function AccountMenu() {
  return (
    <div className="account-menu" aria-label="Tài khoản người dùng">
      <NavLink to="/login" className="account-link">
        Đăng nhập
      </NavLink>
      <NavLink to="/register" className="account-link primary">
        Đăng ký
      </NavLink>
      <NavLink to="/profile" className="account-link">
        Hồ sơ
      </NavLink>
    </div>
  );
}

export default AccountMenu;
