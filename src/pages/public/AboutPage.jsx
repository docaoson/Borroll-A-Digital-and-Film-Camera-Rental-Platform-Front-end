import { Link } from "react-router-dom";

const goals = [
  {
    number: "01",
    title: "Thân thiện với khách hàng",
    description:
      "Tư vấn nhẹ nhàng, quy trình đặt thuê rõ ràng, dễ hiểu ngay cả với các bạn lần đầu cầm máy film hoặc máy ảnh chuyên nghiệp.",
  },
  {
    number: "02",
    title: "Máy ảnh chất lượng",
    description:
      "Toàn bộ thiết bị đều do cửa hàng trực tiếp sở hữu, kiểm tra đo sáng, màn trập và vệ sinh ống kính cẩn thận trước mỗi lần giao.",
  },
  {
    number: "03",
    title: "Giá cả phù hợp sinh viên",
    description:
      "Mức giá thuê phải chăng, minh bạch, giúp sinh viên và người trẻ dễ dàng tiếp cận thiết bị tốt mà không phải đầu tư chi phí quá lớn.",
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

function AboutPage() {
  return (
    <div className="about-page">
      <div className="container about-shell">
        <section className="about-hero-card">
          <p className="eyebrow">VỀ BORROLL</p>
          <h1>Câu chuyện từ một nhóm sinh viên yêu nhiếp ảnh</h1>
          <p className="about-lead">
            BORROLL được khởi xướng và xây dựng bởi một nhóm sinh viên ngành
            Thương mại điện tử (E-Business, Đại học Hà Nội) trong khuôn khổ đề
            tài dự án thực tế. Xuất phát từ nhu cầu tự chụp ảnh dự án, kỷ yếu và
            trải nghiệm máy ảnh film của chính sinh viên, chúng mình mong muốn
            tạo ra một địa chỉ thuê máy gần gũi, dễ tiếp cận và đáng tin cậy.
          </p>
        </section>

        <section className="about-story-card">
          <div className="about-story-block">
            <p className="eyebrow">TIỂU SỬ DỰ ÁN</p>
            <h2>Từ đề tài sinh viên đến mô hình cửa hàng thân thiện</h2>
            <p>
              Nhóm thực hiện dự án nhận thấy nhiều bạn trẻ muốn thử sức với
              nhiếp ảnh nhưng ngại chi phí mua máy mới đắt đỏ hoặc lo lắng khi
              thuê thiết bị qua trung gian không đồng nhất chất lượng. Vì vậy,
              BORROLL hướng đến mô hình cửa hàng sở hữu và tự quản lý kho máy
              trực tiếp, giúp kiểm soát tốt tình trạng từng chiếc máy trước khi
              đến tay người thuê.
            </p>
          </div>

          <div className="about-story-block">
            <p className="eyebrow">MỤC TIÊU</p>
            <h2>Chất lượng đảm bảo, chi phí vừa túi tiền</h2>
            <p>
              Mục tiêu cốt lõi của BORROLL là xây dựng một shop cho thuê máy ảnh
              thân thiện với khách hàng, duy trì thiết bị ổn định — sạch đẹp,
              đồng thời giữ mức giá thuê hợp lý và minh bạch để phù hợp với túi
              tiền sinh viên cũng như các dự án sáng tạo cá nhân.
            </p>
          </div>
        </section>

        <section className="about-story-card">
          <div className="about-story-block">
            <p className="eyebrow">DỊCH VỤ MÁY ẢNH FILM</p>
            <h2>Chất ảnh hoài niệm &amp; trải nghiệm cơ khí</h2>
            <p>
              BORROLL cung cấp các dòng máy film 35mm đa dạng từ Compact ngắm
              chụp, Rangefinder kinh điển đến SLR cơ học. Khách thuê được hướng
              dẫn lắp film, đọc thông số đo sáng và có thể mua kèm các cuộn film
              thông dụng ngay khi đặt đơn.
            </p>
          </div>

          <div className="about-story-block">
            <p className="eyebrow">DỊCH VỤ MÁY ẢNH DIGITAL</p>
            <h2>Linh hoạt cho dự án quay chụp &amp; sự kiện</h2>
            <p>
              Phù hợp với nhu cầu chụp kỷ yếu, sự kiện trường lớp, quay đồ án
              hoặc du lịch ngắn ngày. Các dòng máy Mirrorless và DSLR được trang
              bị đầy đủ pin, sạc, thẻ nhớ và túi chống sốc, sẵn sàng tác nghiệp
              ngay khi nhận máy.
            </p>
          </div>
        </section>

        <section className="about-pillars">
          <div className="section-heading">
            <p className="eyebrow">GIÁ TRỊ HƯỚNG TỚI</p>
            <h2>Ba điều BORROLL luôn ưu tiên</h2>
          </div>

          <div className="process-grid">
            {goals.map((goal) => (
              <article className="process-card" key={goal.number}>
                <span className="process-number">{goal.number}</span>
                <h3>{goal.title}</h3>
                <p>{goal.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-pillars">
          <div className="section-heading">
            <p className="eyebrow">HỆ THỐNG CỬA HÀNG</p>
            <h2>Chi nhánh nhận &amp; trả máy tại Hà Nội</h2>
          </div>

          <div className="branch-card-grid">
            {branches.map((b) => (
              <article className="branch-card" key={b.slug}>
                <p className="eyebrow">BORROLL BRANCH</p>
                <h3>{b.name}</h3>
                <p><strong>Địa chỉ:</strong> {b.address}</p>
                <p><strong>Hotline:</strong> {b.phone}</p>
                <p><strong>Giờ mở cửa:</strong> {b.openHours}</p>
                <span className="branch-highlight">Nhận và trả máy trực tiếp tại quầy</span>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-box">
          <div>
            <p className="eyebrow">TRẢI NGHIỆM CÙNG BORROLL</p>
            <h2>Sẵn sàng chọn chiếc máy đồng hành cho dự án tiếp theo?</h2>
          </div>
          <div className="hero-actions">
            <Link to="/cameras" className="button primary-button">
              Xem danh sách thiết bị
            </Link>
            <Link to="/rental-policy" className="button secondary-button">
              Chính sách thuê máy
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;
