import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import StatusBadge from "../../components/shared/StatusBadge";
import PaymentPanel from "../../components/shared/PaymentPanel";
import { ApiError } from "../../lib/apiClient";
import { bookingService } from "../../services/bookingService";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80";

const CANCELLATION_REASONS = [
  "Thay đổi lịch trình / chuyến đi",
  "Muốn đổi sang dòng máy ảnh hoặc ống kính khác",
  "Thời gian thuê không còn phù hợp",
  "Đã tìm được thiết bị thay thế",
  "Lý do cá nhân khác",
];

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const str = String(dateValue);
  const date = new Date(str.includes("T") ? str : `${str}T00:00:00`);
  if (Number.isNaN(date.getTime())) return str;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("vi-VN")} đ`;
}

function OrderDetailPage() {
  const { id } = useParams();
  const [loadedId, setLoadedId] = useState(null);
  const loading = loadedId !== id;

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");

  // Inspection photo preview lightbox state
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    if (!id) return;

    let active = true;

    bookingService
      .getBookingDetail(id)
      .then((data) => {
        if (!active) return;
        setBooking(data);
        setError("");
        setErrorStatus(null);
        setLoadedId(id);
      })
      .catch((err) => {
        if (!active) return;
        setBooking(null);
        if (err instanceof ApiError) {
          setErrorStatus(err.status);
          if (err.status === 403) {
            setError("Bạn không có quyền truy cập đơn thuê này do không phải chủ sở hữu đơn.");
          } else if (err.status === 404) {
            setError("Không tìm thấy đơn thuê bạn yêu cầu hoặc đơn đã bị xóa.");
          } else {
            setError(err.message || "Không thể tải chi tiết đơn thuê lúc này.");
          }
        } else {
          setError("Không thể tải chi tiết đơn thuê lúc này.");
        }
        setLoadedId(id);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleOpenCancelModal = () => {
    setSelectedReason(CANCELLATION_REASONS[0]);
    setCustomReason("");
    setCancelError("");
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    if (canceling) return;
    setShowCancelModal(false);
    setCancelError("");
  };

  const handleConfirmCancel = async () => {
    if (!booking) return;

    const finalReason =
      selectedReason === "Lý do cá nhân khác" && customReason.trim()
        ? customReason.trim()
        : selectedReason;

    setCanceling(true);
    setCancelError("");

    try {
      const updatedBooking = await bookingService.cancelBooking(booking.id, finalReason);
      setBooking((current) => ({
        ...(current || {}),
        ...updatedBooking,
        status: updatedBooking?.status || "CANCELLED",
        cancelledReason: updatedBooking?.cancelledReason || finalReason,
        allowedActions: Array.isArray(updatedBooking?.allowedActions)
          ? updatedBooking.allowedActions
          : [],
      }));
      setShowCancelModal(false);
      setCancelSuccessMsg("Đơn thuê đã được hủy thành công theo yêu cầu của bạn.");
    } catch (err) {
      setCancelError(
        err instanceof ApiError
          ? err.message
          : "Không thể hủy đơn thuê lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setCanceling(false);
    }
  };

  // Determine timeline steps based on real order state
  const timelineSteps = useMemo(() => {
    if (!booking) return [];

    const isCancelled = booking.status === "CANCELLED";
    const isRejected = booking.status === "REJECTED";

    if (isCancelled || isRejected) {
      return [
        {
          key: "CREATED",
          title: "1. Đặt thuê thành công",
          time: booking.createdAt ? formatDateTime(booking.createdAt) : null,
          note: "Đơn thuê đã được gửi đến hệ thống Borroll",
          status: "completed",
        },
        {
          key: isCancelled ? "CANCELLED" : "REJECTED",
          title: isCancelled ? "2. Đơn thuê đã hủy" : "2. Đơn thuê bị từ chối",
          time: null,
          note: isCancelled
            ? (booking.cancelledReason || "Đã hủy theo yêu cầu")
            : (booking.rejectedReason || "Chi nhánh từ chối đơn thuê"),
          status: "danger",
        },
      ];
    }

    // Normal progression: PENDING -> CONFIRMED -> PICKED_UP -> COMPLETED
    const statusOrder = ["PENDING", "CONFIRMED", "PICKED_UP", "COMPLETED"];
    const currentIndex = statusOrder.indexOf(booking.status);

    const getStepState = (targetIndex) => {
      if (currentIndex > targetIndex) return "completed";
      if (currentIndex === targetIndex) return "current";
      return "upcoming";
    };

    return [
      {
        key: "PENDING",
        title: "1. Tạo yêu cầu đặt thuê",
        time: booking.createdAt ? formatDateTime(booking.createdAt) : null,
        note: "Đơn thuê đã được ghi nhận trên hệ thống",
        status: getStepState(0),
      },
      {
        key: "CONFIRMED",
        title: "2. Chi nhánh xác nhận",
        time: booking.confirmedAt ? formatDateTime(booking.confirmedAt) : null,
        note: booking.confirmedAt
          ? "Đã kiểm tra thiết bị và giữ chỗ sẵn sàng"
          : "Đang chờ nhân viên quầy kiểm tra và xác nhận",
        status: getStepState(1),
      },
      {
        key: "PICKED_UP",
        title: "3. Nhận máy tại chi nhánh",
        time: booking.pickedUpAt ? formatDateTime(booking.pickedUpAt) : null,
        note: booking.pickedUpAt
          ? "Đã bàn giao thiết bị và ký biên bản nhận máy"
          : `Khách nhận máy ngày ${formatDate(booking.startDate)} tại chi nhánh`,
        status: getStepState(2),
      },
      {
        key: "COMPLETED",
        title: "4. Trả máy & Hoàn tất",
        time: booking.completedAt
          ? formatDateTime(booking.completedAt)
          : booking.returnedAt
          ? formatDateTime(booking.returnedAt)
          : null,
        note: booking.completedAt || booking.returnedAt
          ? "Đã hoàn trả thiết bị, kiểm tra tình trạng và hoàn cọc"
          : `Hạn trả máy: ${formatDate(booking.endDate)}`,
        status: getStepState(3),
      },
    ];
  }, [booking]);

  if (loading) {
    return (
      <section className="order-detail-page">
        <div className="order-detail-shell">
          <div className="order-detail-skeleton">
            <div className="skeleton-line skeleton-header" />
            <div className="order-detail-layout">
              <div className="skeleton-line skeleton-body" style={{ minHeight: "360px" }} />
              <div className="skeleton-line skeleton-body" style={{ minHeight: "360px" }} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !booking) {
    return (
      <section className="order-detail-page">
        <div className="order-detail-shell">
          <div className="order-breadcrumb" aria-label="Đường dẫn điều hướng">
            <Link to="/">Trang chủ</Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/orders">Đơn thuê của tôi</Link>
          </div>

          <div className="empty-state orders-error-state">
            <span className="empty-state-icon" aria-hidden="true">
              {errorStatus === 403 ? "🔒" : "⚠️"}
            </span>
            <h2>{errorStatus === 403 ? "Từ chối truy cập (403)" : "Không thể hiển thị đơn thuê"}</h2>
            <p>{error || "Không tìm thấy dữ liệu đơn thuê bạn yêu cầu."}</p>
            <div className="empty-state-actions">
              <Link to="/orders" className="button primary-button">
                ← Quay lại danh sách đơn thuê
              </Link>
              <Link to="/cameras" className="button secondary-button">
                Khám phá thiết bị
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const canCancel =
    Array.isArray(booking.allowedActions) && booking.allowedActions.includes("cancel");

  return (
    <section className="order-detail-page">
      <div className="order-detail-shell">
        {/* Breadcrumb Navigation */}
        <div className="order-breadcrumb" aria-label="Đường dẫn điều hướng">
          <Link to="/">Trang chủ</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/orders">Đơn thuê của tôi</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{booking.code}</span>
        </div>

        {/* Success Alert Banner if just cancelled */}
        {cancelSuccessMsg && (
          <div className="order-alert-banner success" role="alert">
            <span>✓ {cancelSuccessMsg}</span>
            <button
              type="button"
              className="order-alert-close"
              onClick={() => setCancelSuccessMsg("")}
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        )}

        {/* Cancellation Notice Banner if order is cancelled */}
        {booking.status === "CANCELLED" && (
          <div className="order-alert-banner danger" role="alert">
            <div className="order-alert-content">
              <strong>Đơn thuê đã được hủy</strong>
              <p>
                Lý do: {booking.cancelledReason || "Khách hàng hủy đơn"}
                {booking.statusLogs?.length > 0 &&
                  ` (${formatDateTime(booking.statusLogs[booking.statusLogs.length - 1]?.createdAt)})`}
              </p>
            </div>
          </div>
        )}

        {/* Rejection Notice Banner if order is rejected */}
        {booking.status === "REJECTED" && (
          <div className="order-alert-banner danger" role="alert">
            <div className="order-alert-content">
              <strong>Đơn thuê bị từ chối</strong>
              <p>Lý do: {booking.rejectedReason || "Chi nhánh từ chối đơn thuê"}</p>
            </div>
          </div>
        )}

        {/* Header Row */}
        <div className="order-header-row">
          <div>
            <div className="order-header-eyebrow-row">
              <p className="eyebrow">CHI TIẾT ĐƠN THUÊ</p>
              <span className="order-created-inline">
                Ngày đặt: {formatDateTime(booking.createdAt)}
              </span>
            </div>
            <h1 className="order-detail-title">{booking.code}</h1>
          </div>

          <div className="order-header-right-actions">
            <StatusBadge
              status={booking.status}
              isOverdue={Boolean(booking.isOverdue)}
            />
            <Link to="/orders" className="button secondary-button small">
              ← Danh sách đơn
            </Link>
          </div>
        </div>

        <PaymentPanel booking={booking} />

        {/* Main 2-Column Content Layout */}
        <div className="order-detail-layout">
          {/* LEFT COLUMN: Timeline, Equipment, Handover Records */}
          <div className="order-detail-main-col">
            {/* 1. Visual Progress Stepper Card */}
            <div className="order-detail-card order-stepper-card">
              <h2 className="order-card-title">Tiến trình đơn thuê</h2>
              <div className="order-stepper" aria-label="Tiến trình trạng thái đơn thuê">
                {timelineSteps.map((step, idx) => (
                  <div
                    key={step.key}
                    className={`stepper-item ${step.status}`}
                  >
                    <div className="stepper-indicator">
                      <div className="stepper-circle">
                        {step.status === "completed" ? (
                          <span className="stepper-check">✓</span>
                        ) : step.status === "danger" ? (
                          <span className="stepper-x">✕</span>
                        ) : (
                          <span className="stepper-num">{idx + 1}</span>
                        )}
                      </div>
                      {idx < timelineSteps.length - 1 && (
                        <div className="stepper-line" />
                      )}
                    </div>
                    <div className="stepper-content">
                      <strong className="stepper-title">{step.title}</strong>
                      {step.time && (
                        <span className="stepper-time">{step.time}</span>
                      )}
                      <p className="stepper-note">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Rented Equipment Card */}
            <div className="order-detail-card">
              <div className="order-card-header-line">
                <h2 className="order-card-title">
                  Thiết bị thuê ({Array.isArray(booking.items) ? booking.items.length : 0})
                </h2>
                <span className="order-days-pill">
                  Thời lượng: {booking.days ?? 0} ngày
                </span>
              </div>

              <div className="order-item-list">
                {Array.isArray(booking.items) && booking.items.length > 0 ? (
                  booking.items.map((item, idx) => (
                    <div
                      key={`${booking.id}-item-${item.modelId || idx}`}
                      className="order-detail-item-row"
                    >
                      <img
                        src={item.thumbnailUrl || FALLBACK_IMAGE}
                        alt={item.name}
                        className="order-detail-item-thumb"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                      <div className="order-detail-item-info">
                        <strong className="order-detail-item-name">{item.name}</strong>
                        <div className="order-detail-item-meta">
                          <span className="item-kind-badge">
                            {item.kind === "CAMERA" ? "Máy ảnh" : "Ống kính"}
                          </span>
                          <span>Đơn giá: {formatCurrency(item.pricePerDay)}/ngày</span>
                          <span>•</span>
                          <span>Cọc: {formatCurrency(item.depositAmount)}</span>
                        </div>
                      </div>
                      <div className="order-detail-item-price">
                        <span className="item-price-label">Tiền thuê ({booking.days} ngày):</span>
                        <strong className="item-price-val">
                          {formatCurrency(item.rentalAmount)}
                        </strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="order-empty-items">Chưa có thông tin thiết bị trong đơn.</p>
                )}
              </div>

              {/* Addons / Film Products Section */}
              {Array.isArray(booking.addons) && booking.addons.length > 0 && (
                <div className="order-addons-section">
                  <h3 className="order-addons-heading">Phụ kiện & Cuộn film kèm theo</h3>
                  <div className="order-addons-list">
                    {booking.addons.map((addon, idx) => (
                      <div key={`addon-${addon.name || idx}`} className="order-addon-row">
                        <div className="addon-info">
                          <strong>{addon.name}</strong>
                          <span className="addon-meta">
                            Số lượng: {addon.quantity} × {formatCurrency(addon.unitPrice)}
                          </span>
                        </div>
                        <strong className="addon-amount">
                          {formatCurrency(addon.amount)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Handover and Return Records (Biên bản bàn giao thiết bị) */}
            <div className="order-detail-card order-handover-card">
              <div className="order-card-header-line">
                <h2 className="order-card-title">Biên bản bàn giao & Kiểm tra thiết bị</h2>
              </div>

              {Array.isArray(booking.handovers) && booking.handovers.length > 0 ? (
                <div className="handover-records-list">
                  {booking.handovers.map((handover, idx) => (
                    <div key={`handover-${idx}`} className="handover-record-item">
                      <div className="handover-header">
                        <div className="handover-kind-badge">
                          {handover.kind === "PICKUP"
                            ? "BÀN GIAO KHI NHẬN MÁY"
                            : "BIÊN BẢN HOÀN TRẢ MÁY"}
                        </div>
                        <span className="handover-time">
                          {formatDateTime(handover.createdAt)}
                        </span>
                      </div>

                      {/* ID Verification Badge */}
                      <div className="handover-check-row">
                        <span className={`id-check-badge ${handover.idChecked ? "checked" : "pending"}`}>
                          {handover.idChecked
                            ? "✓ Đã đối chiếu CCCD / VNeID chính chủ"
                            : "Chưa đối chiếu CCCD"}
                        </span>
                      </div>

                      {/* Condition notes */}
                      {handover.conditionNotes && (
                        <div className="handover-notes-box">
                          <strong>Ghi chú tình trạng ngoại quan:</strong>
                          <p>{handover.conditionNotes}</p>
                        </div>
                      )}

                      {/* Checklist items */}
                      {handover.checklist && (
                        <div className="handover-checklist-box">
                          <strong>Hạng mục kiểm tra:</strong>
                          {Array.isArray(handover.checklist) ? (
                            <ul className="checklist-items">
                              {handover.checklist.map((item, cIdx) => (
                                <li key={cIdx}>✓ {item}</li>
                              ))}
                            </ul>
                          ) : typeof handover.checklist === "object" ? (
                            <ul className="checklist-items">
                              {Object.entries(handover.checklist).map(([key, val]) => (
                                <li key={key}>
                                  ✓ {key}: {String(val)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>{String(handover.checklist)}</p>
                          )}
                        </div>
                      )}

                      {/* Inspection Photos Gallery */}
                      {Array.isArray(handover.photoUrls) && handover.photoUrls.length > 0 && (
                        <div className="handover-photos-box">
                          <strong>Hình ảnh kiểm tra ngoại quan máy ({handover.photoUrls.length} ảnh):</strong>
                          <div className="handover-photos-grid">
                            {handover.photoUrls.map((photoUrl, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                className="handover-photo-thumb-btn"
                                onClick={() => setLightboxImage(photoUrl)}
                                aria-label={`Xem ảnh kiểm tra ${pIdx + 1}`}
                              >
                                <img
                                  src={photoUrl}
                                  alt={`Ngoại quan thiết bị ${pIdx + 1}`}
                                  className="handover-photo-img"
                                  loading="lazy"
                                />
                                <span className="photo-zoom-overlay">🔍 Phóng to</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="handover-empty-notice">
                  <span className="notice-icon" aria-hidden="true">📋</span>
                  <div className="notice-text">
                    <strong>Chưa có biên bản bàn giao thiết bị</strong>
                    <p>
                      Biên bản bàn giao kèm hình ảnh kiểm tra ngoại quan thực tế sẽ được lập trực tiếp
                      khi bạn có mặt tại quầy chi nhánh để nhận máy.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Payment History (if any) */}
            {Array.isArray(booking.payments) && booking.payments.length > 0 && (
              <div className="order-detail-card">
                <h2 className="order-card-title">Lịch sử thanh toán tại quầy</h2>
                <div className="order-payments-list">
                  {booking.payments.map((p, pIdx) => (
                    <div key={pIdx} className="order-payment-item">
                      <div className="payment-type-wrap">
                        <strong>
                          {p.type === "RENTAL"
                            ? "Thanh toán tiền thuê"
                            : p.type === "DEPOSIT"
                            ? "Đặt cọc thiết bị"
                            : p.type === "REFUND"
                            ? "Hoàn cọc thiết bị"
                            : p.type}
                        </strong>
                        <span className="payment-meta">
                          {p.method} • {formatDateTime(p.createdAt)}
                        </span>
                      </div>
                      <strong className={`payment-amount ${p.type === "REFUND" ? "refund" : ""}`}>
                        {p.type === "REFUND" ? "- " : "+ "}
                        {formatCurrency(p.amount)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Financial Summary, Branch & Contact Info, Cancellation Action */}
          <aside className="order-detail-side-col">
            {/* Financial Breakdown Card */}
            <div className="order-side-card financial-card">
              <h2 className="order-side-title">Chi phí thuê</h2>

              <div className="order-summary-table">
                <div className="order-summary-row">
                  <span>Tiền thuê thiết bị</span>
                  <strong>{formatCurrency(booking.rentalAmount)}</strong>
                </div>

                <div className="order-summary-row">
                  <span>Phụ phí film & phụ kiện</span>
                  <strong>{formatCurrency(booking.addonsAmount)}</strong>
                </div>

                <div className="order-summary-row">
                  <span>Tiền cọc thiết bị</span>
                  <strong>{formatCurrency(booking.depositAmount)}</strong>
                </div>

                <div className="order-deposit-note">
                  <small>
                    * Tiền cọc được hoàn lại 100% khi bạn trả thiết bị đúng hạn và nguyên vẹn.
                  </small>
                </div>

                <div className="order-summary-row order-total-row">
                  <div>
                    <span className="total-label">Tổng thanh toán tại quầy</span>
                    <small className="total-sub">Bao gồm tiền thuê + tiền cọc</small>
                  </div>
                  <strong className="order-grand-total">
                    {formatCurrency(booking.totalDueAtPickup)}
                  </strong>
                </div>
              </div>

              <div className="pickup-payment-tip">
                💳 Thanh toán khi nhận máy bằng tiền mặt hoặc quét mã VietQR tại quầy.
              </div>
            </div>

            {/* Rental Information & Branch Card */}
            <div className="order-side-card">
              <h2 className="order-side-title">Thông tin giao dịch</h2>

              <div className="order-info-list">
                <div className="order-info-item">
                  <span className="info-label">Chi nhánh nhận & trả máy</span>
                  <strong className="info-value">{booking.branch?.name || "Chi nhánh chính"}</strong>
                  <span className="info-sub">{booking.branch?.address || "Hà Nội"}</span>
                  {booking.branch?.phone && (
                    <span className="info-sub">Hotline: {booking.branch.phone}</span>
                  )}
                </div>

                <div className="order-info-item">
                  <span className="info-label">Thời gian thuê máy</span>
                  <strong className="info-value">
                    {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                  </strong>
                  <span className="info-sub">Thời lượng: {booking.days ?? 0} ngày</span>
                </div>

                <div className="order-info-item">
                  <span className="info-label">Người nhận máy</span>
                  <strong className="info-value">{booking.contactName || "—"}</strong>
                  <span className="info-sub">SĐT: {booking.contactPhone || "—"}</span>
                </div>

                {booking.note && (
                  <div className="order-info-item">
                    <span className="info-label">Ghi chú của bạn</span>
                    <p className="info-note">{booking.note}</p>
                  </div>
                )}

                {booking.status === "PENDING" && booking.expiresAt && (
                  <div className="order-info-item expires-warning">
                    <span className="info-label">Thời hạn xác nhận</span>
                    <strong className="info-value">
                      Trước {formatDateTime(booking.expiresAt)}
                    </strong>
                    <span className="info-sub">
                      Đơn sẽ tự động hủy nếu chi nhánh không xác nhận trước thời điểm này.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Cancellation Action Card (Part 5) */}
            {canCancel && (
              <div className="order-side-card cancel-action-card">
                <h3 className="cancel-card-title">Quản lý đơn thuê</h3>
                <p className="cancel-card-desc">
                  Bạn có thể hủy đơn thuê này trước khi cửa hàng hoàn tất thủ tục bàn giao thiết bị.
                </p>
                <button
                  type="button"
                  className="button secondary-button danger full-width"
                  onClick={handleOpenCancelModal}
                  disabled={canceling}
                >
                  Hủy đơn thuê này
                </button>
              </div>
            )}

            {/* Quick Action Links */}
            <div className="order-side-nav-links">
              <Link to="/orders" className="button secondary-button full-width">
                ← Quay lại danh sách đơn
              </Link>
              <Link to="/cameras" className="button primary-button full-width">
                Thuê thiết bị khác
              </Link>
            </div>
          </aside>
        </div>

        {/* Cancellation Confirmation Modal */}
        {showCancelModal && (
          <div className="borroll-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-cancel-title">
            <div className="borroll-modal-dialog">
              <div className="borroll-modal-header">
                <h3 id="modal-cancel-title">Xác nhận hủy đơn thuê</h3>
                <button
                  type="button"
                  className="borroll-modal-close"
                  onClick={handleCloseCancelModal}
                  disabled={canceling}
                  aria-label="Đóng"
                >
                  ✕
                </button>
              </div>

              <div className="borroll-modal-body">
                <div className="cancel-warning-box">
                  <span className="warning-icon" aria-hidden="true">⚠️</span>
                  <div>
                    <strong>Bạn có chắc chắn muốn hủy đơn {booking.code}?</strong>
                    <p>
                      Sau khi hủy, thiết bị sẽ được giải phóng khỏi lịch giữ chỗ và trạng thái đơn sẽ chuyển thành Đã hủy. Thao tác này không thể hoàn tác.
                    </p>
                  </div>
                </div>

                <div className="cancel-reason-form">
                  <label htmlFor="cancel-reason-select" className="form-label">
                    Lý do hủy đơn:
                  </label>
                  <select
                    id="cancel-reason-select"
                    className="borroll-input"
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    disabled={canceling}
                  >
                    {CANCELLATION_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>

                  {selectedReason === "Lý do cá nhân khác" && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <textarea
                        className="borroll-input"
                        rows={3}
                        placeholder="Vui lòng nhập lý do cụ thể..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        disabled={canceling}
                      />
                    </div>
                  )}

                  {cancelError && (
                    <div className="cancel-error-text" role="alert">
                      {cancelError}
                    </div>
                  )}
                </div>
              </div>

              <div className="borroll-modal-footer">
                <button
                  type="button"
                  className="button secondary-button"
                  onClick={handleCloseCancelModal}
                  disabled={canceling}
                >
                  Giữ lại đơn
                </button>
                <button
                  type="button"
                  className="button primary-button danger"
                  onClick={handleConfirmCancel}
                  disabled={canceling}
                >
                  {canceling ? "Đang xử lý hủy đơn..." : "Xác nhận hủy đơn"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inspection Photo Lightbox Modal */}
        {lightboxImage && (
          <div
            className="borroll-lightbox-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Xem ảnh ngoại quan phóng to"
            onClick={() => setLightboxImage(null)}
          >
            <div
              className="borroll-lightbox-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setLightboxImage(null)}
                aria-label="Đóng ảnh"
              >
                ✕ Đóng
              </button>
              <img
                src={lightboxImage}
                alt="Chi tiết ngoại quan thiết bị bàn giao"
                className="lightbox-full-img"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default OrderDetailPage;
