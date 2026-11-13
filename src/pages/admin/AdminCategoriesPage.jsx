import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/adminService";

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

function AdminCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State (null = closed, 'create' = create modal, categoryObject = edit modal)
  const [modalMode, setModalMode] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [parentId, setParentId] = useState("");
  const [modalError, setModalError] = useState("");

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load Categories
  useEffect(() => {
    let active = true;
    adminService
      .getAdminCategories()
      .then((data) => {
        if (!active) return;
        setCategories(data.items || data || []);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Không thể tải danh sách danh mục thiết bị.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  // Filter Categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }, [categories, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setName("");
    setSlug("");
    setSortOrder(categories.length);
    setParentId("");
    setModalError("");
    setModalMode("create");
  };

  // Open Edit Modal
  const handleOpenEdit = (category) => {
    setName(category.name);
    setSlug(category.slug);
    setSortOrder(category.sortOrder ?? 0);
    setParentId(category.parentId || "");
    setModalError("");
    setModalMode(category);
  };

  // Close Modal
  const handleCloseModal = () => {
    setModalMode(null);
    setModalError("");
  };

  // Submit Create or Edit
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError("Vui lòng nhập tên danh mục.");
      return;
    }
    if (!slug.trim()) {
      setModalError("Vui lòng nhập slug định danh.");
      return;
    }

    setSubmitting(true);
    setModalError("");

    const payload = {
      name: name.trim(),
      slug: slugify(slug),
      parentId: parentId || null,
      sortOrder: parseInt(sortOrder, 10) || 0,
    };

    try {
      if (modalMode === "create") {
        await adminService.createAdminCategory(payload);
        setSuccessMsg(`Đã tạo thành công danh mục "${name.trim()}".`);
      } else {
        await adminService.updateAdminCategory(modalMode.id, payload);
        setSuccessMsg(`Đã cập nhật danh mục "${name.trim()}".`);
      }
      handleCloseModal();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setModalError(err?.message || "Đã có lỗi xảy ra khi lưu danh mục.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await adminService.deleteAdminCategory(deleteTarget.id);
      setSuccessMsg(`Đã xóa danh mục "${deleteTarget.name}".`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(
        err?.message ||
          "Không thể xóa danh mục này. Có thể danh mục đang chứa các mẫu máy ảnh.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-categories-page">
      {/* HEADER SECTION */}
      <section className="admin-page-header">
        <div className="admin-page-titles">
          <div className="admin-breadcrumb">
            <Link to="/admin">Bảng điều khiển</Link>
            <span className="sep">/</span>
            <span className="current">Danh mục thiết bị</span>
          </div>
          <h1 className="admin-heading-title">Quản lý danh mục thiết bị</h1>
          <p className="admin-heading-sub">
            Phân chia cấu trúc phân loại sản phẩm (Máy ảnh kỹ thuật số, Máy film 35mm, Khổ trung, Phụ kiện...).
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="button primary-button admin-action-cta"
            onClick={handleOpenCreate}
          >
            <span>Thêm danh mục mới</span>
          </button>
        </div>
      </section>

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

      {/* SEARCH TOOLBAR */}
      <section className="admin-filter-toolbar">
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
            placeholder="Tìm theo tên danh mục, slug..."
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
        <div className="admin-quick-stat-pill">
          <span>Tổng số danh mục:</span>
          <strong>{categories.length}</strong>
        </div>
      </section>

      {/* TABLE */}
      <section className="admin-table-container">
        {loading ? (
          <div className="admin-table-loading">
            <span className="admin-spinner" aria-hidden="true" />
            <p>Đang tải danh mục thiết bị...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="admin-table-empty">
            <span className="empty-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <h3>Chưa có danh mục nào</h3>
            <p>Thêm danh mục đầu tiên để phân loại các dòng máy ảnh cho thuê.</p>
            <button
              type="button"
              className="button primary-button compact"
              onClick={handleOpenCreate}
            >
              Thêm danh mục ngay
            </button>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: "80px" }}>
                    Thứ tự
                  </th>
                  <th scope="col">Tên danh mục</th>
                  <th scope="col">Slug định danh</th>
                  <th scope="col">Danh mục cha</th>
                  <th scope="col" className="text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => {
                  const parent = categories.find((c) => c.id === cat.parentId);
                  return (
                    <tr key={cat.id}>
                      <td>
                        <span className="admin-order-badge">
                          {cat.sortOrder ?? 0}
                        </span>
                      </td>
                      <td>
                        <strong>{cat.name}</strong>
                      </td>
                      <td>
                        <span className="admin-product-slug">/{cat.slug}</span>
                      </td>
                      <td>
                        <span className="admin-category-pill">
                          {parent ? parent.name : "Danh mục gốc"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="button secondary-button compact"
                            onClick={() => handleOpenEdit(cat)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="button danger-button compact"
                            onClick={() => setDeleteTarget(cat)}
                            title="Xóa danh mục"
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
      </section>

      {/* CREATE / EDIT MODAL */}
      {modalMode && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseModal}
        >
          <div
            className="admin-roadmap-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge">
                {modalMode === "create" ? "THÊM MỚI" : "CHỈNH SỬA"}
              </span>
              <h3>
                {modalMode === "create"
                  ? "Thêm danh mục thiết bị mới"
                  : `Chỉnh sửa danh mục: ${name}`}
              </h3>
            </div>

            {modalError && (
              <div className="form-alert error" role="alert">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="admin-dialog-form">
              <div className="admin-field-group">
                <label htmlFor="cat-name">
                  Tên danh mục <span className="req">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  placeholder="Ví dụ: Máy ảnh Mirrorless, Máy ảnh Film SLR..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (modalMode === "create" && !slug) {
                      setSlug(slugify(e.target.value));
                    }
                  }}
                  required
                />
              </div>

              <div className="admin-field-group">
                <label htmlFor="cat-slug">
                  Slug định danh <span className="req">*</span>
                </label>
                <input
                  id="cat-slug"
                  type="text"
                  placeholder="may-anh-mirrorless"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              <div className="admin-field-group">
                <label htmlFor="cat-parent">Danh mục cấp cha (Tùy chọn)</label>
                <select
                  id="cat-parent"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">-- Là danh mục gốc (Không có cha) --</option>
                  {categories
                    .filter((c) => (modalMode === "create" ? true : c.id !== modalMode.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="admin-field-group">
                <label htmlFor="cat-sort">Thứ tự sắp xếp (Sort Order)</label>
                <input
                  id="cat-sort"
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />
              </div>

              <div className="admin-dialog-actions">
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="button primary-button compact"
                  disabled={submitting}
                >
                  {submitting ? "Đang lưu..." : "Lưu danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
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
              <span className="admin-dialog-badge danger">XÁC NHẬN XÓA</span>
              <h3>Xóa danh mục thiết bị</h3>
            </div>
            <div className="admin-dialog-body">
              <p>
                Bạn có chắc chắn muốn xóa danh mục <strong>"{deleteTarget.name}"</strong>?
              </p>
              <p className="admin-dialog-note">
                Lưu ý: Nếu danh mục này đang chứa các mẫu máy ảnh trong hệ thống, Back-end sẽ chặn thao tác xóa để đảm bảo toàn vẹn dữ liệu.
              </p>
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
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCategoriesPage;