import { NavLink } from "react-router-dom";

const links = [
  { to: "/admin", label: "Tổng quan" },
  { to: "/admin/inventory", label: "Kho máy" },
  { to: "/admin/inventory/new", label: "Thêm máy" },
  { to: "/admin/calendar", label: "Lịch thuê" },
  { to: "/admin/orders", label: "Đơn thuê" },
  { to: "/admin/customers", label: "Khách hàng" },
];

function AdminSidebar() {
  return (
    <div className="admin-sidebar-panel">
      <div className="sidebar-brand">
        <strong>BORROLL</strong>
        <span>Quản lý cửa hàng</span>
      </div>

      <nav className="admin-nav" aria-label="Điều hướng quản trị">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? "admin-link active" : "admin-link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default AdminSidebar;
