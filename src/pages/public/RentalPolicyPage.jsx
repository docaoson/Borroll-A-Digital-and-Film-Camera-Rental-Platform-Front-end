import { Link } from "react-router-dom";

const policySections = [
  {
    id: "rental-conditions",
    title: "1. Điều kiện & Thủ tục thuê thiết bị",
    summary:
      "Quy định về giấy tờ tùy thân, xác nhận đơn và thanh toán đặt cọc tại quầy chi nhánh.",
    body: [
      "Khách hàng cần có giấy tờ tùy thân hợp lệ (CCCD hoặc Hộ chiếu còn hạn) để nhân viên đối chiếu và xác nhận khi nhận máy tại quầy.",
      "Mỗi đơn thuê cần được đặt trước trên website BORROLL để hệ thống kiểm tra và giữ thiết bị còn trống tại chi nhánh đã chọn.",
      "Khách hàng thanh toán tiền thuê, phụ kiện film (nếu có) và tiền đặt cọc trực tiếp tại quầy chi nhánh bằng tiền mặt hoặc chuyển khoản.",
      "Tiền cọc là khoản tạm giữ bảo đảm cho thiết bị và sẽ được hoàn lại 100% khi khách trả máy nguyên vẹn theo đúng biên bản giao nhận.",
    ],
  },
  {
    id: "rental-schedule",
    title: "2. Quy định thời gian & Tính ngày thuê",
    summary:
      "Cách thức tính thời lượng thuê và khung giờ nhận trả máy tại các chi nhánh BORROLL.",
    body: [
      "Số ngày thuê được tính theo công thức: Ngày trả − Ngày nhận (thời hạn thuê tối thiểu là 1 ngày).",
      "Ngày trả máy không bị tính là ngày kín: người thuê khác có thể đặt nhận thiết bị từ đúng ngày đó.",
      "Khung giờ nhận và trả máy áp dụng theo giờ mở cửa chính thức của chi nhánh: 09:00 – 21:00 hàng ngày.",
      "Thiết bị phải được nhận và trả tại cùng một chi nhánh mà khách hàng đã lựa chọn khi tạo đơn thuê.",
    ],
  },
  {
    id: "renter-responsibility",
    title: "3. Trách nhiệm bảo quản của người thuê",
    summary:
      "Quy định về việc gìn giữ thiết bị, phụ kiện và an toàn trong quá trình sử dụng.",
    body: [
      "Người thuê có trách nhiệm bảo quản cẩn thận thân máy, ống kính và toàn bộ phụ kiện kèm theo (pin, sạc, dây đeo, nắp đậy, túi chống sốc).",
      "Tuyệt đối không tự ý tháo mở linh kiện, tự sửa chữa, can thiệp phần cứng hoặc cho bên thứ ba mượn lại khi chưa có sự đồng ý của cửa hàng.",
      "Khách hàng cần bảo quản thiết bị tránh tiếp xúc với nước, hóa chất, cát bụi, nguồn nhiệt cao hoặc các tình huống va đập mạnh.",
      "Khi có sự cố kỹ thuật trong quá trình sử dụng, người thuê cần liên hệ ngay hotline chi nhánh để được hướng dẫn xử lý an toàn.",
    ],
  },
  {
    id: "return-deposit-policy",
    title: "4. Quy định hoàn cọc & Xử lý phát sinh",
    summary:
      "Chính sách hoàn trả tiền cọc minh bạch và nguyên tắc xử lý khi phát sinh hư hỏng, trả muộn.",
    body: [
      "Khi trả máy đúng thời hạn và thiết bị hoạt động bình thường, đầy đủ phụ kiện, BORROLL hoàn cọc 100% bằng tiền mặt hoặc chuyển khoản tại quầy.",
      "Trường hợp trả máy muộn hơn ngày hẹn đã cam kết, cửa hàng sẽ ghi nhận trạng thái quá hạn và tính phụ phí theo quy định.",
      "Nếu thiết bị phát sinh trầy xước sâu, móp méo, hư hỏng chức năng hoặc thiếu phụ kiện, nhân viên sẽ đối chiếu ảnh chụp biên bản bàn giao ban đầu.",
      "Chi phí khắc phục hoặc thay thế phụ kiện sẽ được thông báo rõ ràng và khấu trừ trực tiếp từ tiền đặt cọc trước khi hoàn trả phần còn lại.",
    ],
  },
];

function RentalPolicyPage() {
  return (
    <div className="about-page">
      <div className="container about-shell">
        <section className="about-hero-card">
          <p className="eyebrow">CHÍNH SÁCH THUÊ MÁY</p>
          <h1>Quy định thuê và sử dụng thiết bị tại BORROLL</h1>
          <p className="about-lead">
            Chính sách thuê thiết bị của BORROLL được xây dựng dựa trên nguyên
            tắc minh bạch, rõ ràng và bảo vệ quyền lợi của khách thuê. Khách
            hàng nhận và trả máy trực tiếp tại quầy chi nhánh, kiểm tra thiết bị
            thực tế trước khi ký nhận và hoàn cọc ngay khi kết thúc đơn thuê.
          </p>
        </section>

        <section className="about-story-card">
          {policySections.map((section) => (
            <div className="about-story-block" key={section.id}>
              <p className="eyebrow">BORROLL POLICY</p>
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

        <section className="cta-box">
          <div>
            <p className="eyebrow">TÌM HIỂU THÊM QUY TRÌNH</p>
            <h2>Xem chi tiết quy trình nhận máy tại quầy và thủ tục hoàn cọc</h2>
          </div>
          <div className="hero-actions">
            <Link to="/delivery-policy" className="button primary-button">
              Chính sách giao nhận
            </Link>
            <Link to="/return-policy" className="button secondary-button">
              Chính sách trả máy &amp; hoàn cọc
            </Link>
            <Link to="/cameras" className="button secondary-button">
              Xem danh mục thiết bị
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default RentalPolicyPage;
