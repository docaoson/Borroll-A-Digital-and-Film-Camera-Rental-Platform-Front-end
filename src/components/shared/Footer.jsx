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
              <Link to="/about">Giới thiệu</Link>
            </li>
            <li>
              <Link to="/cameras">Danh mục máy</Link>
            </li>
            <li>
              <Link to="/rental-policy">Chính sách thuê</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Hỗ trợ</h4>
          <ul>
            <li>
              <Link to="/delivery-policy">Chính sách giao nhận</Link>
            </li>
            <li>
              <Link to="/return-policy">Quy định trả máy</Link>
            </li>
            <li>
              <Link to="/privacy-policy">Bảo mật</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Liên hệ</h4>
          <ul>
            <li>Hotline: 0900 000 000</li>
            <li>Email: hello@borroll.vn</li>
            <li>Hà Nội, Việt Nam</li>
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
