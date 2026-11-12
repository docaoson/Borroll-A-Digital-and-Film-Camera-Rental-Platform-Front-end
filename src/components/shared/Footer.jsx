import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <h3>BORROLL</h3>
          <p>
            Thuê máy ảnh phim và kỹ thuật số theo nhu cầu cá nhân và dự án sáng
            tạo.
          </p>
        </div>

        <div>
          <h4>Điều hướng</h4>
          <ul>
            <li>
              <Link to="/">Trang chủ</Link>
            </li>
            <li>
              <Link to="/cameras">Danh mục thiết bị</Link>
            </li>
            <li>
              <Link to="/about">Về BORROLL</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Chính sách</h4>
          <ul>
            <li>
              <Link to="/rental-policy">Chính sách thuê</Link>
            </li>
            <li>
              <Link to="/delivery-policy">Chính sách giao nhận</Link>
            </li>
            <li>
              <Link to="/return-policy">Chính sách trả máy</Link>
            </li>
            <li>
              <Link to="/privacy-policy">Chính sách bảo mật</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Chi nhánh cửa hàng</h4>
          <ul>
            <li>Tây Hồ: 18 Xuân Diệu · 0866747114</li>
            <li>Thanh Xuân: 42 Nguyễn Trãi · 0866747115</li>
            <li>Giờ mở cửa: 09:00 – 21:00 hàng ngày</li>
          </ul>
        </div>
      </div>

      <div className="container footer-note">
        <p>Student project – E-Business, Hanoi University</p>
      </div>
    </footer>
  );
}

export default Footer;
