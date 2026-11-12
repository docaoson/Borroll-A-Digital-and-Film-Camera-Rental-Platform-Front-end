import { Link } from "react-router-dom";

const pickupSteps = [
  {
    number: "01",
    title: "Chọn chi nhánh khi đặt",
    description:
      "Khách hàng chọn chi nhánh Tây Hồ hoặc Thanh Xuân ngay trên trang đặt thuê. Thiết bị được nhận và trả tại cùng một chi nhánh.",
  },
  {
    number: "02",
    title: "Kiểm tra máy & giấy tờ tại quầy",
    description:
      "Nhân viên đối chiếu giấy tờ tùy thân, cùng khách kiểm tra ngoại quan, chức năng máy và lưu ảnh biên bản bàn giao.",
  },
  {
    number: "03",
    title: "Thanh toán trực tiếp tại cửa hàng",
    description:
      "Thanh toán tiền thuê, phụ kiện film (nếu có) và tiền cọc bằng tiền mặt hoặc chuyển khoản trực tiếp tại quầy khi nhận máy.",
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

        <section className="cta-box">
          <div>
            <p className="eyebrow">CẦN XEM LẠI ĐIỀU KIỆN TRẢ MÁY?</p>
            <h2>Xem quy định hoàn cọc và kiểm tra thiết bị khi trả</h2>
          </div>
          <Link to="/return-policy" className="button primary-button">
            Xem chính sách trả máy
          </Link>
        </section>
      </div>
    </div>
  );
}

export default DeliveryPolicyPage;
