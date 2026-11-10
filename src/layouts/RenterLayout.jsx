import { Outlet, Link } from "react-router-dom";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";

function RenterLayout() {
  return (
    <div className="app-shell renter-shell">
      <Header variant="renter" />
      <main className="page-main renter-main">
        <aside className="renter-sidebar">
          <h3>Tài khoản thuê máy</h3>
          <nav className="renter-nav" aria-label="Quản lý người thuê">
            <Link to="/cart">Giỏ thuê</Link>
            <Link to="/checkout">Xác nhận đặt</Link>
            <Link to="/orders">Đơn thuê</Link>
            <Link to="/profile">Hồ sơ</Link>
            <Link to="/favorites">Yêu thích</Link>
            <Link to="/kyc">KYC demo</Link>
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
