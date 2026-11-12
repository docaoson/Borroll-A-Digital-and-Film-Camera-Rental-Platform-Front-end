import { NavLink } from "react-router-dom";

const publicLinks = [
  { to: "/", label: "Trang chủ" },
  { to: "/cameras", label: "Thiết bị" },
  { to: "/rental-policy", label: "Chính sách thuê" },
];

function MainNav({ variant = "public" }) {
  const links =
    variant === "admin"
      ? [
          { to: "/admin", label: "Tổng quan", end: true },
          { to: "/admin/inventory", label: "Kho máy" },
          { to: "/admin/calendar", label: "Lịch thuê" },
          { to: "/admin/orders", label: "Đơn thuê" },
          { to: "/admin/customers", label: "Khách hàng" },
        ]
      : publicLinks;

  return (
    <nav className="main-nav" aria-label="Điều hướng chính">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default MainNav;
