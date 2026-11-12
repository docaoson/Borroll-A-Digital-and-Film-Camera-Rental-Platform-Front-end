import { Link, useNavigate } from "react-router-dom";

function NotFoundPage() {
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
          <span className="error-badge">MÃ LỖI 404 · KHÔNG TÌM THẤY TRANG</span>
          <h1>Trang bạn tìm kiếm không tồn tại</h1>
          <p>
            Đường dẫn bạn vừa truy cập có thể đã bị thay đổi, bị xóa hoặc không
            chính xác. Bạn có thể quay lại trang trước đó hoặc khám phá bộ sưu
            tập máy ảnh phong phú tại BORROLL.
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

export default NotFoundPage;
