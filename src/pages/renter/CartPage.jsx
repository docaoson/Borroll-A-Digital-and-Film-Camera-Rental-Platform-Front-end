import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DateInput from "../../components/shared/DateInput";
import { useRentalSelection } from "../../hooks/useRentalSelection";
import { ApiError } from "../../lib/apiClient";
import { bookingService } from "../../services/bookingService";
import { catalogService } from "../../services/catalogService";

function getTodayVietnamIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
}

function parseIsoUtcMs(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null;
  }
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function CartPage() {
  const {
    branchSlug,
    startDate,
    endDate,
    items,
    addons,
    setBranchSlug,
    setStartDate,
    setEndDate,
    removeItem,
    setAddonQuantity,
    clearSelection,
  } = useRentalSelection();

  const [branches, setBranches] = useState([]);
  const [filmProducts, setFilmProducts] = useState([]);
  const [quoteState, setQuoteState] = useState({
    key: null,
    data: null,
    error: "",
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      catalogService.getBranches(),
      catalogService.getFilmProducts(),
    ])
      .then(([branchRes, filmRes]) => {
        if (!active) return;
        setBranches(branchRes.items || []);
        setFilmProducts(filmRes.items || []);
      })
      .catch(() => {
        if (!active) return;
        setBranches([]);
        setFilmProducts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const todayString = getTodayVietnamIso();
  const startMs = parseIsoUtcMs(startDate);
  const endMs = parseIsoUtcMs(endDate);
  const isRangeInvalid =
    startMs !== null && endMs !== null && endMs <= startMs;

  const canQuote = Boolean(
    items.length > 0 &&
      branchSlug &&
      startMs !== null &&
      endMs !== null &&
      endMs > startMs,
  );
  const quoteKey = canQuote
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
        if (active) {
          setQuoteState({ key: quoteKey, data, error: "" });
        }
      })
      .catch((error) => {
        if (active) {
          const msg =
            error instanceof ApiError
              ? error.message
              : "Không thể lấy báo giá từ máy chủ lúc này.";
          setQuoteState({ key: quoteKey, data: null, error: msg });
        }
      });

    return () => {
      active = false;
    };
  }, [quoteKey, branchSlug, startDate, endDate, items, addons]);

  const isLoading = Boolean(quoteKey && quoteState.key !== quoteKey);
  const quote = quoteKey && quoteState.key === quoteKey ? quoteState.data : null;
  const quoteError =
    quoteKey && quoteState.key === quoteKey ? quoteState.error : "";

  const getAddonQty = (filmId) =>
    addons.find((a) => a.filmProductId === filmId)?.quantity || 0;

  return (
    <section className="profile-card">
      <div className="profile-header">
        <div>
          <p className="eyebrow">CHỌN MÓN THUÊ</p>
          <h1>Giỏ thuê</h1>
          <p className="profile-email">
            Danh sách thiết bị và film bán kèm bạn đang chọn trên trình duyệt.
            Chi phí được tính qua <code>POST /bookings/quote</code>.
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            className="button secondary-button"
            onClick={clearSelection}
          >
            Xóa danh sách
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h2>Chưa có thiết bị nào được chọn</h2>
          <p>
            Hãy chọn máy ảnh từ danh sách thiết bị để xem báo giá và đặt thuê tại
            chi nhánh.
          </p>
          <Link to="/cameras" className="button primary-button">
            Khám phá thiết bị
          </Link>
        </div>
      ) : (
        <div className="selection-layout">
          <div className="selection-items">
            <h2>Thiết bị đã chọn ({items.length})</h2>
            <ul className="info-list">
              {items.map((item) => (
                <li key={item.modelId}>
                  <div>
                    <strong>{item.name}</strong>
                    <span className="selection-kind"> · {item.kind}</span>
                  </div>
                  <button
                    type="button"
                    className="account-link account-logout-btn"
                    onClick={() => removeItem(item.modelId)}
                  >
                    Bỏ chọn
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {filmProducts.length > 0 && (
            <div className="selection-items">
              <h2>Film bán kèm (tùy chọn)</h2>
              <ul className="info-list">
                {filmProducts.map((film) => {
                  const qty = getAddonQty(film.id);
                  return (
                    <li key={film.id}>
                      <div>
                        <strong>{film.name}</strong>
                        <span className="selection-kind">
                          {" "}
                          · ISO {film.iso} ·{" "}
                          {film.price.toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                      <div className="addon-qty-controls">
                        <button
                          type="button"
                          className="account-link account-logout-btn"
                          onClick={() => setAddonQuantity(film.id, qty - 1)}
                          disabled={qty <= 0}
                        >
                          −
                        </button>
                        <span>{qty}</span>
                        <button
                          type="button"
                          className="account-link account-logout-btn"
                          onClick={() => setAddonQuantity(film.id, qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="form-field branch-field">
            <label htmlFor="cart-branch">Chi nhánh nhận và trả máy</label>
            <select
              id="cart-branch"
              value={branchSlug}
              onChange={(event) => setBranchSlug(event.target.value)}
            >
              {branches.map((branch) => (
                <option key={branch.slug} value={branch.slug}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="date-row">
            <div>
              <label htmlFor="cart-start-date">Ngày nhận</label>
              <DateInput
                id="cart-start-date"
                label="Ngày nhận"
                min={todayString}
                value={startDate}
                onChange={(nextDate) => setStartDate(nextDate)}
              />
            </div>

            <div>
              <label htmlFor="cart-end-date">Ngày trả</label>
              <DateInput
                id="cart-end-date"
                label="Ngày trả"
                min={startDate || todayString}
                value={endDate}
                onChange={(nextDate) => setEndDate(nextDate)}
              />
            </div>
          </div>

          {isRangeInvalid && (
            <div className="form-alert error" role="alert">
              Ngày trả máy phải sau ngày nhận máy ít nhất 1 ngày.
            </div>
          )}

          {quoteError && (
            <div className="form-alert error" role="alert">
              {quoteError}
            </div>
          )}

          {quote && quote.available === false && (
            <div className="form-alert error" role="alert">
              Một hoặc nhiều thiết bị đã hết máy trong khoảng ngày này.
            </div>
          )}

          <div className="summary-box">
            <div>
              <span>Số ngày thuê</span>
              <strong>
                {isLoading
                  ? "Đang tính..."
                  : quote
                    ? `${quote.days} ngày`
                    : "Chưa chọn đủ ngày"}
              </strong>
            </div>
            <div>
              <span>Tiền thuê + film</span>
              <strong>
                {isLoading
                  ? "Đang tính..."
                  : quote
                    ? `${(quote.rentalAmount + quote.addonsAmount).toLocaleString("vi-VN")} đ`
                    : "—"}
              </strong>
            </div>
            <div>
              <span>Cọc (hoàn lại khi trả)</span>
              <strong>
                {isLoading
                  ? "Đang tính..."
                  : quote
                    ? `${quote.depositAmount.toLocaleString("vi-VN")} đ`
                    : "—"}
              </strong>
            </div>
            <div>
              <span>Tổng thanh toán tại cửa hàng</span>
              <strong>
                {isLoading
                  ? "Đang tính..."
                  : quote
                    ? `${quote.totalDueAtPickup.toLocaleString("vi-VN")} đ`
                    : "—"}
              </strong>
            </div>
          </div>

          <Link to="/checkout" className="button primary-button full-width">
            Tiếp tục xác nhận đặt thuê
          </Link>
        </div>
      )}
    </section>
  );
}

export default CartPage;
