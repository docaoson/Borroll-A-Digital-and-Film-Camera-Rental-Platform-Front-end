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

        {(variant === "public" || variant === "renter") && <AccountMenu />}
      </div>
    </header>
  );
}

export default Header;
