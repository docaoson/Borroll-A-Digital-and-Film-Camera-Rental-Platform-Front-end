import { useEffect, useMemo, useState } from "react";
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

  // Quote State
  const [quoteState, setQuoteState] = useState({
    key: null,
    data: null,
    error: "",
  });

  const todayString = getTodayVietnamIso();

  // Load branches and film addons
  useEffect(() => {
    let active = true;
    Promise.all([
      catalogService.getBranches(),
      catalogService.getFilmProducts(),
    ])
      .then(([branchRes, filmRes]) => {
        if (!active) return;
        const branchList = branchRes.items || [];
        setBranches(branchList);
        setFilmProducts(filmRes.items || []);
        if (branchList.length > 0 && !branchSlug) {
          setBranchSlug(branchList[0].slug);
        }
      })
      .catch(() => {
        if (!active) return;
        setBranches([]);
        setFilmProducts([]);
      });

    return () => {
      active = false;
    };
  }, [branchSlug, setBranchSlug]);

  const startMs = parseIsoUtcMs(startDate);
  const endMs = parseIsoUtcMs(endDate);
  const isStartInPast = startDate && startDate < todayString;
  const isRangeInvalid =
    startMs !== null && endMs !== null && endMs <= startMs;

  const canQuote = Boolean(
    items.length > 0 &&
      branchSlug &&
      startDate &&
      endDate &&
      !isStartInPast &&
      !isRangeInvalid,
  );

  const quoteKey = canQuote
    ? JSON.stringify({
        branchSlug,
        startDate,
        endDate,
        items: items.map((i) => ({ modelId: i.modelId })),
        addons,
      })
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

  const isQuoteLoading = Boolean(quoteKey && quoteState.key !== quoteKey);
  const quote = quoteKey && quoteState.key === quoteKey ? quoteState.data : null;
  const quoteError =
    quoteKey && quoteState.key === quoteKey ? quoteState.error : "";

  const unavailableModelIdsSet = useMemo(() => {
    if (!quote || quote.available !== false || !Array.isArray(quote.unavailableModelIds)) {
      return new Set();
    }
    return new Set(quote.unavailableModelIds);
  }, [quote]);

  const getAddonQty = (filmId) =>
    addons.find((a) => a.filmProductId === filmId)?.quantity || 0;

  const currentBranch = branches.find((b) => b.slug === branchSlug);

  return (
    <div className="cart-page-wrapper cart-shell container">
      <header className="cart-page-header">
        <div>
          <p className="eyebrow">GIỎ THUÊ THIẾT BỊ</p>
          <h1>Danh sách thiết bị chọn thuê</h1>
          <p className="cart-header-desc">
            Xem lại thiết bị, chọn mua thêm film chụp và kiểm tra báo giá theo thời gian thực trước khi gửi yêu cầu.
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            className="button secondary-button small-button clear-cart-btn"
            onClick={clearSelection}
            title="Xóa toàn bộ thiết bị và film trong giỏ"
          >
            🗑️ Xóa giỏ thuê
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="empty-state cart-empty-state">
          <div className="empty-state-icon" aria-hidden="true">📷</div>
          <h2>Giỏ thuê của bạn đang trống</h2>
          <p>
            Bạn chưa chọn thiết bị nào. Hãy khám phá bộ sưu tập máy ảnh digital và film phong phú tại Borroll để bắt đầu.
          </p>
          <Link to="/cameras" className="button primary-button">
            Khám phá bộ sưu tập thiết bị →
          </Link>
        </div>
      ) : (
        <div className="cart-two-column-layout">
          {/* LEFT COLUMN: ITEMS, FILM ADDONS & BOOKING SETTINGS */}
          <div className="cart-main-col">
            {/* 1. EQUIPMENT LIST */}
            <section className="cart-section-box" aria-label="Danh sách thiết bị đã chọn">
              <div className="section-box-header">
                <h2>Thiết bị đã chọn ({items.length})</h2>
                <Link to="/cameras" className="cart-add-more-link">
                  + Thêm thiết bị khác
                </Link>
              </div>

              <div className="cart-items-list">
                {items.map((item) => {
                  const quoteLine = quote?.lines?.find(
                    (l) => l.modelId === item.modelId,
                  );
                  const isItemUnavailable = unavailableModelIdsSet.has(item.modelId);
                  const displayRate = item.pricePerDay || quoteLine?.pricePerDay;
                  const displayDeposit = item.deposit || quoteLine?.depositAmount;

                  return (
                    <article
                      key={item.modelId}
                      className={`cart-item-card ${isItemUnavailable ? "item-unavailable" : ""}`}
                    >
                      <div className="cart-item-thumbnail">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="cart-thumb-img"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fb = e.currentTarget.parentElement?.querySelector(
                                ".cart-thumb-fallback",
                              );
                              if (fb) fb.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div
                          className={`cart-thumb-fallback ${
                            item.thumbnailUrl ? "hidden" : ""
                          }`}
                        >
                          <span aria-hidden="true">📷</span>
                        </div>
                      </div>

                      <div className="cart-item-info">
                        <div className="cart-item-meta-row">
                          <span className="cart-item-brand">
                            {item.brandName || "Thiết bị"}
                          </span>
                          {item.categoryName && (
                            <span className="cart-item-cat">
                              · {item.categoryName}
                            </span>
                          )}
                          {item.mount && (
                            <span className="cart-item-mount">
                              · Ngàm {item.mount}
                            </span>
                          )}
                        </div>

                        <h3 className="cart-item-name">
                          {item.slug ? (
                            <Link to={`/cameras/${item.slug}`}>{item.name}</Link>
                          ) : (
                            item.name
                          )}
                        </h3>

                        {isItemUnavailable && (
                          <div className="item-unavailable-banner" role="alert">
                            ⚠️ Hết máy trong khoảng ngày này tại chi nhánh đã chọn
                          </div>
                        )}

                        <div className="cart-item-pricing-row">
                          {displayRate ? (
                            <span className="cart-rate">
                              Giá thuê: <strong>{displayRate.toLocaleString("vi-VN")} ₫</strong>/ngày
                            </span>
                          ) : null}
                          {displayDeposit ? (
                            <span className="cart-deposit">
                              Cọc: <strong>{displayDeposit.toLocaleString("vi-VN")} ₫</strong>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="cart-item-actions">
                        {quoteLine?.rentalAmount ? (
                          <div className="cart-line-total">
                            <span className="line-label">Tạm tính:</span>
                            <strong className="line-amount">
                              {quoteLine.rentalAmount.toLocaleString("vi-VN")} ₫
                            </strong>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          className="button-link-danger remove-item-btn"
                          onClick={() => removeItem(item.modelId)}
                          aria-label={`Bỏ chọn ${item.name}`}
                          title="Bỏ thiết bị này khỏi giỏ"
                        >
                          ✕ Bỏ chọn
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* 2. FILM PRODUCTS & ACCESSORIES */}
            {filmProducts.length > 0 && (
              <section className="cart-section-box" aria-label="Phim chụp bán kèm">
                <div className="section-box-header">
                  <div>
                    <h2>Film chụp bán kèm (Tùy chọn)</h2>
                    <p className="section-box-subtitle">
                      Mua kèm film chính hãng để sẵn sàng bấm máy ngay khi nhận thiết bị.
                    </p>
                  </div>
                </div>

                <div className="cart-addons-grid">
                  {filmProducts.map((film) => {
                    const qty = getAddonQty(film.id);
                    return (
                      <div
                        key={film.id}
                        className={`addon-product-card ${qty > 0 ? "addon-selected" : ""}`}
                      >
                        <div className="addon-media-box">
                          {film.imageUrl ? (
                            <img
                              src={film.imageUrl}
                              alt={film.name}
                              className="addon-thumb"
                              loading="lazy"
                            />
                          ) : (
                            <div className="addon-fallback-icon" aria-hidden="true">
                              🎞️
                            </div>
                          )}
                        </div>

                        <div className="addon-details">
                          <h4 className="addon-name">{film.name}</h4>
                          <p className="addon-specs">
                            Khổ {film.format} · ISO {film.iso}
                          </p>
                          <p className="addon-price">
                            {film.price.toLocaleString("vi-VN")} ₫
                            <small>/cuộn</small>
                          </p>
                        </div>

                        <div className="addon-qty-block">
                          <button
                            type="button"
                            className="qty-btn dec-btn"
                            onClick={() => setAddonQuantity(film.id, qty - 1)}
                            disabled={qty <= 0}
                            aria-label={`Giảm số lượng ${film.name}`}
                          >
                            −
                          </button>
                          <span className="qty-value" aria-live="polite">
                            {qty}
                          </span>
                          <button
                            type="button"
                            className="qty-btn inc-btn"
                            onClick={() => setAddonQuantity(film.id, qty + 1)}
                            disabled={!film.inStock}
                            aria-label={`Tăng số lượng ${film.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 3. BRANCH & RENTAL SCHEDULE SETTINGS */}
            <section className="cart-section-box" aria-label="Lịch trình và chi nhánh thuê">
              <div className="section-box-header">
                <div>
                  <h2>Địa điểm & Thời gian nhận trả máy</h2>
                  <p className="section-box-subtitle">
                    Nhận và hoàn trả máy trực tiếp tại cùng một chi nhánh theo quy định Borroll.
                  </p>
                </div>
              </div>

              <div className="cart-settings-form">
                <div className="form-field">
                  <label htmlFor="cart-branch-select">
                    Chi nhánh nhận & trả máy
                  </label>
                  <select
                    id="cart-branch-select"
                    value={branchSlug}
                    onChange={(event) => setBranchSlug(event.target.value)}
                  >
                    {branches.map((b) => (
                      <option key={b.slug} value={b.slug}>
                        Chi nhánh {b.name} ({b.address})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cart-date-inputs-row">
                  <DateInput
                    id="cart-start-date"
                    label="Ngày nhận máy"
                    value={startDate}
                    onChange={(nextDate) => setStartDate(nextDate)}
                    minDate={todayString}
                  />

                  <DateInput
                    id="cart-end-date"
                    label="Ngày trả máy"
                    value={endDate}
                    onChange={(nextDate) => setEndDate(nextDate)}
                    minDate={startDate || todayString}
                  />
                </div>
              </div>

              {isStartInPast && (
                <div className="form-alert error" role="alert">
                  ⚠️ Ngày nhận máy không được ở trong quá khứ.
                </div>
              )}

              {isRangeInvalid && (
                <div className="form-alert error" role="alert">
                  ⚠️ Ngày trả máy phải sau ngày nhận máy ít nhất 1 ngày.
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: STICKY QUOTATION SUMMARY */}
          <aside className="cart-summary-col" aria-label="Tóm tắt đơn thuê">
            <div className="cart-summary-card">
              <h3>Tóm tắt chi phí dự tính</h3>

              {currentBranch && (
                <div className="summary-branch-badge">
                  <span className="branch-icon" aria-hidden="true">🏢</span>
                  <div>
                    <strong>Chi nhánh {currentBranch.name}</strong>
                    <p>{currentBranch.address}</p>
                  </div>
                </div>
              )}

              <div className="summary-date-info">
                <span className="summary-date-label">Thời gian thuê:</span>
                <strong>
                  {startDate && endDate && !isRangeInvalid
                    ? `${startDate} → ${endDate}`
                    : "Chưa chọn đủ ngày nhận/trả"}
                </strong>
                {quote?.days ? (
                  <span className="summary-duration-tag">
                    ({quote.days} ngày thuê)
                  </span>
                ) : null}
              </div>

              <div className="summary-divider" />

              {/* Status and warnings */}
              {isQuoteLoading && (
                <div className="quote-status-bar loading" aria-live="polite">
                  ⏳ Đang tính toán lại báo giá...
                </div>
              )}

              {quoteError && (
                <div className="quote-status-bar error" role="alert">
                  ⚠️ {quoteError}
                </div>
              )}

              {quote && quote.available === false && (
                <div className="quote-status-bar warning" role="alert">
                  ⚠️ Một hoặc nhiều máy đã hết trong khoảng ngày này tại chi nhánh đã chọn. Vui lòng đổi ngày hoặc đổi chi nhánh.
                </div>
              )}

              {/* Line items pricing */}
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
                    <span>Phim chụp mua kèm:</span>
                    <strong>
                      +{quote.addonsAmount.toLocaleString("vi-VN")} ₫
                    </strong>
                  </div>
                ) : null}

                <div className="summary-price-line deposit-line">
                  <span>
                    Tiền đặt cọc thiết bị
                    <small className="deposit-note">(Hoàn trả 100% khi trả máy)</small>:
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
                    <span className="total-label">Tổng thanh toán tại cửa hàng:</span>
                    <small className="total-sub">
                      (Đã bao gồm tiền thuê + tiền cọc)
                    </small>
                  </div>
                  <strong className="total-amount">
                    {quote
                      ? `${quote.totalDueAtPickup.toLocaleString("vi-VN")} ₫`
                      : "—"}
                  </strong>
                </div>
              </div>

              {/* TRUST BADGES & POLICIES */}
              <div className="summary-policy-box">
                <p>
                  <span>✓</span> Nhận và kiểm tra máy trực tiếp tại cửa hàng
                </p>
                <p>
                  <span>✓</span> Hoàn lại 100% tiền đặt cọc ngay sau khi bàn giao trả máy
                </p>
                <p>
                  <span>✓</span> Hỗ trợ giữ máy trước trong vòng 24 giờ
                </p>
              </div>

              {/* CHECKOUT ACTION CTA */}
              <div className="cart-checkout-actions">
                <Link
                  to="/checkout"
                  className={`button primary-button full-width large-cta ${
                    !canQuote || isQuoteLoading || !quote || quote.available === false
                      ? "disabled-link"
                      : ""
                  }`}
                  aria-disabled={
                    !canQuote || isQuoteLoading || !quote || quote.available === false
                  }
                  onClick={(e) => {
                    if (
                      !canQuote ||
                      isQuoteLoading ||
                      !quote ||
                      quote.available === false
                    ) {
                      e.preventDefault();
                    }
                  }}
                >
                  Tiếp tục xác nhận đặt thuê →
                </Link>

                <Link
                  to="/cameras"
                  className="button secondary-button full-width continue-shopping-btn"
                >
                  ← Tiếp tục xem thêm thiết bị
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default CartPage;
