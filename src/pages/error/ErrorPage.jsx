import { Link } from "react-router-dom";

function ErrorPage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="error-page">
      <div className="container error-shell">
        <div className="error-card">
          <span className="error-badge">MÃ LỖI 500 · HỆ THỐNG GIÁN ĐOẠN</span>
          <h1>Đã xảy ra sự cố không mong muốn</h1>
          <p>
            Hệ thống đang gặp gián đoạn tạm thời trong quá trình xử lý yêu cầu
            của bạn. Dữ liệu của bạn vẫn an toàn. Vui lòng thử tải lại trang
            hoặc quay về trang chủ để tiếp tục trải nghiệm.
          </p>
          <div className="error-actions">
            <button
              type="button"
              className="button primary-button"
              onClick={handleReload}
            >
              Thử tải lại trang
            </button>
            <Link to="/" className="button secondary-button">
              Về trang chủ
            </Link>
            <Link to="/about" className="button secondary-button">
              Thông tin liên hệ chi nhánh
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
