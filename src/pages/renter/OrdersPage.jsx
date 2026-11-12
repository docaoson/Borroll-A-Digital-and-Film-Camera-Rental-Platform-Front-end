import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import StatusBadge from "../../components/shared/StatusBadge";
import { ApiError } from "../../lib/apiClient";
import { bookingService } from "../../services/bookingService";

const FILTERS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "PICKED_UP", label: "Đang thuê" },
  { key: "COMPLETED", label: "Hoàn tất" },
  { key: "CANCELLED", label: "Đã hủy" },
];

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

function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    bookingService
      .getMyBookings({
        status: statusFilter === "ALL" ? undefined : statusFilter,
      })
      .then((response) => {
        if (!active) return;
        const items = Array.isArray(response?.items) ? response.items : [];
        setBookings(items);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setBookings([]);
        setError(
          err instanceof ApiError
            ? err.message
            : "Không thể tải danh sách đơn thuê lúc này.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [statusFilter]);

  return (
    <section className="orders-page">
      <div className="orders-shell">
        <p className="eyebrow">ĐƠN THUÊ CỦA TÔI</p>
        <div className="order-header-row">
          <h1>Đơn thuê của tôi</h1>
          <Link to="/cameras" className="button primary-button">
            Chọn thiết bị nữa
          </Link>
        </div>

        <div className="order-filters" aria-label="Bộ lọc đơn thuê">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`order-filter-btn ${
                statusFilter === filter.key ? "active" : ""
              }`}
              onClick={() => setStatusFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">
            <h2>Đang tải đơn thuê...</h2>
            <p>Vui lòng chờ trong giây lát.</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <h2>Không thể tải đơn thuê</h2>
            <p>{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <h2>Chưa có đơn thuê nào</h2>
            <p>
              Bạn chưa thực hiện giao dịch thuê máy nào. Hãy xem danh sách máy
              ảnh để đặt đơn đầu tiên.
            </p>
            <Link to="/cameras" className="button primary-button">
              Khám phá thiết bị
            </Link>
          </div>
        ) : (
          <div className="order-list">
            {bookings.map((booking) => (
              <article key={booking.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <div className="order-reference">{booking.code}</div>
                  </div>
                  <StatusBadge
                    status={booking.status}
                    isOverdue={Boolean(booking.isOverdue)}
                  />
                </div>

                <div className="order-body">
                  <div className="order-stat">
                    <span>Thời gian</span>
                    <strong>
                      {formatDate(booking.startDate)} -{" "}
                      {formatDate(booking.endDate)}
                    </strong>
                  </div>
                  <div className="order-stat">
                    <span>Thời hạn</span>
                    <strong>{booking.days ?? 0} ngày</strong>
                  </div>
                  <div className="order-stat">
                    <span>Chi nhánh</span>
                    <strong>{booking.branch?.name || "—"}</strong>
                  </div>
                  <div className="order-stat">
                    <span>Tổng cần thanh toán</span>
                    <strong>{formatCurrency(booking.totalDueAtPickup)}</strong>
                  </div>
                </div>

                <div
                  className="order-card-header"
                  style={{ marginTop: "1rem" }}
                >
                  <div>
                    {Array.isArray(booking.items) &&
                      booking.items.length > 0 && (
                        <small>
                          {booking.items
                            .slice(0, 2)
                            .map((item) => item.name)
                            .join(" • ")}
                          {booking.items.length > 2 ? " + ..." : ""}
                        </small>
                      )}
                  </div>
                  <Link to={`/orders/${booking.id}`} className="order-link">
                    Xem chi tiết
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default OrdersPage;
