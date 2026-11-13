import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { adminService } from "../../services/adminService";

function formatDate(isoStr) {
  if (!isoStr) return "--";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function getInitials(name = "") {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ROLE_CONFIG = {
  ADMIN: {
    label: "Quản trị viên (ADMIN)",
    shortLabel: "ADMIN",
    badgeClass: "role-badge-admin",
    description: "Toàn quyền quản trị hệ thống, danh mục, thiết bị, chi nhánh, đơn hàng và phân quyền người dùng.",
  },
  STAFF: {
    label: "Nhân viên vận hành (STAFF)",
    shortLabel: "STAFF",
    badgeClass: "role-badge-staff",
    description: "Vận hành giao nhận thiết bị, kiểm tra máy, tải ảnh biên bản và khóa lịch bảo trì.",
  },
  RENTER: {
    label: "Khách hàng thuê máy (RENTER)",
    shortLabel: "RENTER",
    badgeClass: "role-badge-renter",
    description: "Xem danh mục, đặt thuê thiết bị, thanh toán cọc và theo dõi tiến độ đơn hàng.",
  },
  HOST: {
    label: "Chủ máy đối tác (HOST)",
    shortLabel: "HOST",
    badgeClass: "role-badge-host",
    description: "Chủ thiết bị đối tác liên kết ký gửi máy trên Borroll (vai trò hệ thống đặc thù).",
    isSystemRole: true,
  },
};

function AdminUsersPage({ defaultRole = "ALL" }) {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query role filter
  const selectedRole = searchParams.get("role") || defaultRole;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  // Detail Drawer State
  const [detailUser, setDetailUser] = useState(null);

  // Edit Access Modal State
  const [editTarget, setEditTarget] = useState(null);
  const [formRoles, setFormRoles] = useState([]);
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Users from GET /admin/users
  useEffect(() => {
    let active = true;

    const params = {
      page,
      pageSize,
    };
    if (debouncedSearch) {
      params.q = debouncedSearch;
    }
    if (selectedRole !== "ALL") {
      params.role = selectedRole;
    }

    adminService
      .getAdminUsers(params)
      .then((data) => {
        if (!active) return;
        setUsers(data.items || []);
        setTotal(data.total || 0);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err?.message ||
            "Không thể tải danh sách tài khoản người dùng từ máy chủ. Vui lòng kiểm tra quyền hạn của bạn.",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, pageSize, debouncedSearch, selectedRole, refreshKey]);

  // Role filter change
  const handleRoleFilterChange = (e) => {
    const val = e.target.value;
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (val === "ALL") next.delete("role");
    else next.set("role", val);
    setSearchParams(next);
  };

  // Quick filter tab handler
  const handleSelectRoleQuickFilter = (val) => {
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (val === "ALL") next.delete("role");
    else next.set("role", val);
    setSearchParams(next);
  };

  // Status filter change (client-side filter on current list)
  const handleStatusFilterChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("ALL");
    setPage(1);
    setSearchParams({});
  };

  // Displayed users filtered by status
  const displayedUsers = useMemo(() => {
    if (selectedStatus === "ALL") return users;
    return users.filter((u) => u.status === selectedStatus);
  }, [users, selectedStatus]);

  // Metrics from current dataset
  const stats = useMemo(() => {
    let adminCount = 0;
    let staffCount = 0;
    let renterCount = 0;
    let activeCount = 0;
    let suspendedCount = 0;

    users.forEach((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : [];
      if (roles.includes("ADMIN")) adminCount++;
      if (roles.includes("STAFF")) staffCount++;
      if (roles.includes("RENTER")) renterCount++;

      if (u.status === "ACTIVE") activeCount++;
      else if (u.status === "SUSPENDED") suspendedCount++;
    });

    return {
      total,
      currentCount: users.length,
      adminCount,
      staffCount,
      renterCount,
      activeCount,
      suspendedCount,
    };
  }, [users, total]);

  // Open Edit Access Modal
  const openEditModal = (targetUser) => {
    setEditTarget(targetUser);
    const initialRoles = Array.isArray(targetUser.roles) ? [...targetUser.roles] : ["RENTER"];
    setFormRoles(initialRoles);
    setFormStatus(targetUser.status || "ACTIVE");
    setModalError("");
  };

  const isTargetHost = Boolean(
    editTarget &&
    Array.isArray(editTarget.roles) &&
    editTarget.roles.includes("HOST"),
  );

  // Toggle role in form
  const handleToggleRole = (roleKey) => {
    // If target has HOST role, role modifications are locked to protect partner role integrity
    if (isTargetHost) {
      setModalError("Tài khoản đối tác có vai trò HOST được bảo vệ cố định. Không thể thay đổi vai trò qua giao diện này để tránh mất liên kết đối tác.");
      return;
    }

    if (roleKey === "HOST") {
      setModalError("Vai trò HOST chỉ được cấp thông qua quy trình đối tác ký gửi thiết bị.");
      return;
    }

    // Safeguard: Cannot remove ADMIN from yourself
    const isSelf = currentUser && currentUser.id === editTarget?.id;
    if (isSelf && roleKey === "ADMIN" && formRoles.includes("ADMIN")) {
      setModalError("Cảnh báo an toàn: Bạn không thể tự bỏ quyền ADMIN của chính tài khoản mình.");
      return;
    }

    setModalError("");
    setFormRoles((prev) => {
      if (prev.includes(roleKey)) {
        if (prev.length <= 1) {
          setModalError("Người dùng phải có ít nhất một vai trò hợp lệ (ADMIN, STAFF hoặc RENTER).");
          return prev;
        }
        return prev.filter((r) => r !== roleKey);
      }
      return [...prev, roleKey];
    });
  };

  // Submit User Access Update
  const handleSaveAccess = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    // Safety check for self
    const isSelf = currentUser && currentUser.id === editTarget.id;
    if (isSelf && !formRoles.includes("ADMIN")) {
      setModalError("Admin không thể tự gỡ quyền ADMIN của chính mình.");
      return;
    }
    if (isSelf && formStatus === "SUSPENDED") {
      setModalError("Bạn không thể tự khóa tài khoản quản trị của chính mình.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    try {
      const payload = {};

      if (isTargetHost) {
        // Backend UpdateAdminUserDto only allows [RENTER, STAFF, ADMIN] in roles.
        // Sending roles with "HOST" fails validation. Sending roles without "HOST" deletes HOST from userRole.
        // Therefore, for accounts with HOST, we DO NOT send `roles` in payload; we only update `status`.
        payload.status = formStatus;
      } else {
        const cleanRoles = formRoles.filter((r) => ["ADMIN", "STAFF", "RENTER"].includes(r));
        if (cleanRoles.length === 0) {
          setModalError("Vui lòng chọn ít nhất một vai trò hợp lệ (ADMIN, STAFF hoặc RENTER).");
          setModalSubmitting(false);
          return;
        }
        payload.roles = cleanRoles;
        payload.status = formStatus;
      }

      await adminService.updateAdminUser(editTarget.id, payload);
      setSuccessMsg(
        `Đã cập nhật thành công phân quyền và trạng thái cho người dùng "${editTarget.fullName || editTarget.email}".`,
      );
      setEditTarget(null);
      if (detailUser && detailUser.id === editTarget.id) {
        setDetailUser((prev) => ({
          ...prev,
          roles: isTargetHost ? editTarget.roles : payload.roles,
          status: formStatus,
        }));
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      let errMsg = err?.message || "Không thể cập nhật phân quyền người dùng.";
      if (err?.details?.fields && typeof err.details.fields === "object") {
        const fieldErrors = Object.entries(err.details.fields)
          .map(([field, msg]) => `• ${field}: ${msg}`)
          .join("\n");
        if (fieldErrors) {
          errMsg = `${errMsg}\nChi tiết lỗi từ máy chủ:\n${fieldErrors}`;
        }
      } else if (err?.details && typeof err.details === "object" && Object.keys(err.details).length > 0) {
        const detailLines = Object.entries(err.details)
          .filter(([k]) => k !== "fields")
          .map(([k, v]) => `• ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
          .join("\n");
        if (detailLines) {
          errMsg = `${errMsg}\n${detailLines}`;
        }
      }
      setModalError(errMsg);
    } finally {
      setModalSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="admin-users-page">
      {/* HEADER SECTION */}
      <div className="admin-page-header">
        <div className="admin-page-title-wrap">
          <div className="admin-breadcrumb">
            <Link to="/admin">Admin</Link>
            <span className="separator">/</span>
            <span>Tài khoản & Phân quyền</span>
          </div>
          <h1 className="admin-page-title">
            {selectedRole === "RENTER"
              ? "Quản lý Khách thuê (RENTER)"
              : "Quản lý Tài khoản & Phân quyền RBAC"}
          </h1>
          <p className="admin-page-desc">
            {selectedRole === "RENTER"
              ? "Danh sách khách hàng thuê thiết bị trên Borroll. Theo dõi thông tin tài khoản, phân quyền và kiểm soát trạng thái hoạt động."
              : "Quản trị danh sách người dùng toàn hệ thống, cấp quyền ADMIN / STAFF / RENTER và kiểm soát trạng thái hoạt động tài khoản."}
          </p>
        </div>

        <div className="admin-page-actions">
          <span className="admin-rbac-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            RBAC: ADMIN Level Only
          </span>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="admin-alert success" role="alert">
          <span>{successMsg}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setSuccessMsg("")}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="admin-alert danger" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setError(null)}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="admin-quick-stats-row">
        <div
          className={`admin-quick-stat-card is-interactive ${selectedRole === "ALL" ? "is-selected-kpi" : ""}`}
          onClick={() => handleSelectRoleQuickFilter("ALL")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleSelectRoleQuickFilter("ALL")}
          title="Nhấp để hiển thị toàn bộ người dùng"
        >
          <span className="stat-label">Tổng người dùng hệ thống</span>
          <strong className="stat-value">{stats.total}</strong>
          <span className="stat-sub">Đã đăng ký tài khoản</span>
        </div>

        <div
          className={`admin-quick-stat-card is-interactive ${selectedRole === "RENTER" ? "is-selected-kpi" : ""}`}
          onClick={() => handleSelectRoleQuickFilter("RENTER")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleSelectRoleQuickFilter("RENTER")}
          title="Nhấp để lọc nhanh Khách thuê (RENTER)"
        >
          <span className="stat-label">Khách thuê (RENTER)</span>
          <strong className="stat-value text-success">{stats.renterCount}</strong>
          <span className="stat-sub">Khách hàng đặt thuê thiết bị</span>
        </div>

        <div
          className={`admin-quick-stat-card is-interactive ${selectedRole === "STAFF" ? "is-selected-kpi" : ""}`}
          onClick={() => handleSelectRoleQuickFilter("STAFF")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleSelectRoleQuickFilter("STAFF")}
          title="Nhấp để lọc nhanh Nhân viên (STAFF)"
        >
          <span className="stat-label">Nhân viên (STAFF)</span>
          <strong className="stat-value text-primary">{stats.staffCount}</strong>
          <span className="stat-sub">Vận hành kho & đơn</span>
        </div>

        <div
          className={`admin-quick-stat-card is-interactive ${selectedRole === "ADMIN" ? "is-selected-kpi" : ""}`}
          onClick={() => handleSelectRoleQuickFilter("ADMIN")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleSelectRoleQuickFilter("ADMIN")}
          title="Nhấp để lọc nhanh Quản trị viên (ADMIN)"
        >
          <span className="stat-label">Quản trị viên (ADMIN)</span>
          <strong className="stat-value text-purple">{stats.adminCount}</strong>
          <span className="stat-sub">Toàn quyền vận hành</span>
        </div>
      </div>

      {/* QUICK ROLE TABS / BỘ LỌC NHANH VAI TRÒ */}
      <div className="admin-user-role-tabs" role="tablist" aria-label="Bộ lọc nhanh vai trò tài khoản">
        <button
          type="button"
          role="tab"
          aria-selected={selectedRole === "ALL"}
          className={`admin-role-tab ${selectedRole === "ALL" ? "active" : ""}`}
          onClick={() => handleSelectRoleQuickFilter("ALL")}
        >
          <span>Tất cả người dùng</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={selectedRole === "RENTER"}
          className={`admin-role-tab ${selectedRole === "RENTER" ? "active" : ""}`}
          onClick={() => handleSelectRoleQuickFilter("RENTER")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Khách thuê (RENTER)</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={selectedRole === "STAFF"}
          className={`admin-role-tab ${selectedRole === "STAFF" ? "active" : ""}`}
          onClick={() => handleSelectRoleQuickFilter("STAFF")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Nhân viên (STAFF)</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={selectedRole === "ADMIN"}
          className={`admin-role-tab ${selectedRole === "ADMIN" ? "active" : ""}`}
          onClick={() => handleSelectRoleQuickFilter("ADMIN")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>Quản trị viên (ADMIN)</span>
        </button>
      </div>

      {/* SEARCH & FILTERS TOOLBAR */}
      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <span className="search-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        <div className="admin-filter-dropdowns">
          <div className="admin-select-wrapper">
            <label htmlFor="filter-user-role">Vai trò:</label>
            <select
              id="filter-user-role"
              className="admin-select-filter"
              value={selectedRole}
              onChange={handleRoleFilterChange}
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="RENTER">RENTER – Khách thuê</option>
              <option value="STAFF">STAFF – Nhân viên vận hành</option>
              <option value="ADMIN">ADMIN – Quản trị viên</option>
            </select>
          </div>

          <div className="admin-select-wrapper">
            <label htmlFor="filter-user-status">Trạng thái:</label>
            <select
              id="filter-user-status"
              className="admin-select-filter"
              value={selectedStatus}
              onChange={handleStatusFilterChange}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
              <option value="SUSPENDED">Bị khóa (SUSPENDED)</option>
            </select>
          </div>

          <button
            type="button"
            className="button secondary-button compact admin-filter-reset-btn"
            onClick={handleResetFilters}
          >
            Đặt lại bộ lọc
          </button>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-table-loading" role="status">
            <div className="admin-spinner" />
            <p>Đang tải danh sách người dùng...</p>
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className="admin-table-empty">
            <div className="empty-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3>
              {selectedRole === "RENTER"
                ? "Không tìm thấy khách thuê nào"
                : "Không tìm thấy người dùng nào"}
            </h3>
            <p>
              {selectedRole === "RENTER"
                ? "Không có tài khoản khách thuê nào phù hợp với từ khóa hoặc bộ lọc trạng thái đã chọn."
                : "Không có tài khoản nào phù hợp với từ khóa hoặc bộ lọc đã chọn."}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Thông tin liên hệ</th>
                <th>Phân quyền (Roles)</th>
                <th>Trạng thái</th>
                <th>Ngày đăng ký</th>
                <th className="text-right" style={{ minWidth: "180px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayedUsers.map((u) => {
                const isCurrent = currentUser && currentUser.id === u.id;
                const userRoles = Array.isArray(u.roles) ? u.roles : [];

                return (
                  <tr key={u.id} className={isCurrent ? "is-current-user-row" : ""}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="user-avatar-badge" aria-hidden="true">
                          {getInitials(u.fullName)}
                        </div>
                        <div className="user-meta">
                          <div className="user-name-line">
                            <strong>{u.fullName || "Chưa cập nhật tên"}</strong>
                            {isCurrent && (
                              <span className="current-user-tag">Bạn</span>
                            )}
                          </div>
                          <span className="user-id-text" title={u.id}>
                            ID: {u.id.slice(0, 10)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="admin-contact-cell">
                        <span className="user-email">{u.email}</span>
                        <span className="user-phone">{u.phone || "Chưa có SĐT"}</span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-roles-pills">
                        {userRoles.map((r) => {
                          const conf = ROLE_CONFIG[r] || {
                            shortLabel: r,
                            badgeClass: "role-badge-renter",
                          };
                          return (
                            <span
                              key={r}
                              className={`role-badge ${conf.badgeClass}`}
                              title={conf.label}
                            >
                              {conf.shortLabel}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`admin-pill-badge ${u.status === "ACTIVE" ? "unit-status-available" : "unit-status-retired"}`}
                      >
                        {u.status === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}
                      </span>
                    </td>

                    <td>
                      <span className="admin-date-text">
                        {formatDate(u.createdAt)}
                      </span>
                    </td>

                    <td className="text-right">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="button text-button compact"
                          onClick={() => setDetailUser(u)}
                          title="Xem thông tin chi tiết tài khoản"
                        >
                          Chi tiết
                        </button>

                        <button
                          type="button"
                          className="button secondary-button compact"
                          onClick={() => openEditModal(u)}
                          title="Phân quyền vai trò và trạng thái"
                        >
                          Phân quyền
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="admin-pagination-bar">
          <span className="pagination-info">
            Trang {page} / {totalPages} (Tổng số {total} tài khoản)
          </span>
          <div className="pagination-buttons">
            <button
              type="button"
              className="button secondary-button compact"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Trang trước
            </button>
            <span className="page-indicator">{page}</span>
            <button
              type="button"
              className="button secondary-button compact"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Trang sau →
            </button>
          </div>
        </div>
      )}

      {/* EDIT ACCESS & ROLES MODAL */}
      {editTarget && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => !modalSubmitting && setEditTarget(null)}
        >
          <div
            className="admin-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head">
              <h3>Phân quyền & Trạng thái tài khoản</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setEditTarget(null)}
                disabled={modalSubmitting}
                aria-label="Đóng modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccess} className="admin-modal-form">
              {modalError && (
                <div className="admin-form-alert danger" role="alert">
                  {modalError}
                </div>
              )}

              <div className="admin-user-summary-card">
                <div className="user-avatar-badge large" aria-hidden="true">
                  {getInitials(editTarget.fullName)}
                </div>
                <div className="admin-user-summary-info">
                  <h4 className="user-name-title">
                    {editTarget.fullName || "Người dùng"}
                    {currentUser?.id === editTarget.id && (
                      <span className="current-user-tag inline">Tài khoản của bạn</span>
                    )}
                  </h4>
                  <p className="user-email-sub">{editTarget.email}</p>
                  <p className="user-id-sub">Mã định danh: {editTarget.id}</p>
                </div>
              </div>

              {isTargetHost && (
                <div className="admin-host-notice" role="status">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <div>
                    <strong>Tài khoản đối tác có vai trò Chủ máy (HOST)</strong>
                    <p>
                      Vai trò HOST của đối tác được hệ thống bảo vệ cố định và không thể chỉnh sửa qua giao diện phân quyền người dùng thông thường để đảm bảo an toàn dữ liệu. Bạn vẫn có thể cập nhật trạng thái hoạt động (Khóa / Kích hoạt) của tài khoản bên dưới.
                    </p>
                  </div>
                </div>
              )}

              {/* Roles selection */}
              <div className="admin-form-group">
                <label>
                  Phân quyền vai trò (Roles) <span className="required">*</span>
                </label>
                <p className="field-hint">
                  Một tài khoản có thể mang nhiều vai trò đồng thời. Quyền hạn của tài khoản là tập hợp các quyền của từng vai trò được cấp.
                </p>

                <div className="admin-roles-checklist">
                  {Object.entries(ROLE_CONFIG).map(([roleKey, conf]) => {
                    const isChecked = formRoles.includes(roleKey);
                    const isSelfAdmin =
                      currentUser?.id === editTarget.id && roleKey === "ADMIN";
                    const isHostRole = roleKey === "HOST";
                    const isLocked = isSelfAdmin || isTargetHost || isHostRole;

                    return (
                      <label
                        key={roleKey}
                        className={`role-choice-card ${isChecked ? "is-selected" : ""} ${isLocked ? "is-locked" : ""}`}
                      >
                        <div className="role-choice-head">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRole(roleKey)}
                            disabled={modalSubmitting || isLocked}
                          />
                          <span className={`role-badge ${conf.badgeClass}`}>
                            {conf.shortLabel}
                          </span>
                          <strong>{conf.label}</strong>
                          {isSelfAdmin && (
                            <span className="lock-tag" title="Admin không thể tự gỡ quyền của chính mình">
                              (Được khóa - Tài khoản đang đăng nhập)
                            </span>
                          )}
                          {isTargetHost && !isSelfAdmin && (
                            <span className="lock-tag" title="Bảo vệ vai trò đối tác">
                              (Được khóa - Bảo vệ vai trò đối tác)
                            </span>
                          )}
                          {!isTargetHost && isHostRole && (
                            <span className="lock-tag" title="Cấp qua quy trình đối tác">
                              (Quy trình đối tác)
                            </span>
                          )}
                        </div>
                        <p className="role-choice-desc">{conf.description}</p>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status selection */}
              <div className="admin-form-group">
                <label htmlFor="user-status-select">Trạng thái hoạt động tài khoản</label>
                <select
                  id="user-status-select"
                  className="admin-form-control"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  disabled={modalSubmitting || currentUser?.id === editTarget.id}
                >
                  <option value="ACTIVE">ACTIVE - Hoạt động bình thường</option>
                  <option value="SUSPENDED">SUSPENDED - Tạm ngưng / Khóa tài khoản</option>
                </select>
                {currentUser?.id === editTarget.id && (
                  <span className="field-hint text-warning">
                    Bạn không thể tự vô hiệu hóa tài khoản quản trị đang đăng nhập của chính mình.
                  </span>
                )}
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={() => setEditTarget(null)}
                  disabled={modalSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="button primary-button compact"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Đang lưu quyền..." : "Cập nhật phân quyền"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DETAIL DRAWER */}
      {detailUser && (
        <div
          className="admin-drawer-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setDetailUser(null)}
        >
          <div
            className="admin-detail-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-drawer-header">
              <div>
                <span className="drawer-badge">HỒ SƠ TÀI KHOẢN NGƯỜI DÙNG</span>
                <h2>{detailUser.fullName || "Người dùng"}</h2>
                <p className="drawer-sub">{detailUser.email}</p>
              </div>
              <button
                type="button"
                className="admin-drawer-close"
                onClick={() => setDetailUser(null)}
                aria-label="Đóng ngăn chi tiết"
              >
                ✕
              </button>
            </div>

            <div className="admin-drawer-content">
              {/* Basic Info */}
              <div className="admin-drawer-section">
                <h4 className="drawer-section-title">Thông tin tài khoản</h4>
                <div className="admin-drawer-grid">
                  <div className="drawer-grid-item">
                    <span className="label">Mã định danh (ID)</span>
                    <strong className="value font-mono">{detailUser.id}</strong>
                  </div>
                  <div className="drawer-grid-item">
                    <span className="label">Số điện thoại</span>
                    <strong className="value">{detailUser.phone || "Chưa cập nhật"}</strong>
                  </div>
                  <div className="drawer-grid-item">
                    <span className="label">Trạng thái</span>
                    <span
                      className={`admin-pill-badge ${detailUser.status === "ACTIVE" ? "unit-status-available" : "unit-status-retired"}`}
                    >
                      {detailUser.status === "ACTIVE" ? "Đang hoạt động" : "Tạm khóa"}
                    </span>
                  </div>
                  <div className="drawer-grid-item">
                    <span className="label">Thời gian tham gia</span>
                    <strong className="value">{formatDate(detailUser.createdAt)}</strong>
                  </div>
                </div>
              </div>

              {/* Roles Breakdown */}
              <div className="admin-drawer-section">
                <h4 className="drawer-section-title">Vai trò & Quyền hạn hiện tại</h4>
                <div className="admin-roles-breakdown">
                  {Array.isArray(detailUser.roles) && detailUser.roles.map((r) => {
                    const conf = ROLE_CONFIG[r] || {
                      label: r,
                      badgeClass: "role-badge-renter",
                      description: "",
                    };
                    return (
                      <div key={r} className="role-breakdown-card">
                        <span className={`role-badge ${conf.badgeClass}`}>
                          {r}
                        </span>
                        <div>
                          <strong>{conf.label}</strong>
                          <p>{conf.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Operational Link */}
              <div className="admin-drawer-section">
                <h4 className="drawer-section-title">Tra cứu đơn thuê</h4>
                <p className="section-desc">
                  Kiểm tra toàn bộ lịch sử thuê thiết bị, tiền đặt cọc và tình trạng thanh toán của người dùng này trong hệ thống vận hành.
                </p>
                <Link
                  to={`/admin/orders?q=${encodeURIComponent(detailUser.email || detailUser.fullName)}`}
                  className="button secondary-button compact full-width"
                >
                  Tra cứu các đơn thuê của người dùng này →
                </Link>
              </div>
            </div>

            <div className="admin-drawer-footer">
              <button
                type="button"
                className="button secondary-button compact"
                onClick={() => {
                  const target = detailUser;
                  setDetailUser(null);
                  openEditModal(target);
                }}
              >
                Chỉnh sửa quyền
              </button>
              <button
                type="button"
                className="button primary-button compact"
                onClick={() => setDetailUser(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
