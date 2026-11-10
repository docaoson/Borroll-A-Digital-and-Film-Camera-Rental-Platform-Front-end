import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useRentalSelection } from "../../hooks/useRentalSelection";
import { ApiError } from "../../lib/apiClient";
import { bookingService } from "../../services/bookingService";

function CheckoutPage() {
  const { user } = useAuth();
  const { branchSlug, startDate, endDate, items, addons, clearSelection } =
    useRentalSelection();

  const [contactNameDraft, setContactNameDraft] = useState(null);
  const [contactPhoneDraft, setContactPhoneDraft] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdBooking, setCreatedBooking] = useState(null);
  const [quoteState, setQuoteState] = useState({
    key: null,
    data: null,
    error: "",
  });

  const contactName = contactNameDraft ?? user?.fullName ?? "";
  const contactPhone = contactPhoneDraft ?? user?.phone ?? "";

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
                : "Không thể lấy báo giá.",
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

  const handleConfirmBooking = async (event) => {
    event.preventDefault();
    setSubmitError("");

    if (!contactName.trim() || !/^0\d{9}$/.test(contactPhone.trim())) {
      setSubmitError(
        "Vui lòng nhập họ tên và số điện thoại hợp lệ (10 chữ số bắt đầu bằng 0).",
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
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "Không thể tạo đơn thuê lúc này.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (createdBooking) {
    return (
      <section className="profile-card">
        <p className="eyebrow">ĐẶT THUÊ THÀNH CÔNG</p>
        <h1>Mã đơn: {createdBooking.code}</h1>
        <p className="profile-email">
          Đơn của bạn đang ở trạng thái chờ shop xác nhận. Bạn thanh toán tại
          cửa hàng khi nhận máy.
        </p>
        <div className="summary-box">
          <div>
            <span>Chi nhánh</span>
            <strong>{createdBooking.branch?.name}</strong>
          </div>
          <div>
            <span>Thời gian</span>
            <strong>
              {createdBooking.startDate} → {createdBooking.endDate} (
              {createdBooking.days} ngày)
            </strong>
          </div>
          <div>
            <span>Tiền cọc (hoàn lại khi trả)</span>
            <strong>
              {createdBooking.depositAmount.toLocaleString("vi-VN")} đ
            </strong>
          </div>
          <div>
            <span>Tổng thanh toán khi nhận</span>
            <strong>
              {createdBooking.totalDueAtPickup.toLocaleString("vi-VN")} đ
            </strong>
          </div>
        </div>
        <Link to="/cameras" className="button primary-button">
          Tiếp tục xem thiết bị
        </Link>
      </section>
    );
  }

  return (
    <section className="profile-card">
      <div className="profile-header">
        <div>
          <p className="eyebrow">XÁC NHẬN ĐẶT THUÊ</p>
          <h1>Xác nhận đơn thuê</h1>
          <p className="profile-email">
            Bạn thanh toán tại cửa hàng khi nhận máy. Nhận và trả máy tại cùng
            chi nhánh đã chọn.
          </p>
        </div>
      </div>

      {items.length === 0 || !startDate || !endDate ? (
        <div className="empty-state">
          <h2>Chưa đủ thông tin để xác nhận đơn</h2>
          <p>
            Vui lòng chọn thiết bị, chi nhánh và khoảng ngày nhận/trả trước khi
            gửi yêu cầu đặt thuê.
          </p>
          <Link to="/cart" className="button primary-button">
            Quay lại giỏ thuê
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleConfirmBooking} noValidate>
          {quoteError && (
            <div className="form-alert error" role="alert">
              {quoteError}
            </div>
          )}
          {submitError && (
            <div className="form-alert error" role="alert">
              {submitError}
            </div>
          )}

          {quote && (
            <div className="summary-box">
              <div>
                <span>Thời gian thuê</span>
                <strong>{quote.days} ngày</strong>
              </div>
              <div>
                <span>Tiền thuê + film</span>
                <strong>
                  {(quote.rentalAmount + quote.addonsAmount).toLocaleString(
                    "vi-VN",
                  )}{" "}
                  đ
                </strong>
              </div>
              <div>
                <span>Cọc (hoàn lại khi trả nếu không hỏng)</span>
                <strong>{quote.depositAmount.toLocaleString("vi-VN")} đ</strong>
              </div>
              <div>
                <span>Tổng cần thanh toán khi nhận máy</span>
                <strong>
                  {quote.totalDueAtPickup.toLocaleString("vi-VN")} đ
                </strong>
              </div>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="checkout-name">Tên người nhận máy</label>
            <input
              id="checkout-name"
              type="text"
              value={contactName}
              onChange={(e) => setContactNameDraft(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="checkout-phone">Số điện thoại liên hệ</label>
            <input
              id="checkout-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhoneDraft(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="checkout-note">Ghi chú cho cửa hàng (tùy chọn)</label>
            <input
              id="checkout-note"
              type="text"
              placeholder="Ví dụ: Mình đến nhận máy lúc 9h"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="button primary-button full-width"
            disabled={submitting || !quote || quote.available === false}
          >
            {submitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu đặt thuê"}
          </button>
        </form>
      )}
    </section>
  );
}

export default CheckoutPage;
