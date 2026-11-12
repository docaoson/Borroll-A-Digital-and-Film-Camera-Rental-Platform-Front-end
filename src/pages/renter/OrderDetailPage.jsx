import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import StatusBadge from "../../components/shared/StatusBadge";
import { ApiError } from "../../lib/apiClient";
import { bookingService } from "../../services/bookingService";

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("vi-VN")} đ`;
}

function OrderDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    bookingService
      .getBookingDetail(id)
      .then((data) => {
        if (!active) return;
        setBooking(data);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          setError("Không tìm thấy đơn thuê bạn yêu cầu.");
        } else {
          setError(
            err instanceof ApiError
              ? err.message
              : "Không thể tải chi tiết đơn thuê lúc này.",
          );
        }
        setBooking(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleCancelBooking = async () => {
    if (!booking || !booking.allowedActions?.includes("cancel")) {
      return;
    }

    setCanceling(true);
    try {
      const updatedBooking = await bookingService.cancelBooking(
        booking.id,
        "Khách hàng hủy đơn",
      );

      setBooking((current) => ({
        ...(current || {}),
        ...updatedBooking,
        status: updatedBooking?.status || "CANCELLED",
        cancelledReason:
          updatedBooking?.cancelledReason || "Khách hàng hủy đơn",
        allowedActions: Array.isArray(updatedBooking?.allowedActions)
          ? updatedBooking.allowedActions
          : [],
      }));
      setError("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Không thể hủy đơn thuê lúc này.",
      );
    } finally {
      setCanceling(false);
    }
  };

  const summaryRows = useMemo(() => {
    if (!booking) return [];

    return [
      {
        label: "Tiền thuê thiết bị",
        value: formatCurrency(booking.rentalAmount),
      },
      {
        label: "Phụ phí film / phụ kiện",
        value: formatCurrency(booking.addonsAmount),
      },
      { label: "Tiền cọc", value: formatCurrency(booking.depositAmount) },
      {
        label: "Tổng thanh toán khi nhận máy",
        value: formatCurrency(booking.totalDueAtPickup),
      },
    ];
  }, [booking]);

  if (loading) {
    return (
      <section className="order-detail-page">
        <div className="order-detail-shell">
          <div className="empty-state">
            <h2>Đang tải đơn thuê...</h2>
            <p>Vui lòng chờ trong giây lát.</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="order-detail-page">
        <div className="order-detail-shell">
          <div className="empty-state">
            <h2>Không thể hiển thị đơn thuê</h2>
            <p>{error}</p>
            <Link to="/orders" className="button primary-button">
              Quay lại đơn thuê
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="order-detail-page">
        <div className="order-detail-shell">
          <div className="empty-state">
            <h2>Không tìm thấy đơn thuê</h2>
            <p>Vui lòng thử lại sau hoặc chọn đơn thuê khác.</p>
            <Link to="/orders" className="button primary-button">
              Quay lại đơn thuê
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const itemCount = Array.isArray(booking.items) ? booking.items.length : 0;

  return (
    <section className="order-detail-page">
      <div className="order-detail-shell">
        <div className="order-header-row">
          <div>
            <p className="eyebrow">CHI TIẾT ĐƠN THUÊ</p>
            <h1>{booking.code}</h1>
          </div>
          <StatusBadge
            status={booking.status}
            isOverdue={Boolean(booking.isOverdue)}
          />
        </div>

        <div className="order-detail-meta">
          <span>Đặt ngày {formatDate(booking.createdAt?.slice(0, 10))}</span>
          <span>•</span>
          <span>
            {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
          </span>
        </div>

        <div className="order-detail-layout">
          <div className="order-detail-card">
            <div className="order-summary-row">
              <strong>Thiết bị đã đặt</strong>
              <span>{itemCount} món</span>
            </div>

            <div className="order-item-list">
              {Array.isArray(booking.items) && booking.items.length > 0 ? (
                booking.items.map((item) => (
                  <div
                    key={`${booking.id}-${item.modelId || item.name}`}
                    className="order-item"
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <small>
                        {item.kind === "CAMERA" ? "Máy ảnh" : "Ống kính"} •{" "}
                        {item.rentalAmount
                          ? formatCurrency(item.rentalAmount)
                          : "—"}
                      </small>
                    </div>
                    <strong>
                      {item.pricePerDay
                        ? formatCurrency(item.pricePerDay)
                        : "—"}
                    </strong>
                  </div>
                ))
              ) : (
                <div className="order-item">
                  <div>
                    <strong>Chưa có thiết bị trong đơn</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="order-summary-table">
              {summaryRows.map((row) => (
                <div key={row.label} className="order-summary-row">
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <aside className="order-side-card">
            <div className="order-summary-row">
              <strong>Thông tin đơn</strong>
            </div>

            <div className="order-summary-table">
              <div className="order-summary-row">
                <span>Chi nhánh</span>
                <strong>{booking.branch?.name || "—"}</strong>
              </div>
              <div className="order-summary-row">
                <span>Thời lượng</span>
                <strong>{booking.days ?? 0} ngày</strong>
              </div>
              <div className="order-summary-row">
                <span>Người nhận máy</span>
                <strong>{booking.contactName || "—"}</strong>
              </div>
              <div className="order-summary-row">
                <span>SĐT</span>
                <strong>{booking.contactPhone || "—"}</strong>
              </div>
              <div className="order-summary-row">
                <span>Trạng thái</span>
                <StatusBadge
                  status={booking.status}
                  isOverdue={Boolean(booking.isOverdue)}
                />
              </div>
            </div>

            {Array.isArray(booking.allowedActions) &&
              booking.allowedActions.includes("cancel") && (
                <button
                  type="button"
                  className="button secondary-button full-width"
                  onClick={handleCancelBooking}
                  disabled={canceling}
                  style={{ marginTop: "1rem" }}
                >
                  {canceling ? "Đang hủy đơn..." : "Hủy đơn thuê"}
                </button>
              )}

            <Link to="/orders" className="button primary-button full-width">
              Quay lại danh sách
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default OrderDetailPage;
