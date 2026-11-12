import { Link, useNavigate } from "react-router-dom";

function ForbiddenPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="error-page">
      <div className="container error-shell">
        <div className="error-card">
          <span className="error-badge">MÃ LỖI 403 · KHÔNG CÓ QUYỀN TRUY CẬP</span>
          <h1>Truy cập bị từ chối</h1>
          <p>
            Tài khoản hiện tại của bạn không có quyền truy cập vào tài nguyên hoặc
            khu vực quản trị này. Nếu bạn là nhân viên hoặc quản trị viên cửa
            hàng BORROLL, vui lòng kiểm tra lại quyền được cấp hoặc đăng nhập bằng
            tài khoản tương ứng.
          </p>
          <div className="error-actions">
            <button
              type="button"
              className="button secondary-button"
              onClick={handleGoBack}
            >
              Quay lại trang trước
            </button>
            <Link to="/" className="button primary-button">
              Về trang chủ BORROLL
            </Link>
            <Link to="/cameras" className="button secondary-button">
              Xem danh mục thiết bị
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForbiddenPage;
