import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { catalogService } from "../../services/catalogService";

const FAQ_DATA = [
  {
    id: "booking-process",
    category: "booking",
    categoryLabel: "Quy trình thuê",
    question: "Làm thế nào để tạo yêu cầu thuê máy ảnh tại Borroll?",
    answer:
      "Để thuê máy ảnh, bạn thực hiện theo 4 bước đơn giản: 1) Khám phá danh mục thiết bị và chọn máy ảnh/ống kính ưng ý; 2) Thêm vào giỏ thuê, chọn chi nhánh nhận máy và khoảng ngày thuê; 3) Chọn thêm cuộn film/phụ kiện (nếu có) và xem trước bảng báo giá minh bạch; 4) Điền thông tin người nhận và bấm 'Xác nhận đặt thuê'. Đơn thuê của bạn sẽ được gửi đến chi nhánh để nhân viên kiểm tra và xác nhận giữ máy.",
  },
  {
    id: "availability-calendar",
    category: "booking",
    categoryLabel: "Quy trình thuê",
    question: "Tôi có thể kiểm tra lịch còn trống của thiết bị trước khi đặt không?",
    answer:
      "Có. Tại trang chi tiết của mỗi máy ảnh hoặc ống kính, Borroll cung cấp bộ lịch kiểm tra tình trạng máy theo từng chi nhánh và từng tháng. Bạn có thể chọn chi nhánh dự kiến và xem trực quan những ngày thiết bị đã được khách khác đặt kín để chủ động sắp xếp lịch trình của mình.",
  },
  {
    id: "pending-expiry",
    category: "booking",
    categoryLabel: "Quy trình thuê",
    question: "Thời gian chờ xác nhận đơn thuê (PENDING) là bao lâu?",
    answer:
      "Mỗi đơn thuê mới tạo sẽ có thời hạn xác nhận (expiresAt) hiển thị trực tiếp trên chi tiết đơn hàng. Nhân viên chi nhánh sẽ kiểm tra và xác nhận đơn của bạn sớm nhất trong giờ làm việc. Nếu quá thời hạn này mà đơn chưa được xử lý, hệ thống sẽ tự động hủy đơn để giải phóng thiết bị cho các lượt đặt khác.",
  },
  {
    id: "pickup-documents",
    category: "pickup",
    categoryLabel: "Nhận máy & CCCD",
    question: "Khi đến nhận máy tại quầy chi nhánh, tôi cần chuẩn bị những gì?",
    answer:
      "Bạn cần chuẩn bị: 1) Bản gốc Căn cước công dân (CCCD gắn chip) hoặc ứng dụng VNeID định danh điện tử mức 2 chính chủ; 2) Tiền thanh toán bao gồm tiền thuê và tiền cọc thiết bị (bằng tiền mặt hoặc chuyển khoản VietQR tại quầy). Thông tin người đến nhận máy phải trùng khớp với tên và số điện thoại đã đăng ký trong đơn thuê.",
  },
  {
    id: "handover-inspection",
    category: "pickup",
    categoryLabel: "Nhận máy & CCCD",
    question: "Biên bản bàn giao và hình ảnh kiểm tra máy diễn ra như thế nào?",
    answer:
      "Tại quầy nhận máy, nhân viên kỹ thuật sẽ cùng bạn kiểm tra kỹ lưỡng ngoại quan máy ảnh, ống kính, sensor, ống ngắm và các phụ kiện đi kèm (pin, sạc, nắp cáp, thẻ nhớ, dây đeo). Nhân viên sẽ chụp ảnh tình trạng thực tế và lập Biên bản bàn giao điện tử (Handover). Bạn có thể tra cứu lại toàn bộ hình ảnh ngoại quan này bất cứ lúc nào trên trang chi tiết đơn hàng của mình.",
  },
  {
    id: "deposit-policy",
    category: "payment",
    categoryLabel: "Đặt cọc & Thanh toán",
    question: "Tiền cọc thiết bị được tính như thế nào và khi nào tôi được hoàn trả?",
    answer:
      "Tiền cọc được quy định minh bạch theo từng mẫu máy ảnh và ống kính dựa trên giá trị thiết bị. Bạn sẽ thanh toán tiền cọc cùng với tiền thuê khi đến nhận máy tại quầy. 100% tiền cọc sẽ được hoàn trả lại ngay lập tức (bằng tiền mặt hoặc chuyển khoản) tại thời điểm bạn mang thiết bị đến quầy hoàn trả đúng hạn và nguyên vẹn.",
  },
  {
    id: "payment-methods",
    category: "payment",
    categoryLabel: "Đặt cọc & Thanh toán",
    question: "Borroll chấp nhận những hình thức thanh toán nào?",
    answer:
      "Borroll hỗ trợ thanh toán trực tiếp tại quầy chi nhánh bằng Tiền mặt hoặc Quét mã VietQR (chuyển khoản liên ngân hàng 24/7). Chúng tôi không yêu cầu thanh toán trực tuyến trước khi tạo đơn nhằm tạo sự thuận tiện và an tâm tuyệt đối cho khách hàng.",
  },
  {
    id: "cancel-policy",
    category: "cancel",
    categoryLabel: "Đổi lịch & Hủy đơn",
    question: "Tôi có thể tự hủy đơn thuê không và thực hiện như thế nào?",
    answer:
      "Bạn hoàn toàn có thể tự hủy đơn thuê trực tiếp trên website mà không mất bất kỳ khoản phí nào khi đơn đang ở trạng thái Chờ xác nhận (PENDING) hoặc Đã xác nhận (CONFIRMED) trước thời điểm nhận máy. Bạn chỉ cần vào 'Đơn thuê của tôi' -> chọn đơn cần hủy -> bấm nút 'Hủy đơn thuê' và chọn lý do xác nhận.",
  },
  {
    id: "extend-rental",
    category: "cancel",
    categoryLabel: "Đổi lịch & Hủy đơn",
    question: "Nếu tôi muốn gia hạn thêm ngày thuê hoặc trả máy muộn thì sao?",
    answer:
      "Nếu có nhu cầu gia hạn thời gian thuê, bạn vui lòng liên hệ hotline chi nhánh trước tối thiểu 24 giờ so với hạn trả máy ban đầu. Chi nhánh sẽ kiểm tra lịch của thiết bị và hỗ trợ bạn gia hạn nếu máy chưa có khách kế tiếp đặt giữ chỗ.",
  },
  {
    id: "film-addon",
    category: "film",
    categoryLabel: "Bảo quản & Film",
    question: "Tôi có thể mua thêm film chụp khi thuê máy ảnh film không?",
    answer:
      "Có. Borroll luôn có sẵn các dòng film 35mm và 120 phổ biến như Kodak ColorPlus 200, Kodak Gold 200, Kodak Ultramax 400, Fujifilm C200, Ilford HP5... Bạn có thể chọn thêm các cuộn film ngay tại trang Giỏ thuê để được chuẩn bị sẵn kèm máy khi đến lấy.",
  },
  {
    id: "equipment-care",
    category: "film",
    categoryLabel: "Bảo quản & Film",
    question: "Những lưu ý quan trọng để bảo quản máy ảnh trong suốt chuyến đi?",
    answer:
      "Bạn hãy luôn đeo dây đeo máy vào cổ hoặc cổ tay khi chụp; đậy nắp ống kính ngay khi không chụp; tránh để máy ở nơi có nhiệt độ cao (cốp xe máy, ô tô dưới nắng) hoặc nơi ẩm ướt; tuyệt đối không thay ống kính ở môi trường nhiều bụi gió hoặc gần nước biển; và bảo quản thiết bị trong túi chống sốc do Borroll cung cấp.",
  },
];

