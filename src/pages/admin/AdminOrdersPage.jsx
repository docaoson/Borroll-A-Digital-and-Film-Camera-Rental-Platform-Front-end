import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";
import { adminService } from "../../services/adminService";
import { catalogService } from "../../services/catalogService";

function formatCurrency(amount) {
  if (typeof amount !== "number") return "0 đ";
  return `${amount.toLocaleString("vi-VN")} đ`;
}

function formatDate(isoStr) {
  if (!isoStr) return "--";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return isoStr;
  }
}

function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters from URL or default
  const selectedStatus = searchParams.get("status") || "ALL";
  const selectedBranch = searchParams.get("branch") || "ALL";
  const filterDate = searchParams.get("date") || "";
  const filterOverdue = searchParams.get("overdue") === "true";
  const urlQ = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(urlQ);
  const [debouncedSearch, setDebouncedSearch] = useState(urlQ);

  // Options
  const [branches, setBranches] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    pendingCount: 0,
    pickupsToday: 0,
    returnsToday: 0,
    overdueCount: 0,
  });

  // Action modals
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [actionReason, setActionReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounce search input and sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      setDebouncedSearch(trimmed);
      setPage(1);
      const currentQ = searchParams.get("q") || "";
      if (trimmed !== currentQ) {
        const next = new URLSearchParams(searchParams);
        if (trimmed) {
          next.set("q", trimmed);
        } else {
          next.delete("q");
        }
        setSearchParams(next, { replace: true });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, setSearchParams]);

  // Load branches and overview counters once
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      catalogService.getBranches(),
      adminService.getStaffDashboard(),
    ]).then(([branchRes, dashRes]) => {
      if (!active) return;
      if (branchRes.status === "fulfilled") {
        const bData = branchRes.value;
        setBranches(Array.isArray(bData) ? bData : bData?.items || []);
      }
      if (dashRes.status === "fulfilled") {
        const d = dashRes.value;
        setDashboardStats({
          pendingCount: d.pendingCount || 0,
          pickupsToday: Array.isArray(d.pickupsToday) ? d.pickupsToday.length : 0,
          returnsToday: Array.isArray(d.returnsToday) ? d.returnsToday.length : 0,
          overdueCount: Array.isArray(d.overdue) ? d.overdue.length : 0,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  // Fetch bookings list from GET /staff/bookings
  useEffect(() => {
    let active = true;

    const params = {
      page,
      pageSize,
    };
    if (debouncedSearch) {
      params.q = debouncedSearch;
    }
    if (selectedStatus !== "ALL") {
      params.status = selectedStatus;
    }
    if (selectedBranch !== "ALL") {
      params.branch = selectedBranch;
    }
    if (filterDate) {
      params.date = filterDate;
    }
    if (filterOverdue) {
      params.overdue = "true";
    }

    adminService
      .getStaffBookings(params)
      .then((data) => {
        if (!active) return;
        const items = Array.isArray(data) ? data : data?.items || [];
        setBookings(items);
        setTotal(typeof data?.total === "number" ? data.total : items.length);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err?.message ||
            "Không thể tải danh sách đơn thuê từ máy chủ. Vui lòng thử lại.",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    page,
    pageSize,
    debouncedSearch,
    selectedStatus,
    selectedBranch,
    filterDate,
    filterOverdue,
    refreshKey,
  ]);

  // Quick Action: Confirm Booking
  const handleConfirmAction = async () => {
    if (!confirmTarget) return;
    setProcessing(true);
    setActionError("");
    try {
      await adminService.confirmBooking(confirmTarget.id);
      setSuccessMsg(
        `Đã phê duyệt thành công đơn thuê #${confirmTarget.code || confirmTarget.id.slice(0, 8)}.`,
      );
      setConfirmTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(
        err?.message || "Không thể xác nhận đơn thuê. Vui lòng thử lại.",
      );
    } finally {
      setProcessing(false);
    }
  };

  // Quick Action: Reject Booking
  const handleRejectAction = async (e) => {
    e.preventDefault();
    if (!rejectTarget) return;
    if (!actionReason.trim()) {
      setActionError("Vui lòng nhập lý do từ chối đơn thuê.");
      return;
    }
    setProcessing(true);
    setActionError("");
    try {
      await adminService.rejectBooking(rejectTarget.id, actionReason.trim());
      setSuccessMsg(
        `Đã từ chối đơn thuê #${rejectTarget.code || rejectTarget.id.slice(0, 8)}.`,
      );
      setRejectTarget(null);
      setActionReason("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(
        err?.message || "Không thể từ chối đơn thuê. Vui lòng thử lại.",
      );
    } finally {
      setProcessing(false);
    }
  };

  // Quick Action: Cancel Booking
  const handleCancelAction = async (e) => {
    e.preventDefault();
    if (!cancelTarget) return;
    if (!actionReason.trim()) {
      setActionError("Vui lòng nhập lý do hủy đơn thuê.");
      return;
    }
    setProcessing(true);
    setActionError("");
    try {
      await adminService.cancelBooking(cancelTarget.id, actionReason.trim());
      setSuccessMsg(
        `Đã hủy đơn thuê #${cancelTarget.code || cancelTarget.id.slice(0, 8)}.`,
      );
      setCancelTarget(null);
      setActionReason("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(
        err?.message || "Không thể hủy đơn thuê. Vui lòng thử lại.",
      );
    } finally {
      setProcessing(false);
    }
  };

  // Status Tab click
  const handleStatusTabClick = (statusVal) => {
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (statusVal === "ALL") {
      next.delete("status");
    } else {
      next.set("status", statusVal);
    }
    next.delete("overdue");
    setSearchParams(next);
  };

  // Overdue Filter click
  const handleOverdueFilterClick = () => {
    const nextVal = !filterOverdue;
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (nextVal) {
      next.set("overdue", "true");
      next.delete("status");
    } else {
      next.delete("overdue");
    }
    setSearchParams(next);
  };

  // Branch filter change
  const handleBranchChange = (branchVal) => {
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (branchVal === "ALL") {
      next.delete("branch");
    } else {
      next.set("branch", branchVal);
    }
    setSearchParams(next);
  };

  // Date filter change
  const handleDateChange = (dateVal) => {
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (!dateVal) {
      next.delete("date");
    } else {
      next.set("date", dateVal);
    }
    setSearchParams(next);
  };

  // Clear search input
  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
    const next = new URLSearchParams(searchParams);
    next.delete("q");
    setSearchParams(next);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setPage(1);
    setSearchParams({});
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="admin-orders-page">
      {/* PAGE HEADER */}
      <section className="admin-page-header">
        <div className="admin-page-titles">
          <div className="admin-breadcrumb">
            <Link to="/admin">Bảng điều khiển</Link>
            <span className="sep">/</span>
            <span className="current">Quản lý đơn thuê & Vận hành</span>
          </div>
          <h1 className="admin-heading-title">Quản lý đơn thuê thiết bị</h1>
          <p className="admin-heading-sub">
            Theo dõi toàn bộ đơn đặt thuê máy ảnh, phê duyệt yêu cầu, tiến hành bàn giao, thu cọc và nhận trả máy theo quy trình vận hành.
          </p>
        </div>

        <div className="admin-header-actions">
          <Link
            to="/admin/calendar"
            className="button secondary-button compact"
            title="Xem lịch thuê dạng biểu đồ thời gian"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Lịch thuê trực quan</span>
          </Link>

          <button
            type="button"
            className="button secondary-button compact"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            title="Tải lại danh sách từ máy chủ"
          >
            <span aria-hidden="true">↻</span>
            <span>Làm mới</span>
          </button>
        </div>
      </section>

      {/* QUICK STATS COUNTERS BAR */}
      <div className="admin-catalog-quick-bar">
        <div className="admin-quick-stat-pill">
          <span>Tổng đơn hiển thị:</span>
          <strong>{bookings.length}</strong>
        </div>
        <div className="admin-quick-stat-pill">
          <span>Tổng trên hệ thống:</span>
          <strong>{total}</strong>
        </div>
        <div className="admin-quick-stat-pill">
          <span>Chờ xác nhận:</span>
          <strong className="text-warning">
            {dashboardStats.pendingCount}
          </strong>
        </div>
        <div className="admin-quick-stat-pill">
          <span>Nhận máy hôm nay:</span>
          <strong>{dashboardStats.pickupsToday}</strong>
        </div>
        <div className="admin-quick-stat-pill">
          <span>Trả máy hôm nay:</span>
          <strong>{dashboardStats.returnsToday}</strong>
        </div>
        {dashboardStats.overdueCount > 0 && (
          <div
            className={`admin-quick-stat-pill is-overdue-pill ${filterOverdue ? "active" : ""}`}
            onClick={handleOverdueFilterClick}
            style={{ cursor: "pointer" }}
            title="Nhấp để chỉ xem các đơn đang quá hạn"
          >
            <span style={{ color: "#c62828" }}>Quá hạn chưa trả:</span>
            <strong style={{ color: "#c62828" }}>
              {dashboardStats.overdueCount} đơn
            </strong>
          </div>
        )}
      </div>

      {/* ALERTS */}
      {successMsg && (
        <div className="form-alert success admin-alert-bar" role="status">
          <span>{successMsg}</span>
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setSuccessMsg("")}
          >
            Đóng
          </button>
        </div>
      )}

      {error && (
        <div className="form-alert error admin-alert-bar" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setError(null)}
          >
            Đóng
          </button>
        </div>
      )}

      {/* STATUS TABS NAVIGATION */}
      <div className="admin-order-tabs-nav" role="tablist">
        <button
          type="button"
          className={`admin-order-tab-btn ${selectedStatus === "ALL" && !filterOverdue ? "active" : ""}`}
          onClick={() => handleStatusTabClick("ALL")}
        >
          Tất cả đơn
        </button>
        <button
          type="button"
          className={`admin-order-tab-btn ${selectedStatus === "PENDING" ? "active" : ""}`}
          onClick={() => handleStatusTabClick("PENDING")}
        >
          Chờ xác nhận
          {dashboardStats.pendingCount > 0 && (
            <span className="tab-badge warning">
              {dashboardStats.pendingCount}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`admin-order-tab-btn ${selectedStatus === "CONFIRMED" ? "active" : ""}`}
          onClick={() => handleStatusTabClick("CONFIRMED")}
        >
          Đã xác nhận (Chờ giao)
        </button>
        <button
          type="button"
          className={`admin-order-tab-btn ${selectedStatus === "PICKED_UP" ? "active" : ""}`}
          onClick={() => handleStatusTabClick("PICKED_UP")}
        >
          Đang thuê (Đã giao)
        </button>
        <button
          type="button"
          className={`admin-order-tab-btn ${selectedStatus === "RETURNED" ? "active" : ""}`}
          onClick={() => handleStatusTabClick("RETURNED")}
        >
          Đã trả (Chờ nghiệm thu)
        </button>
        <button
          type="button"
          className={`admin-order-tab-btn ${selectedStatus === "COMPLETED" ? "active" : ""}`}
          onClick={() => handleStatusTabClick("COMPLETED")}
        >
          Hoàn tất
        </button>
        <button
          type="button"
          className={`admin-order-tab-btn ${selectedStatus === "REJECTED" ? "active" : ""}`}
          onClick={() => handleStatusTabClick("REJECTED")}
        >
          Bị từ chối
        </button>
        <button
          type="button"
          className={`admin-order-tab-btn ${selectedStatus === "CANCELLED" ? "active" : ""}`}
          onClick={() => handleStatusTabClick("CANCELLED")}
        >
          Đã hủy
        </button>
        <button
          type="button"
          className={`admin-order-tab-btn is-overdue-tab ${filterOverdue ? "active" : ""}`}
          onClick={handleOverdueFilterClick}
        >
          Đơn quá hạn
          {dashboardStats.overdueCount > 0 && (
            <span className="tab-badge danger">
              {dashboardStats.overdueCount}
            </span>
          )}
        </button>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <section className="admin-filter-toolbar">
        <div className="admin-search-box">
          <span className="search-icon" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo mã đơn, khách hàng, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={handleClearSearch}
            >
              ✕
            </button>
          )}
        </div>

        <div className="admin-filter-controls">
          {/* Branch Filter */}
          <select
            className="admin-select-filter"
            value={selectedBranch}
            onChange={(e) => handleBranchChange(e.target.value)}
            aria-label="Lọc theo chi nhánh"
          >
            <option value="ALL">Tất cả chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id || b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Date Picker Filter */}
          <div className="admin-date-filter-wrap">
            <input
              type="date"
              className="admin-select-filter"
              value={filterDate}
              onChange={(e) => handleDateChange(e.target.value)}
              title="Lọc đơn theo ngày nhận hoặc ngày trả"
              aria-label="Lọc theo ngày nhận hoặc trả"
            />
          </div>

          {(selectedStatus !== "ALL" ||
            selectedBranch !== "ALL" ||
            filterDate ||
            filterOverdue ||
            searchQuery) && (
            <button
              type="button"
              className="button secondary-button compact"
              onClick={handleResetFilters}
            >
              Đặt lại lọc
            </button>
          )}
        </div>
      </section>

      {/* DATA TABLE */}
      <section className="admin-table-container">
        {loading ? (
          <div className="admin-table-loading">
            <span className="admin-spinner" aria-hidden="true" />
            <p>Đang tải danh sách đơn thuê...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="admin-table-empty">
            <span className="empty-icon" aria-hidden="true">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </span>
            <h3>Không tìm thấy đơn thuê nào</h3>
            <p>
              {searchQuery ||
              selectedStatus !== "ALL" ||
              selectedBranch !== "ALL" ||
              filterDate ||
              filterOverdue
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các điều kiện lọc."
                : "Hệ thống chưa có đơn đặt thuê nào phù hợp tiêu chí."}
            </p>
            {(selectedStatus !== "ALL" ||
              selectedBranch !== "ALL" ||
              filterDate ||
              filterOverdue ||
              searchQuery) && (
              <button
                type="button"
                className="button secondary-button compact"
                onClick={handleResetFilters}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Mã đơn & Ngày đặt</th>
                  <th scope="col">Khách hàng & Liên hệ</th>
                  <th scope="col">Thiết bị thuê</th>
                  <th scope="col">Chi nhánh</th>
                  <th scope="col">Kỳ hạn thuê</th>
                  <th scope="col">Tiền thuê & Cọc</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" className="text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const customerName =
                    booking.customer?.fullName ||
                    booking.contactName ||
                    "Khách thuê";
                  const customerPhone =
                    booking.customer?.phone || booking.contactPhone || "--";
                  const allowedActions = booking.allowedActions || [];

                  return (
                    <tr
                      key={booking.id}
                      className={booking.isOverdue ? "is-overdue-row" : ""}
                    >
                      {/* Code & Created At */}
                      <td className="code-cell">
                        <Link
                          to={`/admin/orders/${booking.id}`}
                          className="admin-order-code-link"
                          title="Xem chi tiết đơn thuê"
                        >
                          <strong>#{booking.code || booking.id.slice(0, 8)}</strong>
                        </Link>
                        <span className="admin-subtext">
                          {formatDate(booking.createdAt)}
                        </span>
                      </td>

                      {/* Customer */}
                      <td>
                        <div className="admin-user-cell">
                          <span className="user-name">
                            {customerName}
                          </span>
                          <span className="user-phone">
                            {customerPhone}
                          </span>
                        </div>
                      </td>

                      {/* Equipment */}
                      <td>
                        <div className="admin-order-items-cell">
                          {booking.items && booking.items.length > 0 ? (
                            booking.items.map((it, idx) => (
                              <span
                                key={it.modelId || idx}
                                className="admin-item-tag"
                                title={it.name}
                              >
                                {it.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">Chưa có thiết bị</span>
                          )}
                          {booking.addons && booking.addons.length > 0 && (
                            <span className="admin-addon-tag">
                              +{booking.addons.length} phụ kiện/film
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Branch */}
                      <td>
                        <span className="admin-branch-pill">
                          {booking.branch?.name || "Chi nhánh"}
                        </span>
                      </td>

                      {/* Rental Period */}
                      <td>
                        <div className="admin-date-cell">
                          <span>Từ: {formatDate(booking.startDate)}</span>
                          <span>Đến: {formatDate(booking.endDate)}</span>
                          <span className="admin-subtext">
                            ({booking.days} ngày)
                          </span>
                        </div>
                      </td>

                      {/* Financials */}
                      <td className="amount-cell">
                        <div className="admin-finance-cell">
                          <strong title="Tổng tiền cần thu lúc nhận máy">
                            {formatCurrency(
                              booking.totalDueAtPickup || booking.rentalAmount,
                            )}
                          </strong>
                          <span
                            className="admin-subtext text-muted"
                            title="Tiền cọc đảm bảo"
                          >
                            Cọc: {formatCurrency(booking.depositAmount)}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge
                          status={booking.status}
                          isOverdue={booking.isOverdue}
                        />
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="admin-table-actions">
                          <Link
                            to={`/admin/orders/${booking.id}`}
                            className="button secondary-button compact"
                            title="Xem chi tiết đơn thuê"
                          >
                            Chi tiết
                          </Link>

                          {/* Action shortcuts */}
                          {allowedActions.includes("confirm") && (
                            <button
                              type="button"
                              className="button primary-button compact"
                              onClick={() => setConfirmTarget(booking)}
                              title="Xác nhận duyệt đơn này"
                            >
                              Duyệt
                            </button>
                          )}

                          {allowedActions.includes("pickup") && (
                            <Link
                              to={`/admin/orders/${booking.id}?action=pickup`}
                              className="button primary-button compact"
                              title="Tiến hành giao máy cho khách"
                            >
                              Giao máy
                            </Link>
                          )}

                          {allowedActions.includes("return") && (
                            <Link
                              to={`/admin/orders/${booking.id}?action=return`}
                              className="button primary-button compact"
                              title="Nhận lại máy khi khách hoàn trả"
                            >
                              Nhận máy
                            </Link>
                          )}

                          {allowedActions.includes("complete") && (
                            <Link
                              to={`/admin/orders/${booking.id}?action=complete`}
                              className="button primary-button compact"
                              title="Nghiệm thu đơn và hoàn cọc"
                            >
                              Nghiệm thu
                            </Link>
                          )}

                          {allowedActions.includes("reject") && (
                            <button
                              type="button"
                              className="button danger-button compact"
                              onClick={() => {
                                setRejectTarget(booking);
                                setActionReason("");
                                setActionError("");
                              }}
                              title="Từ chối yêu cầu thuê"
                            >
                              Từ chối
                            </button>
                          )}

                          {allowedActions.includes("cancel") &&
                            !allowedActions.includes("reject") && (
                              <button
                                type="button"
                                className="button danger-button compact"
                                onClick={() => {
                                  setCancelTarget(booking);
                                  setActionReason("");
                                  setActionError("");
                                }}
                                title="Hủy đơn thuê này"
                              >
                                Hủy
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION BAR */}
        {totalPages > 1 && (
          <div className="admin-pagination-bar">
            <span className="admin-pagination-info">
              Trang {page} / {totalPages} · Tổng cộng {total} đơn thuê
            </span>
            <div className="admin-pagination-nav">
              <button
                type="button"
                className="button secondary-button compact"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ← Trước
              </button>
              <button
                type="button"
                className="button secondary-button compact"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* MODAL 1: CONFIRM BOOKING */}
      {confirmTarget && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => !processing && setConfirmTarget(null)}
        >
          <div
            className="admin-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge">PHÊ DUYỆT ĐƠN THUÊ</span>
              <h3>
                Xác nhận đơn #{confirmTarget.code || confirmTarget.id.slice(0, 8)}
              </h3>
            </div>
            {actionError && (
              <div className="form-alert error" role="alert">
                {actionError}
              </div>
            )}
            <div className="admin-dialog-body">
              <p>
                Bạn có chắc chắn muốn phê duyệt đơn thuê của khách hàng{" "}
                <strong>
                  {confirmTarget.customer?.fullName ||
                    confirmTarget.contactName ||
                    "Khách thuê"}
                </strong>
                ?
              </p>
              <p className="admin-dialog-note">
                Đơn thuê sẽ chuyển sang trạng thái <strong>ĐÃ XÁC NHẬN</strong>.
                Khách hàng sẽ nhận thông báo chuẩn bị đến cửa hàng để nhận máy theo
                lịch hẹn ({formatDate(confirmTarget.startDate)}).
              </p>
            </div>
            <div className="admin-dialog-actions">
              <button
                type="button"
                className="button secondary-button compact"
                onClick={() => setConfirmTarget(null)}
                disabled={processing}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="button primary-button compact"
                onClick={handleConfirmAction}
                disabled={processing}
              >
                {processing ? "Đang xử lý..." : "Xác nhận duyệt đơn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT BOOKING */}
      {rejectTarget && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => !processing && setRejectTarget(null)}
        >
          <div
            className="admin-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge danger">TỪ CHỐI ĐƠN THUÊ</span>
              <h3>
                Từ chối đơn #{rejectTarget.code || rejectTarget.id.slice(0, 8)}
              </h3>
            </div>
            {actionError && (
              <div className="form-alert error" role="alert">
                {actionError}
              </div>
            )}
            <form onSubmit={handleRejectAction} className="admin-dialog-form">
              <p>
                Khách hàng:{" "}
                <strong>
                  {rejectTarget.customer?.fullName ||
                    rejectTarget.contactName ||
                    "Khách thuê"}
                </strong>
              </p>
              <div className="admin-field-group">
                <label htmlFor="reject-reason">
                  Lý do từ chối đơn thuê <span className="req">*</span>
                </label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  placeholder="Ví dụ: Thiết bị cần bảo dưỡng đột xuất, không thể liên hệ xác nhận thông tin khách..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  required
                />
              </div>
              <div className="admin-dialog-actions">
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={() => setRejectTarget(null)}
                  disabled={processing}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="button danger-button compact"
                  disabled={processing}
                >
                  {processing ? "Đang lưu..." : "Xác nhận từ chối"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CANCEL BOOKING */}
      {cancelTarget && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => !processing && setCancelTarget(null)}
        >
          <div
            className="admin-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge danger">HỦY ĐƠN THUÊ</span>
              <h3>
                Hủy đơn #{cancelTarget.code || cancelTarget.id.slice(0, 8)}
              </h3>
            </div>
            {actionError && (
              <div className="form-alert error" role="alert">
                {actionError}
              </div>
            )}
            <form onSubmit={handleCancelAction} className="admin-dialog-form">
              <p>
                Hủy đơn thuê của khách hàng{" "}
                <strong>
                  {cancelTarget.customer?.fullName ||
                    cancelTarget.contactName ||
                    "Khách thuê"}
                </strong>
                .
              </p>
              <div className="admin-field-group">
                <label htmlFor="cancel-reason">
                  Lý do hủy đơn <span className="req">*</span>
                </label>
                <textarea
                  id="cancel-reason"
                  rows={3}
                  placeholder="Ví dụ: Khách gọi điện báo bận không thuê nữa, sự cố phát sinh..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  required
                />
              </div>
              <div className="admin-dialog-actions">
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={() => setCancelTarget(null)}
                  disabled={processing}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="button danger-button compact"
                  disabled={processing}
                >
                  {processing ? "Đ đang xử lý..." : "Xác nhận hủy đơn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrdersPage;