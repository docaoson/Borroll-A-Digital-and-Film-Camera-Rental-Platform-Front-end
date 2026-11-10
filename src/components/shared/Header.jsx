import { Link } from "react-router-dom";
import MainNav from "./MainNav";
import AccountMenu from "./AccountMenu";

function Header({ variant = "public" }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="BORROLL Trang chủ">
          <span className="brand-mark">B</span>
          <span>
            <strong>BORROLL</strong>
            <small>Camera Rental</small>
          </span>
        </Link>

        {variant !== "admin" && <MainNav variant={variant} />}

        {variant === "public" && <AccountMenu />}
        {variant === "renter" && (
          <div className="renter-header-actions">
            <Link to="/favorites" className="account-link">
              Yêu thích
            </Link>
            <Link to="/cart" className="account-link primary">
              Giỏ thuê
            </Link>
            <AccountMenu />
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
