import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

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
  { key: "REJECTED", label: "Bị từ chối" },
];

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80";

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

function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state from URL
  const statusFilter = searchParams.get("status") || "ALL";
  const searchQuery = searchParams.get("q") || "";
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const PAGE_SIZE = 10;

  // Sync search input with URL during render
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  // Derive loading state from fetchKey
  const fetchKey = `${statusFilter}-${currentPage}`;
  const [loadedKey, setLoadedKey] = useState(null);
  const loading = loadedKey !== fetchKey;

  const [bookings, setBookings] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState("");

  // Fetch bookings whenever statusFilter or currentPage changes
  useEffect(() => {
    let active = true;

    bookingService
      .getMyBookings({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        page: currentPage,
        pageSize: PAGE_SIZE,
      })
      .then((response) => {
        if (!active) return;
        const items = Array.isArray(response?.items) ? response.items : [];
        setBookings(items);
        setTotalCount(typeof response?.total === "number" ? response.total : items.length);
        setError("");
        setLoadedKey(fetchKey);
      })
      .catch((err) => {
        if (!active) return;
        setBookings([]);
        setTotalCount(0);
        setError(
          err instanceof ApiError
            ? err.message
            : "Không thể tải danh sách đơn thuê lúc này.",
        );
        setLoadedKey(fetchKey);
      });

    return () => {
      active = false;
    };
  }, [statusFilter, currentPage, fetchKey]);

  // Update status filter in URL
  const handleFilterChange = (key) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (key === "ALL") {
        next.delete("status");
      } else {
        next.set("status", key);
      }
      next.set("page", "1");
      return next;
    });
  };

  // Update search query in URL
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const trimmed = localSearch.trim();
      if (trimmed) {
        next.set("q", trimmed);
      } else {
        next.delete("q");
      }
      next.set("page", "1");
      return next;
    });
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("q");
      next.set("page", "1");
      return next;
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter client-side by search query if any
  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const term = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchCode = b.code?.toLowerCase().includes(term);
      const matchBranch = b.branch?.name?.toLowerCase().includes(term);
      const matchItems = Array.isArray(b.items) && b.items.some((item) =>
        item.name?.toLowerCase().includes(term)
      );
      return matchCode || matchBranch || matchItems;
    });
  }, [bookings, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <section className="orders-page">
      <div className="orders-shell">
        <div className="order-breadcrumb" aria-label="Đường dẫn điều hướng">
          <Link to="/">Trang chủ</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Đơn thuê của tôi</span>
        </div>

        <div className="order-header-row">
          <div>
            <p className="eyebrow">QUẢN LÝ ĐƠN THUÊ</p>
            <h1>Đơn thuê của tôi</h1>
            <p className="orders-subheading">
              Theo dõi tiến trình, tra cứu chi tiết thiết bị và quản lý các giao dịch thuê máy ảnh của bạn.
            </p>
          </div>
          <Link to="/cameras" className="button primary-button">
            + Thuê thêm thiết bị
          </Link>
        </div>

        {/* Search and Filters Bar */}
        <div className="orders-toolbar">
          <form onSubmit={handleSearchSubmit} className="orders-search-form" role="search">
            <div className="orders-search-input-wrap">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                className="orders-search-input"
                placeholder="Tìm theo mã đơn (BKG-...) hoặc tên máy..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                aria-label="Tìm kiếm đơn thuê"
              />
              {localSearch && (
                <button
                  type="button"
                  className="orders-search-clear"
                  onClick={handleClearSearch}
                  aria-label="Xóa từ khóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>
            <button type="submit" className="button secondary-button orders-search-btn">
              Tìm kiếm
            </button>
          </form>

          <div className="order-filters" aria-label="Bộ lọc trạng thái đơn thuê">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`order-filter-btn ${
                  statusFilter === filter.key ? "active" : ""
                }`}
                onClick={() => handleFilterChange(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className="orders-loading-grid" aria-live="polite" aria-busy="true">
            {[1, 2, 3].map((n) => (
              <div key={n} className="order-card-skeleton">
                <div className="skeleton-line skeleton-header" />
                <div className="skeleton-line skeleton-body" />
                <div className="skeleton-line skeleton-footer" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="empty-state orders-error-state">
            <span className="empty-state-icon" aria-hidden="true">⚠️</span>
            <h2>Không thể tải danh sách đơn thuê</h2>
            <p>{error}</p>
            <button
              type="button"
              className="button primary-button"
              onClick={() => handleFilterChange(statusFilter)}
            >
              Thử lại
            </button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state orders-empty-card">
            <div className="empty-state-icon" aria-hidden="true">📷</div>
            {searchQuery || statusFilter !== "ALL" ? (
              <>
                <h2>Không tìm thấy đơn thuê phù hợp</h2>
                <p>
                  Không có đơn thuê nào khớp với từ khóa tìm kiếm hoặc bộ lọc trạng thái hiện tại.
                </p>
                <div className="empty-state-actions">
                  <button
                    type="button"
                    className="button secondary-button"
                    onClick={() => {
                      handleClearSearch();
                      handleFilterChange("ALL");
                    }}
                  >
                    Xóa toàn bộ bộ lọc
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Bạn chưa có đơn thuê nào</h2>
                <p>
                  Bạn chưa thực hiện giao dịch thuê máy ảnh nào tại Borroll.
                  Hãy khám phá danh mục máy ảnh Digital & Film để bắt đầu hành trình sáng tạo của bạn!
                </p>
                <Link to="/cameras" className="button primary-button">
                  Khám phá danh mục thiết bị
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="orders-count-bar">
              <span>
                Hiển thị <strong>{filteredBookings.length}</strong> đơn thuê
                {totalCount > PAGE_SIZE ? ` (Tổng cộng ${totalCount} đơn)` : ""}
              </span>
            </div>

            <div className="order-list">
              {filteredBookings.map((booking) => (
                <article key={booking.id} className="order-card">
                  {/* Card Header */}
                  <div className="order-card-header">
                    <div className="order-card-header-left">
                      <span className="order-card-eyebrow">Mã đơn thuê</span>
                      <strong className="order-reference">{booking.code}</strong>
                      <span className="order-created-time">
                        Đặt lúc: {formatDateTime(booking.createdAt)}
                      </span>
                    </div>
                    <div className="order-card-header-right">
                      <StatusBadge
                        status={booking.status}
                        isOverdue={Boolean(booking.isOverdue)}
                      />
                      <span className={`payment-status ${(booking.payment?.status || "unpaid").toLowerCase()}`}>
                        {({ UNPAID: "Chưa thanh toán", PENDING_VERIFICATION: "Chờ xác nhận thanh toán", PAID: "Đã thanh toán", REJECTED: "Thanh toán bị từ chối" })[booking.payment?.status || "UNPAID"]}
                      </span>
                    </div>
                  </div>

                  {/* Card Items preview */}
                  <div className="order-items-preview">
                    {Array.isArray(booking.items) && booking.items.length > 0 ? (
                      <div className="order-items-grid">
                        {booking.items.map((item, idx) => (
                          <div
                            key={`${booking.id}-item-${item.modelId || idx}`}
                            className="order-item-chip"
                          >
                            <img
                              src={item.thumbnailUrl || FALLBACK_IMAGE}
                              alt={item.name}
                              className="order-item-thumb"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = FALLBACK_IMAGE;
                              }}
                            />
                            <div className="order-item-chip-info">
                              <span className="order-item-name">{item.name}</span>
                              <span className="order-item-meta">
                                {item.kind === "CAMERA" ? "Máy ảnh" : "Ống kính"} • {formatCurrency(item.pricePerDay)}/ngày
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="order-no-items">Thiết bị thuê theo gói dịch vụ</p>
                    )}

                    {Array.isArray(booking.addons) && booking.addons.length > 0 && (
                      <div className="order-addons-summary">
                        <span className="order-addons-badge">
                          + {booking.addons.reduce((sum, a) => sum + (a.quantity || 1), 0)} phụ kiện / cuộn film
                        </span>
                        <span className="order-addons-names">
                          ({booking.addons.map((a) => `${a.name} x${a.quantity}`).join(", ")})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body Stats */}
                  <div className="order-body">
                    <div className="order-stat">
                      <span>Thời gian nhận & trả</span>
                      <strong>
                        {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                      </strong>
                      <small className="order-stat-sub">({booking.days ?? 0} ngày thuê)</small>
                    </div>

                    <div className="order-stat">
                      <span>Chi nhánh nhận máy</span>
                      <strong>{booking.branch?.name || "Chi nhánh chính"}</strong>
                      <small className="order-stat-sub">{booking.branch?.address || "Hà Nội"}</small>
                    </div>

                    <div className="order-stat">
                      <span>Tiền cọc thiết bị</span>
                      <strong>{formatCurrency(booking.depositAmount)}</strong>
                      <small className="order-stat-sub">(Hoàn lại khi trả máy)</small>
                    </div>

                    <div className="order-stat order-stat-highlight">
                      <span>Tổng cần thanh toán</span>
                      <strong className="order-total-price">
                        {formatCurrency(booking.totalDueAtPickup)}
                      </strong>
                      <small className="order-stat-sub">Thanh toán khi nhận máy</small>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="order-card-footer">
                    <div className="order-footer-note">
                      {booking.status === "PENDING" && (
                        <span className="order-status-tip">
                          ⏳ Đơn đang chờ chi nhánh kiểm tra và xác nhận thiết bị
                        </span>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <span className="order-status-tip">
                          ✓ Đã xác nhận. Vui lòng mang CCCD đến quầy nhận máy
                        </span>
                      )}
                      {booking.status === "PICKED_UP" && (
                        <span className="order-status-tip">
                          📸 Thiết bị đang trong thời gian thuê
                        </span>
                      )}
                      {booking.status === "COMPLETED" && (
                        <span className="order-status-tip">
                          ★ Đơn thuê đã hoàn tất trọn vẹn
                        </span>
                      )}
                      {booking.status === "CANCELLED" && (
                        <span className="order-status-tip danger">
                          ✕ Đơn đã hủy{booking.cancelledReason ? `: ${booking.cancelledReason}` : ""}
                        </span>
                      )}
                      {booking.status === "REJECTED" && (
                        <span className="order-status-tip danger">
                          ✕ Bị từ chối{booking.rejectedReason ? `: ${booking.rejectedReason}` : ""}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/orders/${booking.id}`}
                      className="button primary-button small order-action-btn"
                    >
                      Xem chi tiết đơn →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="orders-pagination" aria-label="Phân trang đơn thuê">
                <button
                  type="button"
                  className="button secondary-button small pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  ← Trang trước
                </button>

                <div className="pagination-pages">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`pagination-page-btn ${
                        currentPage === pageNum ? "active" : ""
                      }`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="button secondary-button small pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Trang sau →
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default OrdersPage;
