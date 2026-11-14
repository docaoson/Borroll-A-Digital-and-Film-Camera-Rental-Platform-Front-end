import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MainNav from "./MainNav";
import AccountMenu from "./AccountMenu";

function Header({ variant = "public" }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    const handlePointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="site-header" ref={headerRef}>
      <div
        className={`container header-inner${isMobileMenuOpen ? " mobile-menu-open" : ""}`}
      >
        {/* LEFT SECTION: BRAND */}
        <div className="header-left">
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
        </div>

        {/* CENTER SECTION: MAIN NAVIGATION (DESKTOP) */}
        <div className="header-center desktop-nav-section">
          {variant !== "admin" && (
            <MainNav variant={variant} onNavigate={closeMobileMenu} />
          )}
        </div>

        {/* RIGHT SECTION: USER ACCOUNT (DESKTOP) */}
        <div className="header-right desktop-account-section">
          <AccountMenu onNavigate={closeMobileMenu} />
        </div>

        {/* MOBILE MENU TOGGLE */}
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

        {/* MOBILE / TABLET NAVIGATION DRAWER */}
        <div
          id="site-header-navigation"
          className={`header-mobile-drawer${isMobileMenuOpen ? " is-open" : ""}`}
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
