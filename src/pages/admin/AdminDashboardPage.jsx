import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";
import { adminService } from "../../services/adminService";
import { catalogService } from "../../services/catalogService";
import { useAuth } from "../../hooks/useAuth";

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

function AdminDashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [totalModels, setTotalModels] = useState(0);
  const [totalUsers, setTotalUsers] = useState(null);

  const [dashboardData, setDashboardData] = useState({
    pendingCount: 0,
    pickupsToday: [],
    returnsToday: [],
    overdue: [],
  });

  const [activeTab, setActiveTab] = useState("pickups");
  const [refreshKey, setRefreshKey] = useState(0);

  // Load branch list and total model counts once
  useEffect(() => {
    let active = true;

    Promise.allSettled([
      catalogService.getBranches(),
      catalogService.getModels({ pageSize: 1 }),
      isAdmin ? adminService.getAdminUsers({ pageSize: 1 }) : Promise.resolve(null),
    ]).then(([branchesRes, modelsRes, usersRes]) => {
      if (!active) return;

      if (branchesRes.status === "fulfilled" && Array.isArray(branchesRes.value)) {
        setBranches(branchesRes.value);
      } else if (
        branchesRes.status === "fulfilled" &&
        Array.isArray(branchesRes.value?.items)
      ) {
        setBranches(branchesRes.value.items);
      }

      if (modelsRes.status === "fulfilled" && modelsRes.value?.total !== undefined) {
        setTotalModels(modelsRes.value.total);
      }

      if (usersRes.status === "fulfilled" && usersRes.value?.total !== undefined) {
        setTotalUsers(usersRes.value.total);
      }
    });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  // Load live staff dashboard data whenever selectedBranch or refreshKey changes
  useEffect(() => {
    let active = true;

    const fetchDashboard = async () => {
      setError(null);
      try {
        const params = {};
        if (selectedBranch) {
          params.branch = selectedBranch;
        }
        const data = await adminService.getStaffDashboard(params);
        if (active) {
          setDashboardData({
            pendingCount: data.pendingCount || 0,
            pickupsToday: Array.isArray(data.pickupsToday) ? data.pickupsToday : [],
            returnsToday: Array.isArray(data.returnsToday) ? data.returnsToday : [],
            overdue: Array.isArray(data.overdue) ? data.overdue : [],
          });
          const now = new Date();
          setLastUpdated(
            now.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err?.message ||
              "Không thể tải dữ liệu vận hành từ máy chủ. Vui lòng thử lại sau.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };
  }, [selectedBranch, refreshKey]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  const currentTabItems =
    activeTab === "pickups"
      ? dashboardData.pickupsToday
      : activeTab === "returns"
        ? dashboardData.returnsToday
        : dashboardData.overdue;

  return (
    <div className="admin-dashboard-page">
      {/* HEADER SECTION: TITLES & BRANCH SELECTOR */}
      <section className="admin-page-header">
        <div className="admin-page-titles">
          <div className="admin-breadcrumb">
            <span>Bảng điều khiển</span>
            <span className="sep">/</span>
            <span className="current">Tổng quan vận hành cửa hàng</span>
          </div>
          <h1 className="admin-heading-title">Tổng quan vận hành</h1>
          <p className="admin-heading-sub">
            Theo dõi thời gian thực tình trạng đơn thuê, lịch nhận - trả máy trong ngày và các chỉ số hoạt động của chuỗi Borroll.
          </p>
        </div>

        <div className="admin-header-actions">
          <div className="admin-branch-filter-group">
            <label htmlFor="admin-branch-select" className="admin-field-label">
              Chi nhánh:
            </label>
            <select
              id="admin-branch-select"
              className="admin-select"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id || b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={`button secondary-button admin-refresh-btn ${refreshing ? "is-refreshing" : ""}`}
            onClick={handleRefresh}
            disabled={loading || refreshing}
            title="Tải lại số liệu từ máy chủ"
          >
            <span className="refresh-icon" aria-hidden="true">
              ↻
            </span>
            <span>{refreshing ? "Đang đồng bộ..." : "Làm mới"}</span>
          </button>
        </div>
      </section>

      {/* LAST UPDATED STATUS BAR */}
      <div className="admin-live-bar">
        <div className="admin-live-status">
          <span className="admin-live-pulse" aria-hidden="true" />
          <span>Dữ liệu vận hành trực tiếp</span>
          {lastUpdated && (
            <span className="admin-updated-time">
              (Đồng bộ lúc: {lastUpdated})
            </span>
          )}
        </div>
        <div className="admin-active-branch-name">
          {selectedBranch
            ? `Đang lọc: ${branches.find((b) => b.slug === selectedBranch)?.name || selectedBranch}`
            : "Toàn bộ hệ thống cửa hàng"}
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="form-alert error admin-dashboard-alert" role="alert">
          <div className="alert-content">
            <strong>Lỗi tải dữ liệu:</strong> {error}
          </div>
          <button
            type="button"
            className="button secondary-button compact"
            onClick={handleRefresh}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* OVERDUE CRITICAL ALERT BANNER */}
      {dashboardData.overdue.length > 0 && (
        <div className="admin-critical-banner" role="status">
          <span className="critical-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
          <div className="critical-text">
            <strong>Cảnh báo vận hành:</strong> Có{" "}
            <strong>{dashboardData.overdue.length} đơn thuê quá hạn</strong> chưa
            được khách trả máy. Vui lòng kiểm tra và liên hệ khách hàng ngay.
          </div>
          <button
            type="button"
            className="button danger-button compact"
            onClick={() => setActiveTab("overdue")}
          >
            Xem danh sách ({dashboardData.overdue.length})
          </button>
        </div>
      )}

      {/* KEY METRICS GRID */}
      <section
        className="admin-metrics-grid"
        aria-label="Các chỉ số vận hành quan trọng"
      >
        {/* Metric 1: Đơn chờ xác nhận */}
        <div className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-title">Đơn chờ xác nhận</span>
            <span className="admin-stat-icon warning" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </span>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-number">
              {loading ? "--" : dashboardData.pendingCount}
            </span>
            <span className="admin-stat-desc">
              Đơn mới từ khách hàng cần duyệt thiết bị
            </span>
          </div>
          <div className="admin-stat-footer">
            <Link to="/admin/orders?status=PENDING" className="admin-stat-link">
              Xử lý đơn thuê →
            </Link>
          </div>
        </div>

        {/* Metric 2: Lịch nhận máy hôm nay */}
        <div className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-title">Nhận máy hôm nay</span>
            <span className="admin-stat-icon info" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              </svg>
            </span>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-number">
              {loading ? "--" : dashboardData.pickupsToday.length}
            </span>
            <span className="admin-stat-desc">
              Đơn hẹn bắt đầu thuê trong ngày
            </span>
          </div>
          <div className="admin-stat-footer">
            <button
              type="button"
              className="admin-stat-btn"
              onClick={() => setActiveTab("pickups")}
            >
              Xem danh sách nhận máy →
            </button>
          </div>
        </div>

        {/* Metric 3: Lịch trả máy hôm nay */}
        <div className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-title">Trả máy hôm nay</span>
            <span className="admin-stat-icon success" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 14 4 9 9 4"/>
                <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
              </svg>
            </span>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-number">
              {loading ? "--" : dashboardData.returnsToday.length}
            </span>
            <span className="admin-stat-desc">
              Đơn đến hạn kết thúc và hoàn trả máy
            </span>
          </div>
          <div className="admin-stat-footer">
            <button
              type="button"
              className="admin-stat-btn"
              onClick={() => setActiveTab("returns")}
            >
              Xem danh sách trả máy →
            </button>
          </div>
        </div>

        {/* Metric 4: Đơn quá hạn trả */}
        <div
          className={`admin-stat-card ${dashboardData.overdue.length > 0 ? "is-danger" : ""}`}
        >
          <div className="admin-stat-head">
            <span className="admin-stat-title">Đơn quá hạn trả</span>
            <span
              className={`admin-stat-icon ${dashboardData.overdue.length > 0 ? "danger" : "neutral"}`}
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-number">
              {loading ? "--" : dashboardData.overdue.length}
            </span>
            <span className="admin-stat-desc">
              Đơn chưa hoàn trả sau hạn hợp đồng
            </span>
          </div>
          <div className="admin-stat-footer">
            <button
              type="button"
              className="admin-stat-btn text-danger"
              onClick={() => setActiveTab("overdue")}
            >
              Kiểm tra quá hạn →
            </button>
          </div>
        </div>

        {/* Metric 5: Tổng mẫu thiết bị */}
        <div className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-title">Mẫu máy trong catalog</span>
            <span className="admin-stat-icon primary" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </span>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-number">
              {loading ? "--" : totalModels}
            </span>
            <span className="admin-stat-desc">
              Mẫu máy ảnh kỹ thuật số & máy film
            </span>
          </div>
          <div className="admin-stat-footer">
            <Link to="/admin/products" className="admin-stat-link">
              Quản lý mẫu máy →
            </Link>
          </div>
        </div>

        {/* Metric 6: Tổng chi nhánh & Người dùng */}
        <div className="admin-stat-card">
          <div className="admin-stat-head">
            <span className="admin-stat-title">Chi nhánh & Mạng lưới</span>
            <span className="admin-stat-icon purple" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18"/>
                <path d="M5 21V7l8-4v18"/>
                <path d="M19 21V11l-6-4"/>
              </svg>
            </span>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-number">
              {loading ? "--" : branches.length}
            </span>
            <span className="admin-stat-desc">
              {isAdmin && totalUsers !== null
                ? `${branches.length} chi nhánh · ${totalUsers} tài khoản người dùng`
                : "Chi nhánh tiếp nhận và lưu kho thiết bị"}
            </span>
          </div>
          <div className="admin-stat-footer">
            <Link to="/admin/branches" className="admin-stat-link">
              Quản lý chi nhánh →
            </Link>
          </div>
        </div>
      </section>

      {/* OPERATIONS WORKFLOW TABS & ACTION TABLE */}
      <section className="admin-workflow-section">
        <div className="admin-section-header">
          <div className="admin-tab-nav" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "pickups"}
              className={`admin-tab-btn ${activeTab === "pickups" ? "active" : ""}`}
              onClick={() => setActiveTab("pickups")}
            >
              <span>Lịch nhận máy hôm nay</span>
              <span className="admin-tab-count">
                {dashboardData.pickupsToday.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "returns"}
              className={`admin-tab-btn ${activeTab === "returns" ? "active" : ""}`}
              onClick={() => setActiveTab("returns")}
            >
              <span>Lịch trả máy hôm nay</span>
              <span className="admin-tab-count">
                {dashboardData.returnsToday.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "overdue"}
              className={`admin-tab-btn ${activeTab === "overdue" ? "active danger" : ""}`}
              onClick={() => setActiveTab("overdue")}
            >
              <span>Cảnh báo quá hạn</span>
              <span
                className={`admin-tab-count ${dashboardData.overdue.length > 0 ? "is-danger" : ""}`}
              >
                {dashboardData.overdue.length}
              </span>
            </button>
          </div>
        </div>

        {/* WORKFLOW DATA TABLE */}
        <div className="admin-table-wrapper">
          {loading ? (
            <div className="admin-table-loading">
              <span className="admin-spinner" aria-hidden="true" />
              <p>Đang tải danh sách đơn vận hành...</p>
            </div>
          ) : currentTabItems.length === 0 ? (
            <div className="admin-table-empty">
              <span className="empty-icon" aria-hidden="true">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
              </span>
              <h3>
                {activeTab === "pickups"
                  ? "Không có lịch nhận máy nào trong ngày hôm nay"
                  : activeTab === "returns"
                    ? "Không có đơn thuê nào cần thu hồi trong ngày hôm nay"
                    : "Không có đơn thuê nào bị quá hạn trả máy"}
              </h3>
              <p>
                {activeTab === "pickups"
                  ? "Tất cả các đơn bắt đầu thuê trong ngày đã được xử lý hoặc chưa phát sinh đơn mới."
                  : activeTab === "returns"
                    ? "Tất cả các đơn kết thúc thuê trong ngày đã được kiểm tra hoàn tất."
                    : "Toàn bộ khách hàng đang thuê máy đều trong thời hạn hợp đồng hợp lệ."}
              </p>
              <Link to="/admin/orders" className="button secondary-button compact">
                Xem toàn bộ đơn thuê
              </Link>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Mã đơn</th>
                  <th scope="col">Khách hàng & SĐT</th>
                  <th scope="col">Thiết bị thuê</th>
                  <th scope="col">Chi nhánh</th>
                  <th scope="col">Thời gian</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Số tiền cần thu</th>
                  <th scope="col" className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentTabItems.map((booking) => {
                  const customerName =
                    booking.customer?.fullName || booking.contactName || "Khách thuê";
                  const customerPhone =
                    booking.customer?.phone || booking.contactPhone || "--";
                  const itemsText =
                    booking.items?.map((item) => item.name).join(", ") ||
                    "Thiết bị thuê";

                  return (
                    <tr key={booking.id}>
                      <td className="code-cell">
                        <strong>{booking.code || booking.id.slice(0, 8)}</strong>
                      </td>
                      <td>
                        <div className="admin-user-cell">
                          <span className="user-name">{customerName}</span>
                          <span className="user-phone">{customerPhone}</span>
                        </div>
                      </td>
                      <td>
                        <span className="admin-items-desc" title={itemsText}>
                          {itemsText}
                        </span>
                      </td>
                      <td>
                        <span className="admin-branch-pill">
                          {booking.branch?.name || "Chi nhánh"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-date-cell">
                          <span>Từ: {formatDate(booking.startDate)}</span>
                          <span>Đến: {formatDate(booking.endDate)}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          status={booking.status}
                          isOverdue={booking.isOverdue}
                        />
                      </td>
                      <td className="amount-cell">
                        <strong>
                          {formatCurrency(booking.totalDueAtPickup || booking.totalAmount)}
                        </strong>
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/admin/orders/${booking.id}`}
                          className="button secondary-button compact"
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;