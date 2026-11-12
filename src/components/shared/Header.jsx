import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainNav from "./MainNav";
import AccountMenu from "./AccountMenu";

function Header({ variant = "public" }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <header className="site-header">
      <div
        className={`container header-inner${isMobileMenuOpen ? " mobile-menu-open" : ""}`}
      >
        <Link
          to="/"
          className="brand"
          aria-label="BORROLL Trang chủ"
          onClick={closeMobileMenu}
        >
          <span className="brand-mark">B</span>
          <span>
            <strong>BORROLL</strong>
            <small>Camera Rental</small>
          </span>
        </Link>

        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="site-header-navigation"
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        >
          <span aria-hidden="true">{isMobileMenuOpen ? "×" : "☰"}</span>
        </button>

        <div
          id="site-header-navigation"
          className={`header-navigation${isMobileMenuOpen ? " is-open" : ""}`}
        >
          {variant !== "admin" && (
            <MainNav variant={variant} onNavigate={closeMobileMenu} />
          )}
          <AccountMenu onNavigate={closeMobileMenu} />
        </div>
      </div>
    </header>
  );
}

export default Header;
