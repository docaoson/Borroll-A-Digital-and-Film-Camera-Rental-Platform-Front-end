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

        <section className="cta-box">
          <div>
            <p className="eyebrow">TRẢI NGHIỆM CÙNG BORROLL</p>
            <h2>Sẵn sàng chọn chiếc máy đồng hành cho dự án tiếp theo?</h2>
          </div>
          <Link to="/cameras" className="button primary-button">
            Xem danh sách thiết bị
          </Link>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;