const CATEGORIES = [
  { key: "all", label: "Tất cả câu hỏi" },
  { key: "booking", label: "Quy trình thuê" },
  { key: "pickup", label: "Nhận máy & CCCD" },
  { key: "payment", label: "Đặt cọc & Thanh toán" },
  { key: "cancel", label: "Đổi lịch & Hủy đơn" },
  { key: "film", label: "Bảo quản & Film" },
];

function SupportPage() {
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [openFaqIds, setOpenFaqIds] = useState(new Set(["booking-process", "pickup-documents"]));

  // Fetch branches data
  useEffect(() => {
    let active = true;

    catalogService
      .getBranches()
      .then((res) => {
        if (!active) return;
        setBranches(Array.isArray(res?.items) ? res.items : []);
      })
      .catch(() => {
        if (!active) return;
        setBranches([]);
      })
      .finally(() => {
        if (active) setBranchesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleFaq = (id) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenFaqIds(new Set(FAQ_DATA.map((item) => item.id)));
  };

  const collapseAll = () => {
    setOpenFaqIds(new Set());
  };

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((faq) => {
      const matchCategory =
        activeCategory === "all" || faq.category === activeCategory;
      const term = searchKeyword.trim().toLowerCase();
      const matchSearch =
        !term ||
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term) ||
        faq.categoryLabel.toLowerCase().includes(term);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchKeyword]);

  return (
    <div className="support-page-shell">
      {/* Breadcrumb Navigation */}
      <div className="order-breadcrumb" aria-label="Đường dẫn điều hướng">
        <Link to="/">Trang chủ</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Hỗ trợ & FAQ</span>
      </div>

      {/* Header Section */}
      <header className="support-header">
        <p className="eyebrow">TRỢ GIÚP & HƯỚNG DẪN</p>
        <h1 className="support-title">Trung tâm hỗ trợ Borroll</h1>
        <p className="support-subheading">
          Giải đáp các thắc mắc thường gặp về quy trình thuê máy ảnh, chính sách đặt cọc, thủ tục nhận máy và mạng lưới chi nhánh cửa hàng.
        </p>

        {/* Search Bar */}
        <div className="support-search-wrap">
          <span className="support-search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="support-search-input"
            placeholder="Tìm câu hỏi, từ khóa (ví dụ: cọc, CCCD, hủy đơn, film)..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            aria-label="Tìm kiếm câu hỏi thường gặp"
          />
          {searchKeyword && (
            <button
              type="button"
              className="support-search-clear"
              onClick={() => setSearchKeyword("")}
              aria-label="Xóa từ khóa"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* FAQ Category Pills */}
      <div className="support-category-pills" aria-label="Danh mục câu hỏi">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`support-cat-btn ${activeCategory === cat.key ? "active" : ""}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ Controls and Accordion */}
      <section className="support-faq-section" aria-label="Câu hỏi thường gặp">
        <div className="support-faq-topbar">
          <span className="faq-count-text">
            Hiển thị <strong>{filteredFaqs.length}</strong> câu hỏi
            {searchKeyword && ` cho từ khóa "${searchKeyword}"`}
          </span>
          <div className="faq-expand-controls">
            <button
              type="button"
              className="faq-text-btn"
              onClick={expandAll}
            >
              Mở tất cả
            </button>
            <span className="faq-divider">•</span>
            <button
              type="button"
              className="faq-text-btn"
              onClick={collapseAll}
            >
              Thu gọn
            </button>
          </div>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="empty-state support-empty-faq">
            <span className="empty-state-icon" aria-hidden="true">🔍</span>
            <h3>Không tìm thấy câu hỏi phù hợp</h3>
            <p>
              Không có câu hỏi nào khớp với từ khóa "{searchKeyword}". Quý khách có thể xem các chủ đề khác hoặc liên hệ hotline chi nhánh để được giải đáp trực tiếp.
            </p>
            <button
              type="button"
              className="button secondary-button small"
              onClick={() => {
                setSearchKeyword("");
                setActiveCategory("all");
              }}
            >
              Xem tất cả câu hỏi
            </button>
          </div>
        ) : (
          <div className="support-accordion">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqIds.has(faq.id);
              return (
                <article
                  key={faq.id}
                  className={`support-faq-item ${isOpen ? "is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <span className="faq-cat-tag">{faq.categoryLabel}</span>
                    <span className="faq-question-text">{faq.question}</span>
                    <span className="faq-toggle-icon" aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      id={`faq-answer-${faq.id}`}
                      className="faq-answer-body"
                    >
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Store Branches Section (Part 6.2) */}
      <section className="support-branches-section" aria-label="Mạng lưới chi nhánh">
        <div className="section-header-compact">
          <p className="eyebrow">HỆ THỐNG CỬA HÀNG</p>
          <h2 className="section-title-compact">Chi nhánh Borroll tiếp nhận hỗ trợ</h2>
          <p className="section-sub-compact">
            Quý khách có thể đến trực tiếp chi nhánh trong giờ mở cửa để kiểm tra máy, nhận bàn giao và nhận tư vấn kỹ thuật.
          </p>
        </div>

        {branchesLoading ? (
          <div className="branches-loading-row">
            <div className="skeleton-line branch-skeleton" />
            <div className="skeleton-line branch-skeleton" />
          </div>
        ) : branches.length > 0 ? (
          <div className="support-branches-grid">
            {branches.map((b) => (
              <div key={b.id || b.slug} className="support-branch-card">
                <div className="branch-card-header">
                  <span className="branch-badge">Chi nhánh đang hoạt động</span>
                  <h3 className="branch-name">{b.name}</h3>
                </div>
                <div className="branch-details-list">
                  <div className="branch-detail-item">
                    <span className="detail-icon" aria-hidden="true">📍</span>
                    <div>
                      <strong>Địa chỉ:</strong>
                      <p>{b.address || "Hà Nội"}</p>
                    </div>
                  </div>
                  <div className="branch-detail-item">
                    <span className="detail-icon" aria-hidden="true">📞</span>
                    <div>
                      <strong>Hotline hỗ trợ:</strong>
                      <p>
                        {b.phone ? (
                          <a href={`tel:${b.phone}`} className="branch-tel-link">
                            {b.phone}
                          </a>
                        ) : (
                          "0866.747.114"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="branch-detail-item">
                    <span className="detail-icon" aria-hidden="true">🕒</span>
                    <div>
                      <strong>Giờ mở cửa:</strong>
                      <p>{b.openHours || "09:00 – 21:00 hàng ngày (kể cả Thứ 7, CN)"}</p>
                    </div>
                  </div>
                </div>
                {b.mapUrl && (
                  <div className="branch-card-footer">
                    <a
                      href={b.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button secondary-button small full-width"
                    >
                      Xem bản đồ chỉ đường →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="support-branches-grid">
            <div className="support-branch-card">
              <div className="branch-card-header">
                <span className="branch-badge">Chi nhánh chính</span>
                <h3 className="branch-name">Borroll Tây Hồ</h3>
              </div>
              <div className="branch-details-list">
                <div className="branch-detail-item">
                  <span className="detail-icon">📍</span>
                  <div>
                    <strong>Địa chỉ:</strong>
                    <p>18 Xuân Diệu, Phường Quảng An, Quận Tây Hồ, Hà Nội</p>
                  </div>
                </div>
                <div className="branch-detail-item">
                  <span className="detail-icon">📞</span>
                  <div>
                    <strong>Hotline:</strong>
                    <p><a href="tel:0866747114" className="branch-tel-link">0866.747.114</a></p>
                  </div>
                </div>
                <div className="branch-detail-item">
                  <span className="detail-icon">🕒</span>
                  <div>
                    <strong>Giờ mở cửa:</strong>
                    <p>09:00 – 21:00 hàng ngày</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Emergency Assistance & Ticket System Notice (Part 6.3) */}
      <section className="support-contact-banner" aria-label="Thông tin liên hệ khẩn cấp">
        <div className="contact-banner-content">
          <span className="contact-banner-icon" aria-hidden="true">💬</span>
          <div className="contact-banner-text">
            <h3>Cần hỗ trợ khẩn cấp hoặc tư vấn thiết bị?</h3>
            <p>
              Đội ngũ kỹ thuật Borroll luôn sẵn sàng lắng nghe và giải đáp mọi vấn đề phát sinh trong quá trình sử dụng máy ảnh.
              Hotline tiếp nhận 24/7: <a href="tel:0866747114"><strong>0866.747.114</strong></a> hoặc gửi email về: <strong>support@borroll.vn</strong>.
            </p>
            <small className="contact-banner-note">
              * Lưu ý: Hệ thống gửi phiếu hỗ trợ (Ticket System) trực tuyến đang được phát triển ở phiên bản kế tiếp. Hiện tại Borroll tiếp nhận và xử lý hỗ trợ nhanh nhất qua Hotline và trực tiếp tại quầy chi nhánh.
            </small>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SupportPage;
