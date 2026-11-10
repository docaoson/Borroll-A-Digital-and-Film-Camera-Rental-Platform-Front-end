import { Link } from "react-router-dom";

function FloatingContactWidget() {
  return (
    <div className="floating-contact" aria-label="Liên hệ nhanh">
      <Link to="/about">Liên hệ</Link>
    </div>
  );
}

export default FloatingContactWidget;
