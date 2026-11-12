import { Link } from "react-router-dom";

const pickupSteps = [
  {
    number: "01",
    title: "Chọn chi nhánh khi đặt đơn",
    description:
      "Khách hàng lựa chọn chi nhánh Tây Hồ hoặc Thanh Xuân ngay khi đặt thuê. Toàn bộ thiết bị sẽ được nhận và trả tại đúng chi nhánh này.",
  },
  {
    number: "02",
    title: "Kiểm tra máy & đối chiếu giấy tờ",
    description:
      "Nhân viên đối chiếu CCCD/Hộ chiếu, cùng khách kiểm tra đo sáng, màn trập, thấu kính, phụ kiện và lưu ảnh biên bản bàn giao thiết bị.",
  },
  {
    number: "03",
    title: "Thanh toán trực tiếp tại quầy",
    description:
      "Thanh toán tiền thuê thiết bị, tiền film mua kèm (nếu có) và tiền đặt cọc bằng tiền mặt hoặc chuyển khoản tại quầy trước khi nhận máy.",
  },
];

const branches = [
  {
    slug: "tay-ho",
    name: "Chi nhánh Tây Hồ",
    address: "Số 18 Xuân Diệu, Tây Hồ, Hà Nội",
    phone: "0866747114",
    openHours: "09:00 – 21:00 hàng ngày",
  },
  {
    slug: "thanh-xuan",
    name: "Chi nhánh Thanh Xuân",
    address: "Số 42 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    phone: "0866747115",
    openHours: "09:00 – 21:00 hàng ngày",
  },
];

function DeliveryPolicyPage() {
  return (
    <div className="about-page">
      <div className="container about-shell">
        <section className="about-hero-card">
          <p className="eyebrow">NHẬN VÀ TRẢ MÁY TẠI CHI NHÁNH</p>
          <h1>Chính sách giao nhận thiết bị tại BORROLL</h1>
          <p className="about-lead">
            BORROLL vận hành theo mô hình cửa hàng sở hữu thiết bị trực tiếp.
            Toàn bộ quy trình nhận máy và trả máy đều thực hiện tại quầy ở đúng
            chi nhánh bạn đã chọn — cửa hàng không hỗ trợ giao hàng tận nơi.
          </p>
        </section>

        <section className="about-story-card">
          <div className="about-story-block">
            <p className="eyebrow">NGUYÊN TẮC GIAO NHẬN</p>
            <h2>Nhận và trả tại cùng một chi nhánh</h2>
            <p>
              Khi đặt thuê, khách hàng chọn trước chi nhánh nhận máy (Tây Hồ
              hoặc Thanh Xuân) và đến trực tiếp cửa hàng để kiểm tra thiết bị
              trước khi ký biên bản bàn giao. Việc trả máy cũng được thực hiện
              tại đúng chi nhánh đó để thuận tiện đối chiếu và hoàn cọc ngay.
            </p>
          </div>

          <div className="about-story-block">
            <p className="eyebrow">KHÔNG GIAO HÀNG TẬN NƠI</p>
            <h2>Vì sao BORROLL ưu tiên giao nhận trực tiếp?</h2>
            <p>
              Kiểm tra trực tiếp tại cửa hàng giúp khách hàng thử đo sáng, màn
              trập, ống kính và nhận hướng dẫn thao tác nhanh từ nhân viên,
              tránh rủi ro va đập khi vận chuyển và đảm bảo máy hoạt động ổn
              định trước chuyến đi.
            </p>
          </div>
        </section>

        <section className="about-pillars">
          <div className="section-heading">
            <p className="eyebrow">QUY TRÌNH TẠI QUẦY</p>
            <h2>Ba bước nhận máy nhanh gọn</h2>
          </div>

          <div className="process-grid">
            {pickupSteps.map((step) => (
              <article className="process-card" key={step.number}>
                <span className="process-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-pillars">
          <div className="section-heading">
            <p className="eyebrow">ĐỊA ĐIỂM CHI NHÁNH</p>
            <h2>Các điểm giao nhận trực tiếp tại Hà Nội</h2>
          </div>

          <div className="branch-card-grid">
            {branches.map((b) => (
              <article className="branch-card" key={b.slug}>
                <p className="eyebrow">ĐIỂM NHẬN TRẢ</p>
                <h3>{b.name}</h3>
                <p><strong>Địa chỉ:</strong> {b.address}</p>
                <p><strong>Hotline:</strong> {b.phone}</p>
                <p><strong>Giờ mở cửa:</strong> {b.openHours}</p>
                <span className="branch-highlight">Khách hàng đến nhận máy trong khung giờ mở cửa</span>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-box">
          <div>
            <p className="eyebrow">CẦN XEM LẠI ĐIỀU KIỆN TRẢ MÁY?</p>
            <h2>Xem quy định hoàn cọc và kiểm tra thiết bị khi trả</h2>
          </div>
          <div className="hero-actions">
            <Link to="/return-policy" className="button primary-button">
              Xem chính sách trả máy
            </Link>
            <Link to="/rental-policy" className="button secondary-button">
              Chính sách thuê tổng quát
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DeliveryPolicyPage;
