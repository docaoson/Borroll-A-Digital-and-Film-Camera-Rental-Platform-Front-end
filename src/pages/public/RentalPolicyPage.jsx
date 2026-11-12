import { Link } from "react-router-dom";

const policySections = [
  {
    id: "rental-conditions",
    title: "1. Quy định thuê thiết bị",
    summary: "Thông tin sơ bộ đang chờ phê duyệt chính thức từ BORROLL.",
    body: [
      "Khách hàng cần đặt thuê theo đúng thời gian nhận và trả máy đã xác nhận, đồng thời giữ đầy đủ giấy tờ tùy thân theo yêu cầu hiện hành của cửa hàng.",
      "Thời gian thuê được tính theo ngày, với thời hạn tối thiểu theo quy định của từng loại thiết bị. Khách hàng cần thanh toán trực tiếp tại quầy khi nhận máy và lưu ý kiểm tra lại thông tin đơn trước khi ký biên bản giao nhận.",
      "Việc đặt cọc, thanh toán và hoàn cọc sẽ được xác nhận rõ trên biên bản thuê và giao nhận. Đây là nội dung sơ bộ, chưa là các điều kiện pháp lý cuối cùng.",
    ],
  },
  {
    id: "handover",
    title: "2. Chính sách giao nhận",
    summary: "Thông tin sơ bộ đang chờ phê duyệt chính thức từ BORROLL.",
    body: [
      "BORROLL thực hiện giao nhận và trả máy trực tiếp tại chi nhánh đã chọn. Khách hàng sẽ nhận máy ở cùng địa điểm mà đơn thuê đã xác nhận.",
      "Khi nhận máy, nhân viên sẽ đối chiếu thông tin đơn, kiểm tra tình trạng ngoại quan, phụ kiện đi kèm và nhắc khách hàng xem lại biên bản giao nhận trước khi ký xác nhận.",
      "Ngoài các chi nhánh chính thức, BORROLL chưa áp dụng hình thức giao hàng tận nơi cho đơn thuê máy hiện tại. Đây là nội dung sơ bộ để chuẩn bị cho quy định chính thức sau này.",
    ],
  },
  {
    id: "return",
    title: "3. Chính sách trả máy",
    summary: "Thông tin sơ bộ đang chờ phê duyệt chính thức từ BORROLL.",
    body: [
      "Khách hàng cần trả máy đúng thời hạn, đúng chi nhánh đã nhận máy và đầy đủ phụ kiện theo biên bản giao nhận.",
      "Khi trả máy, nhân viên sẽ kiểm tra tình trạng máy, đối chiếu với lúc nhận, xác nhận phụ kiện còn đầy đủ và ghi nhận các phát sinh nếu có.",
      "Nếu khách hàng trả chậm hoặc không đúng quy trình, cửa hàng sẽ ghi nhận và xử lý theo biên bản kết thúc hợp đồng. Đây là nội dung dự phòng để chuẩn bị cho chính sách chính thức sau này.",
    ],
  },
  {
    id: "compensation",
    title: "4. Chính sách bồi hoàn và đền bù",
    summary:
      "Nội dung này là thông tin sơ bộ, chưa được phê duyệt là chính sách cuối cùng của BORROLL.",
    body: [
      "Nếu thiết bị bị hư hỏng do hành vi của người thuê, cửa hàng sẽ tiến hành kiểm tra và xác định mức độ thiệt hại cùng với việc đối chiếu biên bản giao nhận ban đầu.",
      "Trong trường hợp máy bị mất, thiếu phụ kiện hoặc không còn nguyên trạng như lúc nhận, BORROLL sẽ xem xét việc xử lý theo từng tình huống cụ thể và liên hệ với người thuê để xác nhận tình trạng thực tế.",
      "Các trường hợp như sử dụng sai cách, sử dụng sai mục đích, bỏ quên phụ kiện, hoặc làm hỏng thiết bị trong quá trình thuê đều sẽ được kiểm tra kỹ lưỡng trước khi xác định mức xử lý.",
      "Quy trình kiểm tra thiết bị và định giá đền bù sẽ dựa trên tình trạng thực tế của máy, kết quả kiểm tra kỹ thuật và các ghi nhận về phụ kiện trong biên bản. Nội dung này chưa bao gồm mức bồi thường, tỷ lệ hoặc khoản phí cụ thể nào.",
    ],
  },
];

function RentalPolicyPage() {
  return (
    <div className="about-page">
      <div className="container about-shell">
        <section className="about-hero-card">
          <p className="eyebrow">CHÍNH SÁCH THUÊ</p>
          <h1>Quy định sử dụng và thuê máy tại BORROLL</h1>
          <p className="about-lead">
            Đây là nội dung sơ bộ, đang chờ BORROLL phê duyệt chính thức. Mục
            đích của trang là chuẩn bị cấu trúc nội dung cho chính sách thuê,
            giao nhận và xử lý hư hỏng trước khi cập nhật từ quản trị viên hoặc
            hệ thống quản lý sau này.
          </p>
        </section>

        <section className="about-story-card">
          {policySections.map((section) => (
            <div className="about-story-block" key={section.id}>
              <p className="eyebrow">BORROLL</p>
              <h2>{section.title}</h2>
              <p>{section.summary}</p>
              <ul>
                {section.body.map((item) => (
                  <li key={`${section.id}-${item.slice(0, 20)}`}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="cta-box">
          <div>
            <p className="eyebrow">BẠN CẦN THÊM THÔNG TIN?</p>
            <h2>
              Tìm hiểu thêm về cách nhận máy, trả máy và xử lý phát sinh trước
              khi đặt thuê.
            </h2>
          </div>
          <div className="hero-actions">
            <Link to="/cameras" className="button primary-button">
              Xem thiết bị
            </Link>
            <Link to="/privacy-policy" className="button secondary-button">
              Chính sách bảo mật
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default RentalPolicyPage;
