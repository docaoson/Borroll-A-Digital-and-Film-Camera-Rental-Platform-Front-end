import { Link } from "react-router-dom";

const returnRules = [
  {
    number: "01",
    title: "Trả đúng chi nhánh đã nhận",
    description:
      "Khách hàng mang thiết bị và đầy đủ phụ kiện (pin, sạc, dây đeo, nắp đậy, túi bảo vệ) về lại đúng chi nhánh ban đầu đã nhận máy.",
  },
  {
    number: "02",
    title: "Đối chiếu biên bản & Hoàn cọc ngay",
    description:
      "Nhân viên kiểm tra đo sáng, màn trập, ngoại quan và chụp ảnh biên bản trả máy. Cửa hàng hoàn trả 100% tiền cọc nếu máy nguyên vẹn.",
  },
  {
    number: "03",
    title: "Khấu trừ minh bạch nếu phát sinh",
    description:
      "Trường hợp trả quá hạn hoặc phát sinh trầy xước sâu/hỏng hóc/thiếu phụ kiện, chi phí xử lý được ghi thành mục riêng và khấu trừ từ tiền cọc.",
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

function ReturnPolicyPage() {
  return (
    <div className="about-page">
      <div className="container about-shell">
        <section className="about-hero-card">
          <p className="eyebrow">TRẢ MÁY &amp; HOÀN CỌC</p>
          <h1>Chính sách trả máy tại cửa hàng BORROLL</h1>
          <p className="about-lead">
            Sau khi kết thúc thời gian thuê, khách hàng mang thiết bị đến trả
            trực tiếp tại đúng chi nhánh đã nhận máy trong khung giờ mở cửa. Cửa
            hàng thực hiện kiểm tra tình trạng máy công khai và hoàn trả tiền
            cọc minh bạch tại quầy.
          </p>
        </section>

        <section className="about-story-card">
          <div className="about-story-block">
            <p className="eyebrow">THỜI GIAN TRẢ MÁY</p>
            <h2>Đúng ngày hẹn trong khung giờ 09:00 – 21:00</h2>
            <p>
              Khách hàng vui lòng mang thiết bị đến trả đúng ngày kết thúc thuê
              đã đăng ký trong đơn. Ngày trả máy không tính kín, vì vậy việc trả
              đúng hẹn giúp cửa hàng bảo dưỡng, vệ sinh và kịp bàn giao cho
              người thuê tiếp theo.
            </p>
          </div>

          <div className="about-story-block">
            <p className="eyebrow">HOÀN TIỀN CỌC</p>
            <h2>Hoàn cọc 100% bằng tiền mặt hoặc chuyển khoản</h2>
            <p>
              Tiền đặt cọc là khoản bảo đảm tạm giữ trong thời gian thuê máy. Sau
              khi nhân viên kiểm tra máy và đối chiếu không có hư hỏng, toàn bộ
              số tiền cọc sẽ được hoàn trả ngay lập tức theo phương thức khách
              hàng yêu cầu.
            </p>
          </div>
        </section>

        <section className="about-story-card">
          <div className="about-story-block">
            <p className="eyebrow">XỬ LÝ TRẢ MUỘN</p>
            <h2>Quy định khi trả máy quá hạn</h2>
            <p>
              Trường hợp khách hàng có nhu cầu gia hạn hoặc có lịch trình phát
              sinh, vui lòng liên hệ sớm với hotline chi nhánh. Nếu máy trả muộn
              mà không thông báo trước, hệ thống sẽ ghi nhận trạng thái quá hạn
              và tính phụ phí theo thời gian chậm trễ.
            </p>
          </div>

          <div className="about-story-block">
            <p className="eyebrow">THIỆT HẠI &amp; MẤT PHỤ KIỆN</p>
            <h2>Nguyên tắc bồi hoàn minh bạch</h2>
            <p>
              Mọi ghi nhận hư hỏng đều được đối chiếu trực tiếp với ảnh chụp biên
              bản bàn giao lúc nhận máy ban đầu. Chi phí sửa chữa hoặc thay thế
              phụ kiện bị mất (pin, sạc, nắp lens, dây đeo) sẽ được tính theo
              thực tế và khấu trừ từ tiền đặt cọc.
            </p>
          </div>
        </section>

        <section className="about-pillars">
          <div className="section-heading">
            <p className="eyebrow">QUY TRÌNH KHI TRẢ</p>
            <h2>Ba bước trả máy và hoàn tất đơn thuê</h2>
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

        <section className="about-pillars">
          <div className="section-heading">
            <p className="eyebrow">ĐỊA ĐIỂM TRẢ MÁY</p>
            <h2>Trả tại chi nhánh ban đầu đã nhận</h2>
          </div>

          <div className="branch-card-grid">
            {branches.map((b) => (
              <article className="branch-card" key={b.slug}>
                <p className="eyebrow">CHI NHÁNH HOÀN TRẢ</p>
                <h3>{b.name}</h3>
                <p><strong>Địa chỉ:</strong> {b.address}</p>
                <p><strong>Hotline:</strong> {b.phone}</p>
                <p><strong>Giờ mở cửa:</strong> {b.openHours}</p>
                <span className="branch-highlight">Kiểm tra máy &amp; hoàn cọc ngay tại quầy</span>
              </article>
            ))}
          </div>
        </section>

        <section className="cta-box">
          <div>
            <p className="eyebrow">CHỌN THIẾT BỊ NGAY</p>
            <h2>Khám phá các mẫu máy ảnh film và kỹ thuật số tại BORROLL</h2>
          </div>
          <div className="hero-actions">
            <Link to="/cameras" className="button primary-button">
              Xem danh mục thiết bị
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

export default ReturnPolicyPage;
