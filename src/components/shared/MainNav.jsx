import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const publicLinks = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/cameras", label: "Thiết bị" },
  { to: "/rental-policy", label: "Chính sách thuê" },
];

function MainNav({ variant = "public", onNavigate }) {
  const { user, isAuthenticated } = useAuth();
  const roles = user?.roles || [];
  const isRenter =
    isAuthenticated &&
    roles.includes("RENTER") &&
    !roles.includes("STAFF") &&
    !roles.includes("ADMIN");
  const links =
    variant === "admin"
      ? [
          { to: "/admin", label: "Tổng quan", end: true },
          { to: "/admin/inventory", label: "Kho máy" },
          { to: "/admin/calendar", label: "Lịch thuê" },
          { to: "/admin/orders", label: "Đơn thuê" },
          { to: "/admin/users", label: "Tài khoản" },
        ]
      : isRenter
        ? [
            publicLinks[0],
            publicLinks[1],
            { to: "/cart", label: "Giỏ thuê" },
            { to: "/orders", label: "Đơn thuê" },
            publicLinks[2],
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
          onClick={onNavigate}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default MainNav;
