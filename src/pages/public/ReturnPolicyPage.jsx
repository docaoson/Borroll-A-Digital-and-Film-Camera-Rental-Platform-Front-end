import { Link } from "react-router-dom";

const returnRules = [
  {
    number: "01",
    title: "Trả đúng chi nhánh đã nhận",
    description:
      "Khách hàng mang máy và đầy đủ phụ kiện (pin, sạc, dây đeo, túi bảo vệ) về lại đúng chi nhánh đã nhận máy.",
  },
  {
    number: "02",
    title: "Đối chiếu biên bản & hoàn cọc",
    description:
      "Nhân viên kiểm tra tình trạng máy, chụp ảnh biên bản nhận lại thiết bị và hoàn trả tiền cọc nếu máy không phát sinh hư hỏng.",
  },
  {
    number: "03",
    title: "Khấu trừ minh bạch nếu phát sinh",
    description:
      "Trường hợp trả muộn hoặc hư hỏng/thiếu phụ kiện, chi phí xử lý được ghi thành mục riêng và trừ trực tiếp từ tiền cọc trước khi hoàn phần dư.",
  },
];

function ReturnPolicyPage() {
  return (
    <div className="about-page">
      <div className="container about-shell">
        <section className="about-hero-card">
          <p className="eyebrow">TRẢ MÁY &amp; HOÀN CỌC</p>
          <h1>Chính sách trả máy tại cửa hàng</h1>
          <p className="about-lead">
            Sau khi kết thúc thời gian thuê, khách hàng mang thiết bị đến trả
            trực tiếp tại đúng chi nhánh đã nhận máy. Cửa hàng không thu hồi
            thiết bị qua dịch vụ giao nhận tận nơi.
          </p>
        </section>

        <section className="about-story-card">
          <div className="about-story-block">
            <p className="eyebrow">THỜI GIAN TRẢ MÁY</p>
            <h2>Đúng ngày hẹn trong giờ mở cửa</h2>
            <p>
              Số ngày thuê được tính theo ngày trả trừ ngày nhận (tối thiểu 1
              ngày). Khách hàng vui lòng trả máy đúng ngày hẹn tại quầy để không
              phát sinh phí trả muộn và không ảnh hưởng lịch nhận của khách kế
              tiếp.
            </p>
          </div>

          <div className="about-story-block">
            <p className="eyebrow">HOÀN TIỀN CỌC</p>
            <h2>Minh bạch theo biên bản giao nhận</h2>
            <p>
              Tiền cọc là khoản tạm giữ và sẽ được hoàn lại đầy đủ qua tiền mặt
              hoặc chuyển khoản sau khi nhân viên hoàn tất kiểm tra máy, đối
              chiếu với tình trạng lúc giao máy.
            </p>
          </div>
        </section>

        <section className="about-pillars">
          <div className="section-heading">
            <p className="eyebrow">QUY ĐỊNH KHI TRẢ</p>
            <h2>Ba điểm cần lưu ý</h2>
          </div>

          <div className="process-grid">
            {returnRules.map((rule) => (
              <article className="process-card" key={rule.number}>
                <span className="process-number">{rule.number}</span>
                <h3>{rule.title}</h3>
                <p>{rule.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-box">
          <div>
            <p className="eyebrow">CHỌN THIẾT BỊ NGAY</p>
            <h2>Khám phá các mẫu máy đang cho thuê tại chi nhánh</h2>
          </div>
          <Link to="/cameras" className="button primary-button">
            Xem danh sách thiết bị
          </Link>
        </section>
      </div>
    </div>
  );
}

export default ReturnPolicyPage;
