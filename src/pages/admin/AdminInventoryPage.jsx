import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { adminService } from "../../services/adminService";
import { catalogService } from "../../services/catalogService";

function formatDate(isoStr) {
  if (!isoStr) return "--";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return isoStr;
  }
}

const STATUS_CONFIG = {
  AVAILABLE: {
    label: "Sẵn sàng cho thuê",
    badgeClass: "unit-status-available",
  },
  MAINTENANCE: {
    label: "Đang bảo trì / khóa",
    badgeClass: "unit-status-maintenance",
  },
  RETIRED: {
    label: "Ngừng sử dụng",
    badgeClass: "unit-status-retired",
  },
};

const CONDITION_CONFIG = {
  EXCELLENT: {
    label: "Xuất sắc (Như mới)",
    badgeClass: "unit-cond-excellent",
  },
  GOOD: {
    label: "Tốt (Ít trầy xước)",
    badgeClass: "unit-cond-good",
  },
  FAIR: {
    label: "Trung bình (Có hao mòn)",
    badgeClass: "unit-cond-fair",
  },
};

function AdminInventoryPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams();

  const isAdmin = useMemo(() => {
    const rawRoles = user?.roles || (user?.role ? [user.role] : []);
    return rawRoles.includes("ADMIN");
  }, [user]);

  // Main list state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [units, setUnits] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const selectedBranch = searchParams.get("branch") || "ALL";
  const selectedModel = searchParams.get("model") || "ALL";
  const selectedStatus = searchParams.get("status") || "ALL";
  const [selectedCondition, setSelectedCondition] = useState("ALL");

  // Options
  const [branches, setBranches] = useState([]);
  const [models, setModels] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // KPI counts
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    maintenance: 0,
    retired: 0,
  });

  // Modal State (Create / Edit Unit)
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [unitFormId, setUnitFormId] = useState(null);
  const [formModelId, setFormModelId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formSerial, setFormSerial] = useState("");
  const [formCondition, setFormCondition] = useState("EXCELLENT");
  const [formStatus, setFormStatus] = useState("AVAILABLE");
  const [formPurchasedAt, setFormPurchasedAt] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Delete Unit Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Drawer Detail & Maintenance State
  const [detailUnit, setDetailUnit] = useState(null);
  const [unitBlocks, setUnitBlocks] = useState([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [blockStartDate, setBlockStartDate] = useState("");
  const [blockEndDate, setBlockEndDate] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockError, setBlockError] = useState("");
  const [deletingBlockId, setDeletingBlockId] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load option lists (branches & rental models)
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      catalogService.getBranches(),
      adminService.getAdminModels ? adminService.getAdminModels({ pageSize: 100 }) : catalogService.getModels({ pageSize: 100 }),
    ]).then(([branchRes, modelRes]) => {
      if (!active) return;
      if (branchRes.status === "fulfilled") {
        const b = branchRes.value;
        setBranches(Array.isArray(b) ? b : b?.items || []);
      }
      if (modelRes.status === "fulfilled") {
        const m = modelRes.value;
        setModels(m?.items || (Array.isArray(m) ? m : []));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Fetch Units
  useEffect(() => {
    let active = true;

    const params = {
      page,
      pageSize,
    };
    if (debouncedSearch) {
      params.q = debouncedSearch;
    }
    if (selectedBranch !== "ALL") {
      params.branch = selectedBranch;
    }
    if (selectedModel !== "ALL") {
      params.model = selectedModel;
    }
    if (selectedStatus !== "ALL") {
      params.status = selectedStatus;
    }

    const fetcher = isAdmin ? adminService.getAdminUnits(params) : adminService.getStaffUnits(params);

    fetcher
      .then((data) => {
        if (!active) return;
        const items = data.items || [];
        setUnits(items);
        setTotal(data.total || items.length);
        setError(null);

        // Derive stats from current view or aggregated
        let avail = 0;
        let maint = 0;
        let ret = 0;
        items.forEach((u) => {
          if (u.status === "AVAILABLE") avail++;
          else if (u.status === "MAINTENANCE") maint++;
          else if (u.status === "RETIRED") ret++;
        });
        setStats({
          total: data.total || items.length,
          available: avail,
          maintenance: maint,
          retired: ret,
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err?.message ||
            "Không thể tải danh sách thiết bị từ máy chủ. Vui lòng thử lại sau.",
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
    selectedBranch,
    selectedModel,
    selectedStatus,
    refreshKey,
    isAdmin,
  ]);

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setUnitFormId(null);
    setFormModelId(models[0]?.id || "");
    setFormBranchId(branches[0]?.id || "");
    setFormSerial("");
    setFormCondition("EXCELLENT");
    setFormStatus("AVAILABLE");
    setFormPurchasedAt("");
    setFormNotes("");
    setModalError("");
  };

  // Open Detail Drawer
  const openDetailDrawer = async (unitRef) => {
    setDetailUnit(unitRef);
    setBlocksLoading(true);
    setBlockError("");
    setBlockStartDate("");
    setBlockEndDate("");
    setBlockReason("");

    try {
      let full = unitRef;
      if (isAdmin && !unitRef.createdAt) {
        full = await adminService.getAdminUnit(unitRef.id);
        setDetailUnit(full);
      }
      // Load unit blocks
      const blockRes = await adminService.getStaffUnitBlocks({ unitId: unitRef.id });
      setUnitBlocks(blockRes.items || []);
    } catch (err) {
      setError(err?.message || "Không thể tải chi tiết lịch bảo trì.");
    } finally {
      setBlocksLoading(false);
    }
  };

  // Handle route param or query param for open modal
  useEffect(() => {
    const unitId = routeParams?.id;
    const isNew = searchParams.get("action") === "new";
    if (!unitId && !isNew) return;

    const timer = setTimeout(() => {
      if (unitId) {
        openDetailDrawer({ id: unitId });
      }
      if (isNew) {
        openCreateModal();
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeParams?.id, searchParams]);

  // Filter handlers
  const handleBranchChange = (e) => {
    const val = e.target.value;
    const next = new URLSearchParams(searchParams);
    if (val === "ALL") next.delete("branch");
    else next.set("branch", val);
    setSearchParams(next);
    setPage(1);
  };

  const handleModelChange = (e) => {
    const val = e.target.value;
    const next = new URLSearchParams(searchParams);
    if (val === "ALL") next.delete("model");
    else next.set("model", val);
    setSearchParams(next);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    const val = e.target.value;
    const next = new URLSearchParams(searchParams);
    if (val === "ALL") next.delete("status");
    else next.set("status", val);
    setSearchParams(next);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCondition("ALL");
    setSearchParams({});
    setPage(1);
  };

  // Filter by condition client-side if selected
  const displayedUnits = useMemo(() => {
    if (selectedCondition === "ALL") return units;
    return units.filter((u) => u.condition === selectedCondition);
  }, [units, selectedCondition]);

  // Open Edit Modal
  const openEditModal = async (unit) => {
    setModalMode("edit");
    setUnitFormId(unit.id);
    setModalError("");
    setModalSubmitting(false);

    // Find model ID & branch ID
    let currentModelId = unit.modelId || unit.model?.id || "";
    let currentBranchId = unit.branchId || unit.branch?.id || "";

    // If branch object only has slug, match in branches list
    if (!currentBranchId && unit.branch?.slug) {
      const matchB = branches.find((b) => b.slug === unit.branch.slug);
      if (matchB) currentBranchId = matchB.id;
    }

    setFormModelId(currentModelId);
    setFormBranchId(currentBranchId);
    setFormSerial(unit.serialNumber || "");
    setFormCondition(unit.condition || "EXCELLENT");
    setFormStatus(unit.status || "AVAILABLE");
    setFormPurchasedAt(unit.purchasedAt ? unit.purchasedAt.slice(0, 10) : "");
    setFormNotes(unit.notes || "");

    // If missing detail fields, fetch from getAdminUnit
    if (isAdmin && (!currentBranchId || !currentModelId)) {
      try {
        const full = await adminService.getAdminUnit(unit.id);
        if (full) {
          setFormModelId(full.modelId || "");
          setFormBranchId(full.branchId || "");
          setFormSerial(full.serialNumber || "");
          setFormCondition(full.condition || "EXCELLENT");
          setFormStatus(full.status || "AVAILABLE");
          setFormPurchasedAt(full.purchasedAt ? full.purchasedAt.slice(0, 10) : "");
          setFormNotes(full.notes || "");
        }
      } catch {
        // Fallback to existing
      }
    }
  };

  // Submit Unit Form (Create or Update)
  const handleUnitFormSubmit = async (e) => {
    e.preventDefault();
    if (!formModelId) {
      setModalError("Vui lòng chọn mẫu máy ảnh.");
      return;
    }
    if (!formBranchId) {
      setModalError("Vui lòng chọn chi nhánh quản lý.");
      return;
    }
    if (!formSerial.trim()) {
      setModalError("Số serial thiết bị không được để trống.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    const payload = {
      modelId: formModelId,
      branchId: formBranchId,
      serialNumber: formSerial.trim(),
      condition: formCondition,
      status: formStatus,
      notes: formNotes.trim() || null,
      purchasedAt: formPurchasedAt ? new Date(formPurchasedAt).toISOString() : null,
    };

    try {
      if (modalMode === "create") {
        await adminService.createAdminUnit(payload);
        setSuccessMsg(`Đã thêm thành công thiết bị serial #${payload.serialNumber} vào kho.`);
      } else {
        await adminService.updateAdminUnit(unitFormId, payload);
        setSuccessMsg(`Đã cập nhật thông tin thiết bị serial #${payload.serialNumber}.`);
      }
      setModalMode(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setModalError(
        err?.message ||
          "Không thể lưu thông tin thiết bị. Vui lòng kiểm tra lại số serial hoặc kết nối.",
      );
    } finally {
      setModalSubmitting(false);
    }
  };

  // Open Delete / Retire Modal
  const openDeleteModal = (unit) => {
    setDeleteTarget(unit);
    setDeleteError("");
  };

  // Confirm Delete / Retire
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await adminService.deleteAdminUnit(deleteTarget.id);
      if (res?.retired) {
        setSuccessMsg(
          `Thiết bị serial #${deleteTarget.serialNumber} đã có lịch sử thuê trước đó, hệ thống đã chuyển sang trạng thái "Ngừng sử dụng" (RETIRED) để bảo toàn dữ liệu.`,
        );
      } else {
        setSuccessMsg(`Đã xóa thiết bị #${deleteTarget.serialNumber} khỏi kho.`);
      }
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setDeleteError(
        err?.message || "Không thể xóa thiết bị. Vui lòng thử lại sau.",
      );
    } finally {
      setDeleting(false);
    }
  };

  // Create Unit Block (Staff & Admin)
  const handleCreateBlock = async (e) => {
    e.preventDefault();
    if (!detailUnit) return;
    if (!blockStartDate || !blockEndDate) {
      setBlockError("Vui lòng chọn ngày bắt đầu và ngày kết thúc khóa.");
      return;
    }
    if (new Date(blockEndDate) <= new Date(blockStartDate)) {
      setBlockError("Ngày kết thúc khóa bảo trì phải sau ngày bắt đầu.");
      return;
    }
    if (!blockReason.trim()) {
      setBlockError("Vui lòng nhập lý do khóa bảo dưỡng (ví dụ: Vệ sinh cảm biến, thay pin).");
      return;
    }

    setBlockSubmitting(true);
    setBlockError("");
    try {
      await adminService.createStaffUnitBlock({
        unitId: detailUnit.id,
        startDate: blockStartDate,
        endDate: blockEndDate,
        reason: blockReason.trim(),
      });
      setSuccessMsg(`Đã tạo lịch khóa bảo trì thành công cho máy #${detailUnit.serialNumber}.`);
      setBlockStartDate("");
      setBlockEndDate("");
      setBlockReason("");
      // Reload blocks
      const bRes = await adminService.getStaffUnitBlocks({ unitId: detailUnit.id });
      setUnitBlocks(bRes.items || []);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setBlockError(
        err?.message ||
          "Không thể tạo lịch khóa bảo trì. Khoảng ngày có thể trùng với đơn thuê đang hoạt động.",
      );
    } finally {
      setBlockSubmitting(false);
    }
  };

  // Delete Unit Block
  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch khóa bảo trì này?")) return;
    setDeletingBlockId(blockId);
    try {
      await adminService.deleteStaffUnitBlock(blockId);
      setSuccessMsg("Đã xóa lịch khóa bảo trì.");
      setUnitBlocks((prev) => prev.filter((b) => b.id !== blockId));
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err?.message || "Không thể xóa lịch khóa bảo trì.");
    } finally {
      setDeletingBlockId(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="admin-inventory-page">
      {/* HEADER SECTION */}
      <div className="admin-page-header">
        <div className="admin-page-title-wrap">
          <div className="admin-breadcrumb">
            <Link to="/admin">Admin</Link>
            <span className="separator">/</span>
            <span>Kho máy & Serial</span>
          </div>
          <h1 className="admin-page-title">Kho thiết bị & Số serial</h1>
          <p className="admin-page-desc">
            Quản lý từng thiết bị vật lý cụ thể, số serial độc bản, chi nhánh phân bổ, tình trạng thiết bị và thiết lập lịch khóa bảo dưỡng.
          </p>
        </div>

        <div className="admin-page-actions inventory-page-actions">
          <Link to="/admin/calendar" className="button secondary-button compact">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Lịch thuê thiết bị
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
              Thêm máy mới
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
          <span className="admin-stat-label">Tổng thiết bị trong kho</span>
          <strong className="admin-stat-value">{stats.total}</strong>
          <span className="admin-stat-description">Các mẫu máy & serial</span>
        </div>

        <div className="admin-kpi-card">
          <span className="admin-stat-label">Sẵn sàng cho thuê</span>
          <strong className="admin-stat-value text-success">{stats.available}</strong>
          <span className="admin-stat-description">Hoạt động bình thường</span>
        </div>

        <div className="admin-kpi-card">
          <span className="admin-stat-label">Đang bảo trì / khóa</span>
          <strong className="admin-stat-value text-warning">{stats.maintenance}</strong>
          <span className="admin-stat-description">Chờ bảo dưỡng hoặc kiểm định</span>
        </div>

        <div className="admin-kpi-card">
          <span className="admin-stat-label">Ngừng sử dụng</span>
          <strong className="admin-stat-value text-muted">{stats.retired}</strong>
          <span className="admin-stat-description">Đã thanh lý hoặc hỏng</span>
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
            placeholder="Tìm theo số serial, tên mẫu máy ảnh..."
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
          {/* Branch filter */}
          <div className="admin-select-wrapper">
            <label htmlFor="filter-branch">Chi nhánh:</label>
            <select
              id="filter-branch"
              className="admin-select-filter"
              value={selectedBranch}
              onChange={handleBranchChange}
            >
              <option value="ALL">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id || b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Model filter */}
          <div className="admin-select-wrapper">
            <label htmlFor="filter-model">Mẫu máy:</label>
            <select
              id="filter-model"
              className="admin-select-filter"
              value={selectedModel}
              onChange={handleModelChange}
            >
              <option value="ALL">Tất cả mẫu máy</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="admin-select-wrapper">
            <label htmlFor="filter-status">Trạng thái:</label>
            <select
              id="filter-status"
              className="admin-select-filter"
              value={selectedStatus}
              onChange={handleStatusChange}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">Sẵn sàng (AVAILABLE)</option>
              <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
              <option value="RETIRED">Ngừng sử dụng (RETIRED)</option>
            </select>
          </div>

          {/* Condition filter */}
          <div className="admin-select-wrapper">
            <label htmlFor="filter-condition">Ngoại quan:</label>
            <select
              id="filter-condition"
              className="admin-select-filter"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
            >
              <option value="ALL">Mọi tình trạng</option>
              <option value="EXCELLENT">Xuất sắc (EXCELLENT)</option>
              <option value="GOOD">Tốt (GOOD)</option>
              <option value="FAIR">Trung bình (FAIR)</option>
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

      {/* EQUIPMENT UNITS TABLE */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-table-loading" role="status">
            <div className="admin-spinner" />
            <p>Đang tải danh sách thiết bị và số serial...</p>
          </div>
        ) : displayedUnits.length === 0 ? (
          <div className="admin-table-empty">
            <div className="empty-icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <h3>Không tìm thấy thiết bị nào</h3>
            <p>Không có chiếc máy nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.</p>
            {isAdmin && (
              <button
                type="button"
                className="button primary-button compact"
                onClick={openCreateModal}
              >
                + Thêm chiếc máy đầu tiên
              </button>
            )}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Số Serial</th>
                <th>Mẫu máy ảnh</th>
                <th>Chi nhánh</th>
                <th>Ngoại quan</th>
                <th>Trạng thái</th>
                <th>Ghi chú máy</th>
                <th>Ngày nhập</th>
                <th className="text-right" style={{ minWidth: "220px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayedUnits.map((unit) => {
                const condConf = CONDITION_CONFIG[unit.condition] || {
                  label: unit.condition,
                  badgeClass: "unit-cond-fair",
                };
                const statConf = STATUS_CONFIG[unit.status] || {
                  label: unit.status,
                  badgeClass: "unit-status-retired",
                };

                return (
                  <tr key={unit.id}>
                    <td>
                      <div className="admin-serial-cell">
                        <span className="serial-badge">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                          </svg>
                          {unit.serialNumber}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-model-cell">
                        <strong>{unit.model?.name || "--"}</strong>
                        {unit.model?.id && (
                          <Link
                            to={`/admin/products/${unit.model.id}/edit`}
                            className="sub-link"
                            title="Xem thông số kỹ thuật mẫu máy"
                          >
                            Chi tiết mẫu máy →
                          </Link>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="admin-branch-pill">
                        {unit.branch?.name || unit.branch?.slug || "--"}
                      </span>
                    </td>

                    <td>
                      <span className={`admin-pill-badge ${condConf.badgeClass}`}>
                        {condConf.label}
                      </span>
                    </td>

                    <td>
                      <span className={`admin-pill-badge ${statConf.badgeClass}`}>
                        {statConf.label}
                      </span>
                    </td>

                    <td>
                      <span className="admin-unit-notes" title={unit.notes || ""}>
                        {unit.notes ? (
                          unit.notes
                        ) : (
                          <span className="text-muted-italic">Không có ghi chú</span>
                        )}
                      </span>
                    </td>

                    <td>
                      <span className="admin-date-text">
                        {formatDate(unit.purchasedAt)}
                      </span>
                    </td>

                    <td className="text-right">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="button text-button compact"
                          onClick={() => openDetailDrawer(unit)}
                          title="Xem chi tiết & lịch khóa bảo trì"
                        >
                          Chi tiết / Bảo trì
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              className="button secondary-button compact"
                              onClick={() => openEditModal(unit)}
                              title="Chỉnh sửa thông tin thiết bị"
                            >
                              Sửa
                            </button>

                            <button
                              type="button"
                              className="button danger-text-button compact"
                              onClick={() => openDeleteModal(unit)}
                              title="Xóa hoặc ngừng sử dụng"
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

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="admin-pagination-bar">
          <span className="pagination-info">
            Trang {page} / {totalPages} (Tổng số {total} thiết bị)
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
                  ? "Thêm thiết bị mới vào kho"
                  : `Chỉnh sửa thiết bị #${formSerial}`}
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

            <form onSubmit={handleUnitFormSubmit} className="admin-modal-form">
              {modalError && (
                <div className="admin-form-alert danger" role="alert">
                  {modalError}
                </div>
              )}

              <div className="admin-form-group">
                <label htmlFor="unit-model">
                  Mẫu máy ảnh <span className="required">*</span>
                </label>
                <select
                  id="unit-model"
                  className="admin-form-control"
                  value={formModelId}
                  onChange={(e) => setFormModelId(e.target.value)}
                  disabled={modalSubmitting}
                  required
                >
                  <option value="" disabled>-- Chọn mẫu máy ảnh --</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.kind === "CAMERA" ? "Body máy" : m.kind})
                    </option>
                  ))}
                </select>
                <span className="field-hint">
                  Mẫu máy xác định mức giá thuê theo ngày và tiền đặt cọc quy định.
                </span>
              </div>

              <div className="admin-form-group">
                <label htmlFor="unit-branch">
                  Chi nhánh lưu trữ & bàn giao <span className="required">*</span>
                </label>
                <select
                  id="unit-branch"
                  className="admin-form-control"
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  disabled={modalSubmitting}
                  required
                >
                  <option value="" disabled>-- Chọn chi nhánh --</option>
                  {branches.map((b) => (
                    <option key={b.id || b.slug} value={b.id}>
                      {b.name} ({b.address})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label htmlFor="unit-serial">
                  Số Serial độc bản <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="unit-serial"
                  className="admin-form-control"
                  placeholder="Ví dụ: CANON-R6-0042, LEICA-M6-99"
                  value={formSerial}
                  onChange={(e) => setFormSerial(e.target.value)}
                  disabled={modalSubmitting}
                  required
                />
                <span className="field-hint">
                  Số serial khắc trên thân máy vật lý, là duy nhất trên toàn hệ thống.
                </span>
              </div>

              <div className="admin-form-row two-cols">
                <div className="admin-form-group">
                  <label htmlFor="unit-condition">Tình trạng ngoại quan</label>
                  <select
                    id="unit-condition"
                    className="admin-form-control"
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value)}
                    disabled={modalSubmitting}
                  >
                    <option value="EXCELLENT">Xuất sắc (Như mới)</option>
                    <option value="GOOD">Tốt (Ít trầy xước nhẹ)</option>
                    <option value="FAIR">Trung bình (Có hao mòn sơn)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="unit-status">Trạng thái vận hành</label>
                  <select
                    id="unit-status"
                    className="admin-form-control"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    disabled={modalSubmitting}
                  >
                    <option value="AVAILABLE">Sẵn sàng (AVAILABLE)</option>
                    <option value="MAINTENANCE">Đang bảo trì (MAINTENANCE)</option>
                    <option value="RETIRED">Ngừng sử dụng (RETIRED)</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label htmlFor="unit-purchased">Ngày nhập kho (tùy chọn)</label>
                <input
                  type="date"
                  id="unit-purchased"
                  className="admin-form-control"
                  value={formPurchasedAt}
                  onChange={(e) => setFormPurchasedAt(e.target.value)}
                  disabled={modalSubmitting}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="unit-notes">Ghi chú thiết bị</label>
                <textarea
                  id="unit-notes"
                  className="admin-form-control"
                  rows="3"
                  placeholder="Ghi chú về phụ kiện đi kèm đặc biệt, lưu ý bảo quản riêng..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  disabled={modalSubmitting}
                />
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
                      ? "Lưu vào kho máy"
                      : "Cập nhật thiết bị"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / RETIRE MODAL */}
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
              <h3>Xác nhận xóa thiết bị khỏi kho</h3>
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
                Bạn có chắc chắn muốn xóa thiết bị serial{" "}
                <strong>#{deleteTarget.serialNumber}</strong> (
                {deleteTarget.model?.name || "Mẫu máy"})?
              </p>
              <div className="admin-modal-callout warning">
                <strong>Quy tắc bảo toàn dữ liệu Back-end:</strong>
                <p>
                  Nếu thiết bị đã từng phát sinh hợp đồng thuê trong lịch sử, Back-end sẽ tự động chuyển trạng thái của máy sang <code>RETIRED (Ngừng sử dụng)</code> nhằm bảo toàn tính toàn vẹn của hóa đơn và biên bản bàn giao.
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
                {deleting ? "Đang xử lý..." : "Xác nhận xóa / Ngừng dùng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIT DETAIL & MAINTENANCE DRAWER */}
      {detailUnit && (
        <div
          className="admin-drawer-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setDetailUnit(null)}
        >
          <div
            className="admin-detail-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-drawer-header">
              <div>
                <span className="drawer-badge">CHI TIẾT THIẾT BỊ VẬT LÝ</span>
                <h2>Serial: #{detailUnit.serialNumber}</h2>
                <p className="drawer-sub">{detailUnit.model?.name || "Mẫu máy ảnh"}</p>
              </div>
              <button
                type="button"
                className="admin-drawer-close"
                onClick={() => setDetailUnit(null)}
                aria-label="Đóng ngăn chi tiết"
              >
                ✕
              </button>
            </div>

            <div className="admin-drawer-content">
              {/* Unit Info Grid */}
              <div className="admin-drawer-section">
                <h4 className="drawer-section-title">Thông số hiện thời</h4>
                <div className="admin-drawer-grid">
                  <div className="drawer-grid-item">
                    <span className="label">Mẫu máy</span>
                    <strong className="value">{detailUnit.model?.name || "--"}</strong>
                  </div>
                  <div className="drawer-grid-item">
                    <span className="label">Chi nhánh quản lý</span>
                    <strong className="value">{detailUnit.branch?.name || detailUnit.branch?.slug || "--"}</strong>
                  </div>
                  <div className="drawer-grid-item">
                    <span className="label">Tình trạng ngoại quan</span>
                    <span className={`admin-pill-badge ${CONDITION_CONFIG[detailUnit.condition]?.badgeClass || ""}`}>
                      {CONDITION_CONFIG[detailUnit.condition]?.label || detailUnit.condition}
                    </span>
                  </div>
                  <div className="drawer-grid-item">
                    <span className="label">Trạng thái vận hành</span>
                    <span className={`admin-pill-badge ${STATUS_CONFIG[detailUnit.status]?.badgeClass || ""}`}>
                      {STATUS_CONFIG[detailUnit.status]?.label || detailUnit.status}
                    </span>
                  </div>
                  <div className="drawer-grid-item">
                    <span className="label">Ngày nhập kho</span>
                    <strong className="value">{formatDate(detailUnit.purchasedAt)}</strong>
                  </div>
                  <div className="drawer-grid-item">
                    <span className="label">Ghi chú thiết bị</span>
                    <p className="value-desc">{detailUnit.notes || "Không có ghi chú"}</p>
                  </div>
                </div>
              </div>

              {/* Maintenance Schedule (UnitBlocks) */}
              <div className="admin-drawer-section">
                <div className="section-head-with-badge">
                  <h4 className="drawer-section-title">Lịch khóa bảo trì / Kiểm định</h4>
                  <span className="section-count-badge">
                    {unitBlocks.length} đợt khóa
                  </span>
                </div>
                <p className="section-desc">
                  Trong các khoảng thời gian bị khóa bảo trì, thuật toán cho thuê sẽ tự động loại trừ chiếc máy này khỏi danh sách khả dụng của đơn đặt hàng mới.
                </p>

                {/* Form to add unit block */}
                <form onSubmit={handleCreateBlock} className="admin-add-block-form">
                  <h5>+ Thiết lập đợt khóa bảo dưỡng mới</h5>
                  {blockError && (
                    <div className="admin-form-alert danger" role="alert">
                      {blockError}
                    </div>
                  )}

                  <div className="admin-form-row two-cols">
                    <div className="admin-form-group">
                      <label htmlFor="block-start">
                        Từ ngày <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        id="block-start"
                        className="admin-form-control"
                        value={blockStartDate}
                        onChange={(e) => setBlockStartDate(e.target.value)}
                        disabled={blockSubmitting}
                        required
                      />
                    </div>
                    <div className="admin-form-group">
                      <label htmlFor="block-end">
                        Đến ngày <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        id="block-end"
                        className="admin-form-control"
                        value={blockEndDate}
                        onChange={(e) => setBlockEndDate(e.target.value)}
                        disabled={blockSubmitting}
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label htmlFor="block-reason">
                      Lý do bảo trì <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="block-reason"
                      className="admin-form-control"
                      placeholder="Ví dụ: Vệ sinh cảm biến, căn chỉnh nét, dán lại da grip"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      disabled={blockSubmitting}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="button primary-button compact"
                    disabled={blockSubmitting}
                  >
                    {blockSubmitting ? "Đang tạo lịch..." : "Thêm lịch khóa máy"}
                  </button>
                </form>

                {/* Unit blocks list */}
                <div className="admin-blocks-list-container">
                  {blocksLoading ? (
                    <p className="admin-loading-text">Đang tải lịch bảo trì...</p>
                  ) : unitBlocks.length === 0 ? (
                    <div className="admin-blocks-empty">
                      <span>Thiết bị hiện không có lịch khóa bảo trì nào.</span>
                    </div>
                  ) : (
                    <table className="admin-mini-table">
                      <thead>
                        <tr>
                          <th>Thời gian khóa</th>
                          <th>Lý do bảo dưỡng</th>
                          <th className="text-right">Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unitBlocks.map((blk) => (
                          <tr key={blk.id}>
                            <td>
                              <div className="date-range-badge">
                                <span>{formatDate(blk.startDate)}</span>
                                <span className="arrow">➔</span>
                                <span>{formatDate(blk.endDate)}</span>
                              </div>
                            </td>
                            <td>
                              <strong>{blk.reason}</strong>
                            </td>
                            <td className="text-right">
                              <button
                                type="button"
                                className="button danger-text-button compact"
                                onClick={() => handleDeleteBlock(blk.id)}
                                disabled={deletingBlockId === blk.id}
                                title="Hủy bỏ đợt bảo trì này"
                              >
                                {deletingBlockId === blk.id ? "Đang xóa..." : "Xóa"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-drawer-footer">
              {isAdmin && (
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={() => {
                    const target = detailUnit;
                    setDetailUnit(null);
                    openEditModal(target);
                  }}
                >
                  Chỉnh sửa thiết bị này
                </button>
              )}
              <button
                type="button"
                className="button primary-button compact"
                onClick={() => setDetailUnit(null)}
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

export default AdminInventoryPage;
