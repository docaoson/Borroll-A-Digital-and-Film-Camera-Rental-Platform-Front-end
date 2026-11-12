import { Link } from "react-router-dom";

const privacySections = [
  {
    id: "info-collection",
    title: "1. Thông tin cá nhân được thu thập",
    summary:
      "Các dữ liệu cần thiết phục vụ việc đăng ký tài khoản, liên hệ và lập đơn thuê thiết bị.",
    body: [
      "Thông tin tài khoản: Họ và tên, địa chỉ email, số điện thoại (dùng để liên hệ khi nhận/trả máy).",
      "Thông tin đơn thuê: Chi nhánh nhận máy, ngày nhận, ngày trả, danh sách thiết bị và mã đơn thuê (BR-XXXXX).",
      "Giấy tờ tùy thân: Nhân viên chỉ đối chiếu trực tiếp bản gốc CCCD/Hộ chiếu tại quầy khi giao máy để xác nhận danh tính, không lưu giữ bản sao trái phép.",
      "Hình ảnh biên bản bàn giao: Ảnh chụp tình trạng máy lúc giao và nhận được lưu trữ bảo mật ngắn hạn phục vụ đối soát hoàn cọc giữa hai bên.",
    ],
  },
  {
    id: "purpose-of-use",
    title: "2. Mục đích sử dụng thông tin",
    summary:
      "BORROLL chỉ sử dụng dữ liệu khách hàng cho các hoạt động phục vụ trực tiếp quá trình thuê máy.",
    body: [
      "Xác nhận đơn đặt thuê, chuẩn bị thiết bị sẵn sàng tại chi nhánh và liên hệ nhắc lịch nhận/trả máy.",
      "Hiển thị lịch sử đơn thuê và quản lý hồ sơ cá nhân trong tài khoản người dùng.",
      "Hỗ trợ giải đáp thắc mắc kỹ thuật, tư vấn chọn máy và giải quyết các tình huống phát sinh trong thời gian thuê.",
      "Tuyệt đối không chia sẻ, mua bán hoặc chuyển giao dữ liệu khách hàng cho bên thứ ba vì mục đích thương mại hoặc quảng cáo rác.",
    ],
  },
  {
    id: "data-protection",
    title: "3. Cơ chế quản lý & Bảo vệ dữ liệu",
    summary:
      "Các tiêu chuẩn kỹ thuật nghiêm ngặt nhằm bảo vệ tài khoản và thông tin người dùng.",
    body: [
      "Mật khẩu tài khoản được mã hóa bằng thuật toán bảo mật cao (Argon2), máy chủ không lưu mật khẩu thô.",
      "Mã xác thực phiên làm việc (Access Token) chỉ lưu trong bộ nhớ tạm thời của ứng dụng, không lưu trong LocalStorage của trình duyệt.",
      "Phiên đăng nhập dài hạn được quản lý an toàn qua Cookie HttpOnly có gắn cờ bảo mật, ngăn chặn nguy cơ đánh cắp dữ liệu.",
      "Hệ thống lưu trữ ảnh biên bản bàn giao được bảo vệ bởi chứng chỉ truy cập ngắn hạn, chỉ khách thuê và nhân viên phụ trách mới có quyền xem.",
    ],
  },
  {
    id: "user-rights",
    title: "4. Quyền của người dùng đối với dữ liệu",
    summary:
      "Khách hàng hoàn toàn chủ động quản lý và cập nhật thông tin cá nhân của mình.",
    body: [
      "Quyền truy cập và cập nhật: Khách hàng có thể xem và chỉnh sửa họ tên, số điện thoại, ảnh đại diện bất kỳ lúc nào tại trang Hồ sơ cá nhân.",
      "Quyền theo dõi đơn thuê: Toàn bộ thông tin đơn thuê, trạng thái xác nhận và chi tiết thanh toán đều được hiển thị minh bạch tại trang Đơn thuê.",
      "Quyền yêu cầu hỗ trợ: Khách hàng có quyền yêu cầu xóa tài khoản hoặc giải đáp các thắc mắc về quyền riêng tư thông qua kênh liên hệ chính thức của BORROLL.",
    ],
  },
];

function PrivacyPolicyPage() {
  return (
    <div className="about-page">
      <div className="container about-shell">
        <section className="about-hero-card">
          <p className="eyebrow">CHÍNH SÁCH BẢO MẬT</p>
          <h1>Bảo vệ thông tin &amp; quyền riêng tư của khách hàng</h1>
          <p className="about-lead">
            BORROLL cam kết tôn trọng và bảo vệ tối đa quyền riêng tư của người
            thuê. Chúng tôi chỉ thu thập những thông tin thực sự cần thiết để
            vận hành đơn thuê, quản lý thiết bị và bảo đảm tính minh bạch trong
            suốt quá trình giao nhận máy tại cửa hàng.
          </p>
        </section>

        <section className="about-story-card">
          {privacySections.map((section) => (
            <div className="about-story-block" key={section.id}>
              <p className="eyebrow">BORROLL PRIVACY</p>
              <h2>{section.title}</h2>
              <p>{section.summary}</p>
              <ul>
                {section.body.map((item, idx) => (
                  <li key={`${section.id}-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="about-pillars">
          <div className="section-heading">
            <p className="eyebrow">HỖ TRỢ THÔNG TIN</p>
            <h2>Kênh liên hệ hỗ trợ về quyền riêng tư</h2>
          </div>

          <div className="branch-card-grid">
            <article className="branch-card">
              <p className="eyebrow">CHI NHÁNH TÂY HỒ</p>
              <h3>Số 18 Xuân Diệu, Tây Hồ, Hà Nội</h3>
              <p><strong>Hotline:</strong> 0866747114</p>
              <p><strong>Giờ làm việc:</strong> 09:00 – 21:00 hàng ngày</p>
            </article>

            <article className="branch-card">
              <p className="eyebrow">CHI NHÁNH THANH XUÂN</p>
              <h3>Số 42 Nguyễn Trãi, Thanh Xuân, Hà Nội</h3>
              <p><strong>Hotline:</strong> 0866747115</p>
              <p><strong>Giờ làm việc:</strong> 09:00 – 21:00 hàng ngày</p>
            </article>
          </div>
        </section>

        <section className="cta-box">
          <div>
            <p className="eyebrow">BẠN ĐÃ SẴN SÀNG?</p>
            <h2>Xem thêm quy định thuê máy hoặc khám phá bộ sưu tập thiết bị</h2>
          </div>
          <div className="hero-actions">
            <Link to="/rental-policy" className="button primary-button">
              Chính sách thuê máy
            </Link>
            <Link to="/cameras" className="button secondary-button">
              Danh mục thiết bị
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
