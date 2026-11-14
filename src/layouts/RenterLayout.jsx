import { NavLink, Outlet } from "react-router-dom";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";
import { useAuth } from "../hooks/useAuth";

function RenterLayout() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN");

  const navLinks = [
    { to: "/profile", label: "Hồ sơ" },
    { to: "/favorites", label: "Yêu thích" },
    ...(!isAdmin
      ? [
          { to: "/cart", label: "Giỏ thuê" },
          { to: "/orders", label: "Đơn thuê" },
        ]
      : []),
    { to: "/support", label: "Hỗ trợ & FAQ" },
  ];

  return (
    <div className="app-shell renter-shell">
      <Header variant="renter" />
      <main className="page-main renter-main">
        <aside className="renter-sidebar">
          <h3>Tài khoản thuê máy</h3>
          <nav className="renter-nav" aria-label="Quản lý người thuê">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="renter-content">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default RenterLayout;
