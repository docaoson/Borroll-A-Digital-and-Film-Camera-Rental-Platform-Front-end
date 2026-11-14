import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { adminService } from "../../services/adminService";
import { catalogService } from "../../services/catalogService";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AdminBranchesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const isAdmin = useMemo(() => {
    const rawRoles = user?.roles || (user?.role ? [user.role] : []);
    return rawRoles.includes("ADMIN");
  }, [user]);

  // Branch list state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [refreshKey, setRefreshKey] = useState(0);

  // Unit counts cache map: { [branchSlug]: number }
  const [branchUnitCounts, setBranchUnitCounts] = useState({});

  // Modal State (Create / Edit Branch)
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [formBranchId, setFormBranchId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formOpenHours, setFormOpenHours] = useState("08:00 - 20:00 hàng ngày");
  const [formMapUrl, setFormMapUrl] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Branch Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Branch Detail Drawer
  const [detailBranch, setDetailBranch] = useState(null);
  const [branchUnits, setBranchUnits] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch branches
  useEffect(() => {
    let active = true;

    const params = {};
    if (debouncedSearch) {
      params.q = debouncedSearch;
    }

    const fetcher = isAdmin
      ? adminService.getAdminBranches(params)
      : catalogService.getBranches();

    fetcher
      .then((data) => {
        if (!active) return;
        const items = Array.isArray(data) ? data : data?.items || [];
        setBranches(items);
        setError(null);

        // Fetch unit counts for each branch
        items.forEach((b) => {
          if (b.slug) {
            adminService
              .getStaffUnits({ branch: b.slug, pageSize: 1 })
              .then((uData) => {
                if (!active) return;
                setBranchUnitCounts((prev) => ({
                  ...prev,
                  [b.slug]: uData?.total ?? 0,
                }));
              })
              .catch(() => {
                // Ignore silent count failure
              });
          }
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err?.message ||
            "Không thể tải danh sách chi nhánh cửa hàng. Vui lòng thử lại sau.",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, refreshKey, isAdmin]);

  // Open Detail Drawer
  const openDetailDrawer = async (branch) => {
    setDetailBranch(branch);
    setUnitsLoading(true);
    try {
      const uRes = await adminService.getStaffUnits({ branch: branch.slug, pageSize: 50 });
      setBranchUnits(uRes.items || []);
    } catch {
      setBranchUnits([]);
    } finally {
      setUnitsLoading(false);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setFormBranchId(null);
    setFormName("");
    setFormSlug("");
    setIsSlugManuallyEdited(false);
    setFormAddress("");
    setFormPhone("");
    setFormOpenHours("08:00 - 20:00 hàng ngày");
    setFormMapUrl("");
    setFormIsActive(true);
    setModalError("");
  };

  // Handle URL query to auto open branch detail or create modal
  useEffect(() => {
    const targetSlug = searchParams.get("branch");
    const isNew = searchParams.get("action") === "new" && isAdmin;
    if (!targetSlug && !isNew) return;

    const timer = setTimeout(() => {
      if (targetSlug && branches.length > 0) {
        const match = branches.find((b) => b.slug === targetSlug);
        if (match) {
          openDetailDrawer(match);
        }
      }
      if (isNew) {
        openCreateModal();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [branches, searchParams, isAdmin]);

  // Filtered branches
  const displayedBranches = useMemo(() => {
    return branches.filter((b) => {
      if (statusFilter === "ACTIVE") return b.isActive === true;
      if (statusFilter === "INACTIVE") return b.isActive === false;
      return true;
    });
  }, [branches, statusFilter]);

  // KPI calculations
  const stats = useMemo(() => {
    let activeCount = 0;
    let inactiveCount = 0;
    let totalAssignedUnits = 0;

    branches.forEach((b) => {
      if (b.isActive) activeCount++;
      else inactiveCount++;
      totalAssignedUnits += branchUnitCounts[b.slug] || 0;
    });

    return {
      total: branches.length,
      active: activeCount,
      inactive: inactiveCount,
      totalUnits: totalAssignedUnits,
    };
  }, [branches, branchUnitCounts]);

  // Open Edit Modal
  const openEditModal = (branch) => {
    setModalMode("edit");
    setFormBranchId(branch.id);
    setFormName(branch.name || "");
    setFormSlug(branch.slug || "");
    setIsSlugManuallyEdited(true);
    setFormAddress(branch.address || "");
    setFormPhone(branch.phone || "");
    setFormOpenHours(branch.openHours || "08:00 - 20:00 hàng ngày");
    setFormMapUrl(branch.mapUrl || "");
    setFormIsActive(branch.isActive ?? true);
    setModalError("");
  };

  // Form slug auto-fill
  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormName(val);
    if (!isSlugManuallyEdited) {
      setFormSlug(slugify(val));
    }
  };

  // Submit Branch Form (Create / Edit)
  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError("Vui lòng nhập tên chi nhánh cửa hàng.");
      return;
    }
    if (!formSlug.trim()) {
      setModalError("Đường dẫn tĩnh (slug) không được để trống.");
      return;
    }
    if (!formAddress.trim()) {
      setModalError("Vui lòng nhập địa chỉ cụ thể của chi nhánh.");
      return;
    }
    if (!formPhone.trim()) {
      setModalError("Vui lòng nhập số điện thoại hotline của chi nhánh.");
      return;
    }
    if (!formOpenHours.trim()) {
      setModalError("Vui lòng nhập khung giờ mở cửa đón khách.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    const payload = {
      name: formName.trim(),
      slug: formSlug.trim().toLowerCase(),
      address: formAddress.trim(),
      phone: formPhone.trim(),
      openHours: formOpenHours.trim(),
      mapUrl: formMapUrl.trim() || null,
      isActive: formIsActive,
    };

    try {
      if (modalMode === "create") {
        await adminService.createAdminBranch(payload);
        setSuccessMsg(`Đã tạo chi nhánh mới "${payload.name}" thành công.`);
      } else {
        await adminService.updateAdminBranch(formBranchId, payload);
        setSuccessMsg(`Đã cập nhật thông tin chi nhánh "${payload.name}".`);
      }
      setModalMode(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setModalError(
        err?.message ||
          "Không thể lưu chi nhánh. Vui lòng kiểm tra xem mã slug đã tồn tại chưa.",
      );
    } finally {
      setModalSubmitting(false);
    }
  };

  // Open Delete / Deactivate Modal
  const openDeleteModal = (branch) => {
    setDeleteTarget(branch);
    setDeleteError("");
  };

  // Confirm Delete / Deactivate
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await adminService.deleteAdminBranch(deleteTarget.id);
      if (res?.isActive === false) {
        setSuccessMsg(
          `Chi nhánh "${deleteTarget.name}" hiện đang chứa thiết bị máy ảnh trong kho, hệ thống đã tự động chuyển sang trạng thái "Tạm ngưng hoạt động" thay vì xóa vĩnh viễn để bảo toàn dữ liệu.`,
        );
      } else {
        setSuccessMsg(`Đã xóa hoàn toàn chi nhánh "${deleteTarget.name}".`);
      }
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setDeleteError(
        err?.message || "Không thể xóa chi nhánh. Vui lòng thử lại sau.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-branches-page">
      {/* HEADER SECTION */}
      <div className="admin-page-header">
        <div className="admin-page-title-wrap">
          <div className="admin-breadcrumb">
            <Link to="/admin">Admin</Link>
            <span className="separator">/</span>
            <span>Chi nhánh cửa hàng</span>
          </div>
          <h1 className="admin-page-title">Quản lý Chi nhánh cửa hàng</h1>
          <p className="admin-page-desc">
            Cấu hình địa chỉ cơ sở, số điện thoại tiếp đón, giờ mở cửa, liên kết bản đồ chỉ đường và phân bổ nguồn thiết bị máy ảnh trên toàn hệ thống.
          </p>
        </div>

        <div className="admin-page-actions">
          <Link to="/admin/inventory" className="button secondary-button compact">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            Xem kho thiết bị
          </Link>
          <button
              type="button"
              className="button primary-button compact"
              onClick={openCreateModal}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Thêm chi nhánh mới
          </button>
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
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span className="admin-stat-label">Tổng số chi nhánh</span>
          <strong className="admin-stat-value">{stats.total}</strong>
          <span className="admin-stat-description">Cơ sở Borroll</span>
        </div>

        <div className="admin-kpi-card">
          <span className="admin-stat-label">Đang hoạt động</span>
          <strong className="admin-stat-value text-success">{stats.active}</strong>
          <span className="admin-stat-description">Mở cửa đón khách giao nhận</span>
        </div>

        <div className="admin-kpi-card">
          <span className="admin-stat-label">Tạm ngưng hoạt động</span>
          <strong className="admin-stat-value text-muted">{stats.inactive}</strong>
          <span className="admin-stat-description">Bảo trì cơ sở / Chưa mở</span>
        </div>

        <div className="admin-kpi-card">
          <span className="admin-stat-label">Tổng máy ảnh phân bổ</span>
          <strong className="admin-stat-value text-primary">{stats.totalUnits}</strong>
          <span className="admin-stat-description">Thiết bị có serial tại kho</span>
        </div>
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
            placeholder="Tìm theo tên chi nhánh, địa chỉ..."
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
            <label htmlFor="filter-branch-status">Trạng thái:</label>
            <select
              id="filter-branch-status"
              className="admin-select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tất cả chi nhánh</option>
              <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
              <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
            </select>
          </div>

          <button
            type="button"
            className="button secondary-button compact admin-filter-reset-btn"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("ALL");
            }}
          >
            Đặt lại bộ lọc
          </button>
        </div>
      </div>

      {/* BRANCHES LIST & CARDS */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-table-loading" role="status">
            <div className="admin-spinner" />
            <p>Đang tải danh sách chi nhánh cửa hàng...</p>
          </div>
        ) : displayedBranches.length === 0 ? (
          <div className="admin-table-empty">
            <div className="empty-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18"/>
                <path d="M5 21V7l8-4v18"/>
                <path d="M19 21V11l-6-4"/>
              </svg>
            </div>
            <h3>Chưa tìm thấy chi nhánh nào</h3>
            <p>Không có chi nhánh phù hợp với điều kiện tìm kiếm hoặc bộ lọc.</p>
            {isAdmin && (
              <button
                type="button"
                className="button primary-button compact"
                onClick={openCreateModal}
              >
                + Thêm chi nhánh mới
              </button>
            )}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Chi nhánh & Định danh</th>
                <th>Địa chỉ cửa hàng</th>
                <th>Hotline</th>
                <th>Giờ phục vụ</th>
                <th>Vị trí bản đồ</th>
                <th>Thiết bị tại kho</th>
                <th>Trạng thái</th>
                <th className="text-right" style={{ minWidth: "180px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayedBranches.map((branch) => {
                const unitCount = branchUnitCounts[branch.slug] ?? 0;

                return (
                  <tr key={branch.id || branch.slug}>
                    <td>
                      <div className="admin-branch-title-cell">
                        <strong>{branch.name}</strong>
                        <span className="branch-slug-tag">slug: {branch.slug}</span>
                      </div>
                    </td>

                    <td>
                      <span className="admin-address-text" title={branch.address}>
                        {branch.address}
                      </span>
                    </td>

                    <td>
                      <span className="admin-phone-text">{branch.phone}</span>
                    </td>

                    <td>
                      <span className="admin-hours-text">{branch.openHours}</span>
                    </td>

                    <td>
                      {branch.mapUrl ? (
                        <a
                          href={branch.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-map-link"
                          title="Mở chỉ đường trên Google Maps"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          Xem bản đồ
                        </a>
                      ) : (
                        <span className="text-muted-italic">Chưa có link</span>
                      )}
                    </td>

                    <td>
                      <Link
                        to={`/admin/inventory?branch=${encodeURIComponent(branch.slug)}`}
                        className="admin-count-pill-link"
                        title="Xem danh sách các máy thuộc chi nhánh này"
                      >
                        <strong>{unitCount}</strong> máy ảnh →
                      </Link>
                    </td>

                    <td>
                      <span
                        className={`admin-pill-badge ${branch.isActive ? "unit-status-available" : "unit-status-retired"}`}
                      >
                        {branch.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                      </span>
                    </td>

                    <td className="text-right">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="button text-button compact"
                          onClick={() => openDetailDrawer(branch)}
                          title="Xem chi tiết & danh sách máy đang có"
                        >
                          Chi tiết
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              className="button secondary-button compact"
                              onClick={() => openEditModal(branch)}
                              title="Chỉnh sửa thông tin chi nhánh"
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              className="button danger-text-button compact"
                              onClick={() => openDeleteModal(branch)}
                              title="Ngừng hoạt động hoặc xóa"
                            >
                              Xóa
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalMode && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => !modalSubmitting && setModalMode(null)}
        >
          <div
            className="admin-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head">
              <h3>
                {modalMode === "create"
                  ? "Thêm chi nhánh cửa hàng mới"
                  : `Chỉnh sửa chi nhánh: ${formName}`}
              </h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setModalMode(null)}
                disabled={modalSubmitting}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBranchSubmit} className="admin-modal-form">
              {modalError && (
                <div className="admin-form-alert danger" role="alert">
                  {modalError}
                </div>
              )}

              <div className="admin-form-group">
                <label htmlFor="branch-name">
                  Tên chi nhánh cửa hàng <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="branch-name"
                  className="admin-form-control"
                  placeholder="Ví dụ: Chi nhánh Ba Đình, Borroll Studio Quận 1"
                  value={formName}
                  onChange={handleNameChange}
                  disabled={modalSubmitting}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="branch-slug">
                  Mã định danh (Slug) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="branch-slug"
                  className="admin-form-control"
                  placeholder="Ví dụ: ba-dinh, quan-1, ho-hoan-kiem"
                  value={formSlug}
                  onChange={(e) => {
                    setFormSlug(e.target.value);
                    setIsSlugManuallyEdited(true);
                  }}
                  disabled={modalSubmitting}
                  required
                />
                <span className="field-hint">
                  Đường dẫn tĩnh duy nhất dùng trong bộ lọc, phân bổ kho và định tuyến đơn thuê.
                </span>
              </div>

              <div className="admin-form-group">
                <label htmlFor="branch-address">
                  Địa chỉ chi tiết cơ sở <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="branch-address"
                  className="admin-form-control"
                  placeholder="Ví dụ: 12 Kim Mã, Ba Đình, Hà Nội"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  disabled={modalSubmitting}
                  required
                />
              </div>

              <div className="admin-form-row two-cols">
                <div className="admin-form-group">
                  <label htmlFor="branch-phone">
                    Số điện thoại hotline <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="branch-phone"
                    className="admin-form-control"
                    placeholder="Ví dụ: 024 3823 4567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    disabled={modalSubmitting}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="branch-hours">
                    Giờ mở cửa phục vụ <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="branch-hours"
                    className="admin-form-control"
                    placeholder="Ví dụ: 08:00 - 20:00 hàng ngày"
                    value={formOpenHours}
                    onChange={(e) => setFormOpenHours(e.target.value)}
                    disabled={modalSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label htmlFor="branch-map">Link Google Maps (tùy chọn)</label>
                <input
                  type="url"
                  id="branch-map"
                  className="admin-form-control"
                  placeholder="https://maps.google.com/..."
                  value={formMapUrl}
                  onChange={(e) => setFormMapUrl(e.target.value)}
                  disabled={modalSubmitting}
                />
                <span className="field-hint">
                  Đường link bản đồ để khách hàng dễ dàng tìm đường khi đến nhận máy.
                </span>
              </div>

              <div className="admin-form-checkbox-group">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    disabled={modalSubmitting}
                  />
                  <span>Chi nhánh đang mở cửa hoạt động (nhận khách đặt thuê & bàn giao máy)</span>
                </label>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={() => setModalMode(null)}
                  disabled={modalSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="button primary-button compact"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting
                    ? "Đang lưu..."
                    : modalMode === "create"
                      ? "Lưu chi nhánh"
                      : "Cập nhật chi nhánh"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / DEACTIVATE MODAL */}
      {deleteTarget && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="admin-modal-box confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-head danger-head">
              <h3>Xác nhận xóa chi nhánh</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {deleteError && (
                <div className="admin-form-alert danger" role="alert">
                  {deleteError}
                </div>
              )}
              <p>
                Bạn có chắc chắn muốn xóa chi nhánh{" "}
                <strong>"{deleteTarget.name}"</strong> (
                <code>{deleteTarget.slug}</code>)?
              </p>
              <div className="admin-modal-callout warning">
                <strong>Quy tắc vận hành Back-end:</strong>
                <p>
                  Nếu chi nhánh này hiện đang có các máy ảnh vật lý được gán trong kho, Back-end sẽ tự động chuyển chi nhánh sang trạng thái <code>Tạm ngưng hoạt động (isActive = false)</code> thay vì xóa hoàn toàn để đảm bảo tính toàn vẹn dữ liệu máy và hợp đồng thuê.
                </p>
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="button secondary-button compact"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Không xóa
              </button>
              <button
                type="button"
                className="button danger-button compact"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Đang xử lý..." : "Xác nhận xóa / Tạm ngưng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BRANCH DETAIL DRAWER */}
      {detailBranch && (
        <div
          className="admin-drawer-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setDetailBranch(null)}
        >
          <div
            className="admin-detail-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-drawer-header">
              <div>
                <span className="drawer-badge">THÔNG TIN CHI NHÁNH</span>
                <h2>{detailBranch.name}</h2>
                <p className="drawer-sub">Slug: {detailBranch.slug}</p>
              </div>
              <button
                type="button"
                className="admin-drawer-close"
                onClick={() => setDetailBranch(null)}
                aria-label="Đóng ngăn chi tiết"
              >
                ✕
              </button>
            </div>

            <div className="admin-drawer-content">
              {/* Branch Contact Info */}
              <div className="admin-drawer-section">
                <h4 className="drawer-section-title">Thông tin liên hệ & Vị trí</h4>
                <div className="admin-drawer-grid">
                  <div className="drawer-grid-item">
                    <span className="label">Địa chỉ cơ sở</span>
                    <strong className="value">{detailBranch.address}</strong>
                  </div>
                  <div className="drawer-grid-item">
                    <span className="label">Hotline chi nhánh</span>
                    <strong className="value">{detailBranch.phone}</strong>
                  </div>
                  <div className="drawer-grid-item">
                    <span className="label">Giờ mở cửa đón khách</span>
                    <strong className="value">{detailBranch.openHours}</strong>
                  </div>
                  <div className="drawer-grid-item">
                    <span className="label">Trạng thái</span>
                    <span
                      className={`admin-pill-badge ${detailBranch.isActive ? "unit-status-available" : "unit-status-retired"}`}
                    >
                      {detailBranch.isActive ? "Đang hoạt động" : "Tạm ngưng"}
                    </span>
                  </div>
                  {detailBranch.mapUrl && (
                    <div className="drawer-grid-item full-width">
                      <span className="label">Bản đồ Google Maps</span>
                      <a
                        href={detailBranch.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-map-link inline"
                      >
                        Mở địa chỉ trên Google Maps →
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Units Assigned to This Branch */}
              <div className="admin-drawer-section">
                <div className="section-head-with-badge">
                  <h4 className="drawer-section-title">Thiết bị đang phân bổ tại cơ sở</h4>
                  <span className="section-count-badge">
                    {branchUnits.length} máy
                  </span>
                </div>
                <p className="section-desc">
                  Toàn bộ các máy ảnh vật lý và số serial độc bản đang được lưu trữ tại kho của chi nhánh này.
                </p>

                <div className="admin-blocks-list-container">
                  {unitsLoading ? (
                    <p className="admin-loading-text">Đang tải danh sách thiết bị...</p>
                  ) : branchUnits.length === 0 ? (
                    <div className="admin-blocks-empty">
                      <span>Chưa có thiết bị nào được gán cho chi nhánh này.</span>
                    </div>
                  ) : (
                    <table className="admin-mini-table">
                      <thead>
                        <tr>
                          <th>Số Serial</th>
                          <th>Mẫu máy</th>
                          <th>Tình trạng</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branchUnits.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <span className="serial-badge compact">#{u.serialNumber}</span>
                            </td>
                            <td>
                              <strong>{u.model?.name || "--"}</strong>
                            </td>
                            <td>
                              <span className="small-pill">{u.condition}</span>
                            </td>
                            <td>
                              <span
                                className={`admin-pill-badge small ${u.status === "AVAILABLE" ? "unit-status-available" : u.status === "MAINTENANCE" ? "unit-status-maintenance" : "unit-status-retired"}`}
                              >
                                {u.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="admin-drawer-link-bar">
                  <Link
                    to={`/admin/inventory?branch=${encodeURIComponent(detailBranch.slug)}`}
                    className="button secondary-button compact full-width"
                  >
                    Mở toàn bộ kho máy chi nhánh này trong Inventory →
                  </Link>
                </div>
              </div>
            </div>

            <div className="admin-drawer-footer">
              {isAdmin && (
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={() => {
                    const target = detailBranch;
                    setDetailBranch(null);
                    openEditModal(target);
                  }}
                >
                  Chỉnh sửa chi nhánh
                </button>
              )}
              <button
                type="button"
                className="button primary-button compact"
                onClick={() => setDetailBranch(null)}
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

export default AdminBranchesPage;
