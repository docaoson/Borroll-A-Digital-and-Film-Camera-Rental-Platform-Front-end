import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useRentalSelection } from "../../hooks/useRentalSelection";
import { ApiError } from "../../lib/apiClient";
import { bookingService } from "../../services/bookingService";
import { catalogService } from "../../services/catalogService";

function CheckoutPage() {
  const { user } = useAuth();
  const { branchSlug, startDate, endDate, items, addons, clearSelection } =
    useRentalSelection();

  const [branches, setBranches] = useState([]);
  const [contactNameDraft, setContactNameDraft] = useState(null);
  const [contactPhoneDraft, setContactPhoneDraft] = useState(null);
  const [note, setNote] = useState("");
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdBooking, setCreatedBooking] = useState(null);

  // Quote State
  const [quoteState, setQuoteState] = useState({
    key: null,
    data: null,
    error: "",
  });

  const contactName = contactNameDraft ?? user?.fullName ?? "";
  const contactPhone = contactPhoneDraft ?? user?.phone ?? "";

  // Load branch information
  useEffect(() => {
    let active = true;
    catalogService
      .getBranches()
      .then((res) => {
        if (active) setBranches(res.items || []);
      })
      .catch(() => {
        if (active) setBranches([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const quoteKey =
    items.length > 0 && branchSlug && startDate && endDate
      ? JSON.stringify({ branchSlug, startDate, endDate, items, addons })
      : null;

  useEffect(() => {
    if (!quoteKey) return;
    let active = true;
    bookingService
      .quote({
        branchSlug,
        startDate,
        endDate,
        items: items.map((item) => ({ modelId: item.modelId })),
        addons,
      })
      .then((data) => {
        if (active) setQuoteState({ key: quoteKey, data, error: "" });
      })
      .catch((error) => {
        if (active) {
          setQuoteState({
            key: quoteKey,
            data: null,
            error:
              error instanceof ApiError
                ? error.message
                : "Không thể lấy báo giá từ máy chủ lúc này.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [quoteKey, branchSlug, startDate, endDate, items, addons]);

  const quote = quoteKey && quoteState.key === quoteKey ? quoteState.data : null;
  const quoteError =
    quoteKey && quoteState.key === quoteKey ? quoteState.error : "";
  const isQuoteLoading = Boolean(quoteKey && quoteState.key !== quoteKey);

  const currentBranch = branches.find((b) => b.slug === branchSlug);

  const handleConfirmBooking = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!contactName.trim()) {
      setSubmitError("Vui lòng nhập họ và tên người nhận máy.");
      return;
    }

    if (!/^0\d{9}$/.test(contactPhone.trim())) {
      setSubmitError(
        "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số bắt đầu bằng 0.",
      );
      return;
    }

    if (!agreePolicy) {
      setSubmitError(
        "Vui lòng xác nhận đồng ý với Quy định nhận máy và Chính sách thuê trước khi gửi yêu cầu.",
      );
      return;
    }

    if (!quote || quote.available === false) {
      setSubmitError(
        "Thiết bị đã kín lịch trong khoảng ngày này hoặc báo giá chưa sẵn sàng. Vui lòng quay lại giỏ thuê kiểm tra.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const booking = await bookingService.createBooking({
        branchSlug,
        startDate,
        endDate,
        items: items.map((item) => ({ modelId: item.modelId })),
        addons,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        note: note.trim() || null,
        setupPlanId: null,
      });

      setCreatedBooking(booking);
      clearSelection();
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : "Không thể tạo đơn thuê lúc này. Vui lòng thử lại.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS STATE (PART 8)
  if (createdBooking) {
    return (
      <div className="checkout-success-view">
        <div className="success-banner-card">
          <div className="success-checkmark-circle" aria-hidden="true">
            ✓
          </div>
          <p className="eyebrow">YÊU CẦU THUÊ ĐÃ ĐƯỢC GỬI THÀNH CÔNG</p>
          <h1 className="success-booking-code">
            Mã đơn thuê: <span>{createdBooking.code}</span>
          </h1>
          <div className="booking-status-pill pending">
            Trạng thái: <strong>Chờ cửa hàng xác nhận (PENDING)</strong>
          </div>
          <p className="success-instructions-lead">
            Cảm ơn bạn đã lựa chọn Borroll! Yêu cầu đặt thuê của bạn đã được ghi nhận vào hệ thống. Đội ngũ kỹ thuật viên tại chi nhánh sẽ liên hệ với bạn trong vòng 30–60 phút để xác nhận và chuẩn bị thiết bị.
          </p>
        </div>

        <div className="success-details-grid">
          {/* BOOKING SUMMARY BOX */}
          <div className="checkout-card success-summary-box">
            <h3>Chi tiết đơn thuê</h3>
            <div className="summary-table">
              <div className="summary-row">
                <span>Chi nhánh nhận & trả:</span>
                <strong>
                  Chi nhánh {createdBooking.branch?.name} ({createdBooking.branch?.address})
                </strong>
              </div>
              <div className="summary-row">
                <span>Thời gian thuê:</span>
                <strong>
                  {createdBooking.startDate} → {createdBooking.endDate} (
                  {createdBooking.days} ngày)
                </strong>
              </div>
              <div className="summary-row">
                <span>Người nhận máy:</span>
                <strong>
                  {createdBooking.contactName} ({createdBooking.contactPhone})
                </strong>
              </div>
              {createdBooking.note && (
                <div className="summary-row">
                  <span>Ghi chú của bạn:</span>
                  <p className="note-text">{createdBooking.note}</p>
                </div>
              )}
            </div>

            <div className="success-divider" />

            <div className="success-financial-breakdown">
              <div className="fin-row">
                <span>Tiền thuê thiết bị:</span>
                <strong>
                  {createdBooking.rentalAmount.toLocaleString("vi-VN")} ₫
                </strong>
              </div>
              {createdBooking.addonsAmount > 0 && (
                <div className="fin-row">
                  <span>Phim chụp mua kèm:</span>
                  <strong>
                    +{createdBooking.addonsAmount.toLocaleString("vi-VN")} ₫
                  </strong>
                </div>
              )}
              <div className="fin-row deposit-fin-row">
                <span>Tiền đặt cọc (hoàn lại 100% khi trả máy):</span>
                <strong>
                  {createdBooking.depositAmount.toLocaleString("vi-VN")} ₫
                </strong>
              </div>
              <div className="success-divider" />
              <div className="fin-total-row">
                <span>Tổng thanh toán khi nhận máy tại quầy:</span>
                <strong className="text-terra">
                  {createdBooking.totalDueAtPickup.toLocaleString("vi-VN")} ₫
                </strong>
              </div>
            </div>
          </div>

          {/* NEXT STEPS & HANDOVER POLICY GUIDE */}
          <div className="checkout-card success-guide-box">
            <h3>Các bước tiếp theo tại cửa hàng</h3>
            <ol className="next-steps-list">
              <li>
                <strong>1. Cửa hàng liên hệ xác nhận:</strong> Kỹ thuật viên sẽ gọi điện thoại hoặc gửi email xác nhận tình trạng sẵn sàng của thiết bị.
              </li>
              <li>
                <strong>2. Đến chi nhánh đúng hẹn:</strong> Bạn mang theo <strong>CCCD gắn chip chính chủ</strong> hoặc <strong>Hộ chiếu gốc</strong> để làm thủ tục đối chiếu giấy tờ.
              </li>
              <li>
                <strong>3. Kiểm định thiết bị tại quầy:</strong> Kỹ thuật viên sẽ hướng dẫn bạn thao tác máy, test cơ học/màn trập/kính ngắm và ký biên bản bàn giao.
              </li>
              <li>
                <strong>4. Thanh toán & Hoàn cọc:</strong> Thanh toán tiền thuê và đặt cọc trực tiếp tại quầy bằng tiền mặt hoặc chuyển khoản ngân hàng. Tiền đặt cọc sẽ được hoàn trả 100% ngay khi bạn trả máy.
              </li>
            </ol>

            <div className="success-action-buttons">
              <Link to="/orders" className="button primary-button full-width">
                Xem danh sách đơn thuê của tôi →
              </Link>
              <Link to="/cameras" className="button secondary-button full-width">
                Tiếp tục xem thêm thiết bị
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CHECKOUT FORM VIEW
  return (
    <div className="checkout-page-wrapper">
      <header className="checkout-page-header">
        <p className="eyebrow">XÁC NHẬN THÔNG TIN THUÊ</p>
        <h1>Xác nhận yêu cầu đặt thuê</h1>
        <p className="checkout-header-desc">
          Kiểm tra lại danh sách thiết bị, thông tin người nhận và quy định bàn giao trước khi gửi đơn thuê.
        </p>
      </header>

      {items.length === 0 || !startDate || !endDate ? (
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true">⚠️</div>
          <h2>Chưa đủ thông tin để xác nhận đơn thuê</h2>
          <p>
            Bạn cần chọn ít nhất một thiết bị, chi nhánh và khoảng ngày nhận/trả máy tại Giỏ thuê trước khi tiến hành xác nhận.
          </p>
          <Link to="/cart" className="button primary-button">
            Quay lại Giỏ thuê
          </Link>
        </div>
      ) : (
        <div className="checkout-layout-grid">
          {/* LEFT COLUMN: CONTACT FORM & IN-STORE POLICY */}
          <div className="checkout-form-col">
            {/* 1. CUSTOMER CONTACT INFORMATION */}
            <section className="checkout-card" aria-label="Thông tin người nhận máy">
              <h2>1. Thông tin người nhận thiết bị</h2>
              <p className="section-instruction">
                Thông tin dùng để đối chiếu khi bạn đến nhận máy tại cửa hàng.
              </p>

              <form id="checkout-form" onSubmit={handleConfirmBooking} noValidate>
                <div className="form-field">
                  <label htmlFor="contact-name">
                    Họ và tên người nhận máy <span className="required-star">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={contactName}
                    onChange={(e) => setContactNameDraft(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="contact-phone">
                    Số điện thoại liên hệ <span className="required-star">*</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    placeholder="Ví dụ: 0912345678"
                    value={contactPhone}
                    onChange={(e) => setContactPhoneDraft(e.target.value)}
                    required
                  />
                  <small className="field-hint">
                    Yêu cầu số điện thoại di động 10 chữ số bắt đầu bằng 0.
                  </small>
                </div>

                {user?.email && (
                  <div className="form-field">
                    <label htmlFor="contact-email">Email tài khoản</label>
                    <input
                      id="contact-email"
                      type="email"
                      value={user.email}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="checkout-note">
                    Ghi chú cho cửa hàng (tùy chọn)
                  </label>
                  <textarea
                    id="checkout-note"
                    rows={3}
                    placeholder="Ví dụ: Mình dự kiến đến nhận máy lúc 9h30 sáng; nhờ shop chuẩn bị pin đã sạc đầy..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </form>
            </section>

            {/* 2. IN-STORE PICKUP & HANDOVER POLICY CONFIRMATION (PART 6.3) */}
            <section className="checkout-card handover-policy-card" aria-label="Quy định nhận máy">
              <h2>2. Quy định nhận và trả máy tại cửa hàng</h2>
              {currentBranch && (
                <div className="handover-branch-box">
                  <span className="branch-icon" aria-hidden="true">🏢</span>
                  <div>
                    <strong>Chi nhánh nhận & trả: {currentBranch.name}</strong>
                    <p>Địa chỉ: {currentBranch.address}</p>
                    <p>Hotline hỗ trợ: {currentBranch.phone || "0987 654 321"}</p>
                  </div>
                </div>
              )}

              <div className="policy-notice-box">
                <h4>Chính sách giao nhận & thanh toán:</h4>
                <ul>
                  <li>
                    <strong>Nhận máy trực tiếp:</strong> Borroll áp dụng hình thức nhận và trả máy trực tiếp tại cửa hàng để bạn có thể kiểm tra thấu kính, cảm biến và thao tác cùng chuyên viên.
                  </li>
                  <li>
                    <strong>Giấy tờ bảo lãnh & Đặt cọc:</strong> Khi nhận máy, vui lòng xuất trình <strong>CCCD gắn chip</strong> hoặc <strong>Hộ chiếu chính chủ</strong>. Bạn có thể chọn giữ CCCD + cọc một phần hoặc chuyển khoản 100% tiền cọc.
                  </li>
                  <li>
                    <strong>Thanh toán tại quầy:</strong> Toàn bộ tiền thuê và tiền đặt cọc được thanh toán trực tiếp tại cửa hàng khi bạn nhận máy. Không có phí ẩn phát sinh.
                  </li>
                </ul>
              </div>

              <div className="form-checkbox-row">
                <input
                  id="agree-policy-checkbox"
                  type="checkbox"
                  checked={agreePolicy}
                  onChange={(e) => setAgreePolicy(e.target.checked)}
                />
                <label htmlFor="agree-policy-checkbox">
                  Tôi đã đọc, hiểu rõ và đồng ý với{" "}
                  <Link to="/rental-policy" target="_blank" rel="noreferrer">
                    Chính sách thuê
                  </Link>{" "}
                  và quy định nhận máy tại quầy của Borroll.
                </label>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY & SUBMIT CTA */}
          <aside className="checkout-summary-col" aria-label="Tóm tắt đơn hàng">
            <div className="cart-summary-card">
              <h3>Tóm tắt đơn đặt thuê</h3>

              {/* Items overview */}
              <div className="checkout-items-preview">
                <span className="preview-label">Thiết bị thuê ({items.length}):</span>
                <ul className="checkout-items-list">
                  {items.map((item) => (
                    <li key={item.modelId}>
                      <span className="checkout-item-title">{item.name}</span>
                      {item.pricePerDay ? (
                        <span className="checkout-item-rate">
                          {item.pricePerDay.toLocaleString("vi-VN")} ₫/ngày
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {addons.length > 0 && (
                  <>
                    <span className="preview-label mt-2">Phim mua kèm ({addons.length}):</span>
                    <ul className="checkout-items-list">
                      {addons.map((a) => (
                        <li key={a.filmProductId}>
                          <span>Film phụ kiện</span>
                          <span>Số lượng: {a.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="summary-divider" />

              <div className="summary-date-info">
                <span className="summary-date-label">Lịch trình thuê:</span>
                <strong>
                  {startDate} → {endDate}
                </strong>
                {quote?.days ? (
                  <span className="summary-duration-tag">
                    ({quote.days} ngày thuê)
                  </span>
                ) : null}
              </div>

              <div className="summary-divider" />

              {/* Pricing Breakdown */}
              {isQuoteLoading && (
                <div className="quote-status-bar loading">
                  ⏳ Đang xác minh báo giá với máy chủ...
                </div>
              )}

              {quoteError && (
                <div className="quote-status-bar error" role="alert">
                  ⚠️ {quoteError}
                </div>
              )}

              {submitError && (
                <div className="form-alert error" role="alert">
                  ⚠️ {submitError}
                </div>
              )}

              <div className="summary-pricing-list">
                <div className="summary-price-line">
                  <span>Tiền thuê thiết bị:</span>
                  <strong>
                    {quote
                      ? `${quote.rentalAmount.toLocaleString("vi-VN")} ₫`
                      : "—"}
                  </strong>
                </div>

                {quote && quote.addonsAmount > 0 ? (
                  <div className="summary-price-line">
                    <span>Phim mua kèm:</span>
                    <strong>
                      +{quote.addonsAmount.toLocaleString("vi-VN")} ₫
                    </strong>
                  </div>
                ) : null}

                <div className="summary-price-line deposit-line">
                  <span>
                    Tiền đặt cọc
                    <small className="deposit-note">(Hoàn trả khi trả máy)</small>:
                  </span>
                  <strong>
                    {quote
                      ? `${quote.depositAmount.toLocaleString("vi-VN")} ₫`
                      : "—"}
                  </strong>
                </div>

                <div className="summary-divider" />

                <div className="summary-total-due">
                  <div>
                    <span className="total-label">Tổng thanh toán tại quầy:</span>
                    <small className="total-sub">(Bao gồm tiền thuê + cọc)</small>
                  </div>
                  <strong className="total-amount">
                    {quote
                      ? `${quote.totalDueAtPickup.toLocaleString("vi-VN")} ₫`
                      : "—"}
                  </strong>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="checkout-cta-box">
                <button
                  type="submit"
                  form="checkout-form"
                  className="button primary-button full-width large-cta"
                  disabled={
                    submitting ||
                    isQuoteLoading ||
                    !quote ||
                    quote.available === false
                  }
                >
                  {submitting ? "Đang gửi yêu cầu đặt thuê..." : "Xác nhận gửi yêu cầu đặt thuê"}
                </button>

                <Link
                  to="/cart"
                  className="button secondary-button full-width mt-2"
                >
                  ← Quay lại Giỏ thuê chỉnh sửa
                </Link>
              </div>

              <p className="checkout-reassurance-note">
                🔒 Đơn đặt thuê sẽ được bảo lưu trong 24 giờ. Bạn chỉ thanh toán khi đã kiểm tra và hài lòng với thiết bị tại cửa hàng.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default CheckoutPage;
