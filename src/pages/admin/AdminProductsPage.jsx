import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/adminService";

function formatCurrency(amount) {
  if (typeof amount !== "number") return "0 đ";
  return `${amount.toLocaleString("vi-VN")} đ`;
}

function AdminProductsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [models, setModels] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedKind, setSelectedKind] = useState("ALL");
  const [selectedCameraType, setSelectedCameraType] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Options
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load categories and brands for filter dropdowns
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      adminService.getAdminCategories(),
      adminService.getAdminBrands(),
    ]).then(([catRes, brandRes]) => {
      if (!active) return;
      if (catRes.status === "fulfilled") {
        setCategories(catRes.value.items || catRes.value || []);
      }
      if (brandRes.status === "fulfilled") {
        setBrands(brandRes.value.items || brandRes.value || []);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Load models from API
  useEffect(() => {
    let active = true;
    const params = {
      page,
      pageSize,
    };
    if (debouncedSearch) {
      params.q = debouncedSearch;
    }

    adminService
      .getAdminModels(params)
      .then((data) => {
        if (!active) return;
        setModels(data.items || []);
        setTotal(data.total || 0);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err?.message ||
            "Không thể tải danh sách mẫu máy. Vui lòng kiểm tra kết nối.",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, pageSize, debouncedSearch]);

  // Client-side filtering for kind, cameraType, brand, category, status
  const filteredModels = useMemo(() => {
    return models.filter((item) => {
      if (selectedKind !== "ALL" && item.kind !== selectedKind) {
        return false;
      }
      if (
        selectedCameraType !== "ALL" &&
        item.cameraType !== selectedCameraType
      ) {
        return false;
      }
      if (selectedBrand !== "ALL" && item.brandId !== selectedBrand) {
        return false;
      }
      if (selectedCategory !== "ALL" && item.categoryId !== selectedCategory) {
        const selectedRoot = categories.find((root) => root.id === selectedCategory);
        if (!(selectedRoot?.children || []).some((child) => child.id === item.categoryId)) {
          return false;
        }
      }
      if (selectedStatus === "ACTIVE" && !item.isActive) {
        return false;
      }
      if (selectedStatus === "INACTIVE" && item.isActive) {
        return false;
      }
      return true;
    });
  }, [
    models,
    selectedKind,
    selectedCameraType,
    selectedBrand,
    selectedCategory,
    selectedStatus,
    categories,
  ]);

  // Handle delete or deactivate model
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await adminService.deleteAdminModel(deleteTarget.id);
      if (res.deleted) {
        setSuccessMsg(`Đã xóa hoàn toàn mẫu máy "${deleteTarget.name}".`);
      } else {
        setSuccessMsg(
          `Mẫu máy "${deleteTarget.name}" đã được ẩn khỏi danh mục (do đang có máy hoặc đơn thuê liên kết).`,
        );
      }
      setDeleteTarget(null);
      // Reload current page
      const data = await adminService.getAdminModels({
        page,
        pageSize,
        q: debouncedSearch || undefined,
      });
      setModels(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(
        err?.message || "Không thể xóa mẫu máy này. Vui lòng thử lại sau.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  // Compute quick counters
  const cameraCount = models.filter((m) => m.kind === "CAMERA").length;
  const digitalCount = models.filter((m) => m.cameraType === "DIGITAL").length;
  const filmCount = models.filter((m) => m.cameraType === "FILM").length;
  const activeCount = models.filter((m) => m.isActive).length;
  const categoryGroupById = useMemo(() => {
    const groups = new Map();
    categories.forEach((root) => {
      const group = { slug: root.slug, name: root.name };
      groups.set(root.id, group);
      (root.children || []).forEach((child) => groups.set(child.id, group));
    });
    return groups;
  }, [categories]);

  return (
    <div className="admin-products-page">
      {/* PAGE HEADER */}
      <section className="admin-page-header">
        <div className="admin-page-titles">
          <div className="admin-breadcrumb">
            <Link to="/admin">Bảng điều khiển</Link>
            <span className="sep">/</span>
            <span className="current">Quản lý mẫu sản phẩm</span>
          </div>
          <h1 className="admin-heading-title">Danh mục sản phẩm</h1>
          <p className="admin-heading-sub">
            Quản lý toàn diện các dòng máy ảnh số, film, ống kính và phụ kiện; cấu hình giá thuê theo ngày, tiền cọc và thông số kỹ thuật.
          </p>
        </div>

        <div className="admin-header-actions">
          <Link
            to="/admin/products/new?type=camera"
            className="button primary-button admin-action-cta"
          >
            <span>+ Thêm sản phẩm</span>
          </Link>
          <Link
            to="/admin/products/new?type=accessory"
            className="button secondary-button admin-action-cta"
          >
            <span>+ Thêm cuộn film</span>
          </Link>
        </div>
      </section>

      {/* QUICK STATS PILLS */}
      <div className="admin-catalog-quick-bar">
        <div className="admin-quick-stat-pill">
          <span>Tổng mẫu trong trang:</span>
          <strong>{models.length}</strong>
        </div>
        <div className="admin-quick-stat-pill">
          <span>Tổng toàn hệ thống:</span>
          <strong>{total}</strong>
        </div>
        <div className="admin-quick-stat-pill">
          <span>Máy ảnh:</span>
          <strong>{cameraCount}</strong>
        </div>
        <div className="admin-quick-stat-pill">
          <span>Digital:</span>
          <strong>{digitalCount}</strong>
        </div>
        <div className="admin-quick-stat-pill">
          <span>Film:</span>
          <strong>{filmCount}</strong>
        </div>
        <div className="admin-quick-stat-pill">
          <span>Đang hoạt động:</span>
          <strong className="text-success">{activeCount}</strong>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
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

      {/* FILTER & SEARCH TOOLBAR */}
      <section className="admin-products-filter-layout" aria-label="Tìm kiếm và lọc sản phẩm">
        <div className="admin-search-box admin-products-search">
          <span className="search-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tên sản phẩm hoặc slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="admin-products-filter-grid">
          {/* Kind Filter */}
          <select
            className="admin-select-filter filter-kind"
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value)}
            aria-label="Lọc theo phân loại sản phẩm"
          >
            <option value="ALL">Tất cả phân loại</option>
            <option value="CAMERA">Máy ảnh (Camera)</option>
            <option value="LENS">Ống kính (Lens)</option>
            <option value="ACCESSORY">Phụ kiện (Accessory)</option>
          </select>

          {/* Camera Type Filter (Active when kind is ALL or CAMERA) */}
          {(selectedKind === "ALL" || selectedKind === "CAMERA") && (
            <select
              className="admin-select-filter filter-camera-type"
              value={selectedCameraType}
              onChange={(e) => setSelectedCameraType(e.target.value)}
              aria-label="Lọc theo dòng máy"
            >
              <option value="ALL">Tất cả dòng máy</option>
              <option value="DIGITAL">Máy ảnh số (Digital)</option>
              <option value="FILM">Máy ảnh phim (Film)</option>
              <option value="INSTANT">Máy ảnh lấy liền (Instant)</option>
            </select>
          )}

          {/* Brand Filter */}
          <select
            className="admin-select-filter filter-brand"
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            aria-label="Lọc theo thương hiệu"
          >
            <option value="ALL">Tất cả thương hiệu</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            className="admin-select-filter filter-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Lọc theo danh mục"
          >
            <option value="ALL">Tất cả danh mục</option>
            {categories.flatMap((root) => [
              <option key={root.id} value={root.id}>{root.name}</option>,
              ...(root.children || []).map((child) => (
                <option key={child.id} value={child.id}>— {child.name}</option>
              )),
            ])}
          </select>

          {/* Status Filter */}
          <select
            className="admin-select-filter filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Lọc theo trạng thái"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang kích hoạt</option>
            <option value="INACTIVE">Tạm ẩn</option>
          </select>

          <button
            type="button"
            className="button secondary-button compact filter-reset"
            disabled={selectedKind === "ALL" && selectedCameraType === "ALL" && selectedBrand === "ALL" && selectedCategory === "ALL" && selectedStatus === "ALL" && !searchQuery}
            onClick={() => {
              setSelectedKind("ALL");
              setSelectedCameraType("ALL");
              setSelectedBrand("ALL");
              setSelectedCategory("ALL");
              setSelectedStatus("ALL");
              setSearchQuery("");
              setPage(1);
            }}
          >
            Đặt lại lọc
          </button>
        </div>
      </section>

      {/* DATA TABLE */}
      <section className="admin-table-container">
        {loading ? (
          <div className="admin-table-loading">
            <span className="admin-spinner" aria-hidden="true" />
            <p>Đang tải danh sách mẫu máy ảnh...</p>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="admin-table-empty">
            <span className="empty-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
            </span>
            <h3>Không tìm thấy mẫu máy nào phù hợp</h3>
            <p>
              {searchQuery ||
              selectedKind !== "ALL" ||
              selectedCameraType !== "ALL" ||
              selectedBrand !== "ALL" ||
              selectedCategory !== "ALL" ||
              selectedStatus !== "ALL"
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các tiêu chí lọc."
                : "Hệ thống chưa có mẫu máy nào trong danh mục."}
            </p>
            <Link
              to="/admin/products/new"
              className="button primary-button compact"
            >
              Thêm mẫu máy mới
            </Link>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table admin-products-table">
              <thead>
                <tr>
                  <th scope="col" className="product-image-heading">
                    Ảnh
                  </th>
                  <th scope="col">Tên sản phẩm & Slug</th>
                  <th scope="col">Thương hiệu</th>
                  <th scope="col">Danh mục</th>
                  <th scope="col">Phân loại</th>
                  <th scope="col" className="amount-heading">Giá thuê / ngày</th>
                  <th scope="col" className="amount-heading">Tiền cọc</th>
                  <th scope="col">Kho máy</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" className="text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.map((model) => {
                  const hasUnits = (model._count?.units || 0) > 0;
                  return (
                    <tr key={model.id}>
                      {/* Icon / Kind indicator */}
                      <td className="product-image-cell">
                        <div className="admin-thumb-wrapper" title={model.name}>
                          {model.thumbnailUrl ? (
                            <img src={model.thumbnailUrl} alt="" className="admin-product-thumbnail" loading="lazy" />
                          ) : model.kind === "CAMERA" ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                              <circle cx="12" cy="13" r="3"/>
                            </svg>
                          ) : model.kind === "LENS" ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="9"/>
                              <circle cx="12" cy="12" r="5"/>
                              <circle cx="12" cy="12" r="2"/>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            </svg>
                          )}
                        </div>
                      </td>

                      {/* Name & Slug */}
                      <td>
                        <div className="admin-product-info-cell">
                          <Link
                            to={`/admin/products/${model.id}/edit`}
                            className="admin-product-name-link"
                            title={model.name}
                          >
                            <strong>{model.name}</strong>
                          </Link>
                          <span className="admin-product-slug" title={model.slug}>
                            /{model.slug}
                          </span>
                        </div>
                      </td>

                      {/* Brand */}
                      <td>
                        <span className="admin-brand-pill">
                          {model.brand?.name || "--"}
                        </span>
                      </td>

                      {/* Category */}
                      <td>
                        {(() => {
                          const group = categoryGroupById.get(model.categoryId);
                          const categoryName = model.category?.name || "--";
                          const showGroup = model.kind === "CAMERA" && group && group.name !== categoryName;
                          return (
                            <span className="admin-category-pill">
                              {showGroup ? `${group.name} / ${categoryName}` : categoryName}
                            </span>
                          );
                        })()}
                        {model.kind === "CAMERA" && (() => {
                          const expectedGroup = model.cameraType === "FILM" ? "may-film" : model.cameraType === "DIGITAL" ? "may-digital" : model.cameraType === "INSTANT" ? "may-instant" : null;
                          const actualGroup = categoryGroupById.get(model.categoryId)?.slug || model.category?.slug;
                          return !expectedGroup || actualGroup !== expectedGroup ? (
                            <span className="product-classification-warning" title="Danh mục và phân loại đang không khớp; vui lòng sửa trong biểu mẫu sản phẩm.">Cần rà soát</span>
                          ) : null;
                        })()}
                      </td>

                      {/* Kind / CameraType Badge */}
                      <td>
                        {model.kind === "CAMERA" ? (
                          model.cameraType ? <span
                            className={`admin-kind-badge ${
                              model.cameraType === "FILM"
                                ? "is-film"
                                : model.cameraType === "INSTANT"
                                  ? "is-instant"
                                  : "is-digital"
                            }`}
                          >
                            {model.cameraType === "FILM"
                              ? "Film"
                              : model.cameraType === "INSTANT"
                                ? "Instant"
                                : "Digital"}
                          </span>
                          : <span className="product-classification-warning">Cần rà soát</span>
                        ) : model.kind === "LENS" ? (
                          <span className="admin-kind-badge is-lens">
                            Ống kính
                          </span>
                        ) : (
                          <span className="admin-kind-badge is-accessory">
                            {model.filmFormat ? "Cuộn film" : "Phụ kiện"}
                          </span>
                        )}
                      </td>

                      {/* Price Per Day */}
                      <td className="amount-cell product-money-cell">
                        <strong>{formatCurrency(model.pricePerDay)}</strong>
                      </td>

                      {/* Deposit */}
                      <td className="amount-cell text-muted product-money-cell">
                        {formatCurrency(model.deposit)}
                      </td>

                      {/* Unit Count */}
                      <td>
                        <span
                          className={`admin-units-pill ${hasUnits ? "has-units" : "no-units"}`}
                          title={
                            hasUnits
                              ? `Đang có ${model._count?.units} máy vật lý trong kho`
                              : "Chưa có chiếc máy cụ thể nào trong kho"
                          }
                        >
                          {model._count?.units || 0} máy
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`admin-status-chip ${model.isActive ? "active" : "inactive"}`}
                        >
                          {model.isActive ? "Hoạt động" : "Tạm ẩn"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="admin-table-actions">
                          <a
                            href={`/cameras/${model.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button secondary-button compact"
                            title="Xem trang sản phẩm công khai"
                          >
                            Xem ↗
                          </a>
                          <Link
                            to={`/admin/products/${model.id}/edit`}
                            className="button secondary-button compact"
                            title="Chỉnh sửa thông tin & hình ảnh"
                          >
                            Sửa
                          </Link>
                          <button
                            type="button"
                            className="button danger-button compact"
                            onClick={() => setDeleteTarget(model)}
                            title="Xóa hoặc ẩn mẫu máy"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="admin-pagination-bar">
            <span className="admin-pagination-info">
              Trang {page} / {totalPages} · Tổng cộng {total} mẫu máy
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

      {/* DELETE / DEACTIVATE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="admin-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge danger">XÁC NHẬN THAO TÁC</span>
              <h3>Xóa hoặc ẩn mẫu máy ảnh</h3>
            </div>
            <div className="admin-dialog-body">
              <p>
                Bạn có chắc chắn muốn xóa mẫu máy{" "}
                <strong>"{deleteTarget.name}"</strong>?
              </p>
              <div className="admin-dialog-warning-box">
                <div>
                  <strong>Quy tắc bảo toàn dữ liệu Back-end:</strong>
                  <p>
                    - Nếu mẫu máy này <strong>đã có thiết bị vật lý trong kho</strong> hoặc{" "}
                    <strong>đã từng phát sinh đơn thuê</strong>, hệ thống sẽ tự động chuyển trạng thái sang <strong>Tạm ẩn (isActive = false)</strong> nhằm bảo toàn lịch sử giao dịch.
                  </p>
                  <p>
                    - Nếu mẫu máy chưa từng phát sinh dữ liệu liên quan, hệ thống sẽ xóa vĩnh viễn.
                  </p>
                </div>
              </div>
            </div>
            <div className="admin-dialog-actions">
              <button
                type="button"
                className="button secondary-button compact"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="button danger-button compact"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? "Đang xử lý..." : "Xác nhận xóa / ẩn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductsPage;
