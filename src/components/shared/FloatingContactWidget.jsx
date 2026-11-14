import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61596440062572";
const ZALO_URL = "https://zalo.me/0913764995";

function FloatingContactWidget() {
  const [open, setOpen] = useState(false);
  const groupRef = useRef(null);
  const mainLinkRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (!groupRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        mainLinkRef.current?.focus();
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const handleMainClick = (event) => {
    const touchInput = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (touchInput) {
      event.preventDefault();
      setOpen((current) => !current);
    }
  };

  const handleMainKeyDown = (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      setOpen((current) => !current);
    }
  };

  const handlePointerEnter = (event) => {
    if (event.pointerType === "mouse") setOpen(true);
  };

  const handlePointerLeave = (event) => {
    if (event.pointerType === "mouse" && !groupRef.current?.contains(document.activeElement)) {
      setOpen(false);
    }
  };

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <div
      ref={groupRef}
      className={`floating-contact${open ? " is-open" : ""}`}
      role="group"
      aria-label="Liên hệ nhanh"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onBlurCapture={handleBlur}
    >
      <div className="floating-contact-links" id="floating-contact-links" aria-hidden={!open}>
        <a
          className="floating-contact-item facebook"
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Mở Facebook BORROLL trong tab mới"
          tabIndex={open ? 0 : -1}
        >
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.5 21v-8h2.7l.4-3h-3.1V8c0-.9.3-1.5 1.5-1.5h1.7V3.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.4V10H7.5v3H10v8h3.5Z" />
          </svg>
          <span className="floating-contact-tooltip" aria-hidden="true">Facebook</span>
        </a>
        <a
          className="floating-contact-item zalo"
          href={ZALO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Nhắn tin Zalo BORROLL theo số 0913764995 trong tab mới"
          tabIndex={open ? 0 : -1}
        >
          <svg aria-hidden="true" focusable="false" viewBox="0 0 28 24" fill="none">
            <path d="M3 5.2c0-1.2 1-2.2 2.2-2.2h17.6C24 3 25 4 25 5.2v10.1c0 1.2-1 2.2-2.2 2.2h-9l-5.2 3.4v-3.4H5.2C4 17.5 3 16.5 3 15.3V5.2Z" fill="white" />
            <text x="14" y="13.4" textAnchor="middle" fill="#0068ff" fontSize="7" fontWeight="800" fontFamily="Arial, sans-serif">Zalo</text>
          </svg>
          <span className="floating-contact-tooltip" aria-hidden="true">Zalo</span>
        </a>
      </div>
      <Link
        ref={mainLinkRef}
        to="/about"
        className="floating-contact-main"
        aria-label="Liên hệ BORROLL; mở trang liên hệ hoặc menu Facebook và Zalo"
        aria-expanded={open}
        aria-controls="floating-contact-links"
        onClick={handleMainClick}
        onKeyDown={handleMainKeyDown}
      >
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
        </svg>
        <span>Liên hệ</span>
      </Link>
    </div>
  );
}

export default FloatingContactWidget;
